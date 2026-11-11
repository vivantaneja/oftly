import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

test("scroll introduction keeps the trial and setup accessible at every width", async ({
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
    const reveal = await page
      .getByRole("button", { name: "Reveal answer", exact: true })
      .boundingBox();
    expect(reveal!.y + reveal!.height).toBeLessThanOrEqual(height);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: `.impeccable/review/scroll-${name}.png`,
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
    page.getByRole("heading", { name: /A useful return/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: /successful reviews lead to shallower dips/,
    }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: ".impeccable/review/scroll-rated-mobile.png",
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
    path: ".impeccable/review/scroll-rated-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Set up my study plan" }).click();
  await page.screenshot({
    path: ".impeccable/review/scroll-context-mobile.png",
    fullPage: true,
  });
  await expect(
    page.getByRole("heading", { name: "What are you studying for?" }),
  ).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: ".impeccable/review/study-purpose-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Other", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "How do you usually study?" }),
  ).toBeFocused();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "How do you usually study?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reading and notes", exact: true })
    .click();
  await page.getByLabel("Hours", { exact: true }).fill("8");
  await page.screenshot({
    path: ".impeccable/review/scroll-time-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "See my plan" }).click();
  await expect(
    page.getByText("Other · 8 hours a day", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/scroll-plan-mobile.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Use this plan" }).click();
  const google = page.getByRole("button", {
    name: "Continue with Google",
    exact: true,
  });
  await expect(google).toBeEnabled();
  await expect(google.locator("img")).toHaveAttribute("alt", "");
  await expect
    .poll(() =>
      google
        .locator("img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.screenshot({
    path: ".impeccable/review/scroll-account-mobile.png",
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: ".impeccable/review/google-signin-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "30px"));
  const emailButton = page.getByRole("button", {
    name: "Email me a sign-in link",
    exact: true,
  });
  const labelFits = await emailButton.evaluate((button) => {
    const range = document.createRange();
    range.selectNodeContents(button);
    const label = range.getBoundingClientRect(),
      bounds = button.getBoundingClientRect();
    return label.left >= bounds.left && label.right <= bounds.right;
  });
  expect(labelFits).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: ".impeccable/review/google-signin-large-text.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Continue on this device without an account" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Decks", exact: true }),
  ).toBeVisible();
  const saved = await page.evaluate(async () => {
    const { readMeta } = await import("/src/lib/browser/storage.ts");
    return readMeta("plan");
  });
  expect(saved).toEqual({
    version: 2,
    context: "other",
    method: "notes",
    minutes: 480,
  });
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

async function scrollStory(page: Page, progress: number) {
  await page.locator(".recall-scroll").evaluate((section, progress) => {
    const stage = section.querySelector(".recall-stage")!;
    const top = section.getBoundingClientRect().top + scrollY;
    const distance = section.clientHeight - stage.clientHeight;
    scrollTo(0, top - 16 + distance * progress);
  }, progress);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(page.locator(".recall-scroll")).toHaveAttribute(
    "data-moving",
    "false",
  );
}

test("scroll directly moves the card across, draws the curve and reverses on desktop and phone", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["phone", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /One card/ })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".recall-scroll")).toHaveAttribute(
      "data-stationary",
      "false",
    );
    await scrollStory(page, 0);
    await expect(page.locator(".recall-card-stage")).toHaveText(
      "First encounter",
    );
    const first = (await page
      .locator(".recall-travelling-card")
      .boundingBox())!;
    await page.screenshot({
      path: `.impeccable/review/scroll-${name}-start.png`,
    });
    await scrollStory(page, 0.5);
    await expect(page.locator(".recall-card-stage")).toHaveText(
      "Recall & rate",
    );
    const middle = (await page
      .locator(".recall-travelling-card")
      .boundingBox())!;
    expect(middle.x).toBeGreaterThan(first.x + (width > 600 ? 200 : 25));
    await expect(page.locator(".recall-travelling-card p")).toHaveText(
      "The Pacific Ocean.",
    );
    await page.screenshot({
      path: `.impeccable/review/scroll-${name}-middle.png`,
    });
    const progress = await page
      .locator(".recall-scroll")
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--curve-progress"),
      );
    expect(Number(progress)).toBeCloseTo(0.5, 1);
    await page.waitForTimeout(200);
    expect(
      (await page.locator(".recall-travelling-card").boundingBox())!.x,
    ).toBeCloseTo(middle.x, 0);
    await scrollStory(page, 1);
    await expect(page.locator(".recall-card-stage")).toHaveText(
      "A later return",
    );
    const last = (await page.locator(".recall-travelling-card").boundingBox())!;
    expect(last.x).toBeGreaterThan(middle.x + (width > 600 ? 200 : 25));
    expect(last.x + last.width).toBeLessThanOrEqual(width);
    await expect(page.locator(".recall-travelling-card p")).toHaveText(
      "What is the largest ocean on Earth?",
    );
    await page.screenshot({
      path: `.impeccable/review/scroll-${name}-end.png`,
    });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await scrollStory(page, 0);
    expect(
      (await page.locator(".recall-travelling-card").boundingBox())!.x,
    ).toBeCloseTo(first.x, 0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page
    .getByRole("button", { name: "Reveal answer", exact: true })
    .click();
  await page.getByRole("button", { name: "I missed it", exact: true }).click();
  await scrollStory(page, 1);
  await expect(page.locator(".recall-card-stage")).toHaveText("Back sooner");
  await page.getByRole("button", { name: "Set up my study plan" }).click();
  await expect(
    page.getByRole("heading", { name: "What are you studying for?" }),
  ).toBeFocused();
});

test("reduced motion and large text preserve the complete story without pinned movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".recall-scroll")).toHaveAttribute(
    "data-stationary",
    "true",
  );
  expect(
    await page
      .locator(".recall-stage")
      .evaluate((el) => getComputedStyle(el).position),
  ).toBe("static");
  expect(
    await page
      .locator(".recall-path")
      .evaluate((el) => getComputedStyle(el).strokeDashoffset),
  ).toBe("0px");
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "30px"));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".recall-scroll")).toHaveAttribute(
    "data-stationary",
    "true",
  );
  const bounds = await page
    .getByRole("button", { name: "Set up my study plan" })
    .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
  expect(bounds.scroll).toBeLessThanOrEqual(bounds.width);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  const figure = (await page.locator(".recall-figure").boundingBox())!;
  for (const label of await page.locator(".recall-chapters li").all()) {
    const box = (await label.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(figure.x + figure.width + 1);
  }
  await page.screenshot({
    path: ".impeccable/review/scroll-large-text.png",
    fullPage: true,
  });
});
