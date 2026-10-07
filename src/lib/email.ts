import { updateStore } from "./store";
import type { BusinessSettings, EmailRecord, Quote } from "./types";

function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function formatQuoteBody(
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
      ? `New estimate draft for ${quote.customerName}`
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

async function recordEmail(
  partial: Omit<EmailRecord, "id" | "createdAt">,
): Promise<EmailRecord> {
  const email: EmailRecord = {
    ...partial,
    id: `em_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  await updateStore((store) => ({
    ...store,
    emails: [email, ...store.emails].slice(0, 100),
  }));

  return email;
}

export async function emailOwnerDraft(
  quote: Quote,
  settings: BusinessSettings,
): Promise<EmailRecord> {
  const subject = `[Approve] Estimate for ${quote.customerName} — ${money(quote.total)}`;
  const body = [
    formatQuoteBody(quote, settings, "owner"),
    "",
    `Customer: ${quote.customerName} <${quote.customerEmail}> ${quote.customerPhone}`,
    "Approve this draft in the Quinsta admin inbox before the customer receives it.",
  ].join("\n");

  const provider = await sendViaResend({
    to: settings.ownerEmail,
    subject,
    body,
    from: settings.fromEmail,
  });

  return recordEmail({
    to: settings.ownerEmail,
    subject,
    body,
    kind: "owner_draft",
    quoteId: quote.id,
    provider,
  });
}

export async function emailCustomerEstimate(
  quote: Quote,
  settings: BusinessSettings,
): Promise<EmailRecord> {
  const subject = `Your landscaping estimate from ${settings.businessName}`;
  const body = formatQuoteBody(quote, settings, "customer");

  const provider = await sendViaResend({
    to: quote.customerEmail,
    subject,
    body,
    from: settings.fromEmail,
  });

  return recordEmail({
    to: quote.customerEmail,
    subject,
    body,
    kind: "customer_estimate",
    quoteId: quote.id,
    provider,
  });
}
