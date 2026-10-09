import * as XLSX from "xlsx";
import { parsePriceBookText, priceBookToCsv } from "./seed";
import type { PriceItem } from "./types";

export type IngestResult = {
  items: PriceItem[];
  raw: string;
  source: string;
  method: string;
  warnings: string[];
};

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function classifyUpload(
  fileName: string,
  mimeType: string,
): "csv" | "excel" | "pdf" | "image" | "text" | "unknown" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv") || mimeType === "text/csv") return "csv";
  if (
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".ods") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel")
  ) {
    return "excel";
  }
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") return "pdf";
  if (
    IMAGE_TYPES.has(mimeType) ||
    /\.(jpe?g|png|webp|heic|heif)$/i.test(lower)
  ) {
    return "image";
  }
  if (lower.endsWith(".txt") || mimeType.startsWith("text/")) return "text";
  return "unknown";
}

function sheetToCsv(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return "";
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_csv(sheet);
}

async function pdfToText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function imageToText(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<{ text: string; method: string; warnings: string[] }> {
  const warnings: string[] = [];
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    try {
      const text = await visionExtract(buffer, mimeType || "image/jpeg", openaiKey);
      if (text.trim()) {
        return { text, method: "openai-vision", warnings };
      }
      warnings.push("Vision returned no readable prices; tried OCR next.");
    } catch {
      warnings.push("Vision failed; tried OCR next.");
    }
  } else {
    warnings.push(
      "No OPENAI_API_KEY — using on-device OCR. Handwriting quality may be limited.",
    );
  }

  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const {
      data: { text },
    } = await worker.recognize(buffer);
    await worker.terminate();
    return {
      text: text ?? "",
      method: openaiKey ? "tesseract-fallback" : "tesseract",
      warnings,
    };
  } catch {
    warnings.push(
      `Could not read ${fileName}. Upload CSV/Excel, or set OPENAI_API_KEY for photo OCR.`,
    );
    return { text: "", method: "failed", warnings };
  }
}

async function visionExtract(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
): Promise<string> {
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract price list lines from this photo (printed or handwritten). Return plain CSV with header sku,name,category,unit,price,keywords,notes. Invent simple SKUs if missing. Only include items with a price. No markdown.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`Vision API ${response.status}`);
  }
  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content ?? "";
}

function normalizeExtractedText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  // Strip markdown fences if a model wrapped CSV
  return trimmed
    .replace(/^```(?:csv|text)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function ingestPriceBookFile(opts: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<IngestResult> {
  const kind = classifyUpload(opts.fileName, opts.mimeType);
  const warnings: string[] = [];
  let text = "";
  let method = String(kind);

  if (kind === "unknown") {
    warnings.push(
      "Unrecognized file type. Use CSV, Excel (.xlsx), PDF, or a photo (JPG/PNG).",
    );
  }

  if (kind === "excel") {
    text = sheetToCsv(opts.buffer);
    method = "excel";
  } else if (kind === "pdf") {
    text = await pdfToText(opts.buffer);
    method = "pdf-text";
    if (!text.trim()) {
      warnings.push("PDF had no extractable text (maybe a scan). Try a photo upload.");
    }
  } else if (kind === "image") {
    const result = await imageToText(
      opts.buffer,
      opts.mimeType || "image/jpeg",
      opts.fileName,
    );
    text = result.text;
    method = result.method;
    warnings.push(...result.warnings);
  } else if (kind === "csv" || kind === "text" || kind === "unknown") {
    text = opts.buffer.toString("utf8");
    method = kind === "unknown" ? "raw-text" : kind;
  }

  text = normalizeExtractedText(text);
  let items = parsePriceBookText(text);

  // If vision returned prose lines without CSV header, parser still handles "name — $price"
  if (items.length === 0 && text) {
    warnings.push(
      "Could not map rows to prices. Check the preview and edit, or upload a clearer file.",
    );
  }

  const raw = items.length > 0 ? priceBookToCsv(items) : text;

  return {
    items,
    raw,
    source: opts.fileName,
    method,
    warnings,
  };
}
