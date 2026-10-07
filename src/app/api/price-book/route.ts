import { NextResponse } from "next/server";
import {
  DEFAULT_SETTINGS,
  SAMPLE_PRICE_BOOK,
  parsePriceBookText,
  priceBookToCsv,
} from "@/lib/seed";
import { SAMPLE_PRICE_BOOK_SOURCE, readStore, updateStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({
    items: store.priceBook,
    raw: store.priceBookRaw,
    source: store.priceBookSource,
    settings: store.settings,
  });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    raw?: string;
    instructions?: string;
    businessName?: string;
    ownerEmail?: string;
    resetSample?: boolean;
  };

  const store = await updateStore((current) => {
    if (body.resetSample) {
      return {
        ...current,
        priceBook: SAMPLE_PRICE_BOOK,
        priceBookRaw: priceBookToCsv(SAMPLE_PRICE_BOOK),
        priceBookSource: SAMPLE_PRICE_BOOK_SOURCE,
        settings: {
          ...current.settings,
          instructions: DEFAULT_SETTINGS.instructions,
          businessName: body.businessName ?? current.settings.businessName,
          ownerEmail: body.ownerEmail ?? current.settings.ownerEmail,
        },
      };
    }

    const priceBookRaw =
      typeof body.raw === "string" ? body.raw : current.priceBookRaw;
    const priceBook =
      typeof body.raw === "string"
        ? parsePriceBookText(body.raw)
        : current.priceBook;

    return {
      ...current,
      priceBook,
      priceBookRaw,
      priceBookSource:
        typeof body.raw === "string"
          ? current.priceBookSource || "edited-price-book.csv"
          : current.priceBookSource,
      settings: {
        ...current.settings,
        instructions:
          typeof body.instructions === "string"
            ? body.instructions
            : current.settings.instructions,
        businessName:
          typeof body.businessName === "string"
            ? body.businessName
            : current.settings.businessName,
        ownerEmail:
          typeof body.ownerEmail === "string"
            ? body.ownerEmail
            : current.settings.ownerEmail,
      },
    };
  });

  return NextResponse.json({
    items: store.priceBook,
    raw: store.priceBookRaw,
    source: store.priceBookSource,
    settings: store.settings,
  });
}
