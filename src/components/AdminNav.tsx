"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/price-book", label: "Price book" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/embed", label: "Embed" },
  { href: "/admin/emails", label: "Emails" },
  { href: "/demo", label: "Demo" },
];

export function AdminNav({ current }: { current?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-100/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-primary sm:text-2xl"
          >
            Quinsta
          </Link>
          <p className="truncate text-xs text-base-content/70 sm:text-sm">
            Landscaping quote admin
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-ghost btn-sm md:hidden"
            aria-expanded={open}
            aria-controls="admin-nav-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <nav
        id="admin-nav-menu"
        className={`${
          open ? "flex" : "hidden"
        } max-h-[70vh] flex-col gap-1 overflow-y-auto border-t border-base-300 px-4 py-3 md:flex md:max-h-none md:flex-row md:flex-wrap md:items-center md:gap-2 md:overflow-visible md:border-t-0 md:px-4 md:pb-4 md:pt-0`}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 md:flex-row md:flex-wrap md:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`btn btn-md justify-start md:btn-sm ${
                current === link.href ? "btn-primary" : "btn-ghost"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
