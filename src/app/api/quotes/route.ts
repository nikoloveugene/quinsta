import { NextResponse } from "next/server";
import { emailCustomerEstimate, emailOwnerNotice } from "@/lib/email";
import { generateQuote } from "@/lib/quote-engine";
import { readStore, updateStore } from "@/lib/store";
import type { Quote } from "@/lib/types";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({
    quotes: store.quotes,
    settings: store.settings,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    jobDescription?: string;
    siteKey?: string;
  };

  const customerName = body.customerName?.trim() ?? "";
  const customerEmail = body.customerEmail?.trim() ?? "";
  const customerPhone = body.customerPhone?.trim() ?? "";
  const jobDescription = body.jobDescription?.trim() ?? "";

  if (!customerName || !customerEmail || !jobDescription) {
    return NextResponse.json(
      { error: "Name, email, and job description are required." },
      { status: 400 },
    );
  }

  const store = await readStore();

  if (body.siteKey && body.siteKey !== store.settings.siteKey) {
    return NextResponse.json({ error: "Invalid site key." }, { status: 403 });
  }

  const draft = await generateQuote(
    { customerName, customerEmail, customerPhone, jobDescription },
    store.priceBook,
    store.settings.instructions,
  );

  const quote: Quote = {
    ...draft,
    id: `qt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: "sent",
  };

  await updateStore((current) => ({
    ...current,
    quotes: [quote, ...current.quotes],
    settings: {
      ...current.settings,
      // Keep product default: instant quotes to the customer
      approvalMode: "instant",
    },
  }));

  await emailCustomerEstimate(quote, store.settings);
  await emailOwnerNotice(quote, store.settings);

  return NextResponse.json({
    quote,
    message:
      "Your estimate is ready and on its way to your email. The shop got a copy too.",
    approvalMode: "instant",
  });
}
