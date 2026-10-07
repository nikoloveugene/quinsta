import Link from "next/link";
import { QuoteWidget } from "@/components/QuoteWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const store = await readStore();

  return (
    <main className="min-h-screen">
      <div className="border-b border-base-300 bg-base-100/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="font-display text-xl font-semibold text-primary">
              {store.settings.businessName}
            </p>
            <p className="text-sm text-base-content/60">Demo customer site</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/admin" className="btn btn-ghost btn-sm">
              Back to admin
            </Link>
          </div>
        </div>
      </div>

      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Lawn care, mulch, and seasonal cleanup
          </h1>
          <p className="mt-4 max-w-xl text-base-content/75">
            Tell us what you need. You will get a non-binding estimate by email
            after we review it.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-base-content/80">
            <li>• Weekly and biweekly mowing</li>
            <li>• Spring and fall cleanup packages</li>
            <li>• Mulch, edging, fertilizer, shrub trim</li>
          </ul>
        </div>
        <QuoteWidget siteKey={store.settings.siteKey} />
      </section>
    </main>
  );
}
