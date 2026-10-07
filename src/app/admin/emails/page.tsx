import { AdminNav } from "@/components/AdminNav";
import { formatDate } from "@/lib/format";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const store = await readStore();
  const hasResend = Boolean(process.env.RESEND_API_KEY);

  return (
    <div className="min-h-screen">
      <AdminNav current="/admin/emails" />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            Email inbox
          </h1>
          <p className="mt-1 text-sm text-base-content/70 sm:text-base">
            {hasResend
              ? "RESEND_API_KEY is set. Sent mail is also logged here."
              : "No RESEND_API_KEY. All messages are mock-only and listed here."}
          </p>
        </div>

        {store.emails.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center text-base-content/65">
            No emails yet.
          </div>
        ) : (
          <div className="space-y-4">
            {store.emails.map((email) => (
              <article
                key={email.id}
                className="rounded-2xl border border-base-300 bg-base-100 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-medium">{email.subject}</h2>
                  <span className="badge badge-ghost badge-sm">
                    {email.provider} · {email.kind}
                  </span>
                </div>
                <p className="mt-1 text-sm text-base-content/60">
                  To {email.to} · {formatDate(email.createdAt)}
                </p>
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-base-200 p-3 text-xs sm:p-4 sm:text-sm">
                  {email.body}
                </pre>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
