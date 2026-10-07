"use client";

import { FormEvent, useState } from "react";

export function BusinessSettingsForm({
  initialBusinessName,
  initialOwnerEmail,
}: {
  initialBusinessName: string;
  initialOwnerEmail: string;
}) {
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [ownerEmail, setOwnerEmail] = useState(initialOwnerEmail);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, ownerEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Save failed.");
      setBusinessName(data.settings.businessName);
      setOwnerEmail(data.settings.ownerEmail);
      setMessage("Business settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-base-300 bg-base-100 p-5"
    >
      <h2 className="font-display text-xl font-semibold">Business</h2>
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
      <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
        {saving ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          "Save business settings"
        )}
      </button>
    </form>
  );
}
