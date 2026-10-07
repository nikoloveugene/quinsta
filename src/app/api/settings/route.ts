import { NextResponse } from "next/server";
import { readStore, updateStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({
    settings: store.settings,
    llm: process.env.OPENAI_API_KEY
      ? "openai"
      : process.env.ANTHROPIC_API_KEY
        ? "anthropic"
        : "mock",
    email: process.env.RESEND_API_KEY ? "resend" : "mock",
  });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<{
    businessName: string;
    ownerEmail: string;
    fromEmail: string;
    disclaimer: string;
    instructions: string;
    approvalMode: "owner-first" | "instant";
  }>;

  const store = await updateStore((current) => ({
    ...current,
    settings: {
      ...current.settings,
      businessName: body.businessName ?? current.settings.businessName,
      ownerEmail: body.ownerEmail ?? current.settings.ownerEmail,
      fromEmail: body.fromEmail ?? current.settings.fromEmail,
      disclaimer: body.disclaimer ?? current.settings.disclaimer,
      instructions: body.instructions ?? current.settings.instructions,
      approvalMode: body.approvalMode ?? current.settings.approvalMode,
    },
  }));

  return NextResponse.json({ settings: store.settings });
}
