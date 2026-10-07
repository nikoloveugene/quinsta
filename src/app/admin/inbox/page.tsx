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
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            Approval inbox
          </h1>
          <p className="mt-1 text-sm text-base-content/70 sm:text-base">
            Review drafts before the customer gets an email.
          </p>
        </div>

        {store.quotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center sm:p-10">
            <p className="text-base-content/70">No quote drafts yet.</p>
            <Link href="/demo" className="btn btn-primary mt-4 w-full sm:w-auto">
              Open customer demo
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {store.quotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/admin/inbox/${quote.id}`}
                  className="block rounded-2xl border border-base-300 bg-base-100 p-4 active:bg-base-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{quote.customerName}</p>
                      <p className="truncate text-xs text-base-content/60">
                        {quote.customerEmail}
                      </p>
                    </div>
                    <span className={`badge shrink-0 ${statusBadge(quote.status)}`}>
                      {quote.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-base-content/80">
                    {quote.jobDescription}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-base-content/55">
                      {formatDate(quote.createdAt)}
                    </span>
                    <span className="font-semibold">{money(quote.total)}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-base-300 bg-base-100 md:block">
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
          </>
        )}
      </main>
    </div>
  );
}
