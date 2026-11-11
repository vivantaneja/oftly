import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

test("compact setup fits desktop and phone screens with an accessible path", async ({
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
      page.getByRole("heading", { name: "Try one card." }),
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
      path: `.impeccable/review/setup-${name}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Reveal answer", exact: true })
    .click();
  await page.getByRole("button", { name: "I remembered", exact: true }).click();
  await page.getByRole("button", { name: "Set up my study plan" }).click();
  await page.screenshot({
    path: ".impeccable/review/setup-context-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "School", exact: true }).click();
  await page
    .getByRole("button", { name: "Reading and notes", exact: true })
    .click();
  await page.getByLabel("Hours", { exact: true }).fill("8");
  await page.screenshot({
    path: ".impeccable/review/setup-time-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "See my plan" }).click();
  await page.screenshot({
    path: ".impeccable/review/setup-plan-mobile.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Use this plan" }).click();
  await page.screenshot({
    path: ".impeccable/review/setup-account-mobile.png",
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
