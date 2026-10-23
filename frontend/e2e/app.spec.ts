import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const admin = { username: process.env.E2E_ADMIN_USERNAME ?? "", password: process.env.E2E_ADMIN_PASSWORD ?? "" };
const viewer = { username: process.env.E2E_VIEWER_USERNAME ?? "", password: process.env.E2E_VIEWER_PASSWORD ?? "" };
const SCREENS = "test-results/screens";

// 1×1 PNG and a text file pretending to be a JPEG.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const FAKE_JPG = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg' onload='alert(1)'/>");

async function signIn(page: Page, user: { username: string; password: string }) {
  // In `next dev` the form can render before React hydrates it; typing too early is wiped by
  // hydration. Wait for the hydration marker, then confirm the values stuck before submitting.
  await page.locator("form[data-hydrated=true]").waitFor({ timeout: 20_000 });
  const username = page.getByLabel("Username or email");
  const password = page.getByLabel("Password", { exact: true });
  await expect(async () => {
    await username.fill(user.username);
    await password.fill(user.password);
    await expect(username).toHaveValue(user.username, { timeout: 500 });
  }).toPass({ timeout: 10_000 });
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.beforeAll(() => {
  if (!admin.username || !admin.password || !viewer.username || !viewer.password) {
    throw new Error("Set E2E_ADMIN_* and E2E_VIEWER_* in frontend/.env.local");
  }
});

test("rejects bad credentials with the backend's generic message", async ({ page }) => {
  await page.goto("/en/login");
  await signIn(page, { username: "nobody-e2e", password: "wrong-password-123" });
  await expect(page.getByRole("alert").filter({ hasText: "Invalid username or password" })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
});

test.describe("administrator", () => {
  test.describe.configure({ mode: "serial" });
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({ permissions: ["camera"] });
    page = await context.newPage();
  });
  test.afterAll(async () => context.close());

  test("protected page redirects to login, then returns after sign-in", async () => {
    await page.goto("/settings"); // no locale on purpose: the proxy adds /en, ?next stays locale-less
    await expect(page).toHaveURL(/\/en\/login\?next=%2Fsettings$/);
    await page.screenshot({ path: `${SCREENS}/login.png` });
    await signIn(page, admin);
    await expect(page).toHaveURL(/\/en\/settings$/);
    await expect(page.locator("#main").getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
  });

  test("dashboard shows live API status and the role chart", async () => {
    await page.locator("[data-sidebar=sidebar]").getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("region", { name: "System status" }).getByText("Online", { exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "System status" }).getByText("Connected", { exact: true })).toBeVisible();
    await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();
    const nav = page.locator("[data-sidebar=sidebar]");
    for (const name of ["Employees", "Departments", "Registration", "Scanner", "Scan History", "Attendance", "Reports", "Settings"]) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await page.screenshot({ path: `${SCREENS}/dashboard-light.png`, fullPage: true });
  });

  test("session survives a reload and two tabs restoring at the same time", async () => {
    await page.reload();
    await expect(page.getByRole("region", { name: "System status" }).getByText("Online", { exact: true })).toBeVisible();

    // Both tabs call /auth/refresh at once. Without cross-tab locking the second would replay a
    // rotated token and the backend would revoke the whole sign-in.
    const [a, b] = await Promise.all([context.newPage(), context.newPage()]);
    await Promise.all([a.goto("/en/dashboard"), b.goto("/en/dashboard")]);
    for (const tab of [a, b]) {
      await expect(tab.locator("#main").getByRole("heading", { level: 1 })).toContainText("Good");
      await expect(tab).toHaveURL(/\/dashboard$/);
    }
    await Promise.all([a.close(), b.close()]);

    await page.reload();
    await expect(page.getByRole("region", { name: "System status" }).getByText("Online", { exact: true })).toBeVisible();
  });

  test("roles & permissions table is searchable", async () => {
    await page.goto("/en/settings?tab=users"); // roles live on the User Management tab
    const table = page.getByRole("table", { name: "Role Permissions Matrix" });
    // Header + all 20 permissions (the roles table pages at 25).
    await expect(table.getByRole("row")).toHaveCount(1 + 20);
    await page.getByLabel("Search Role Permissions Matrix").fill("faces");
    await expect(table.getByRole("row")).toHaveCount(1 + 3);
    await expect(page.getByText("1–3 of 3")).toBeVisible();
  });

  test("live camera preview and frame capture work", async () => {
    await page.goto("/en/scanner");
    await page.getByTestId("start-camera").click();
    await expect(page.getByText("Live", { exact: true })).toBeVisible();
    await page.getByTestId("capture-frame").click();
    await expect(page.getByTestId("scan-preview")).toBeVisible();
    // The scan button exists; real recognition needs the backend scan API (Phase 4).
    await expect(page.getByRole("button", { name: "Scan Face" })).toBeVisible();
    await page.screenshot({ path: `${SCREENS}/scanner-live.png`, fullPage: true });
  });

  test("upload validates the real file type", async () => {
    await page.getByRole("tab", { name: "Upload Photo" }).click();
    // Leaving the live tab unmounts the camera panel, which stops the stream.
    await expect(page.getByLabel("Live camera preview")).toHaveCount(0);

    const input = page.getByTestId("image-input");
    await input.setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: FAKE_JPG });
    await expect(page.getByRole("alert").filter({ hasText: "Only JPG, JPEG and PNG images are accepted" })).toBeVisible();

    await input.setInputFiles({ name: "face.png", mimeType: "image/png", buffer: PNG_1PX });
    await expect(page.getByTestId("scan-preview")).toBeVisible();
    await expect(page.getByText(/1×1px/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Scan Face" })).toBeVisible();
  });

  test("face registration collects up to five images", async () => {
    await page.goto("/en/faces");
    await page.getByTestId("image-input").setInputFiles(
      Array.from({ length: 6 }, (_, i) => ({ name: `f${i}.png`, mimeType: "image/png", buffer: PNG_1PX })),
    );
    await expect(page.getByTestId("collected-images").getByRole("listitem")).toHaveCount(5);
    await expect(page.getByRole("button", { name: /Submit for Approval \(5\)/ })).toBeDisabled();
  });

  test("dark mode and mobile layout", async () => {
    await page.goto("/en/dashboard");
    await page.getByTestId("theme-toggle").click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.screenshot({ path: `${SCREENS}/dashboard-dark.png`, fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("[data-sidebar=sidebar]").first()).toBeHidden();
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("link", { name: "Scanner", exact: true })).toBeVisible();
    await expect(drawer).toHaveAttribute("data-state", "open");
    await page.waitForTimeout(600); // let the slide-in animation finish before the screenshot
    await page.screenshot({ path: `${SCREENS}/mobile-nav-dark.png` });
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByTestId("theme-toggle").click();
    await page.getByRole("menuitemradio", { name: "Light" }).click();
  });

  test("language switch keeps the page and swaps the /en ↔ /km prefix", async () => {
    await page.goto("/en/settings");
    const nav = page.locator("[data-sidebar=sidebar]");
    await expect(nav.locator("a[href='/en/scanner']")).toBeVisible();

    await page.getByRole("button", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: /ខ្មែរ/ }).click();
    await expect(page).toHaveURL(/\/km\/settings$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "km");
    await expect(nav.locator("a[href='/km/scanner']")).toBeVisible();
    // Only visible links: Next.js keeps the previous /en page mounted but hidden (Activity).
    await expect(nav.locator("a[href^='/en/']:visible")).toHaveCount(0);

    // A locale-less URL now remembers Khmer (cookie).
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/km\/dashboard$/);

    await page.getByRole("button", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: /English/ }).click();
    await expect(page).toHaveURL(/\/en\/dashboard$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("sign out ends the session everywhere", async () => {
    await page.getByRole("button", { name: /Account menu/ }).click();
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/en\/login$/);
    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/login\?next=%2Fdashboard$/);
  });
});

test("viewer role only sees what it may use", async ({ page }) => {
  await page.goto("/en/login");
  await signIn(page, viewer);
  await expect(page).toHaveURL(/\/dashboard$/);

  const nav = page.locator("[data-sidebar=sidebar]");
  await expect(nav.getByRole("link", { name: "Attendance", exact: true })).toBeVisible();
  for (const hidden of ["Scanner", "Registration", "Scan History"]) {
    await expect(nav.getByRole("link", { name: hidden, exact: true })).toHaveCount(0);
  }

  await page.goto("/en/scanner");
  await expect(page.getByText("You don't have access to this page")).toBeVisible();
  await expect(page.getByText("scan.run")).toBeVisible();
  await page.screenshot({ path: `${SCREENS}/viewer-forbidden.png` });

  await page.goto("/en/settings?tab=users");
  await expect(page.getByRole("table", { name: "Role Permissions Matrix" })).toHaveCount(0);
});
