"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AdminNav } from "@/components/AdminNav";
import type { BusinessSettings, PriceItem } from "@/lib/types";
import { money } from "@/lib/format";

export default function PriceBookPage() {
  const [raw, setRaw] = useState("");
  const [instructions, setInstructions] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastSource, setLastSource] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        raw: string;
        items: PriceItem[];
        settings: BusinessSettings;
      };
      if (!response.ok) throw new Error("Could not load price book.");
      setRaw(data.raw);
      setItems(data.items);
      setInstructions(data.settings.instructions);
      setBusinessName(data.settings.businessName);
      setOwnerEmail(data.settings.ownerEmail);
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
      setRaw(data.raw);
      setLastSource(data.source);
      setWarnings(data.warnings ?? []);
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/price-book", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          instructions,
          businessName,
          ownerEmail,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Save failed.");
      setItems(data.items);
      setRaw(data.raw);
      setMessage(`Saved ${data.items.length} price book rows.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function resetSample() {
    setSaving(true);
    setMessage(null);
    setError(null);
    setWarnings([]);
    try {
      const response = await fetch("/api/price-book", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetSample: true }),
      });
      const data = await response.json();
      setItems(data.items);
      setRaw(data.raw);
      setInstructions(data.settings.instructions);
      setBusinessName(data.settings.businessName);
      setOwnerEmail(data.settings.ownerEmail);
      setLastSource("sample landscaping price book");
      setMessage("Restored sample landscaping price book.");
    } catch {
      setError("Could not reset sample.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AdminNav current="/admin/price-book" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">Price book</h1>
            <p className="mt-1 text-base-content/70">
              Upload your price list. Quotes only use these prices.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => void resetSample()}
            disabled={saving || uploading}
          >
            Restore sample
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4 rounded-2xl border border-base-300 bg-base-100 p-5">
              <label className="form-control w-full">
                <span className="label-text mb-1">Business name</span>
                <input
                  className="input input-bordered"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Owner email</span>
                <input
                  type="email"
                  className="input input-bordered"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Owner instructions</span>
                <textarea
                  className="textarea textarea-bordered min-h-28"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </label>

              <div>
                <p className="label-text mb-2">Price list file</p>
                <div
                  className={`rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-base-300 bg-base-200/40"
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
                    Excel, Google Sheets export (CSV/XLSX), CSV, PDF, or a phone
                    photo of a handwritten price list.
                  </p>
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
                  {lastSource && (
                    <p className="mt-3 text-xs text-base-content/55">
                      Last upload: {lastSource}
                    </p>
                  )}
                </div>
              </div>

              <details className="rounded-xl border border-base-300 bg-base-100 p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  Edit extracted text (optional)
                </summary>
                <textarea
                  className="textarea textarea-bordered mt-3 min-h-48 w-full font-mono text-xs"
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                />
              </details>

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
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || uploading}
              >
                {saving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Save business settings"
                )}
              </button>
            </section>

            <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <h2 className="font-display text-xl font-semibold">
                What Quinsta understood ({items.length})
              </h2>
              <div className="mt-4 max-h-[36rem] overflow-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.sku}>
                        <td className="font-mono text-xs">{item.sku}</td>
                        <td>
                          <div>{item.name}</div>
                          <div className="text-xs text-base-content/55">
                            / {item.unit}
                          </div>
                        </td>
                        <td>{item.category}</td>
                        <td>{money(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </form>
        )}
      </main>
    </div>
  );
}
