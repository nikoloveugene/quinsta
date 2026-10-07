import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { BusinessSettingsForm } from "@/components/BusinessSettingsForm";
import { money } from "@/lib/format";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const store = await readStore();
  const pending = store.quotes.filter((q) => q.status === "pending_approval");
  const llm = process.env.OPENAI_API_KEY
    ? "OpenAI"
    : process.env.ANTHROPIC_API_KEY
      ? "Anthropic"
      : "Mock (no API key)";
  const email = process.env.RESEND_API_KEY ? "Resend" : "Mock inbox";

  return (
    <div className="min-h-screen">
      <AdminNav current="/admin" />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            {store.settings.businessName}
          </h1>
          <p className="mt-1 text-base-content/70">
            Landscaping instant estimates — owner approval first.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Price book items" value={String(store.priceBook.length)} />
          <Stat label="Pending approvals" value={String(pending.length)} />
          <Stat label="Quotes total" value={String(store.quotes.length)} />
          <Stat label="Mock emails" value={String(store.emails.length)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <BusinessSettingsForm
            initialBusinessName={store.settings.businessName}
            initialOwnerEmail={store.settings.ownerEmail}
          />
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
                <dt className="text-base-content/60">Approval mode</dt>
                <dd>{store.settings.approvalMode}</dd>
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
                Submit a job on the{" "}
                <Link className="link link-primary" href="/demo">
                  demo page
                </Link>
                .
              </li>
              <li>
                Approve it in the{" "}
                <Link className="link link-primary" href="/admin/inbox">
                  inbox
                </Link>
                .
              </li>
            </ol>
          </section>
        </div>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">
              Recent drafts
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
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
      <p className="text-xs uppercase tracking-wide text-base-content/55">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
