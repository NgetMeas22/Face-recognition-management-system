// Locale-prefixed URLs: /en/dashboard, /km/dashboard. Pure functions, shared by the proxy
// (server) and client components.
import type { Locale } from "./translations";

export const LOCALES = ["en", "km"] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = "en";
/** Remembers the last chosen language so locale-less URLs (/, /dashboard) redirect to it. */
export const LOCALE_COOKIE = "facetrack_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Splits "/km/settings?tab=1" into { locale: "km", path: "/settings?tab=1" }. */
export function stripLocale(pathname: string): { locale: Locale | null; path: string } {
  const match = /^\/([^/?#]+)(.*)$/.exec(pathname);
  if (match && isLocale(match[1])) {
    const rest = match[2];
    return { locale: match[1], path: rest === "" || rest.startsWith("?") || rest.startsWith("#") ? `/${rest}` : rest };
  }
  return { locale: null, path: pathname };
}

/** Prefixes an app path with a locale: ("en", "/dashboard") → "/en/dashboard". Idempotent. */
export function localizePath(locale: Locale, path: string): `/${string}` {
  const { path: bare } = stripLocale(path.startsWith("/") ? path : `/${path}`);
  if (bare === "/") return `/${locale}`;
  if (bare.startsWith("/?") || bare.startsWith("/#")) return `/${locale}${bare.slice(1)}`;
  return `/${locale}${bare}`;
}

/**
 * Picks a locale for a request without one in the URL: saved cookie first, then the browser's
 * Accept-Language preference, then English.
 */
export function negotiateLocale(cookieValue: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.split("=")[1] ?? "1");
      return { base: tag.split("-")[0], q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.base && entry.q > 0)
    .sort((a, b) => b.q - a.q);
  return ranked.map((entry) => entry.base).find(isLocale) ?? DEFAULT_LOCALE;
}
