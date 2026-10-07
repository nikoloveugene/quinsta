export type PriceItem = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  keywords: string[];
  notes?: string;
};

export type BusinessSettings = {
  businessName: string;
  ownerEmail: string;
  fromEmail: string;
  disclaimer: string;
  instructions: string;
  siteKey: string;
  approvalMode: "owner-first" | "instant";
};

export type QuoteLineItem = {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
};

export type QuoteStatus = "pending_approval" | "approved" | "rejected" | "sent";

export type Quote = {
  id: string;
  createdAt: string;
  status: QuoteStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  jobDescription: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  total: number;
  assumptions: string[];
  exclusions: string[];
  generationMode: "mock" | "openai" | "anthropic";
  ownerNote?: string;
};

export type EmailRecord = {
  id: string;
  createdAt: string;
  to: string;
  subject: string;
  body: string;
  kind: "owner_draft" | "customer_estimate" | "owner_notice";
  quoteId?: string;
  provider: "resend" | "mock";
};

export type StoreShape = {
  settings: BusinessSettings;
  priceBook: PriceItem[];
  priceBookRaw: string;
  priceBookSource: string;
  quotes: Quote[];
  emails: EmailRecord[];
};
