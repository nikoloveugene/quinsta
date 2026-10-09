import { promises as fs } from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import {
  DEFAULT_SETTINGS,
  SAMPLE_PRICE_BOOK,
  priceBookToCsv,
} from "./seed";
import type { StoreShape } from "./types";

const BLOB_PATH = "quinsta/store.json";

const globalForStore = globalThis as unknown as {
  __quinstaStore?: StoreShape;
};

function dataDir(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "quinsta-data");
  }
  return path.join(process.cwd(), "data");
}

function storePath(): string {
  return path.join(dataDir(), "store.json");
}

function blobConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN) ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL),
  );
}

export const SAMPLE_PRICE_BOOK_SOURCE = "sample-landscaping-price-book.csv";

function defaultStore(): StoreShape {
  return {
    settings: DEFAULT_SETTINGS,
    priceBook: SAMPLE_PRICE_BOOK,
    priceBookRaw: priceBookToCsv(SAMPLE_PRICE_BOOK),
    priceBookSource: SAMPLE_PRICE_BOOK_SOURCE,
    quotes: [],
    emails: [],
  };
}

function mergeStore(parsed: Partial<StoreShape>): StoreShape {
  const defaults = defaultStore();
  const mergedSettings = { ...DEFAULT_SETTINGS, ...parsed.settings };
  if (mergedSettings.siteKey === "qs_demo_landscaping") {
    mergedSettings.siteKey = DEFAULT_SETTINGS.siteKey;
  }
  return {
    ...defaults,
    ...parsed,
    settings: mergedSettings,
    priceBookSource:
      parsed.priceBookSource ||
      (parsed.priceBook?.length
        ? SAMPLE_PRICE_BOOK_SOURCE
        : defaults.priceBookSource),
    quotes: parsed.quotes ?? defaults.quotes,
    emails: parsed.emails ?? defaults.emails,
  };
}

async function streamToText(
  stream: ReadableStream<Uint8Array>,
): Promise<string> {
  return new Response(stream).text();
}

async function readFromBlob(): Promise<StoreShape | null> {
  try {
    const result = await get(BLOB_PATH, {
      access: "private",
      // Always read origin — admin must see quotes/emails written moments ago.
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }
    const raw = await streamToText(result.stream);
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return mergeStore(parsed);
  } catch {
    return null;
  }
}

async function writeToBlob(store: StoreShape): Promise<void> {
  await put(BLOB_PATH, JSON.stringify(store, null, 2), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    // Mutable app state — keep CDN cache as short as Blob allows.
    cacheControlMaxAge: 60,
  });
}

async function readFromDisk(): Promise<StoreShape | null> {
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    return mergeStore(JSON.parse(raw) as Partial<StoreShape>);
  } catch {
    return null;
  }
}

async function writeToDisk(store: StoreShape): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(storePath(), JSON.stringify(store, null, 2), "utf8");
}

async function loadStore(): Promise<StoreShape> {
  if (blobConfigured()) {
    const fromBlob = await readFromBlob();
    if (fromBlob) {
      globalForStore.__quinstaStore = fromBlob;
      return fromBlob;
    }
    const seeded = defaultStore();
    globalForStore.__quinstaStore = seeded;
    try {
      await writeToBlob(seeded);
    } catch {
      // Keep memory copy if the first blob write fails; next write retries.
    }
    return seeded;
  }

  if (globalForStore.__quinstaStore) {
    return globalForStore.__quinstaStore;
  }

  const fromDisk = await readFromDisk();
  if (fromDisk) {
    globalForStore.__quinstaStore = fromDisk;
    return fromDisk;
  }

  const store = defaultStore();
  globalForStore.__quinstaStore = store;
  try {
    await writeToDisk(store);
  } catch {
    // memory-only fallback
  }
  return store;
}

export async function readStore(): Promise<StoreShape> {
  // Blob-backed hosts re-read every time inside loadStore so every
  // serverless instance sees the same quotes/emails.
  return loadStore();
}

export async function writeStore(store: StoreShape): Promise<void> {
  globalForStore.__quinstaStore = store;
  if (blobConfigured()) {
    await writeToBlob(store);
    return;
  }
  try {
    await writeToDisk(store);
  } catch {
    // keep in-memory copy on read-only hosts without Blob
  }
}

export async function updateStore(
  updater: (store: StoreShape) => StoreShape | Promise<StoreShape>,
): Promise<StoreShape> {
  // Always load the latest durable copy before mutating.
  const current = await loadStore();
  const next = await updater(current);
  await writeStore(next);
  return next;
}
