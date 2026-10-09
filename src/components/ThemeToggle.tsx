"use client";

import { useEffect, useState } from "react";
import {
  DARK_THEME,
  DEFAULT_THEME,
  LIGHT_THEME,
  THEME_STORAGE_KEY,
  isQuinstaTheme,
  type QuinstaTheme,
} from "@/lib/theme";

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<QuinstaTheme>(DEFAULT_THEME);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const next = isQuinstaTheme(stored)
      ? stored
      : ((document.documentElement.getAttribute("data-theme") as QuinstaTheme) ||
        DEFAULT_THEME);
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  function toggle() {
    const next = theme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  }

  const isDark = theme === DARK_THEME;

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm btn-square"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
