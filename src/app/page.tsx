import Link from "next/link";
import { PersonaAvatar } from "@/components/PersonaAvatar";
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
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight text-base-content sm:text-5xl md:text-6xl">
          Instant estimates for your website
        </h1>
        <p className="mt-5 max-w-2xl text-base text-base-content/75 sm:text-lg">
          Upload your price book. Customers describe the job and get an estimate
          by email right away. You get a copy so you can check the result.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/admin"
            className="btn btn-primary w-full gap-2 sm:w-auto"
          >
            <PersonaAvatar persona="admin" active size="md" />
            Admin view
          </Link>
          <Link
            href="/demo"
            className="btn btn-outline w-full gap-2 sm:w-auto"
          >
            <PersonaAvatar persona="customer" size="md" />
            Customer widget
          </Link>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Price book",
              body: "Upload your rate list once. Quinsta maps it into quote lines.",
            },
            {
              title: "Owner copy",
              body: "Every customer quote lands in your inbox so you can check it.",
            },
            {
              title: "Script embed",
              body: "One snippet on your site. No CRM required.",
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
