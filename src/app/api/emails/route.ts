import { NextResponse } from "next/server";
import { readStore, updateStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  return NextResponse.json({
    emails: store.emails,
    mode: hasResend ? "resend-with-mock-fallback" : "mock",
    hint: hasResend
      ? "RESEND_API_KEY is set. Failures still land in the mock inbox."
      : "No RESEND_API_KEY. All emails are stored in the mock inbox only.",
  });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as {
    quoteId?: string;
    emailIds?: string[];
  };

  const quoteId = body.quoteId?.trim();
  const emailIds = new Set(
    (body.emailIds ?? []).filter((id): id is string => Boolean(id)),
  );

  if (!quoteId && emailIds.size === 0) {
    return NextResponse.json(
      { error: "quoteId or emailIds required." },
      { status: 400 },
    );
  }

  const next = await updateStore((current) => ({
    ...current,
    emails: current.emails.filter((email) => {
      if (quoteId && email.quoteId === quoteId) return false;
      if (emailIds.has(email.id)) return false;
      return true;
    }),
  }));

  return NextResponse.json({
    ok: true,
    remaining: next.emails.length,
  });
}
