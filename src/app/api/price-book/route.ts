import { NextResponse } from "next/server";
import {
  DEFAULT_SETTINGS,
  SAMPLE_PRICE_BOOK,
  parsePriceBookText,
  priceBookToCsv,
} from "@/lib/seed";
import { SAMPLE_PRICE_BOOK_SOURCE, readStore, updateStore } from "@/lib/store";
import type { PriceItem } from "@/lib/types";

function normalizeItems(items: unknown): PriceItem[] | null {
  if (!Array.isArray(items)) return null;
  return items.map((entry, index) => {
    const item = (entry ?? {}) as Partial<PriceItem>;
    const price = Number(item.price);
    return {
      sku: String(item.sku ?? "").trim() || `ITEM-${index + 1}`,
      name: String(item.name ?? "").trim() || `Untitled item ${index + 1}`,
      category: String(item.category ?? "").trim() || "General",
      unit: String(item.unit ?? "").trim() || "each",
      price: Number.isFinite(price) ? price : 0,
      keywords: Array.isArray(item.keywords)
        ? item.keywords.map((keyword) => String(keyword))
        : [],
      notes: item.notes ? String(item.notes) : undefined,
    };
  });
}

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
    items?: PriceItem[];
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

    const normalizedItems = normalizeItems(body.items);
    let priceBook = current.priceBook;
    let priceBookRaw = current.priceBookRaw;
    let priceBookSource = current.priceBookSource;

    if (normalizedItems) {
      priceBook = normalizedItems;
      priceBookRaw = priceBookToCsv(normalizedItems);
      priceBookSource =
        current.priceBookSource || "edited-price-book.csv";
    } else if (typeof body.raw === "string") {
      priceBookRaw = body.raw;
      priceBook = parsePriceBookText(body.raw);
      priceBookSource =
        current.priceBookSource || "edited-price-book.csv";
    }

    return {
      ...current,
      priceBook,
      priceBookRaw,
      priceBookSource,
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
