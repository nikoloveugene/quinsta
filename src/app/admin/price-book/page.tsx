"use client";

import { useEffect, useRef, useState } from "react";
import { AdminNav } from "@/components/AdminNav";
import type { BusinessSettings, PriceItem } from "@/lib/types";
import { money } from "@/lib/format";

function MoreIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<PriceItem | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [instructionsDraft, setInstructionsDraft] = useState("");
  const [savingInstructions, setSavingInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  const savedItemsRef = useRef("");

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-item-menu]")) {
        setOpenMenuIndex(null);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

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
      setInstructionsDraft(data.settings.instructions);
      setEditingInstructions(false);
      setEditingIndex(null);
      setDraft(null);
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

  function startEditInstructions() {
    setInstructionsDraft(instructions);
    setEditingInstructions(true);
  }

  function cancelEditInstructions() {
    setInstructionsDraft(instructions);
    setEditingInstructions(false);
  }

  async function submitInstructions() {
    setSavingInstructions(true);
    setError(null);
    try {
      const response = await fetch("/api/price-book", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: instructionsDraft }),
      });
      if (!response.ok) throw new Error("Could not update instructions.");
      setInstructions(instructionsDraft);
      setEditingInstructions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setSavingInstructions(false);
    }
  }

  async function persistItems(next: PriceItem[]) {
    const snapshot = JSON.stringify(next);
    if (snapshot === savedItemsRef.current) return true;
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
      setItems(data.items);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
      return false;
    } finally {
      setSavingItems(false);
    }
  }

  function startEdit(index: number) {
    setOpenMenuIndex(null);
    setEditingIndex(index);
    setDraft({ ...items[index] });
  }

  function cancelEdit() {
    setEditingIndex(null);
    setDraft(null);
  }

  async function saveEdit() {
    if (editingIndex === null || !draft) return;
    const next = items.map((item, i) =>
      i === editingIndex ? { ...draft } : item,
    );
    const ok = await persistItems(next);
    if (ok) {
      setEditingIndex(null);
      setDraft(null);
    }
  }

  async function deleteItem(index: number) {
    setOpenMenuIndex(null);
    if (editingIndex === index) {
      setEditingIndex(null);
      setDraft(null);
    }
    const next = items.filter((_, i) => i !== index);
    await persistItems(next);
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
      setEditingIndex(null);
      setDraft(null);
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
            Upload your rate list. Use the menu on a row to edit or delete if
            something looks off.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
            <section className="space-y-8">
              <div className="space-y-3 border-b border-primary/25 pb-8">
                <h2 className="font-display text-xl font-semibold">
                  Owner instructions
                </h2>
                <div className="space-y-2 text-sm text-base-content/75">
                  <p>
                    A price list alone is not enough when the real price depends
                    on a site visit, hidden damage, a custom layout, or labor
                    that changes job to job.
                  </p>
                  <p>
                    Write how you expect Quinsta to build quotes: what to
                    include, what to leave out, when to refuse a firm number,
                    trip fees, minimums, and the tone you want.
                  </p>
                </div>
                {editingInstructions ? (
                  <div className="space-y-3">
                    <textarea
                      className="textarea textarea-bordered min-h-36 w-full text-sm"
                      value={instructionsDraft}
                      onChange={(e) => setInstructionsDraft(e.target.value)}
                      placeholder="Example: Do not invent prices. If size is unclear, assume a typical job and say so. Never discount labor. Add a trip fee outside the service area. Refuse a firm number for custom work that needs a site visit."
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={savingInstructions}
                        onClick={() => void submitInstructions()}
                      >
                        {savingInstructions ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          "Submit"
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={savingInstructions}
                        onClick={cancelEditInstructions}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative min-h-36 rounded-lg border border-base-300 bg-base-200/30 px-3 py-3 pr-12">
                    <button
                      type="button"
                      className="btn btn-ghost btn-square btn-xs absolute right-2 top-2"
                      aria-label="Edit owner instructions"
                      onClick={startEditInstructions}
                    >
                      <EditIcon />
                    </button>
                    <p className="whitespace-pre-wrap text-sm text-base-content/90">
                      {instructions.trim()
                        ? instructions
                        : "No instructions yet. Click edit to add how Quinsta should build quotes."}
                    </p>
                  </div>
                )}
              </div>

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
                          {items.length === 1 ? "" : "s"} — this is the active
                          price book.
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
              <div className="mt-4 space-y-3">
                {items.map((item, index) => {
                  const isEditing = editingIndex === index && draft;

                  if (isEditing) {
                    return (
                      <div
                        key={`${index}-${item.sku}-edit`}
                        className="rounded-xl border border-primary/40 p-4"
                      >
                        <div className="grid gap-3">
                          <label className="form-control w-full">
                            <span className="label-text mb-1">Name</span>
                            <input
                              className="input input-bordered input-sm"
                              value={draft.name}
                              onChange={(e) =>
                                setDraft({ ...draft, name: e.target.value })
                              }
                            />
                          </label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="form-control w-full">
                              <span className="label-text mb-1">SKU</span>
                              <input
                                className="input input-bordered input-sm font-mono"
                                value={draft.sku}
                                onChange={(e) =>
                                  setDraft({ ...draft, sku: e.target.value })
                                }
                              />
                            </label>
                            <label className="form-control w-full">
                              <span className="label-text mb-1">Category</span>
                              <input
                                className="input input-bordered input-sm"
                                value={draft.category}
                                onChange={(e) =>
                                  setDraft({
                                    ...draft,
                                    category: e.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="form-control w-full">
                              <span className="label-text mb-1">Price</span>
                              <input
                                className="input input-bordered input-sm"
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.01"
                                value={
                                  Number.isFinite(draft.price) ? draft.price : 0
                                }
                                onChange={(e) => {
                                  const price = Number.parseFloat(
                                    e.target.value,
                                  );
                                  setDraft({
                                    ...draft,
                                    price: Number.isFinite(price) ? price : 0,
                                  });
                                }}
                              />
                            </label>
                            <label className="form-control w-full">
                              <span className="label-text mb-1">Unit</span>
                              <input
                                className="input input-bordered input-sm"
                                value={draft.unit}
                                onChange={(e) =>
                                  setDraft({ ...draft, unit: e.target.value })
                                }
                              />
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={savingItems}
                              onClick={() => void saveEdit()}
                            >
                              {savingItems ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : (
                                "Save"
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              disabled={savingItems}
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`${index}-${item.sku}`}
                      className="rounded-xl border border-base-300 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="font-mono text-xs text-base-content/55">
                            {item.sku} · {item.category}
                          </p>
                          <p className="mt-1 text-xs text-base-content/55">
                            per {item.unit}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-start gap-1">
                          <p className="pt-0.5 font-semibold">
                            {money(item.price)}
                          </p>
                          <div className="relative" data-item-menu>
                            <button
                              type="button"
                              className="btn btn-ghost btn-square btn-xs"
                              aria-label={`More options for ${item.name}`}
                              aria-expanded={openMenuIndex === index}
                              onClick={() =>
                                setOpenMenuIndex((current) =>
                                  current === index ? null : index,
                                )
                              }
                            >
                              <MoreIcon />
                            </button>
                            {openMenuIndex === index && (
                              <ul className="menu absolute right-0 z-20 mt-1 w-36 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg">
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => startEdit(index)}
                                  >
                                    Edit
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    className="text-error"
                                    onClick={() => void deleteItem(index)}
                                  >
                                    Delete
                                  </button>
                                </li>
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
