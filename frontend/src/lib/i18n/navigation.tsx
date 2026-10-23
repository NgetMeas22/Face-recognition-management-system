"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, type ComponentProps } from "react";

import { useI18n } from "./context";
import { localizePath } from "./routing";

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  /** App path without a locale, e.g. "/settings#account". */
  href: string;
};

/** next/link that keeps the current language: href="/scanner" → /en/scanner or /km/scanner. */
export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const { locale } = useI18n();
  return <Link href={localizePath(locale, href)} {...props} />;
}

/** useRouter() whose push/replace take locale-less paths and add the current locale. */
export function useLocaleRouter() {
  const router = useRouter();
  const { locale } = useI18n();
  return useMemo(
    () => ({
      push: (path: string) => router.push(localizePath(locale, path)),
      replace: (path: string) => router.replace(localizePath(locale, path)),
    }),
    [router, locale],
  );
}
