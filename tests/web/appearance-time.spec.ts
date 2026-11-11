import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";

async function capture(page: Page, name: string) {
  mkdirSync(".impeccable/review", { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: `.impeccable/review/${name}.png`,
    fullPage: !name.includes("wheel"),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function startTime(page: Page) {
  await page.goto("/#welcome");
  await page.getByRole("button", { name: "Set up my study plan" }).click();
  await page.getByRole("button", { name: "Other", exact: true }).click();
  await page
    .getByRole("button", { name: "Practice questions", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "How much do you study each day?" }),
  ).toBeVisible();
}

test("appearance persists, follows the system only when selected, and works offline", async ({
  page,
  context,
}) => {
  test.setTimeout(60000);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/#settings");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "New deck", exact: true }),
  ).toBeEnabled();
  await capture(page, "dark-settings-desktop");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.reload();
  await expect(page.getByLabel("Appearance", { exact: true })).toHaveValue(
    "dark",
  );
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Appearance", { exact: true }).selectOption("system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const second = await context.newPage();
  await second.goto("/#settings");
  await second.getByLabel("Appearance", { exact: true }).selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await second.close();
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  for (const [route, name] of [
    ["#import", "import"],
    ["#account", "account"],
    ["#welcome", "welcome"],
    ["privacy.html", "privacy"],
  ]) {
    await page.goto(`/${route}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("h1:visible, h2:visible").first()).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await capture(page, `dark-${name}`);
  }
  await page.goto("/#today");
  await page.getByRole("button", { name: "Try a 6-card sample deck" }).click();
  await page.getByRole("button", { name: "Start studying" }).first().click();
  await page.getByRole("button", { name: "Show answer" }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await capture(page, "dark-study");
  await page.goto("/#settings");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, "dark-settings-phone");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel("Appearance", { exact: true })).toHaveValue(
    "dark",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("saved dark appearance paints before the app bundle and blocked storage stays usable", async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.addInitScript(() =>
    localStorage.setItem("oftly-appearance", "dark"),
  );
  await page.route("**/assets/index-*.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(21, 27, 37)");
  await context.close();
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "oftly-appearance")
        throw new DOMException("Blocked", "SecurityError");
      return set.call(this, key, value);
    };
  });
  const blockedPage = await blocked.newPage();
  await blockedPage.goto("/#settings");
  await blockedPage
    .getByLabel("Appearance", { exact: true })
    .selectOption("dark");
  await expect(blockedPage.locator("html")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  await expect(blockedPage.getByRole("status")).toContainText("couldn’t save");
  await blocked.close();
});

test("desktop minute arrows use ten-minute steps while precise typed values remain valid", async ({
  page,
}) => {
  await startTime(page);
  const minutes = page.getByLabel("Minutes", { exact: true });
  await minutes.press("ArrowUp");
  await expect(minutes).toHaveValue("10");
  await minutes.press("ArrowUp");
  await expect(minutes).toHaveValue("20");
  await minutes.press("ArrowDown");
  await expect(minutes).toHaveValue("10");
  await minutes.fill("7");
  await page.getByRole("button", { name: "See my plan" }).click();
  await expect(page.getByText("Other · 1 hour 7 minutes a day")).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.reload();
  await expect(minutes).toHaveValue("7");
});

test.describe("touch time picker", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  test("phone and tablet wheels respond to touch, taps and keyboard without changing the other column", async ({
    page,
    context,
  }) => {
    test.setTimeout(60000);
    await startTime(page);
    const minutes = page.getByRole("spinbutton", {
      name: "Minutes",
      exact: true,
    });
    const hours = page.getByRole("spinbutton", { name: "Hours", exact: true });
    await hours.press("ArrowUp");
    await expect(hours).toHaveAttribute("aria-valuenow", "2");
    await minutes.press("End");
    await expect(minutes).toHaveAttribute("aria-valuenow", "50");
    await minutes.press("ArrowUp");
    await expect(minutes).toHaveAttribute("aria-valuenow", "50");
    await minutes.press("Home");
    await expect(minutes).toHaveAttribute("aria-valuenow", "0");
    const box = (await minutes.boundingBox())!;
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2 + 40;
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (const delta of [20, 40, 60, 80]) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - delta }],
      });
      await page.waitForTimeout(40);
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(async () => Number(await minutes.getAttribute("aria-valuenow")))
      .toBeGreaterThan(0);
    await expect
      .poll(() =>
        minutes.evaluate((el) => {
          const active = el.querySelector(".selected")!.getBoundingClientRect(),
            frame = el.getBoundingClientRect();
          return Math.abs(
            active.top + active.height / 2 - frame.top - frame.height / 2,
          );
        }),
      )
      .toBeLessThan(1);
    expect(Number(await minutes.getAttribute("aria-valuenow")) % 10).toBe(0);
    await minutes.press("Home");
    await minutes.getByText("10", { exact: true }).tap();
    await expect(minutes).toHaveAttribute("aria-valuenow", "10");
    const selected = 10;
    await expect(hours).toHaveAttribute("aria-valuenow", "2");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await capture(page, "time-wheel-phone");
    await page.reload();
    await expect(minutes).toHaveAttribute("aria-valuenow", String(selected));
    await page.getByRole("button", { name: "See my plan" }).click();
    await expect(
      page.getByText(`Other · 2 hours ${selected} minutes a day`),
    ).toBeVisible();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.setViewportSize({ width: 834, height: 1112 });
    await capture(page, "time-wheel-tablet");
    await hours.press("End");
    await page.getByRole("button", { name: "See my plan" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "between 5 minutes and 24 hours",
    );
    await hours.press("Home");
    await minutes.press("Home");
    await page.getByRole("button", { name: "See my plan" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "30px"),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await capture(page, "time-wheel-large-text");
    // A swipe outside the wheel still scrolls the page at large text sizes.
    const beforeScroll = await page.evaluate(() => scrollY);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 8, y: 700 }],
    });
    for (const y of [650, 600, 550, 500]) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 8, y }],
      });
      await page.waitForTimeout(40);
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeGreaterThan(beforeScroll);
    await page.evaluate(() =>
      document.documentElement.style.removeProperty("font-size"),
    );
    await page.goto("/#settings");
    await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
    await page.goto("/#welcome");
    await expect(minutes).toHaveAttribute("aria-valuenow", "0");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await capture(page, "dark-time-wheel-phone");
    await expect(page.locator(".time-wheel")).toHaveCount(2);
    await cdp.detach();
  });
});
