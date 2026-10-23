import { stripLocale } from "@/lib/i18n/routing";

/**
 * Returns `next` as a locale-less app path, but only if it is a same-site path, so
 * ?next=https://evil.example or //evil.example cannot turn the login page into an open redirect.
 * A locale prefix in `next` is dropped; the caller adds the current locale.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  const path = stripLocale(next).path;
  if (path === "/" || path === "/login" || path.startsWith("/login?") || path.startsWith("/login/")) return fallback;
  return path;
}
