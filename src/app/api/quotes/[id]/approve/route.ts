import { NextResponse } from "next/server";
import { emailCustomerEstimate } from "@/lib/email";
import { readStore, updateStore } from "@/lib/store";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const store = await readStore();
  const quote = store.quotes.find((q) => q.id === id);

  if (!quote) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  if (quote.status === "sent" || quote.status === "approved") {
    return NextResponse.json({ quote, message: "Already sent." });
  }

  await emailCustomerEstimate(quote, store.settings);

  const next = await updateStore((current) => ({
    ...current,
    quotes: current.quotes.map((q) =>
      q.id === id ? { ...q, status: "sent" as const } : q,
    ),
  }));

  const updated = next.quotes.find((q) => q.id === id)!;
  return NextResponse.json({
    quote: updated,
    message: "Estimate emailed to the customer.",
  });
}
