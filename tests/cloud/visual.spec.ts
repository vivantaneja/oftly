import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
test("landing at desktop and phone sizes respects motion and stays readable", async ({
  page,
}) => {
  mkdirSync(".impeccable/review", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "One card. A longer-lasting memory." }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: `.impeccable/review/landing-${name}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await page.getByLabel("Subject or goal").fill("Biology");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "See my study rhythm" }).click();
  await page
    .getByRole("heading", { name: "Biology, in 15-minute returns." })
    .scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: ".impeccable/review/plan-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/#account");
  await expect(
    page.getByRole("heading", { name: "Take your learning with you." }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/auth-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("sample rating follows the card through the scroll story", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try to recall. Then reveal." })
    .click();
  await page.getByRole("button", { name: "Hard", exact: true }).click();
  await expect(
    page.getByText("Rated Hard. This card will return after a gap."),
  ).toBeVisible();
  await page.screenshot({ path: ".impeccable/review/landing-rated.png" });
  for (const [name, progress] of [
    ["rating", 0.5],
    ["return", 0.9],
  ] as const) {
    await page.evaluate((progress) => {
      const section = document.querySelector(".memory-story")!;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const start = top - innerHeight / 2;
      const end = top + section.getBoundingClientRect().height - innerHeight;
      window.scrollTo(0, start + (end - start) * progress);
    }, progress);
    await expect(page.locator(".story-card-state")).toHaveText(
      name === "rating"
        ? "Your rating: Hard"
        : "Same question. A fresh retrieval.",
    );
    await page.screenshot({
      path: `.impeccable/review/landing-story-${name}.png`,
      animations: "disabled",
    });
  }
});
