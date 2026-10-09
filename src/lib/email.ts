import { updateStore } from "./store";
import type { BusinessSettings, EmailRecord, Quote } from "./types";

function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function formatQuoteBody(
  quote: Quote,
  settings: BusinessSettings,
  audience: "customer" | "owner",
): string {
  const lines = quote.lineItems
    .map(
      (item) =>
        `- ${item.name} (${item.sku}): ${item.quantity} ${item.unit} × ${money(item.unitPrice)} = ${money(item.lineTotal)}`,
    )
    .join("\n");

  const header =
    audience === "owner"
      ? `Quote sent to ${quote.customerName}`
      : `Your estimate from ${settings.businessName}`;

  return [
    header,
    "",
    `Job: ${quote.jobDescription}`,
    "",
    "Line items:",
    lines,
    "",
    `Total: ${money(quote.total)}`,
    "",
    "Assumptions:",
    ...quote.assumptions.map((a) => `- ${a}`),
    "",
    "Not included:",
    ...quote.exclusions.map((e) => `- ${e}`),
    "",
    settings.disclaimer,
  ].join("\n");
}

export function buildCustomerEstimateContent(
  quote: Quote,
  settings: BusinessSettings,
): { to: string; subject: string; body: string } {
  return {
    to: quote.customerEmail,
    subject: `Your estimate from ${settings.businessName}`,
    body: formatQuoteBody(quote, settings, "customer"),
  };
}

export function buildOwnerNoticeContent(
  quote: Quote,
  settings: BusinessSettings,
): { to: string; subject: string; body: string } {
  const body = [
    `An estimate was emailed to ${quote.customerName} <${quote.customerEmail}>.`,
    quote.customerPhone ? `Phone: ${quote.customerPhone}` : "",
    "",
    "Quote copy:",
    formatQuoteBody(quote, settings, "owner"),
    "",
    "Open Quinsta admin → Quotes to check the line items and confirm the result looks right.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to: settings.ownerEmail,
    subject: `Quote sent to ${quote.customerName} — ${money(quote.total)}`,
    body,
  };
}

async function sendViaResend(opts: {
  to: string;
  subject: string;
  body: string;
  from: string;
}): Promise<"resend" | "mock"> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return "mock";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: opts.from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.body,
      }),
    });
    if (!response.ok) return "mock";
    return "resend";
  } catch {
    return "mock";
  }
}

function newEmailRecord(
  partial: Omit<EmailRecord, "id" | "createdAt">,
): EmailRecord {
  return {
    ...partial,
    id: `em_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
}

async function recordEmails(records: EmailRecord[]): Promise<void> {
  if (records.length === 0) return;
  await updateStore((store) => ({
    ...store,
    emails: [...records, ...store.emails].slice(0, 100),
  }));
}

async function recordEmail(
  partial: Omit<EmailRecord, "id" | "createdAt">,
): Promise<EmailRecord> {
  const email = newEmailRecord(partial);
  await recordEmails([email]);
  return email;
}

/** Send + log customer + owner copies in one store write. */
export async function sendQuoteEmails(
  quote: Quote,
  settings: BusinessSettings,
): Promise<{ customer: EmailRecord; owner: EmailRecord }> {
  const customerContent = buildCustomerEstimateContent(quote, settings);
  const ownerContent = buildOwnerNoticeContent(quote, settings);

  const customerProvider = await sendViaResend({
    ...customerContent,
    from: settings.fromEmail,
  });
  const ownerProvider = await sendViaResend({
    ...ownerContent,
    from: settings.fromEmail,
  });

  const customer = newEmailRecord({
    ...customerContent,
    kind: "customer_estimate",
    quoteId: quote.id,
    provider: customerProvider,
  });
  const owner = newEmailRecord({
    ...ownerContent,
    kind: "owner_notice",
    quoteId: quote.id,
    provider: ownerProvider,
  });

  await recordEmails([customer, owner]);
  return { customer, owner };
}

/** Owner copy: quote already went to the customer. */
export async function emailOwnerNotice(
  quote: Quote,
  settings: BusinessSettings,
): Promise<EmailRecord> {
  const content = buildOwnerNoticeContent(quote, settings);
  const provider = await sendViaResend({
    ...content,
    from: settings.fromEmail,
  });

  return recordEmail({
    ...content,
    kind: "owner_notice",
    quoteId: quote.id,
    provider,
  });
}

/** @deprecated Use emailOwnerNotice — kept for older approve paths */
export async function emailOwnerDraft(
  quote: Quote,
  settings: BusinessSettings,
): Promise<EmailRecord> {
  return emailOwnerNotice(quote, settings);
}

export async function emailCustomerEstimate(
  quote: Quote,
  settings: BusinessSettings,
): Promise<EmailRecord> {
  const content = buildCustomerEstimateContent(quote, settings);
  const provider = await sendViaResend({
    ...content,
    from: settings.fromEmail,
  });

  return recordEmail({
    ...content,
    kind: "customer_estimate",
    quoteId: quote.id,
    provider,
  });
}
