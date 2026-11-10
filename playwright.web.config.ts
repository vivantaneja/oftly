import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/web",
  workers: 1,
  use: {
    baseURL: process.env.OFTLY_TEST_URL ?? "http://127.0.0.1:18766",
    channel: "chrome",
    headless: true,
  },
  webServer: process.env.OFTLY_TEST_URL
    ? undefined
    : {
        command: "node tests/web/serve.mjs",
        url: "http://127.0.0.1:18766",
        reuseExistingServer: false,
      },
  reporter: "list",
});
