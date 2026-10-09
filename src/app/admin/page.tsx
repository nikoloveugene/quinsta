import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { money } from "@/lib/format";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const store = await readStore();
  const sent = store.quotes.filter((q) => q.status === "sent").length;
  const llm = process.env.OPENAI_API_KEY
    ? "OpenAI"
    : process.env.ANTHROPIC_API_KEY
      ? "Anthropic"
      : "Mock (no API key)";
  const email = process.env.RESEND_API_KEY ? "Resend" : "Mock inbox";

  return (
    <div className="min-h-screen">
      <AdminNav current="/admin" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-8">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            {store.settings.businessName}
          </h1>
          <p className="mt-1 text-sm text-base-content/70 sm:text-base">
            Instant estimates from your price book. Check quotes after they go
            out.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat label="Price book items" value={String(store.priceBook.length)} />
          <Stat label="Quotes sent" value={String(sent)} />
          <Stat label="Quotes total" value={String(store.quotes.length)} />
          <Stat label="Emails logged" value={String(store.emails.length)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
            <h2 className="font-display text-xl font-semibold">Status</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-base-content/60">Quote engine</dt>
                <dd>{llm}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-base-content/60">Email</dt>
                <dd>{email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-base-content/60">Customer delivery</dt>
                <dd>Instant</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-base-content/60">Site key</dt>
                <dd className="font-mono text-xs">{store.settings.siteKey}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
            <h2 className="font-display text-xl font-semibold">Next steps</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-base-content/80">
              <li>
                Confirm the{" "}
                <Link className="link link-primary" href="/admin/price-book">
                  price book
                </Link>
                .
              </li>
              <li>
                Copy the{" "}
                <Link className="link link-primary" href="/admin/embed">
                  embed snippet
                </Link>
                .
              </li>
              <li>
                Generate a quote on the{" "}
                <Link className="link link-primary" href="/demo">
                  demo page
                </Link>
                .
              </li>
              <li>
                Open{" "}
                <Link className="link link-primary" href="/admin/inbox">
                  Quotes
                </Link>{" "}
                and confirm the line items look right.
              </li>
            </ol>
          </section>
        </div>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">
              Recent quotes
            </h2>
            <Link href="/admin/inbox" className="btn btn-ghost btn-sm">
              View all
            </Link>
          </div>
          {store.quotes.length === 0 ? (
            <p className="text-sm text-base-content/60">
              No quotes yet. Use the customer demo to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {store.quotes.slice(0, 5).map((quote) => (
                    <tr key={quote.id}>
                      <td>{quote.customerName}</td>
                      <td>{money(quote.total)}</td>
                      <td>
                        <span className="badge badge-ghost badge-sm">
                          {quote.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/inbox/${quote.id}`}
                          className="link link-primary text-sm"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-3 sm:p-4">
      <p className="text-[0.7rem] uppercase tracking-wide text-base-content/55 sm:text-xs">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
