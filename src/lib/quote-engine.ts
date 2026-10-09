import type { PriceItem, Quote, QuoteLineItem } from "./types";

export type QuoteRequestInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  jobDescription: string;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function scoreItem(item: PriceItem, tokens: Set<string>, text: string): number {
  let score = 0;
  for (const keyword of item.keywords) {
    if (keyword.includes(" ")) {
      if (text.includes(keyword)) score += 4;
    } else if (tokens.has(keyword)) {
      score += 2;
    }
  }
  const nameTokens = tokenize(item.name);
  for (const token of nameTokens) {
    if (tokens.has(token)) score += 1;
  }
  return score;
}

function inferQuantity(item: PriceItem, text: string): number {
  const lower = text.toLowerCase();

  if (item.sku === "MU-YARD") {
    const yards = lower.match(/(\d+(?:\.\d+)?)\s*(?:cubic\s*)?yards?/);
    if (yards) return Math.max(1, Number(yards[1]));
    return 3;
  }

  if (item.sku === "MU-EDGE") {
    const feet = lower.match(/(\d+)\s*(?:linear\s*)?(?:feet|ft|foot)/);
    if (feet) return Math.max(10, Number(feet[1]));
    return 80;
  }

  if (item.sku === "AD-SOD") {
    const sqft = lower.match(/(\d+)\s*(?:sq\.?\s*ft|square\s*feet)/);
    if (sqft) return Math.max(10, Number(sqft[1]));
    return 50;
  }

  if (item.sku === "MU-WEED" || item.sku === "AD-SHRUB") {
    const hours = lower.match(/(\d+(?:\.\d+)?)\s*hours?/);
    if (hours) return Math.max(1, Number(hours[1]));
    return 2;
  }

  if (item.sku === "LC-WEEKLY") {
    const weeks = lower.match(/(\d+)\s*weeks?/);
    if (weeks) return Math.max(1, Number(weeks[1]));
    if (lower.includes("month")) return 4;
    return 1;
  }

  return 1;
}

export function generateMockQuote(
  input: QuoteRequestInput,
  priceBook: PriceItem[],
): Omit<Quote, "id" | "createdAt" | "status"> {
  const text = input.jobDescription.toLowerCase();
  const tokens = new Set(tokenize(input.jobDescription));

  const wantsMow =
    /\b(mow|mowing|cut the grass|weekly|biweekly|lawn care)\b/.test(text);
  const wantsFertilizer = /\b(fertiliz|feed the lawn)\b/.test(text);

  const ranked = priceBook
    .map((item) => {
      let score = scoreItem(item, tokens, text);
      // Do not treat "lawn" alone as a mow package signal.
      if (
        item.category === "Lawn care" &&
        !wantsMow &&
        (tokens.has("lawn") || text.includes("lawn"))
      ) {
        score = Math.max(0, score - 3);
      }
      if (item.sku === "AD-FERT" && wantsFertilizer) score += 5;
      return { item, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  let selected = ranked.slice(0, 4).map((row) => row.item);

  if (selected.length === 0) {
    const spring = priceBook.find((i) => i.sku === "SP-SPRING");
    const mow = priceBook.find((i) => i.sku === "LC-ONETIME");
    selected = [spring, mow].filter(Boolean) as PriceItem[];
  }

  // Prefer one lawn package, not both weekly and biweekly
  const lawnSkus = selected.filter((i) => i.category === "Lawn care");
  if (lawnSkus.length > 1) {
    const bestLawn = ranked.find((r) => r.item.category === "Lawn care")?.item;
    selected = selected.filter(
      (i) => i.category !== "Lawn care" || i.sku === bestLawn?.sku,
    );
  }


  const lineItems: QuoteLineItem[] = selected.map((item) => {
    const quantity = inferQuantity(item, text);
    return {
      sku: item.sku,
      name: item.name,
      quantity,
      unit: item.unit,
      unitPrice: item.price,
      lineTotal: Math.round(quantity * item.price * 100) / 100,
    };
  });

  const subtotal =
    Math.round(lineItems.reduce((sum, line) => sum + line.lineTotal, 0) * 100) /
    100;

  const assumptions = [
    "Yard size assumed as a typical suburban lot (~5,000 sq ft) unless you stated otherwise.",
    "Access is assumed clear for a standard crew and equipment.",
  ];

  if (!/(sq\.?\s*ft|square\s*feet|acre)/i.test(input.jobDescription)) {
    assumptions.push("Confirm lot size for a final price.");
  }

  const exclusions = [
    "Tree removal and stump grinding",
    "Hardscape (pavers, walls, concrete)",
    "Irrigation repairs not listed above",
  ];

  return {
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim(),
    customerPhone: input.customerPhone.trim(),
    jobDescription: input.jobDescription.trim(),
    lineItems,
    subtotal,
    total: subtotal,
    assumptions,
    exclusions,
    generationMode: "mock",
  };
}

export async function generateQuote(
  input: QuoteRequestInput,
  priceBook: PriceItem[],
  instructions: string,
): Promise<Omit<Quote, "id" | "createdAt" | "status">> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openaiKey) {
    try {
      return await generateWithOpenAI(input, priceBook, instructions, openaiKey);
    } catch {
      // fall through to mock
    }
  }

  if (anthropicKey) {
    try {
      return await generateWithAnthropic(
        input,
        priceBook,
        instructions,
        anthropicKey,
      );
    } catch {
      // fall through to mock
    }
  }

  return generateMockQuote(input, priceBook);
}

async function generateWithOpenAI(
  input: QuoteRequestInput,
  priceBook: PriceItem[],
  instructions: string,
  apiKey: string,
): Promise<Omit<Quote, "id" | "createdAt" | "status">> {
  const catalog = priceBook.map((i) => ({
    sku: i.sku,
    name: i.name,
    unit: i.unit,
    price: i.price,
    category: i.category,
  }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You create service estimates from a shop price book. Only use SKUs from the provided price book. Return JSON with lineItems[{sku,name,quantity,unit,unitPrice,lineTotal}], assumptions[], exclusions[], subtotal, total. Do not invent prices.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instructions,
            priceBook: catalog,
            job: input,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  const parsed = JSON.parse(data.choices[0].message.content) as {
    lineItems: QuoteLineItem[];
    assumptions: string[];
    exclusions: string[];
    subtotal: number;
    total: number;
  };

  return {
    ...input,
    lineItems: parsed.lineItems,
    assumptions: parsed.assumptions ?? [],
    exclusions: parsed.exclusions ?? [],
    subtotal: parsed.subtotal,
    total: parsed.total,
    generationMode: "openai",
  };
}

async function generateWithAnthropic(
  input: QuoteRequestInput,
  priceBook: PriceItem[],
  instructions: string,
  apiKey: string,
): Promise<Omit<Quote, "id" | "createdAt" | "status">> {
  const catalog = priceBook.map((i) => ({
    sku: i.sku,
    name: i.name,
    unit: i.unit,
    price: i.price,
    category: i.category,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Create a service estimate JSON only. Use only these SKUs. Instructions: ${instructions}\nPrice book: ${JSON.stringify(catalog)}\nJob: ${JSON.stringify(input)}\nReturn JSON with lineItems, assumptions, exclusions, subtotal, total.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic error ${response.status}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text: string }[];
  };
  const text = data.content.find((c) => c.type === "text")?.text ?? "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch?.[0] ?? "{}") as {
    lineItems: QuoteLineItem[];
    assumptions: string[];
    exclusions: string[];
    subtotal: number;
    total: number;
  };

  return {
    ...input,
    lineItems: parsed.lineItems,
    assumptions: parsed.assumptions ?? [],
    exclusions: parsed.exclusions ?? [],
    subtotal: parsed.subtotal,
    total: parsed.total,
    generationMode: "anthropic",
  };
}
