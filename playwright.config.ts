import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:18765", channel: "chrome", headless: true },
  webServer: {
    command:
      ".venv/bin/python -m uvicorn server.app:app --host 127.0.0.1 --port 18765",
    url: "http://127.0.0.1:18765/api/dashboard",
    reuseExistingServer: false,
    env: { RECALL_DATA_DIR: mkdtempSync(join(tmpdir(), "recall-e2e-")) },
  },
  reporter: "list",
});
