import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

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
