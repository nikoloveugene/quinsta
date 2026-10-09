import Link from "next/link";
import { QuoteWidget } from "@/components/QuoteWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const store = await readStore();

  return (
    <main className="min-h-screen">
      <div className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-primary sm:text-xl">
              {store.settings.businessName}
            </p>
            <p className="text-xs text-base-content/60 sm:text-sm">
              Demo customer site
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link href="/admin" className="btn btn-ghost btn-sm">
              Admin
            </Link>
          </div>
        </div>
      </div>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            Request a job estimate
          </h1>
          <p className="mt-4 max-w-xl text-base-content/75">
            This demo uses a sample shop price book (lawn care packages). Tell
            us what you need. You get an estimate by email right away. The shop
            gets a copy at the same time.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-base-content/80">
            <li>• Sample packages: weekly and biweekly mowing</li>
            <li>• Sample packages: spring and fall cleanup</li>
            <li>• Sample add-ons: mulch, edging, fertilizer, shrub trim</li>
          </ul>
        </div>
        <QuoteWidget siteKey={store.settings.siteKey} />
      </section>
    </main>
  );
}
