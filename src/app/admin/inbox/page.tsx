import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { formatDate, money, statusBadge } from "@/lib/format";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const store = await readStore();

  return (
    <div className="min-h-screen">
      <AdminNav current="/admin/inbox" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            Approval inbox
          </h1>
          <p className="mt-1 text-base-content/70">
            Review drafts before the customer gets an email.
          </p>
        </div>

        {store.quotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
            <p className="text-base-content/70">No quote drafts yet.</p>
            <Link href="/demo" className="btn btn-primary btn-sm mt-4">
              Open customer demo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
            <table className="table">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Customer</th>
                  <th>Job</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {store.quotes.map((quote) => (
                  <tr key={quote.id}>
                    <td className="whitespace-nowrap text-sm">
                      {formatDate(quote.createdAt)}
                    </td>
                    <td>
                      <div className="font-medium">{quote.customerName}</div>
                      <div className="text-xs text-base-content/60">
                        {quote.customerEmail}
                      </div>
                    </td>
                    <td className="max-w-xs truncate text-sm">
                      {quote.jobDescription}
                    </td>
                    <td>{money(quote.total)}</td>
                    <td>
                      <span className={`badge ${statusBadge(quote.status)}`}>
                        {quote.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/admin/inbox/${quote.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
