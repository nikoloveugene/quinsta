import { NextResponse } from "next/server";
import { updateStore } from "@/lib/store";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    ownerNote?: string;
  };

  const next = await updateStore((current) => {
    const exists = current.quotes.some((q) => q.id === id);
    if (!exists) return current;
    return {
      ...current,
      quotes: current.quotes.map((q) =>
        q.id === id
          ? {
              ...q,
              status: "rejected" as const,
              ownerNote: body.ownerNote?.trim() || q.ownerNote,
            }
          : q,
      ),
    };
  });

  const quote = next.quotes.find((q) => q.id === id);
  if (!quote) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  return NextResponse.json({ quote, message: "Quote rejected." });
}
