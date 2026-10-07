import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/price-book", label: "Price book" },
  { href: "/admin/inbox", label: "Approval inbox" },
  { href: "/admin/embed", label: "Embed" },
  { href: "/admin/emails", label: "Email inbox" },
  { href: "/demo", label: "Customer demo" },
];

export function AdminNav({ current }: { current?: string }) {
  return (
    <header className="border-b border-base-300 bg-base-100/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="font-display text-2xl font-semibold tracking-tight text-primary"
          >
            Quinsta
          </Link>
          <p className="text-sm text-base-content/70">Landscaping quote admin</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`btn btn-sm ${
                  current === link.href ? "btn-primary" : "btn-ghost"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
