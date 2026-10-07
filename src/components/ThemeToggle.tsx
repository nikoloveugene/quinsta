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
      className="btn btn-ghost btn-sm"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
