import { expect, test, type Page } from "@playwright/test";

async function frame(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

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
  await frame(page);
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

async function wheel(page: Page, delta: number) {
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, delta);
  await page.waitForFunction(
    ({ before, delta }) => (delta > 0 ? scrollY > before : scrollY < before),
    { before, delta },
  );
  await frame(page);
}

for (const [name, width, height, answer, peaks] of [
  ["desktop", 1440, 900, "I remembered", [240, 640]],
  ["phone", 390, 844, "I missed it", [130, 430]],
] as const) {
  test(`${name}: the illustration eases into each peak while the page keeps scrolling`, async ({
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
    for (const [index, x] of peaks.entries()) {
      const movements: number[] = [];
      let current = await snapshot(page);
      for (let step = 0; step < 100; step++) {
        if (
          Math.abs(current.curveX - x) < 0.01 &&
          Math.abs(current.curveY - 18) < 0.001
        )
          break;
        await wheel(page, 10);
        const next = await snapshot(page);
        movements.push(next.cardX - current.cardX);
        current = next;
      }
      expect(current.curveX).toBeCloseTo(x, 1);
      expect(current.curveY).toBeCloseTo(18, 1);
      // The card decelerates into the peak instead of hitting a hard stop.
      expect(movements.at(-1)!).toBeLessThan(Math.max(...movements) / 3);
      // The easing can look stationary just before the exact endpoint.
      await wheel(page, 10);
      current = await snapshot(page);
      await expect(page.locator(".recall-card-stage")).toHaveText(
        index === 0
          ? "Recall & rate"
          : name === "phone"
            ? "Back sooner"
            : "A later return",
      );
      await wheel(page, 20);
      const dwell = await snapshot(page);
      expect(dwell.scroll).toBeGreaterThan(current.scroll + 18);
      expect(dwell.cardX).toBeCloseTo(current.cardX, 1);
      expect(dwell.curveY).toBeCloseTo(18, 1);
      await page.screenshot({
        path: `.impeccable/review/soft-peak-${name}-${index + 1}.png`,
      });
      await wheel(page, 100);
      expect((await snapshot(page)).cardX).toBeGreaterThan(dwell.cardX);
    }
    const end = await snapshot(page);
    await wheel(page, -50);
    expect((await snapshot(page)).cardX).toBeLessThan(end.cardX);
    await page.getByRole("button", { name: "Set up my study plan" }).click();
    await expect(
      page.getByRole("heading", { name: "Where are you studying?" }),
    ).toBeFocused();
  });
}

test("fast scrolling and keyboard navigation remain unrestricted", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await enterStory(page);
  const before = await page.evaluate(() => scrollY);
  await wheel(page, 1000);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(before + 500);
  await page.keyboard.press("Home");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(10);
  await enterStory(page);
  const start = await page.evaluate(() => scrollY);
  await page.keyboard.press("PageDown");
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(start + 500);
  await page.getByRole("button", { name: "Set up my study plan" }).focus();
  await expect(
    page.getByRole("button", { name: "Set up my study plan" }),
  ).toBeInViewport();
});

test.describe("touch scrolling", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("touch gestures continue through the story without a forced page stop", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await enterStory(page);
    const session = await context.newCDPSession(page);
    for (const direction of [1, -1]) {
      const before = await page.evaluate(() => scrollY);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 200, y: direction > 0 ? 700 : 300 }],
      });
      const positions =
        direction > 0 ? [600, 500, 400, 300] : [400, 500, 600, 700];
      for (const y of positions) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: 200, y }],
        });
        await page.waitForTimeout(30);
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect
        .poll(
          async () =>
            direction * ((await page.evaluate(() => scrollY)) - before),
        )
        .toBeGreaterThan(180);
    }
    await session.detach();
    await page.getByRole("button", { name: "Set up my study plan" }).click();
    await expect(
      page.getByRole("heading", { name: "Where are you studying?" }),
    ).toBeVisible();
  });
});
