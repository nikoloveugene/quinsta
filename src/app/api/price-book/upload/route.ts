import { NextResponse } from "next/server";
import { ingestPriceBookFile } from "@/lib/ingest";
import { updateStore } from "@/lib/store";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose a file to upload." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 12 MB)." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await ingestPriceBookFile({
      buffer,
      fileName: file.name || "upload",
      mimeType: file.type || "application/octet-stream",
    });

    if (result.items.length === 0) {
      return NextResponse.json(
        {
          error:
            result.warnings[0] ||
            "No priced items found in that file. Try CSV/Excel, or a clearer photo.",
          warnings: result.warnings,
          method: result.method,
          source: result.source,
        },
        { status: 422 },
      );
    }

    const store = await updateStore((current) => ({
      ...current,
      priceBook: result.items,
      priceBookRaw: result.raw,
      priceBookSource: result.source,
    }));

    return NextResponse.json({
      items: store.priceBook,
      raw: store.priceBookRaw,
      source: store.priceBookSource,
      settings: store.settings,
      method: result.method,
      warnings: result.warnings,
      message: `Loaded ${result.items.length} items from ${result.source}.`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Upload failed. Try another file.",
      },
      { status: 500 },
    );
  }
}
