import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

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
  await expect(page.locator(".recall-scroll")).toHaveAttribute(
    "data-moving",
    "false",
  );
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

async function seek(page: Page, progress: number) {
  await page.locator(".recall-scroll").evaluate((el, progress) => {
    const stage = el.querySelector(".recall-stage")!;
    const start = scrollY + el.getBoundingClientRect().top - 16;
    scrollTo(0, start + (el.clientHeight - stage.clientHeight) * progress);
  }, progress);
  await frame(page);
  await expect(page.locator(".recall-scroll")).toHaveAttribute(
    "data-moving",
    "false",
  );
}

for (const [name, width, height, answer] of [
  ["desktop", 1440, 900, "I remembered"],
  ["phone", 390, 844, "I missed it"],
] as const) {
  test(`${name}: scroll bursts glide, settle and keep moving through both reviews`, async ({
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
    const before = await snapshot(page);
    const sampling = page.locator(".recall-scroll").evaluate(
      (el) =>
        new Promise<{ time: number; x: number; height: number }[]>(
          (resolve) => {
            const samples: { time: number; x: number; height: number }[] = [];
            const start = performance.now();
            const sample = (time: number) => {
              const box = el
                .querySelector(".recall-travelling-card")!
                .getBoundingClientRect();
              samples.push({
                time: time - start,
                x: box.x,
                height: box.height,
              });
              if (time - start < 700) requestAnimationFrame(sample);
              else resolve(samples);
            };
            requestAnimationFrame(sample);
          },
        ),
    );
    await page.mouse.wheel(0, 220);
    const samples = await sampling;
    await expect(page.locator(".recall-scroll")).toHaveAttribute(
      "data-moving",
      "false",
    );
    const last = samples.at(-1)!.x;
    const positions = [before.cardX, ...samples.map((sample) => sample.x)];
    const changes = positions.slice(1).map((x, i) => x - positions[i]);
    expect(last - before.cardX).toBeGreaterThan(width > 600 ? 100 : 10);
    expect(changes.filter((delta) => delta > 0.01).length).toBeGreaterThan(5);
    expect(Math.max(...changes)).toBeLessThan((last - before.cardX) * 0.45);
    expect(Math.max(...positions)).toBeLessThanOrEqual(last + 0.1);
    expect(
      Math.max(...samples.map((s) => s.height)) -
        Math.min(...samples.map((s) => s.height)),
    ).toBeLessThan(1);
    await page.waitForTimeout(150);
    expect((await snapshot(page)).cardX).toBeCloseTo(last, 1);
    mkdirSync(".impeccable/review", { recursive: true });
    writeFileSync(
      `.impeccable/review/fluid-scroll-${name}.json`,
      JSON.stringify(samples),
    );

    const peaks = await page.locator(".recall-path").evaluate((el) => {
      const path = el as SVGPathElement;
      const pieces = path.getAttribute("d")!.split("V18");
      return [0, 1].map((index) => {
        const prefix = path.cloneNode() as SVGPathElement;
        prefix.setAttribute(
          "d",
          pieces.slice(0, index + 1).join("V18") + "V18",
        );
        return prefix.getTotalLength() / path.getTotalLength();
      });
    });
    for (const [index, peak] of peaks.entries()) {
      await seek(page, peak - 0.025);
      const approach = await snapshot(page);
      await seek(page, peak);
      const center = await snapshot(page);
      await seek(page, peak + 0.025);
      const departure = await snapshot(page);
      expect(center.cardX).toBeGreaterThan(approach.cardX + 0.5);
      expect(departure.cardX).toBeGreaterThan(center.cardX + 0.5);
      await page.screenshot({
        path: `.impeccable/review/fluid-${name}-review-${index + 1}.png`,
      });
    }
    await seek(page, 0);
    expect((await snapshot(page)).cardX).toBeCloseTo(before.cardX, 1);
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
