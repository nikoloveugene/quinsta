"use client";

import { useEffect, useRef, useState } from "react";
import { AdminNav } from "@/components/AdminNav";
import type { BusinessSettings, PriceItem } from "@/lib/types";

export default function PriceBookPage() {
  const [instructions, setInstructions] = useState("");
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastSource, setLastSource] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const instructionsRef = useRef(instructions);
  const itemsRef = useRef(items);
  const savedItemsRef = useRef("");

  useEffect(() => {
    instructionsRef.current = instructions;
  }, [instructions]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  async function load() {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch("/api/price-book", {
        signal: controller.signal,
        cache: "no-store",
      });
      const data = (await response.json()) as {
        items: PriceItem[];
        source?: string;
        settings: BusinessSettings;
      };
      if (!response.ok) throw new Error("Could not load price book.");
      setItems(data.items);
      savedItemsRef.current = JSON.stringify(data.items);
      setLastSource(data.source || null);
      setInstructions(data.settings.instructions);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "Loading timed out. Refresh the page."
          : "Could not load price book. Refresh the page.",
      );
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function persistInstructions() {
    try {
      const response = await fetch("/api/price-book", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: instructionsRef.current }),
      });
      if (!response.ok) throw new Error("Could not update instructions.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    }
  }

  async function persistItems(next: PriceItem[]) {
    const snapshot = JSON.stringify(next);
    if (snapshot === savedItemsRef.current) return;
    setSavingItems(true);
    setError(null);
    try {
      const response = await fetch("/api/price-book", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Could not update price book.");
      savedItemsRef.current = JSON.stringify(data.items);
      if (JSON.stringify(itemsRef.current) === snapshot) {
        setItems(data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setSavingItems(false);
    }
  }

  function updateItem(index: number, patch: Partial<PriceItem>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function saveItemsOnBlur() {
    void persistItems(itemsRef.current);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setMessage(null);
    setError(null);
    setWarnings([]);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/price-book/upload", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }
      setItems(data.items);
      savedItemsRef.current = JSON.stringify(data.items);
      setLastSource(data.source || file.name);
      setWarnings(data.warnings ?? []);
      setMessage(
        `Price book updated from ${data.source || file.name} (${data.items.length} lines).`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen">
      <AdminNav current="/admin/price-book" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            Price book
          </h1>
          <p className="mt-1 text-sm text-base-content/70 sm:text-base">
            Upload a price list. Fix any wrong rows in the list — that is the
            price book.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
            <section className="space-y-5">
              <label className="form-control w-full">
                <span className="label-text mb-1">Owner instructions</span>
                <textarea
                  className="textarea textarea-bordered min-h-28"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  onBlur={() => {
                    void persistInstructions();
                  }}
                  placeholder="How to price jobs from this list."
                />
              </label>

              <div>
                <p className="label-text mb-2">Price list file</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.ods,.pdf,.txt,image/*,.jpg,.jpeg,.png,.webp,.heic"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadFile(file);
                  }}
                />

                {items.length > 0 && lastSource ? (
                  <div className="border-t border-primary/25 pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          File selected · analyzed
                        </p>
                        <p className="mt-1 font-display text-lg font-semibold">
                          {lastSource}
                        </p>
                        <p className="mt-1 text-sm text-base-content/70">
                          Quinsta mapped {items.length} line
                          {items.length === 1 ? "" : "s"} — edit rows on the
                          right if anything looks off.
                        </p>
                      </div>
                      <span className="badge badge-primary">Applied</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-primary w-full sm:w-auto"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : (
                          "Replace file"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
                      dragOver
                        ? "border-primary bg-primary/5"
                        : "border-base-300"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) void uploadFile(file);
                    }}
                  >
                    <p className="font-display text-lg font-semibold">
                      Drop a file here
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-base-content/65">
                      Excel, Google Sheets export (CSV/XLSX), CSV, PDF, or a
                      phone photo of a handwritten price list.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary mt-5"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        "Choose file"
                      )}
                    </button>
                  </div>
                )}
              </div>

              {message && (
                <div className="alert alert-success text-sm">
                  <span>{message}</span>
                </div>
              )}
              {warnings.length > 0 && (
                <div className="alert alert-warning text-sm">
                  <span>{warnings.join(" ")}</span>
                </div>
              )}
              {error && (
                <div className="alert alert-error text-sm">
                  <span>{error}</span>
                </div>
              )}
            </section>

            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-semibold">
                  What Quinsta understood ({items.length})
                </h2>
                {savingItems && (
                  <span className="text-xs text-base-content/55">Saving…</span>
                )}
              </div>
              <p className="mt-1 text-sm text-base-content/65">
                Tap a field to correct name, SKU, category, unit, or price.
              </p>
              <div className="mt-4 space-y-3">
                {items.map((item, index) => (
                  <div
                    key={`${index}-${item.sku}`}
                    className="rounded-xl border border-base-300 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          className="input input-ghost input-sm h-auto w-full px-0 text-base font-medium focus:bg-base-200/50"
                          value={item.name}
                          aria-label="Service name"
                          onChange={(e) =>
                            updateItem(index, { name: e.target.value })
                          }
                          onBlur={saveItemsOnBlur}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            className="input input-ghost input-xs h-auto max-w-[9rem] px-0 font-mono text-xs text-base-content/70 focus:bg-base-200/50"
                            value={item.sku}
                            aria-label="SKU"
                            onChange={(e) =>
                              updateItem(index, { sku: e.target.value })
                            }
                            onBlur={saveItemsOnBlur}
                          />
                          <span className="text-xs text-base-content/40">·</span>
                          <input
                            className="input input-ghost input-xs h-auto min-w-0 flex-1 px-0 text-xs text-base-content/70 focus:bg-base-200/50"
                            value={item.category}
                            aria-label="Category"
                            onChange={(e) =>
                              updateItem(index, { category: e.target.value })
                            }
                            onBlur={saveItemsOnBlur}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <label className="flex items-center justify-end gap-0.5">
                          <span className="text-sm font-semibold text-base-content/55">
                            $
                          </span>
                          <input
                            className="input input-ghost input-sm h-auto w-[5.5rem] px-0 text-right text-base font-semibold focus:bg-base-200/50"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={Number.isFinite(item.price) ? item.price : 0}
                            aria-label="Price"
                            onChange={(e) => {
                              const price = Number.parseFloat(e.target.value);
                              updateItem(index, {
                                price: Number.isFinite(price) ? price : 0,
                              });
                            }}
                            onBlur={saveItemsOnBlur}
                          />
                        </label>
                      </div>
                    </div>
                    <label className="mt-2 flex items-center gap-1 text-xs text-base-content/55">
                      <span>per</span>
                      <input
                        className="input input-ghost input-xs h-auto w-28 px-0 text-xs text-base-content/70 focus:bg-base-200/50"
                        value={item.unit}
                        aria-label="Unit"
                        onChange={(e) =>
                          updateItem(index, { unit: e.target.value })
                        }
                        onBlur={saveItemsOnBlur}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
