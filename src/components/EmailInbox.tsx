"use client";

import { useEffect, useState } from "react";
import { QuoteDocument } from "@/components/QuoteDocument";
import type { EmailPane, EmailThread } from "@/lib/email-threads";
import { formatDate } from "@/lib/format";

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

function PlainFallback({ pane }: { pane: EmailPane }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">{pane.subject}</h2>
        <span className="badge badge-ghost badge-sm">{pane.provider}</span>
      </div>
      <p className="text-sm text-base-content/60">To {pane.to}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs sm:text-sm">
        {pane.body}
      </pre>
    </div>
  );
}

function EmailThreadCard({
  thread,
  onDeleted,
}: {
  thread: EmailThread;
  onDeleted: (id: string) => void;
}) {
  const [tab, setTab] = useState<"customer" | "owner">("customer");
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-email-menu]")) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const pane =
    tab === "customer"
      ? (thread.customer ?? thread.owner)
      : (thread.owner ?? thread.customer);

  const ownerPreface = thread.quote
    ? `An estimate was emailed to ${thread.quote.customerName} <${thread.quote.customerEmail}>.`
    : undefined;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    setMenuOpen(false);
    try {
      const response = await fetch("/api/emails", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: thread.quoteId,
          emailIds: thread.emailIds,
        }),
      });
      if (!response.ok) throw new Error("Could not delete.");
      onDeleted(thread.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="rounded-2xl border border-base-300 bg-base-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div role="tablist" className="tabs tabs-bordered min-w-0 flex-1">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "customer"}
            className={`tab ${tab === "customer" ? "tab-active" : ""}`}
            onClick={() => setTab("customer")}
          >
            Customer email
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "owner"}
            className={`tab ${tab === "owner" ? "tab-active" : ""}`}
            onClick={() => setTab("owner")}
          >
            Your email
          </button>
        </div>
        <div className="relative shrink-0" data-email-menu>
          <button
            type="button"
            className="btn btn-ghost btn-square btn-xs"
            aria-label="More options"
            aria-expanded={menuOpen}
            disabled={deleting}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {deleting ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <MoreIcon />
            )}
          </button>
          {menuOpen && (
            <ul className="menu absolute right-0 z-20 mt-1 w-36 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg">
              <li>
                <button
                  type="button"
                  className="text-error"
                  onClick={() => void handleDelete()}
                >
                  Delete
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-base-content/55">
        <span>{formatDate(thread.createdAt)}</span>
        {pane ? (
          <span className="badge badge-ghost badge-sm">
            {pane.provider} · To {pane.to}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        {thread.quote ? (
          <QuoteDocument
            quote={thread.quote}
            settings={thread.settings}
            preface={tab === "owner" ? ownerPreface : undefined}
          />
        ) : pane ? (
          <PlainFallback pane={pane} />
        ) : (
          <p className="text-sm text-base-content/60">No email body.</p>
        )}
      </div>

      {error && (
        <div className="alert alert-error mt-4 text-sm">
          <span>{error}</span>
        </div>
      )}
    </article>
  );
}

export function EmailInbox({
  initialThreads,
}: {
  initialThreads: EmailThread[];
}) {
  const [threads, setThreads] = useState(initialThreads);

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center text-base-content/65">
        No emails yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <EmailThreadCard
          key={thread.id}
          thread={thread}
          onDeleted={(id) =>
            setThreads((current) => current.filter((t) => t.id !== id))
          }
        />
      ))}
    </div>
  );
}
