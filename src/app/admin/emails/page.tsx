import { AdminNav } from "@/components/AdminNav";
import { EmailInbox } from "@/components/EmailInbox";
import {
  emailsNeedingBackfill,
  groupEmailThreads,
} from "@/lib/email-threads";
import { readStore, updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  let store = await readStore();
  const hasResend = Boolean(process.env.RESEND_API_KEY);

  const missing = emailsNeedingBackfill(store);
  if (missing.length > 0) {
    store = await updateStore((current) => ({
      ...current,
      emails: [...missing, ...current.emails].slice(0, 100),
    }));
  }

  const threads = groupEmailThreads(
    store.emails,
    store.quotes,
    store.settings,
  );

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

        <EmailInbox initialThreads={threads} />
      </main>
    </div>
  );
}
