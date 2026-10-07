"use client";

import { FormEvent, useState } from "react";

type SubmitResult = {
  message: string;
  quoteTotal?: number;
};

export function QuoteWidget({
  siteKey,
  apiBase = "",
}: {
  siteKey: string;
  apiBase?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [job, setJob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${apiBase}/api/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          jobDescription: job,
          siteKey,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not create estimate.");
      }
      setResult({
        message: data.message,
        quoteTotal: data.quote?.total,
      });
      setName("");
      setEmail("");
      setPhone("");
      setJob("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-5 shadow-lg">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Instant estimate
        </p>
        <h2 className="font-display text-2xl font-semibold text-base-content">
          Get a landscaping estimate
        </h2>
        <p className="mt-1 text-sm text-base-content/70">
          Describe the job. We prepare a non-binding estimate from our price list.
        </p>
      </div>

      {result ? (
        <div className="space-y-3">
          <div className="alert alert-success text-sm">
            <span>{result.message}</span>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setResult(null)}
          >
            Request another estimate
          </button>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="form-control w-full">
            <span className="label-text mb-1">Name</span>
            <input
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1">Email</span>
            <input
              type="email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1">Phone</span>
            <input
              type="tel"
              className="input input-bordered w-full"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1">Job details</span>
            <textarea
              className="textarea textarea-bordered min-h-28 w-full"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              required
              placeholder="Example: Spring cleanup, 3 yards of mulch in front beds, and shrub trim along the driveway."
            />
          </label>

          {error && (
            <div className="alert alert-error text-sm">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Get estimate"
            )}
          </button>
          <p className="text-xs text-base-content/60">
            Non-binding estimate. Final price may change after a site visit.
          </p>
        </form>
      )}
    </div>
  );
}
