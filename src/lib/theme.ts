export const THEME_STORAGE_KEY = "quinsta-theme";
export const DEFAULT_THEME = "quinsta-dark";
export const LIGHT_THEME = "quinsta";
export const DARK_THEME = "quinsta-dark";

export type QuinstaTheme = typeof DARK_THEME | typeof LIGHT_THEME;

export function isQuinstaTheme(value: string | null): value is QuinstaTheme {
  return value === DARK_THEME || value === LIGHT_THEME;
}
