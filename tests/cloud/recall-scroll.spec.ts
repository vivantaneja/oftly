import { expect, test, type Page } from "@playwright/test";

async function enterStory(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".recall-scroll")).toHaveAttribute(
    "data-stationary",
    "false",
  );
  await page
    .locator(".recall-scroll")
    .evaluate((el) =>
      window.scrollTo(0, scrollY + el.getBoundingClientRect().top - 16),
    );
  await expect
    .poll(() =>
      page
        .locator(".recall-scroll")
        .evaluate((el) =>
          Number(el.style.getPropertyValue("--curve-progress")),
        ),
    )
    .toBeCloseTo(0.02);
}

async function snapshot(page: Page) {
  return page.locator(".recall-scroll").evaluate((el) => {
    const progress = Number(el.style.getPropertyValue("--curve-progress"));
    const path = el.querySelector<SVGPathElement>(".recall-path")!;
    const point = path.getPointAtLength(path.getTotalLength() * progress);
    return {
      scroll: scrollY,
      cardX: el
        .querySelector(".recall-travelling-card")!
        .getBoundingClientRect().x,
      curveX: point.x,
      curveY: point.y,
    };
  });
}

for (const [name, width, height, answer, peaks] of [
  ["desktop", 1440, 900, "I remembered", [240, 640]],
  ["phone", 390, 844, "I missed it", [130, 430]],
] as const) {
  test(`${name}: each review spike holds for one second, then forward scrolling resumes`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Reveal answer", exact: true })
      .click();
    await page.getByRole("button", { name: answer, exact: true }).click();
    await enterStory(page);
    const story = page.locator(".recall-scroll");
    for (const [index, x] of peaks.entries()) {
      const started = Date.now();
      await page.mouse.wheel(0, 1300);
      await expect(story).toHaveAttribute("data-paused", "true");
      await expect
        .poll(async () => (await snapshot(page)).curveX)
        .toBeCloseTo(x, 0);
      const held = await snapshot(page);
      expect(held.curveY).toBeCloseTo(18, 0);
      await expect(page.locator(".recall-card-stage")).toHaveText(
        index === 0
          ? "Recall & rate"
          : name === "phone"
            ? "Back sooner"
            : "A later return",
      );
      // Continued trackpad/wheel input cannot move the page or extend the timer.
      await page.mouse.wheel(0, 160);
      await page.waitForTimeout(550);
      await page.mouse.wheel(0, 160);
      await expect(story).toHaveAttribute("data-paused", "true");
      expect(await snapshot(page)).toEqual(held);
      await expect(story).not.toHaveAttribute("data-paused", "true");
      expect(Date.now() - started).toBeGreaterThanOrEqual(950);
      expect(Date.now() - started).toBeLessThan(1800);
      await page.screenshot({
        path: `.impeccable/review/peak-${name}-${index + 1}.png`,
      });
    }
    const end = (await snapshot(page)).scroll;
    await page.mouse.wheel(0, 500);
    await expect
      .poll(async () => (await snapshot(page)).scroll)
      .toBeGreaterThan(end + 50);
    await expect(story).not.toHaveAttribute("data-paused", "true");
    await page.getByRole("button", { name: "Set up my study plan" }).click();
    await expect(
      page.getByRole("heading", { name: "Where are you studying?" }),
    ).toBeFocused();
  });
}

test("reverse, keyboard navigation, resize and reduced motion can leave a hold", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await enterStory(page);
  const story = page.locator(".recall-scroll");
  await page.keyboard.press("PageDown");
  await expect(story).toHaveAttribute("data-paused", "true");
  const first = (await snapshot(page)).scroll;
  await page.keyboard.press("ArrowDown");
  expect((await snapshot(page)).scroll).toBe(first);
  await page.mouse.wheel(0, -60);
  await expect(story).not.toHaveAttribute("data-paused", "true");
  await expect
    .poll(async () => (await snapshot(page)).scroll)
    .toBeLessThan(first - 20);
  // Crossing the already visited peak again does not restart its hold.
  await page.mouse.wheel(0, 70);
  await expect
    .poll(async () => (await snapshot(page)).scroll)
    .toBeGreaterThan(first);
  await expect(story).not.toHaveAttribute("data-paused", "true");
  await page.keyboard.press("PageDown");
  await expect(story).toHaveAttribute("data-paused", "true");
  await page.keyboard.press("Escape");
  await expect(story).not.toHaveAttribute("data-paused", "true");

  for (const exit of ["resize", "reduce", "focus", "unmount"] as const) {
    await page.reload();
    await enterStory(page);
    await page.mouse.wheel(0, 1000);
    await expect(story).toHaveAttribute("data-paused", "true");
    if (exit === "resize") {
      await page.setViewportSize({ width: 1000, height: 900 });
    } else if (exit === "reduce") {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(story).toHaveAttribute("data-stationary", "true");
    } else if (exit === "focus") {
      await page.getByRole("button", { name: "Set up my study plan" }).focus();
      await expect(
        page.getByRole("button", { name: "Set up my study plan" }),
      ).toBeInViewport();
    } else {
      await page.getByRole("button", { name: "Set up my study plan" }).click();
      await expect(story).toHaveCount(0);
      await page.waitForTimeout(1100);
      expect(await page.evaluate(() => scrollY)).toBe(0);
    }
    if (exit !== "unmount")
      await expect(story).not.toHaveAttribute("data-paused", "true");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
});

test.describe("touch scrolling", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("finger scrolling pauses at a spike and continues after release", async ({
    page,
    context,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await enterStory(page);
    const session = await context.newCDPSession(page);
    const swipe = async () => {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 200, y: 700 }],
      });
      for (const y of [600, 500, 400, 300]) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: 200, y }],
        });
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    };
    await swipe();
    const story = page.locator(".recall-scroll");
    await expect(story).toHaveAttribute("data-paused", "true");
    const held = await snapshot(page);
    expect(held.curveX).toBeCloseTo(240, 0);
    expect(held.curveY).toBeCloseTo(18, 0);
    await swipe();
    expect(await snapshot(page)).toEqual(held);
    await expect(story).not.toHaveAttribute("data-paused", "true");
    await swipe();
    await expect(story).toHaveAttribute("data-paused", "true");
    await expect
      .poll(async () => (await snapshot(page)).curveX)
      .toBeCloseTo(640, 0);
    await session.detach();
  });
});
