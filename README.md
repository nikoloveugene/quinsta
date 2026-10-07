# Quinsta

AI instant quote widget for landscaping SMBs. Customers describe a job on your site and get a price-book estimate by email right away. The owner gets a copy and can check quotes in admin.

## First vertical

**Landscaping** — packages + add-ons (lawn care, mulch, cleanup, seasonal packages).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + **daisyUI**
- Local JSON store (no database required)
- Email: Resend when `RESEND_API_KEY` is set, otherwise mock inbox at `/admin/emails`
- Quotes: OpenAI or Anthropic when a key is set, otherwise a deterministic mock grounded on the price book

## Run locally

```bash
npm install
npm run dev
```

App: [http://127.0.0.1:4317](http://127.0.0.1:4317)

### Useful routes

| Route | Purpose |
|---|---|
| `/` | Product landing |
| `/admin` | Owner overview |
| `/admin/price-book` | Paste/edit price list + instructions |
| `/admin/inbox` | Quotes sent to customers (quality check) |
| `/admin/embed` | Script snippet |
| `/admin/emails` | Mock / logged emails |
| `/demo` | Customer widget demo |

### Optional env

Copy `.env.example` if present, or set:

```bash
RESEND_API_KEY=       # real email; omit for mock inbox
OPENAI_API_KEY=       # LLM quotes; omit for mock engine
ANTHROPIC_API_KEY=    # alternative LLM
NEXT_PUBLIC_APP_URL=http://127.0.0.1:4317
```

A sample landscaping price book is seeded automatically so the demo works offline.

## Out of scope (this slice)

Auth platform, multi-vertical catalog, Jobber integrations, payments, photo upload.
