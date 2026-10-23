import { loadEnvConfig } from "@next/env";
import { defineConfig } from "@playwright/test";

// Reads E2E_* variables from .env.local. Both servers must already be running:
//   backend:  uvicorn app.main:app --port 8000      frontend:  npm run dev (or build + start)
loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./e2e",
  // One worker: tests share a signed-in page so they stay under the backend's login rate limit.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    // Uses the Microsoft Edge already installed on Windows, so no browser download is needed.
    channel: "msedge",
    permissions: ["camera"],
    launchOptions: {
      // Synthetic webcam + auto-accepted permission prompt for the scanner tests.
      args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
