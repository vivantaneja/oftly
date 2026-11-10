import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
const shots = ".impeccable/review";
async function capture(page: Page, path: string) {
  const viewport = page.viewportSize()!;
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement)?.blur();
  });
  // A single raster avoids Chromium's tall-page stitching of fixed mobile chrome.
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  await page.setViewportSize({
    width: viewport.width,
    height: Math.max(viewport.height, Math.min(height, 5000)),
  });
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await page.screenshot({ path, fullPage: false });
  await page.setViewportSize(viewport);
}
test("complete learner journey, native scheduling, and responsive accessibility", async ({
  page,
}) => {
  test.setTimeout(90000);
  mkdirSync(shots, { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your daily practice." }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement)?.blur();
  });
  await page.screenshot({ path: shots + "/desktop-empty.png", fullPage: true });
  await page
    .getByRole("button", { name: "Or try a 6-card sample deck" })
    .click();
  await expect(
    page.getByRole("button", { name: "Start studying" }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement)?.blur();
  });
  await page.screenshot({ path: shots + "/desktop.png", fullPage: true });
  let audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect
    .soft(
      audit.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    )
    .toEqual([]);
  await page.getByRole("button", { name: "Start studying" }).click();
  await expect(
    page.getByText("What is active recall?", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Bringing information to mind before looking at the answer.",
      { exact: true },
    ),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Write an answer first" }).click();
  await page
    .getByRole("textbox", { name: "Your attempt" })
    .fill("Remember without looking");
  await page.getByRole("button", { name: "Show answer" }).click();
  await expect(
    page.getByText(
      "Bringing information to mind before looking at the answer.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement)?.blur();
  });
  await page.screenshot({ path: shots + "/study-desktop.png", fullPage: true });
  audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect
    .soft(
      audit.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    )
    .toEqual([]);
  await page.getByRole("button", { name: /Easy 4/ }).click();
  await expect(
    page.getByText("Why space your study sessions?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByText("What is active recall?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Good 3/ }).click();
  await page.getByRole("button", { name: "Finish for now" }).click();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Deck name" })
    .fill("Biology · sample");
  await page
    .getByRole("textbox", { name: "Paste your cards" })
    .fill(
      "Mitochondria\tSite of aerobic respiration\nRibosome\tSite of protein synthesis",
    );
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(
    page.getByRole("heading", { name: "2 cards found" }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement)?.blur();
  });
  await page.screenshot({
    path: shots + "/import-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Import 2 cards" }).click();
  await page.getByRole("button", { name: "Go to your library" }).click();
  await page.getByRole("button", { name: /Biology · sample/ }).click();
  await page.getByRole("button", { name: "Add cards", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Question", exact: true })
    .fill("What does DNA stand for?");
  await page
    .getByRole("textbox", { name: "Answer", exact: true })
    .fill("Deoxyribonucleic acid");
  await page.getByRole("button", { name: "Add card", exact: true }).click();
  await expect(
    page.getByText("What does DNA stand for?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close editor" }).click();
  await page.getByRole("button", { name: "Edit note" }).first().click();
  await page
    .getByRole("textbox", { name: "Question", exact: true })
    .fill("Expand DNA.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Expand DNA.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Expand DNA.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "New cards per deck per day" })
    .fill("7");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download Anki backup" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.apkg$/);
  await page.getByRole("link", { name: /^Today/ }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement)?.blur();
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({ path: shots + "/mobile.png", fullPage: false });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect
    .soft(
      audit.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    )
    .toEqual([]);
  await page.getByRole("button", { name: "Start studying" }).click();
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    (document.activeElement as HTMLElement)?.blur();
  });
  await page.screenshot({ path: shots + "/study-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("study focus, keyboard ratings and question position survive a long answer", async ({
  page,
  request,
}) => {
  const preview = await request.post("/api/import/text/preview", {
    headers: { "X-Recall-Request": "1" },
    data: {
      text:
        "Explain this idea.\t" +
        "An explanation with enough detail to span several lines. ".repeat(30),
    },
  });
  const token = (await preview.json()).token;
  const imported = await request.post("/api/import/commit", {
    headers: { "X-Recall-Request": "1" },
    data: { token, name: "Long-answer accessibility test" },
  });
  const deckId = (await imported.json()).deckId;
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#study/" + deckId);
    await page.reload();
    const question = page.getByRole("region", {
      name: "Question",
      exact: true,
    });
    await expect(question).toBeVisible();
    await expect(question).toBeFocused();
    const before = await question.boundingBox();
    await page.keyboard.press("Space");
    await expect(
      page.getByRole("region", { name: "Answer", exact: true }),
    ).toBeFocused();
    const after = await question.boundingBox();
    expect(after?.y).toBe(before?.y);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.keyboard.press("4");
  await expect(
    page.getByRole("heading", { name: "A good place to pause." }),
  ).toBeFocused();
  await page.goto("/#import");
  const anki = page.getByRole("button", { name: "Anki package", exact: true });
  await anki.focus();
  await page.keyboard.press("Enter");
  await expect(anki).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText("Choose an Anki package", { exact: true }),
  ).toBeVisible();
});

test("Anki Star drafts become structured study cards on desktop and mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#import");
  await page.getByRole("button", { name: "Assistant / JSON" }).click();
  await page
    .getByText("Create a prompt for your assistant", { exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Source material" })
    .fill("A stack uses last-in, first-out ordering.");
  await page
    .getByRole("button", { name: "Prepare prompt", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Prepared prompt" }),
  ).toHaveValue(/recall::apply/);
  await page
    .getByText("Create a prompt for your assistant", { exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Deck name", exact: true })
    .fill("Structured cards");
  await page.getByRole("textbox", { name: "Paste Anki Star JSON" }).fill(
    JSON.stringify({
      notes: [
        {
          type: "typing",
          front: "What is 2 to the power of 5?",
          back: "32",
          extra: "Multiply two by itself five times.",
          source: "Lecture 2, page 4",
          tags: ["maths"],
        },
        { type: "basic", front: "Skip me", back: "Not imported" },
      ],
    }),
  );
  await page.getByRole("button", { name: "Review notes", exact: true }).click();
  await page.getByRole("checkbox", { name: "Include note 2" }).uncheck();
  await page
    .getByRole("group", { name: "Note 1", exact: true })
    .getByRole("textbox", { name: "Source", exact: true })
    .fill("Lecture 2, page 5");
  await capture(page, shots + "/star-review-desktop.png");
  const editedAnswer = page
    .getByRole("group", { name: "Note 1", exact: true })
    .getByRole("textbox", { name: "Answer", exact: true });
  await editedAnswer.fill("");
  await page.getByRole("button", { name: "Import 1 note" }).click();
  await expect(page.getByRole("alert")).toContainText("back cannot be empty");
  await expect(page.getByRole("alert")).toBeFocused();
  await expect(page.getByRole("alert")).toBeInViewport();
  await editedAnswer.fill("32");
  await page.getByRole("button", { name: "Import 1 note" }).click();
  await expect(
    page.getByRole("heading", { name: "Your notes are ready." }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open deck" }).click();
  await expect(page.getByText("Skip me", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Study deck" }).click();
  await expect(
    page.getByRole("region", { name: "Question", exact: true }),
  ).toHaveText("What is 2 to the power of 5?");
  await expect(
    page.getByRole("textbox", { name: "Your attempt" }),
  ).toBeVisible();
  await expect(page.getByText("32", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Lecture 2, page 5", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("textbox", { name: "Your attempt" }).fill("32");
  await page.getByRole("button", { name: "Show answer" }).click();
  await expect(
    page.getByRole("complementary", { name: "Sources" }),
  ).toContainText("Lecture 2, page 5");
  await expect(
    page.getByText("Multiply two by itself five times.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Note ID", { exact: true })).not.toBeVisible();
  await capture(page, shots + "/structured-study-desktop.png");
  const button = page.getByRole("button", { name: /Good 3/ });
  const size = await button.boundingBox();
  expect(size!.height).toBeGreaterThanOrEqual(44);
  expect(size!.height).toBeLessThan(90);
  expect(size!.width).toBeLessThan(170);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, shots + "/structured-study-mobile.png");
  await page.getByText("Card details", { exact: true }).click();
  await expect(page.getByText("Note ID", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Finish for now" }).click();
  await page.goto("/#import");
  await page.getByRole("button", { name: "Assistant / JSON" }).click();
  await capture(page, shots + "/star-import-mobile.png");
});

test("writing suggestions can be disabled by kind or altogether and persist", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#import");
  await page.getByRole("button", { name: "Assistant / JSON" }).click();
  await page.getByRole("textbox", { name: "Paste Anki Star JSON" }).fill(
    JSON.stringify({
      notes: [
        {
          front: "What is RAM? How does it differ from ROM?",
          back: "RAM is volatile working memory.",
        },
      ],
    }),
  );
  await page.getByRole("button", { name: "Review notes", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Card suggestions" }),
  ).toContainText("splitting it into two cards");
  await expect(
    page.getByRole("region", { name: "Card suggestions" }),
  ).toContainText("Add a source");
  await capture(page, shots + "/suggestions-desktop.png");
  await page
    .getByRole("button", { name: "Turn off splitting cards suggestions" })
    .click();
  await expect(
    page.getByRole("region", { name: "Card suggestions" }),
  ).not.toContainText("splitting it into two cards");
  await expect(
    page.getByRole("region", { name: "Card suggestions" }),
  ).toContainText("Add a source");
  await page.goto("/#settings");
  await expect(
    page.getByRole("checkbox", { name: "Splitting cards", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Missing sources", exact: true }),
  ).toBeChecked();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Splitting cards", exact: true }),
  ).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Show card suggestions" }).uncheck();
  await expect(
    page.getByRole("checkbox", { name: "Missing sources", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Show card suggestions" }),
  ).not.toBeChecked();
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, shots + "/suggestions-settings-mobile.png");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.getByRole("checkbox", { name: "Show card suggestions" }).check();
  await expect(
    page.getByRole("checkbox", { name: "Splitting cards", exact: true }),
  ).not.toBeChecked();
  await page
    .getByRole("checkbox", { name: "Splitting cards", exact: true })
    .check();
});

test("large text and reordered imported answer fields stay usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#settings");
  await expect(
    page.getByRole("heading", { name: "Card suggestions", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => (document.documentElement.style.fontSize = "30px"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  const response = await page.request.get("/api/dashboard");
  const deck = (await response.json()).decks.find(
    (d: { total: number }) => d.total > 0,
  );
  await page.route("**/api/decks/" + deck.id + "/notes?**", (route) =>
    route.fulfill({
      json: {
        total: 1,
        notes: [
          {
            id: "fixture",
            fields: [
              Array(70).fill("word").join(" "),
              "What is the concept?",
              "Lecture 1",
            ],
            fieldNames: ["Answer", "Question", "Source"],
            front: "What is the concept?",
            back: "Long answer",
            model: "Reordered fields",
            suspended: false,
          },
        ],
      },
    }),
  );
  await page.goto("/#deck/" + deck.id);
  await page.getByRole("button", { name: "Edit note", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Card suggestions" }),
  ).toContainText("long recall target");
  await page.evaluate(() => (document.documentElement.style.fontSize = "30px"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
