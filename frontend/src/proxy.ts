import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_COOKIE, localizePath, negotiateLocale, stripLocale } from "@/lib/i18n/routing";

/**
 * Every page lives under a locale prefix (/en/..., /km/...). Requests without one — "/",
 * "/dashboard", old bookmarks — are redirected to the visitor's language: the saved cookie, then
 * the browser's Accept-Language, then English.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (stripLocale(pathname).locale) return NextResponse.next();

  const locale = negotiateLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = localizePath(locale, pathname);
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip the API proxy (/api/v1 → FastAPI), Next.js internals and files with an extension.
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
