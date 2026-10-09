import { AdminNav } from "@/components/AdminNav";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EmbedPage() {
  const store = await readStore();
  const snippet = `<!-- Quinsta instant estimate widget -->
<script
  src="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4317"}/widget.js"
  data-site-key="${store.settings.siteKey}"
  defer
></script>`;

  return (
    <div className="min-h-screen">
      <AdminNav current="/admin/embed" />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-8">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            Embed
          </h1>
          <p className="mt-1 text-sm text-base-content/70 sm:text-base">
            Paste this on your site, or use the demo page for local testing.
          </p>
        </div>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
          <h2 className="font-display text-xl font-semibold">Site key</h2>
          <code className="mt-3 block break-all rounded-lg bg-base-200 px-3 py-2 font-mono text-xs sm:text-sm">
            {store.settings.siteKey}
          </code>
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5">
          <h2 className="font-display text-xl font-semibold">Script snippet</h2>
          <p className="mt-2 text-sm text-base-content/65">
            For this first slice, the hosted demo at{" "}
            <a className="link link-primary" href="/demo">
              /demo
            </a>{" "}
            embeds the React widget directly. The script tag below is the
            install shape for customer sites;{" "}
            <code className="text-xs">/widget.js</code> serves a lightweight
            bootstrap that opens the demo flow.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-neutral p-3 text-xs text-neutral-content sm:p-4 sm:text-sm">
            <code>{snippet}</code>
          </pre>
        </section>
      </main>
    </div>
  );
}
