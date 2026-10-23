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
  await page.getByLabel("Username or email").fill(user.username);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.beforeAll(() => {
  if (!admin.username || !admin.password || !viewer.username || !viewer.password) {
    throw new Error("Set E2E_ADMIN_* and E2E_VIEWER_* in frontend/.env.local");
  }
});

test("rejects bad credentials with the backend's generic message", async ({ page }) => {
  await page.goto("/login");
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
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login\?next=%2Fsettings$/);
    await page.screenshot({ path: `${SCREENS}/login.png` });
    await signIn(page, admin);
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
  });

  test("dashboard shows live API status and the role chart", async () => {
    await page.locator("[data-sidebar=sidebar]").getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Online")).toBeVisible();
    await expect(page.getByText("Connected")).toBeVisible();
    await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();
    const nav = page.locator("[data-sidebar=sidebar]");
    for (const name of ["Employees & Students", "Departments", "Face Registration", "Face Scanner", "Scan History", "Attendance", "Reports", "Settings"]) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await page.screenshot({ path: `${SCREENS}/dashboard-light.png`, fullPage: true });
  });

  test("session survives a reload and two tabs restoring at the same time", async () => {
    await page.reload();
    await expect(page.getByText("Online")).toBeVisible();

    // Both tabs call /auth/refresh at once. Without cross-tab locking the second would replay a
    // rotated token and the backend would revoke the whole sign-in.
    const [a, b] = await Promise.all([context.newPage(), context.newPage()]);
    await Promise.all([a.goto("/dashboard"), b.goto("/dashboard")]);
    for (const tab of [a, b]) {
      await expect(tab.getByRole("heading", { level: 1 })).toContainText("Good");
      await expect(tab).toHaveURL(/\/dashboard$/);
    }
    await Promise.all([a.close(), b.close()]);

    await page.reload();
    await expect(page.getByText("Online")).toBeVisible();
  });

  test("roles & permissions table is searchable", async () => {
    await page.goto("/settings");
    const table = page.getByRole("table", { name: "Permissions by role" });
    // Header + all 20 permissions (the roles table pages at 25).
    await expect(table.getByRole("row")).toHaveCount(1 + 20);
    await page.getByLabel("Search Permissions by role").fill("faces");
    await expect(table.getByRole("row")).toHaveCount(1 + 3);
    await expect(page.getByText("1–3 of 3")).toBeVisible();
  });

  test("live camera preview and frame capture work; recognition stays disabled", async () => {
    await page.goto("/scanner");
    await page.getByTestId("start-camera").click();
    await expect(page.getByText("Live", { exact: true })).toBeVisible();
    await page.getByTestId("capture-frame").click();
    await expect(page.getByTestId("scan-preview")).toBeVisible();
    await expect(page.getByRole("button", { name: "Identify" })).toBeDisabled();
    await page.screenshot({ path: `${SCREENS}/scanner-live.png`, fullPage: true });
  });

  test("upload validates the real file type", async () => {
    await page.getByRole("tab", { name: "Upload image" }).click();
    // Leaving the live tab unmounts the camera panel, which stops the stream.
    await expect(page.getByLabel("Live camera preview")).toHaveCount(0);

    const input = page.getByTestId("image-input");
    await input.setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: FAKE_JPG });
    await expect(page.getByRole("alert").filter({ hasText: "Only JPG, JPEG and PNG images are accepted" })).toBeVisible();

    await input.setInputFiles({ name: "face.png", mimeType: "image/png", buffer: PNG_1PX });
    await expect(page.getByTestId("scan-preview")).toBeVisible();
    await expect(page.getByText("1×1px")).toBeVisible();
    await expect(page.getByRole("button", { name: "Scan image" })).toBeDisabled();
  });

  test("face registration collects up to five images", async () => {
    await page.goto("/faces");
    await page.getByTestId("image-input").setInputFiles(
      Array.from({ length: 6 }, (_, i) => ({ name: `f${i}.png`, mimeType: "image/png", buffer: PNG_1PX })),
    );
    await expect(page.getByTestId("collected-images").getByRole("listitem")).toHaveCount(5);
    await expect(page.getByRole("button", { name: /Submit 5 images/ })).toBeDisabled();
  });

  test("dark mode and mobile layout", async () => {
    await page.goto("/dashboard");
    await page.getByTestId("theme-toggle").click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.screenshot({ path: `${SCREENS}/dashboard-dark.png`, fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("[data-sidebar=sidebar]").first()).toBeHidden();
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await expect(page.getByRole("dialog").getByRole("link", { name: "Face Scanner" })).toBeVisible();
    await page.screenshot({ path: `${SCREENS}/mobile-nav-dark.png` });
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByTestId("theme-toggle").click();
    await page.getByRole("menuitemradio", { name: "Light" }).click();
  });

  test("sign out ends the session everywhere", async () => {
    await page.getByRole("button", { name: /Account menu/ }).click();
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });
});

test("viewer role only sees what it may use", async ({ page }) => {
  await page.goto("/login");
  await signIn(page, viewer);
  await expect(page).toHaveURL(/\/dashboard$/);

  const nav = page.locator("[data-sidebar=sidebar]");
  await expect(nav.getByRole("link", { name: "Attendance", exact: true })).toBeVisible();
  for (const hidden of ["Face Scanner", "Face Registration", "Scan History"]) {
    await expect(nav.getByRole("link", { name: hidden, exact: true })).toHaveCount(0);
  }
  await expect(page.getByText("Visible to administrators (roles.manage).")).toBeVisible();

  await page.goto("/scanner");
  await expect(page.getByText("You don't have access to this page")).toBeVisible();
  await expect(page.getByText("scan.run")).toBeVisible();
  await page.screenshot({ path: `${SCREENS}/viewer-forbidden.png` });

  await page.goto("/settings");
  await expect(page.getByRole("table", { name: "Permissions by role" })).toHaveCount(0);
});
