import { defineConfig } from "@playwright/test";
import { readFileSync } from "node:fs";
const { env } = JSON.parse(
  readFileSync("supabase/.temp/local-status.json", "utf8"),
);
if (env.API_URL !== "http://127.0.0.1:54321")
  throw Error("Cloud tests require the disposable localhost Supabase stack.");
export default defineConfig({
  testDir: "./tests/cloud",
  workers: 1,
  timeout: 90000,
  use: { baseURL: "http://127.0.0.1:18767", channel: "chrome", headless: true },
  webServer: {
    command: "npm run dev:browser -- --port 18767",
    url: "http://127.0.0.1:18767",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: env.API_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: env.PUBLISHABLE_KEY,
    },
  },
  reporter: "list",
});
