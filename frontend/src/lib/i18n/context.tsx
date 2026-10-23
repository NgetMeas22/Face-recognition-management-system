"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";

import { LOCALE_COOKIE, localizePath, stripLocale } from "./routing";
import { translations, type Locale, type Translations } from "./translations";

interface I18nContextValue {
  locale: Locale;
  /** Switches language by moving to the same page under the other locale prefix. */
  setLocale: (locale: Locale) => void;
  t: Translations;
  isKhmer: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function rememberLocale(locale: Locale) {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // Cookies disabled: the URL still carries the locale.
  }
}

/** The locale comes from the URL segment (/en/…, /km/…), so it is known on the server too. */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = locale;
    rememberLocale(locale);
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      rememberLocale(next);
      const { path } = stripLocale(pathname);
      router.replace(localizePath(next, `${path}${window.location.search}${window.location.hash}`));
    },
    [locale, pathname, router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: translations[locale] ?? translations.en, isKhmer: locale === "km" }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      t: translations.en,
      isKhmer: false,
    };
  }
  return context;
}
