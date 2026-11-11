import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

test("research explains actual study results and simulates FSRS without changing the library", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#welcome");
  await page
    .getByRole("button", { name: "Reveal answer", exact: true })
    .click();
  await page.getByRole("button", { name: "I remembered", exact: true }).click();
  await page
    .getByRole("link", { name: "See the research", exact: true })
    .click();
  await expect(page).toHaveURL(/#research$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Make it stick.Here’s the science.",
  );
  await expect(
    page.getByRole("button", { name: "1 week", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".research-bar-row strong")).toHaveText([
    "42%",
    "56%",
  ]);
  await page.getByRole("button", { name: "5 minutes", exact: true }).click();
  await expect(page.locator(".research-bar-row strong")).toHaveText([
    "81%",
    "75%",
  ]);
  await page.getByRole("button", { name: "2 days", exact: true }).click();
  await expect(page.locator(".research-bar-row strong")).toHaveText([
    "54%",
    "68%",
  ]);
  await expect(
    page.getByRole("link", { name: /Roediger & Karpicke/ }),
  ).toHaveAttribute(
    "href",
    "https://learninglab.psych.purdue.edu/downloads/2006/2006_Roediger_Karpicke_PsychSci.pdf",
  );
  await expect(
    page.getByRole("link", { name: /Full research notes on GitHub/ }),
  ).toHaveAttribute(
    "href",
    /github.com\/vivantaneja\/oftly\/blob\/main\/docs\/LEARNING-RESEARCH.md/,
  );
  await page.getByText("Show the answer", { exact: true }).click();
  await expect(
    page.getByText("The Pacific Ocean.", { exact: true }),
  ).toBeVisible();
  const demo = page.locator(".scheduler-demo");
  await demo.getByRole("button", { name: "Easy", exact: true }).click();
  await expect(demo.getByRole("status")).toContainText(
    /next review in \d+ days/,
  );
  await demo.getByRole("button", { name: "Again", exact: true }).click();
  await expect(demo.getByRole("status")).toContainText(
    "next review in 10 minutes",
  );
  await expect(demo).toContainText("2 simulated reviews");
  await demo.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(demo.getByRole("status")).toContainText("A new card.");
  await expect(demo).toContainText("0 simulated reviews");
  await page
    .getByText("How far does the evidence go?", { exact: true })
    .click();
  await expect(
    page.getByText(/not a scientifically validated prediction/),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: "Back to Oftly", exact: true }).click();
  await expect(
    page.getByText("Your response: I remembered", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "The research", exact: true }),
  ).toHaveAttribute("href", "#research");
  expect(errors).toEqual([]);
  await page.goto("/#today");
  await expect(
    page.getByRole("button", { name: "Try a 6-card sample deck" }),
  ).toBeVisible();
});

test("research visuals follow native scrolling and fit desktop, phone, dark and enlarged text", async ({
  page,
}) => {
  test.setTimeout(60000);
  mkdirSync(".impeccable/review", { recursive: true });
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto("/#research");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".spacing-return")).toHaveCSS(
    "stroke-dashoffset",
    "1px",
  );
  await page.screenshot({ path: ".impeccable/review/research-desktop.png" });
  await page.locator(".research-feedback").scrollIntoViewIfNeeded();
  await expect(page.locator(".spacing-return")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await page
    .locator(".spacing-explainer")
    .screenshot({ path: ".impeccable/review/research-spacing.png" });
  await page
    .locator(".research-engine")
    .screenshot({ path: ".impeccable/review/research-engine.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: ".impeccable/review/research-full.png",
    fullPage: true,
  });
  await page.goto("/#settings");
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await page.goto("/#research");
  await page.screenshot({ path: ".impeccable/review/research-dark.png" });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: ".impeccable/review/research-phone.png",
    fullPage: true,
  });
  for (const size of [16, 30]) {
    await page.evaluate(
      (size) => (document.documentElement.style.fontSize = `${size}px`),
      size,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: ".impeccable/review/research-large-text.png",
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator(".spacing-return")).toHaveCSS(
    "stroke-dashoffset",
    "0px",
  );
  await expect(page.locator(".research-bar-track span").first()).toHaveCSS(
    "transition-duration",
    "0s",
  );
});
