import {
  buildCustomerEstimateContent,
  buildOwnerNoticeContent,
} from "./email";
import type {
  BusinessSettings,
  EmailRecord,
  Quote,
  StoreShape,
} from "./types";

export type EmailPane = {
  to: string;
  subject: string;
  body: string;
  provider: "resend" | "mock";
  synthesized?: boolean;
};

export type EmailThread = {
  /** Stable key for the UI (quote id when available). */
  id: string;
  quoteId?: string;
  createdAt: string;
  emailIds: string[];
  customer: EmailPane | null;
  owner: EmailPane | null;
};

function isCustomerKind(kind: EmailRecord["kind"]): boolean {
  return kind === "customer_estimate";
}

function isOwnerKind(kind: EmailRecord["kind"]): boolean {
  return kind === "owner_notice" || kind === "owner_draft";
}

function paneFromRecord(email: EmailRecord): EmailPane {
  return {
    to: email.to,
    subject: email.subject,
    body: email.body,
    provider: email.provider,
  };
}

/** Group flat email rows into one record per quote (customer + owner tabs). */
export function groupEmailThreads(
  emails: EmailRecord[],
  quotes: Quote[],
  settings: BusinessSettings,
): EmailThread[] {
  const quoteById = new Map(quotes.map((q) => [q.id, q]));
  const groups = new Map<string, EmailRecord[]>();

  for (const email of emails) {
    const key = email.quoteId || email.id;
    const list = groups.get(key) ?? [];
    list.push(email);
    groups.set(key, list);
  }

  const threads: EmailThread[] = [];

  for (const [key, rows] of groups) {
    const sorted = [...rows].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const customerRow = sorted.find((e) => isCustomerKind(e.kind));
    const ownerRow = sorted.find((e) => isOwnerKind(e.kind));
    const quoteId = sorted.find((e) => e.quoteId)?.quoteId;
    const quote = quoteId ? quoteById.get(quoteId) : undefined;

    let customer: EmailPane | null = customerRow
      ? paneFromRecord(customerRow)
      : null;
    let owner: EmailPane | null = ownerRow ? paneFromRecord(ownerRow) : null;

    if (!customer && quote) {
      const content = buildCustomerEstimateContent(quote, settings);
      customer = {
        ...content,
        provider: owner?.provider ?? "mock",
        synthesized: true,
      };
    }

    if (!owner && quote) {
      const content = buildOwnerNoticeContent(quote, settings);
      owner = {
        ...content,
        provider: customer?.provider ?? "mock",
        synthesized: true,
      };
    }

    // Orphan single emails without a quote still show in both tabs when possible.
    if (!customer && !owner && sorted[0]) {
      const fallback = paneFromRecord(sorted[0]);
      if (isOwnerKind(sorted[0].kind)) {
        owner = fallback;
      } else {
        customer = fallback;
      }
    }

    threads.push({
      id: key,
      quoteId,
      createdAt: sorted[0]?.createdAt ?? new Date().toISOString(),
      emailIds: sorted.map((e) => e.id),
      customer,
      owner,
    });
  }

  return threads.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Persist missing customer/owner rows when a quote exists but one side was lost. */
export function emailsNeedingBackfill(
  store: StoreShape,
): EmailRecord[] {
  const quoteById = new Map(store.quotes.map((q) => [q.id, q]));
  const byQuote = new Map<string, EmailRecord[]>();

  for (const email of store.emails) {
    if (!email.quoteId) continue;
    const list = byQuote.get(email.quoteId) ?? [];
    list.push(email);
    byQuote.set(email.quoteId, list);
  }

  const missing: EmailRecord[] = [];

  for (const [quoteId, rows] of byQuote) {
    const quote = quoteById.get(quoteId);
    if (!quote) continue;

    const hasCustomer = rows.some((e) => isCustomerKind(e.kind));
    const hasOwner = rows.some((e) => isOwnerKind(e.kind));
    const provider = rows[0]?.provider ?? "mock";

    if (!hasCustomer) {
      const content = buildCustomerEstimateContent(quote, store.settings);
      missing.push({
        ...content,
        id: `em_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        kind: "customer_estimate",
        quoteId,
        provider,
      });
    }

    if (!hasOwner) {
      const content = buildOwnerNoticeContent(quote, store.settings);
      missing.push({
        ...content,
        id: `em_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_o`,
        createdAt: new Date().toISOString(),
        kind: "owner_notice",
        quoteId,
        provider,
      });
    }
  }

  return missing;
}
