# Quinsta

AI instant quote widget for any business with a price book. Customers describe a job on your site and get a price-book estimate by email right away. The owner gets a copy and can check quotes in admin.

The seeded demo uses a **sample landscaping price book** (mow, mulch, cleanup) so you can try the flow immediately. That is example data, not the product category.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + **daisyUI**
- Durable JSON store via **Vercel Blob** in production (local `data/store.json` for offline/dev)
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
| `/admin/price-book` | Upload price list + owner instructions |
| `/admin/inbox` | Quotes sent to customers (quality check) |
| `/admin/embed` | Script snippet |
| `/admin/emails` | Mock / logged emails |
| `/demo` | Customer widget demo |

### Optional env

```bash
RESEND_API_KEY=       # real email; omit for mock inbox
OPENAI_API_KEY=       # LLM quotes; omit for mock engine
ANTHROPIC_API_KEY=    # alternative LLM
NEXT_PUBLIC_APP_URL=http://127.0.0.1:4317
# On Vercel, connect a private Blob store (BLOB_READ_WRITE_TOKEN / BLOB_STORE_ID)
# so quotes and emails persist across serverless invocations.
```

## Out of scope (this slice)

Auth platform, multi-vertical catalog, Jobber integrations, payments.
