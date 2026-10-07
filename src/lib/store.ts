import { promises as fs } from "fs";
import path from "path";
import {
  DEFAULT_SETTINGS,
  SAMPLE_PRICE_BOOK,
  priceBookToCsv,
} from "./seed";
import type { StoreShape } from "./types";

const globalForStore = globalThis as unknown as {
  __quinstaStore?: StoreShape;
};

function dataDir(): string {
  // Vercel serverless FS is read-only except /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "quinsta-data");
  }
  return path.join(process.cwd(), "data");
}

function storePath(): string {
  return path.join(dataDir(), "store.json");
}

function defaultStore(): StoreShape {
  return {
    settings: DEFAULT_SETTINGS,
    priceBook: SAMPLE_PRICE_BOOK,
    priceBookRaw: priceBookToCsv(SAMPLE_PRICE_BOOK),
    quotes: [],
    emails: [],
  };
}

async function ensureStore(): Promise<StoreShape> {
  if (globalForStore.__quinstaStore) {
    return globalForStore.__quinstaStore;
  }

  try {
    await fs.mkdir(dataDir(), { recursive: true });
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    const store = {
      ...defaultStore(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
    globalForStore.__quinstaStore = store;
    return store;
  } catch {
    const store = defaultStore();
    globalForStore.__quinstaStore = store;
    try {
      await fs.mkdir(dataDir(), { recursive: true });
      await fs.writeFile(storePath(), JSON.stringify(store, null, 2), "utf8");
    } catch {
      // memory-only fallback
    }
    return store;
  }
}

export async function readStore(): Promise<StoreShape> {
  return ensureStore();
}

export async function writeStore(store: StoreShape): Promise<void> {
  globalForStore.__quinstaStore = store;
  try {
    await fs.mkdir(dataDir(), { recursive: true });
    await fs.writeFile(storePath(), JSON.stringify(store, null, 2), "utf8");
  } catch {
    // keep in-memory copy on read-only hosts
  }
}

export async function updateStore(
  updater: (store: StoreShape) => StoreShape | Promise<StoreShape>,
): Promise<StoreShape> {
  const current = await readStore();
  const next = await updater(current);
  await writeStore(next);
  return next;
}
