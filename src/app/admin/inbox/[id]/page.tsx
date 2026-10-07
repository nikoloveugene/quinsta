"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminNav } from "@/components/AdminNav";
import { formatDate, money, statusBadge } from "@/lib/format";
import type { BusinessSettings, Quote } from "@/lib/types";

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/quotes/${params.id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Not found");
        setQuote(data.quote);
        setSettings(data.settings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.id]);

  async function approve() {
    setActing(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/quotes/${params.id}/approve`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Approve failed");
      setQuote(data.quote);
      setMessage(data.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setActing(false);
    }
  }

  async function reject() {
    setActing(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/quotes/${params.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerNote: "Rejected from admin inbox" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reject failed");
      setQuote(data.quote);
      setMessage(data.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AdminNav current="/admin/inbox" />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
        <Link href="/admin/inbox" className="link link-primary text-sm">
          ← Back to quotes
        </Link>

        {loading && (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        )}

        {error && !quote && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {quote && settings && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                  Estimate for {quote.customerName}
                </h1>
                <p className="mt-1 text-sm text-base-content/65">
                  {formatDate(quote.createdAt)} · generated via{" "}
                  {quote.generationMode}
                </p>
              </div>
              <span className={`badge ${statusBadge(quote.status)}`}>
                {quote.status.replace("_", " ")}
              </span>
            </div>

            <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
              {settings.disclaimer}
            </div>

            <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <h2 className="font-display text-xl font-semibold">Customer</h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-base-content/55">Email</dt>
                  <dd>{quote.customerEmail}</dd>
                </div>
                <div>
                  <dt className="text-base-content/55">Phone</dt>
                  <dd>{quote.customerPhone || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-base-content/55">Job</dt>
                  <dd className="mt-1">{quote.jobDescription}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
              <h2 className="font-display text-xl font-semibold">Line items</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.lineItems.map((item) => (
                      <tr key={item.sku}>
                        <td>
                          <div>{item.name}</div>
                          <div className="font-mono text-xs text-base-content/50">
                            {item.sku}
                          </div>
                        </td>
                        <td>
                          {item.quantity} {item.unit}
                        </td>
                        <td>{money(item.unitPrice)}</td>
                        <td>{money(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-right font-display text-2xl font-semibold">
                Total {money(quote.total)}
              </p>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
                <h3 className="font-semibold">Assumptions</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {quote.assumptions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
                <h3 className="font-semibold">Not included</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {quote.exclusions.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </section>
            </div>

            {message && (
              <div className="alert alert-success text-sm">
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="alert alert-error text-sm">
                <span>{error}</span>
              </div>
            )}

            {quote.status === "sent" && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
                This estimate was emailed to the customer and to you. Use this
                page to check whether the line items match what you would have
                quoted.
              </div>
            )}

            {quote.status === "pending_approval" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  className="btn btn-primary w-full sm:w-auto"
                  disabled={acting}
                  onClick={() => void approve()}
                >
                  Send to customer now
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-error w-full sm:w-auto"
                  disabled={acting}
                  onClick={() => void reject()}
                >
                  Discard
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
