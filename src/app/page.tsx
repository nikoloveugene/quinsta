import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <main className="lawn-grid min-h-screen">
      <div className="mx-auto flex justify-end px-4 pt-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col justify-center px-4 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Quinsta
        </p>
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-tight text-base-content sm:text-6xl">
          Instant landscaping estimates for your website
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-base-content/75">
          Customers describe the job. Quinsta drafts a price-book estimate.
          You approve before they get the email.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/admin" className="btn btn-primary">
            Open admin
          </Link>
          <Link href="/demo" className="btn btn-outline">
            Try customer widget
          </Link>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Price book",
              body: "Paste your lawn, mulch, and seasonal packages once.",
            },
            {
              title: "Owner approval",
              body: "Drafts land in your inbox. Customer email waits on you.",
            },
            {
              title: "Script embed",
              body: "One snippet on your site. No CRM or Jobber required.",
            },
          ].map((item) => (
            <div key={item.title} className="border-t border-primary/30 pt-4">
              <h2 className="font-display text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-base-content/70">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
