import { promises as fs } from "fs";
import path from "path";
import {
  DEFAULT_SETTINGS,
  SAMPLE_PRICE_BOOK,
  priceBookToCsv,
} from "./seed";
import type { StoreShape } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

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
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      ...defaultStore(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    const store = defaultStore();
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    return store;
  }
}

export async function readStore(): Promise<StoreShape> {
  return ensureStore();
}

export async function writeStore(store: StoreShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function updateStore(
  updater: (store: StoreShape) => StoreShape | Promise<StoreShape>,
): Promise<StoreShape> {
  const current = await readStore();
  const next = await updater(current);
  await writeStore(next);
  return next;
}
