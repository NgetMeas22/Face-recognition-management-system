import { describe, expect, it } from "vitest";

import { navItemFor } from "../navigation";
import { safeNextPath } from "../safe-redirect";
import { isLocale, localizePath, negotiateLocale, stripLocale } from "./routing";

describe("localizePath", () => {
  it.each([
    ["en", "/dashboard", "/en/dashboard"],
    ["km", "/settings?tab=users#account", "/km/settings?tab=users#account"],
    ["en", "/", "/en"],
    ["km", "/?x=1", "/km?x=1"],
    ["en", "dashboard", "/en/dashboard"],
    // Already localized paths are re-targeted, never double-prefixed.
    ["km", "/en/scanner", "/km/scanner"],
    ["en", "/en", "/en"],
  ] as const)("%s + %s → %s", (locale, path, expected) => {
    expect(localizePath(locale, path)).toBe(expected);
  });
});

describe("stripLocale", () => {
  it.each([
    ["/en/dashboard", "en", "/dashboard"],
    ["/km", "km", "/"],
    ["/km?tab=1", "km", "/?tab=1"],
    ["/dashboard", null, "/dashboard"],
    ["/english/page", null, "/english/page"],
    ["/", null, "/"],
  ])("%s → %s %s", (input, locale, path) => {
    expect(stripLocale(input)).toEqual({ locale, path });
  });
});

describe("negotiateLocale", () => {
  it("prefers a valid saved cookie", () => {
    expect(negotiateLocale("km", "en-US,en;q=0.9")).toBe("km");
  });

  it("ignores an invalid cookie and uses Accept-Language by quality", () => {
    expect(negotiateLocale("fr", "fr-FR,km;q=0.8,en;q=0.5")).toBe("km");
    expect(negotiateLocale(undefined, "km-KH")).toBe("km");
    expect(negotiateLocale(undefined, "en;q=0.4,km;q=0.9")).toBe("km");
  });

  it("falls back to English", () => {
    expect(negotiateLocale(undefined, null)).toBe("en");
    expect(negotiateLocale(undefined, "fr,de;q=0.8")).toBe("en");
    expect(negotiateLocale(undefined, "km;q=0")).toBe("en");
  });

  it("validates locales", () => {
    expect(isLocale("km")).toBe(true);
    expect(isLocale("EN")).toBe(false);
  });
});

describe("locale-aware helpers", () => {
  it("safeNextPath returns a locale-less path and still blocks open redirects", () => {
    expect(safeNextPath("/km/people?x=1")).toBe("/people?x=1");
    expect(safeNextPath("/en/login?next=/x")).toBe("/dashboard");
    expect(safeNextPath("/en")).toBe("/dashboard");
    expect(safeNextPath("//evil.example/en")).toBe("/dashboard");
  });

  it("navItemFor ignores the locale prefix", () => {
    expect(navItemFor("/km/scanner")?.href).toBe("/scanner");
    expect(navItemFor("/en/people/42")?.href).toBe("/people");
  });
});
