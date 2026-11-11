import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

test("expressive opening fits desktop and phone screens with an accessible path", async ({
  page,
}) => {
  mkdirSync(".impeccable/review", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["tablet", 800, 900],
    ["mobile", 390, 844],
    ["small", 320, 740],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /One card\.\s*A longer-lasting memory\./,
      }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight + 1,
      ),
    ).toBeTruthy();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: `.impeccable/review/return-${name}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Reveal answer", exact: true })
    .click();
  await page.getByRole("button", { name: "I remembered", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A useful return." }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /remembered card has a longer gap/ }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: ".impeccable/review/return-rated-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: ".impeccable/review/return-rated-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Set up my study plan" }).click();
  await page.screenshot({
    path: ".impeccable/review/return-context-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "School", exact: true }).click();
  await page
    .getByRole("button", { name: "Reading and notes", exact: true })
    .click();
  await page.getByLabel("Hours", { exact: true }).fill("8");
  await page.screenshot({
    path: ".impeccable/review/return-time-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "See my plan" }).click();
  await page.screenshot({
    path: ".impeccable/review/return-plan-mobile.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Use this plan" }).click();
  await page.screenshot({
    path: ".impeccable/review/return-account-mobile.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "30px"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("time entry handles short sessions, full days, invalid totals and legacy saved plans", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "oftly-setup",
      JSON.stringify({
        step: 3,
        context: "independent",
        method: "flashcards",
        hours: "0",
        minutes: "0",
        demo: "again",
      }),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: "See my plan" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "between 5 minutes and 24 hours",
  );
  await page.getByLabel("Minutes", { exact: true }).fill("5");
  await page.getByRole("button", { name: "See my plan" }).click();
  await expect(
    page.getByText("Work or personal study · 5 minutes a day"),
  ).toBeVisible();
  await expect(page.getByText("Other study & breaks")).toHaveCount(0);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByLabel("Hours", { exact: true }).fill("24");
  await page.getByRole("button", { name: "See my plan" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Minutes", { exact: true }).fill("0");
  await page.getByRole("button", { name: "See my plan" }).click();
  await expect(
    page.getByText("Work or personal study · 24 hours a day"),
  ).toBeVisible();
  const legacy = await page.evaluate(async () => {
    const { savedPlanLabel } = await import("/src/lib/plan.ts");
    return savedPlanLabel({
      subject: "Spanish",
      minutes: 15,
      weeks: 8,
      cards: 300,
    });
  });
  expect(legacy).toBe("Spanish · 15 minutes a day");
});

test("recall illustration follows the answer and finishes its animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Reveal answer", exact: true })
    .click();
  await page.getByRole("button", { name: "I missed it", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /missed card has a shorter gap/ }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".recall-path")
        .evaluate((el) => getComputedStyle(el).strokeDashoffset),
    )
    .toBe("0px");
  expect(
    await page
      .locator(".recall-path")
      .evaluate((el) => getComputedStyle(el).animationIterationCount),
  ).toBe("1");
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "30px"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  const bounds = await page
    .getByRole("button", { name: "Set up my study plan" })
    .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
  expect(bounds.scroll).toBeLessThanOrEqual(bounds.width);
  const marker = await page.locator(".recall-marker span").boundingBox();
  const axis = await page.locator(".recall-axis").boundingBox();
  expect(marker!.y + marker!.height).toBeLessThan(axis!.y);
  await page.screenshot({
    path: ".impeccable/review/return-large-text.png",
    fullPage: true,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".recall-path")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
