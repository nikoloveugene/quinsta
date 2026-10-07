import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const store = await readStore();
  const quote = store.quotes.find((q) => q.id === id);
  if (!quote) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }
  return NextResponse.json({ quote, settings: store.settings });
}
