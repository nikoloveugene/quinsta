import type { BusinessSettings, PriceItem } from "./types";

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: "GreenPath Landscaping",
  ownerEmail: "owner@greenpath.example",
  fromEmail: "quotes@quinsta.local",
  disclaimer:
    "This is a non-binding estimate. Final price may change after a site visit.",
  instructions:
    "Prefer package SKUs when the job matches weekly or seasonal work. Add mulch and cleanup as line items when mentioned. Do not invent prices. If lawn size is unclear, assume a typical suburban lot (about 5,000 sq ft) and note that assumption. Never discount labor. Exclude tree removal and hardscape unless listed in the price book.",
  siteKey: "qs_demo_quinsta",
  approvalMode: "instant",
};

export const SAMPLE_PRICE_BOOK: PriceItem[] = [
  {
    sku: "LC-WEEKLY",
    name: "Weekly lawn care package",
    category: "Lawn care",
    unit: "visit",
    price: 55,
    keywords: ["weekly", "mow", "lawn care", "grass", "cut"],
    notes: "Mow, edge, and blow. Standard suburban lot.",
  },
  {
    sku: "LC-BIWEEKLY",
    name: "Biweekly lawn care package",
    category: "Lawn care",
    unit: "visit",
    price: 65,
    keywords: ["biweekly", "every other week", "lawn", "mow"],
  },
  {
    sku: "LC-ONETIME",
    name: "One-time mow and edge",
    category: "Lawn care",
    unit: "job",
    price: 85,
    keywords: ["one time", "one-time", "single mow", "overgrown"],
  },
  {
    sku: "SP-SPRING",
    name: "Spring cleanup package",
    category: "Seasonal",
    unit: "job",
    price: 275,
    keywords: ["spring", "cleanup", "debris", "beds", "winter debris"],
  },
  {
    sku: "SP-FALL",
    name: "Fall leaf removal package",
    category: "Seasonal",
    unit: "job",
    price: 320,
    keywords: ["fall", "leaves", "leaf", "autumn", "rake"],
  },
  {
    sku: "SP-WINTER",
    name: "Winter prep package",
    category: "Seasonal",
    unit: "job",
    price: 240,
    keywords: ["winter", "prep", "protect", "wrap"],
  },
  {
    sku: "MU-YARD",
    name: "Mulch install",
    category: "Mulch / beds",
    unit: "cubic yard",
    price: 65,
    keywords: ["mulch", "bark", "beds"],
  },
  {
    sku: "MU-WEED",
    name: "Bed weeding",
    category: "Mulch / beds",
    unit: "hour",
    price: 55,
    keywords: ["weed", "weeding", "beds", "garden"],
  },
  {
    sku: "MU-EDGE",
    name: "Bed edging",
    category: "Mulch / beds",
    unit: "linear foot",
    price: 2.5,
    keywords: ["edge", "edging", "border"],
  },
  {
    sku: "AD-FERT",
    name: "Fertilizer application",
    category: "Add-ons",
    unit: "application",
    price: 75,
    keywords: ["fertilizer", "fertilize", "feed", "nutrient"],
  },
  {
    sku: "AD-AERATE",
    name: "Core aeration",
    category: "Add-ons",
    unit: "job",
    price: 145,
    keywords: ["aerate", "aeration", "core"],
  },
  {
    sku: "AD-SHRUB",
    name: "Shrub trim",
    category: "Add-ons",
    unit: "hour",
    price: 65,
    keywords: ["shrub", "bush", "trim", "hedge", "prune"],
  },
  {
    sku: "AD-SOD",
    name: "Sod repair patch",
    category: "Add-ons",
    unit: "sq ft",
    price: 4.5,
    keywords: ["sod", "patch", "bare spot", "dead grass"],
  },
];

export function priceBookToCsv(items: PriceItem[]): string {
  const header = "sku,name,category,unit,price,keywords,notes";
  const rows = items.map((item) => {
    const cells = [
      item.sku,
      item.name,
      item.category,
      item.unit,
      String(item.price),
      item.keywords.join("|"),
      item.notes ?? "",
    ];
    return cells.map(escapeCsv).join(",");
  });
  return [header, ...rows].join("\n");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function parsePriceBookText(raw: string): PriceItem[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const first = lines[0].toLowerCase();
  const looksCsv =
    first.includes("sku") ||
    first.includes("price") ||
    first.includes("name") ||
    lines[0].includes(",");

  if (looksCsv) {
    return parseCsvPriceBook(lines);
  }

  return lines.map((line, index) => {
    const match = line.match(/^(.+?)\s*[-–—:]\s*\$?\s*([\d.]+)\s*(.*)$/);
    if (match) {
      const name = match[1].trim();
      const price = Number(match[2]);
      const rest = match[3].trim();
      return {
        sku: `CUSTOM-${index + 1}`,
        name,
        category: "Custom",
        unit: rest || "job",
        price: Number.isFinite(price) ? price : 0,
        keywords: name.toLowerCase().split(/\s+/).filter(Boolean),
      };
    }
    return {
      sku: `CUSTOM-${index + 1}`,
      name: line.trim(),
      category: "Custom",
      unit: "job",
      price: 0,
      keywords: line.toLowerCase().split(/\s+/).filter(Boolean),
    };
  });
}

function parseCsvPriceBook(lines: string[]): PriceItem[] {
  const headerCells = splitCsvLine(lines[0]).map((c) => c.trim().toLowerCase());
  const hasHeader =
    headerCells.includes("sku") ||
    headerCells.includes("name") ||
    headerCells.includes("price");
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const indexOf = (names: string[]) =>
    names.reduce((found, name) => {
      if (found >= 0) return found;
      return headerCells.indexOf(name);
    }, -1);

  const skuIdx = hasHeader ? indexOf(["sku", "id", "code"]) : 0;
  const nameIdx = hasHeader ? indexOf(["name", "item", "description"]) : 1;
  const categoryIdx = hasHeader ? indexOf(["category", "group"]) : 2;
  const unitIdx = hasHeader ? indexOf(["unit", "uom"]) : 3;
  const priceIdx = hasHeader ? indexOf(["price", "amount", "cost"]) : 4;
  const keywordsIdx = hasHeader ? indexOf(["keywords", "tags"]) : 5;
  const notesIdx = hasHeader ? indexOf(["notes", "note"]) : 6;

  return dataLines
    .map((line, index) => {
      const cells = splitCsvLine(line);
      const name = (cells[nameIdx] ?? cells[0] ?? `Item ${index + 1}`).trim();
      const price = Number(String(cells[priceIdx] ?? "0").replace(/[$,]/g, ""));
      const keywordsRaw = cells[keywordsIdx] ?? "";
      const keywords = keywordsRaw
        ? keywordsRaw.split(/[|;]/).map((k) => k.trim().toLowerCase()).filter(Boolean)
        : name.toLowerCase().split(/\s+/).filter(Boolean);

      return {
        sku: (cells[skuIdx] ?? `ROW-${index + 1}`).trim() || `ROW-${index + 1}`,
        name,
        category: (cells[categoryIdx] ?? "General").trim() || "General",
        unit: (cells[unitIdx] ?? "job").trim() || "job",
        price: Number.isFinite(price) ? price : 0,
        keywords,
        notes: (cells[notesIdx] ?? "").trim() || undefined,
      } satisfies PriceItem;
    })
    .filter((item) => item.name.length > 0);
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
}
