import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

async function verifyChrome() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    console.log(`Test browser ready: Chrome ${browser.version()}`);
  } finally {
    await browser.close();
  }
}

try {
  // Hosted runners may already provide Chrome and its required libraries.
  // Verify it can actually launch before skipping the package installer.
  await verifyChrome();
} catch {
  console.log("Chrome is not ready; installing the browser and dependencies.");
  execFileSync(
    process.execPath,
    [
      fileURLToPath(new URL("../node_modules/playwright/cli.js", import.meta.url)),
      "install",
      "--with-deps",
      "chrome",
    ],
    { stdio: "inherit" },
  );
  await verifyChrome();
}
