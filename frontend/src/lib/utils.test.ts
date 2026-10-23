import { describe, expect, it } from "vitest";

import { formatBytes, sniffImageKind } from "./image-validation";
import { NAV_ITEMS, navItemFor } from "./navigation";
import { Perm, satisfies } from "./permissions";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it.each([
    ["/people", "/people"],
    ["/scanner?tab=upload", "/scanner?tab=upload"],
    [null, "/dashboard"],
    ["https://evil.example/", "/dashboard"],
    ["//evil.example", "/dashboard"],
    ["/\\evil.example", "/dashboard"],
    ["javascript:alert(1)", "/dashboard"],
    ["/login?next=/x", "/dashboard"],
    ["/ok\n", "/dashboard"],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});

describe("sniffImageKind", () => {
  it("detects JPEG and PNG from magic bytes", () => {
    expect(sniffImageKind(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(sniffImageKind(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
  });

  it("rejects other content even if it is named .jpg", () => {
    expect(sniffImageKind(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImageKind(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toBeNull(); // GIF
    expect(sniffImageKind(new Uint8Array([]))).toBeNull();
  });

  it("formats sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("permissions", () => {
  const viewer = new Set(["people.read", "attendance.read", "reports.read"]);

  it("checks all/any requirements", () => {
    expect(satisfies(viewer, undefined)).toBe(true);
    expect(satisfies(viewer, { all: [Perm.PEOPLE_READ, Perm.REPORTS_READ] })).toBe(true);
    expect(satisfies(viewer, { all: [Perm.SCAN_RUN] })).toBe(false);
    expect(satisfies(viewer, { any: [Perm.SCAN_RUN, Perm.AUDIT_READ] })).toBe(false);
    expect(satisfies(new Set(["audit.read"]), { any: [Perm.SCAN_RUN, Perm.AUDIT_READ] })).toBe(true);
  });

  it("hides recognition pages from the default viewer role", () => {
    const visible = NAV_ITEMS.filter((item) => satisfies(viewer, item.requires)).map((i) => i.href);
    expect(visible).toEqual(["/dashboard", "/people", "/departments", "/attendance", "/reports", "/settings"]);
  });

  it("maps nested paths to their nav item", () => {
    expect(navItemFor("/people/42")?.href).toBe("/people");
    expect(navItemFor("/peoplex")).toBeUndefined();
  });
});
