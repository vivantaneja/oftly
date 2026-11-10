import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { zipSync, strToU8 } from "fflate";
async function state(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("oftly", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return await new Promise<any>((resolve, reject) => {
      const r = db
        .transaction("collection")
        .objectStore("collection")
        .get("current");
      r.onsuccess = () => {
        db.close();
        resolve(r.result);
      };
      r.onerror = () => reject(r.error);
    });
  });
}
async function importText(page: Page, name: string, text: string) {
  await page.goto("/#import");
  await page
    .getByRole("button", { name: "Quizlet / text", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Deck name", exact: true })
    .fill(name);
  await page.getByRole("textbox", { name: "Paste your cards" }).fill(text);
  await page.getByRole("button", { name: "Preview import" }).click();
  await page.getByRole("button", { name: /^Import \d+ cards$/ }).click();
  await expect(
    page.getByRole("heading", { name: "Import complete" }),
  ).toBeVisible();
}
async function packagePreview(
  page: Page,
  file: string | { name: string; mimeType: string; buffer: Buffer },
) {
  await page.goto("/#import");
  await page
    .getByRole("button", { name: "Anki / backup", exact: true })
    .click();
  await page.locator("input[type=file]").setInputFiles(file);
  await page.getByRole("button", { name: "Preview import" }).click();
}
test("queue counts keep missed cards visible, respect scope, undo and repeat time", async ({
  page,
}) => {
  await importText(
    page,
    "Course::Topic",
    "First cue\tFirst answer\nSecond cue\tSecond answer",
  );
  await page.goto("/#today");
  await expect(
    page.getByRole("heading", { name: "Decks", exact: true }),
  ).toBeVisible();
  await importText(page, "Other", "Other cue\tOther answer");
  const collection = await state(page);
  const parent = collection.decks.find(
    (d: { name: string }) => d.name === "Course",
  );
  const other = collection.decks.find(
    (d: { name: string }) => d.name === "Other",
  );
  await page.clock.install({ time: new Date("2026-11-10T12:00:00") });
  await page.goto("/#study/" + parent.id);
  const queue = page.getByRole("group", { name: "Study queue" });
  await expect(queue.locator(".queue-new strong")).toHaveText("2");
  await expect(queue.locator(".queue-learning strong")).toHaveText("0");
  const question = await page
    .getByRole("region", { name: "Question", exact: true })
    .innerText();
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Again 1/ }).click();
  await expect(queue.locator(".queue-new strong")).toHaveText("1");
  await expect(queue.locator(".queue-learning strong")).toHaveText("1");
  await expect(page.locator(".session-tally")).toContainText("1 missed");
  await expect(page.getByRole("timer")).toContainText("Next repeat in");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: ".impeccable/review/queue-waiting-desktop.png",
    fullPage: false,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(page.locator(".session-tally")).toBeVisible();
  await expect(page.locator(".study-toolbar")).toHaveCount(1);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await page.screenshot({
    path: ".impeccable/review/queue-waiting-mobile.png",
    fullPage: false,
  });
  await page.evaluate(() => (document.documentElement.style.fontSize = "30px"));
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(queue.locator(".queue-new strong")).toHaveText("2");
  await expect(queue.locator(".queue-learning strong")).toHaveText("0");
  await expect(page.locator(".session-tally")).toContainText("0 missed");
  await expect(page.getByRole("timer")).toHaveCount(0);
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Again 1/ }).click();
  await expect(queue.locator(".queue-learning strong")).toHaveText("1");
  await page.goto("/#study/" + other.id);
  await expect(queue.locator(".queue-learning strong")).toHaveText("0");
  await expect(page.getByRole("timer")).toHaveCount(0);
  await page.goto("/#study/" + parent.id);
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Easy 4/ }).click();
  await expect(
    page.getByRole("heading", { name: "Session complete" }),
  ).toBeVisible();
  await expect(queue.locator(".queue-learning strong")).toHaveText("1");
  await page.clock.fastForward(61000);
  await expect(page.getByRole("timer")).toHaveText("Repeat ready");
  await page.getByRole("button", { name: "Check for due cards" }).click();
  await expect(
    page.getByRole("region", { name: "Question", exact: true }),
  ).toHaveText(question);
  await expect(queue.locator(".queue-learning strong")).toHaveText("1");
  await expect(page.getByRole("timer")).toHaveCount(0);
  // The overview unlocks studying when a waiting step becomes due, without a reload.
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Again 1/ }).click();
  await expect(
    page.getByRole("heading", { name: "Session complete" }),
  ).toBeVisible();
  await page.goto("/#deck/" + parent.id);
  await expect(
    page.getByRole("button", { name: "Study folder" }),
  ).toBeDisabled();
  await page.clock.fastForward(61000);
  await expect(
    page.getByRole("button", { name: "Study folder" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Study folder" }).click();
  await expect(
    page.getByRole("region", { name: "Question", exact: true }),
  ).toHaveText(question);
  await page.setViewportSize({ width: 320, height: 800 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations.map((v) => v.id)).toEqual([]);
});
test("local scheduling, daily limits, undo, persistence, backup restore and no uploads", async ({
  page,
  browser,
}) => {
  const network: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET" || new URL(r.url()).pathname.startsWith("/api"))
      network.push(r.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Try a 6-card sample deck" }).click();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "New cards per deck per day" })
    .fill("1");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Splitting cards", exact: true })
    .uncheck();
  await expect
    .poll(async () => (await state(page)).suggestions.split)
    .toBe(false);
  await page.getByRole("link", { name: /^Decks/ }).click();
  await page.getByRole("button", { name: "Start studying" }).click();
  const question = await page
    .getByRole("region", { name: "Question", exact: true })
    .innerText();
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Good 3/ }).click();
  await expect(
    page.getByRole("heading", { name: "Session complete" }),
  ).toBeVisible();
  let s = await state(page);
  expect(s.reviews).toHaveLength(1);
  expect(s.cards[0].memory.stability).toBeGreaterThan(0);
  expect(new Date(s.cards[0].memory.dueAt).getTime()).toBeGreaterThan(
    Date.now(),
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Question", exact: true }),
  ).toHaveText(question);
  expect((await state(page)).reviews).toHaveLength(0);
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Easy 4/ }).click();
  await page.goto("/#settings");
  await page.reload();
  await expect(
    page.getByRole("spinbutton", { name: "New cards per deck per day" }),
  ).toHaveValue("1");
  await expect(
    page.getByRole("checkbox", { name: "Splitting cards", exact: true }),
  ).not.toBeChecked();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Oftly backup" }).click();
  const download = await downloaded;
  const path = await download.path();
  expect(download.suggestedFilename()).toMatch(/\.oftly.zip$/);
  const fresh = await browser.newContext(),
    restored = await fresh.newPage();
  await packagePreview(restored, path!);
  await expect(
    restored.getByRole("heading", { name: "6 cards found" }),
  ).toBeVisible();
  await restored.getByRole("button", { name: "Import 6 cards" }).click();
  await expect(
    restored.getByRole("heading", { name: "Import complete" }),
  ).toBeVisible();
  s = await state(restored);
  expect(s.cards).toHaveLength(6);
  expect(s.reviews).toHaveLength(1);
  expect(s.settings.newPerDay).toBe(1);
  expect(s.suggestions.split).toBe(false);
  await fresh.close();
  expect(network).toEqual([]);
});
for (const format of ["legacy", "modern"])
  test(`official Anki ${format} import, folders, media and duplicate protection`, async ({
    page,
  }) => {
    await packagePreview(page, `.impeccable/review/security/${format}.apkg`);
    await expect(
      page.getByRole("heading", { name: "2 cards found" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Import 2 cards" }).click();
    await page.getByRole("button", { name: "Go to your library" }).click();
    await expect(page.getByText("School", { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Expand School", exact: true })
      .click();
    await page
      .locator(".library-item")
      .filter({ has: page.getByText("Biology", { exact: true }) })
      .click();
    await page.getByRole("button", { name: "Study deck" }).click();
    await page.getByRole("button", { name: "Show answer" }).click();
    await expect(
      page.getByRole("complementary", { name: "Sources" }),
    ).toContainText("Biology textbook, p. 4");
    await expect(page.locator(".answer-reveal img")).toHaveAttribute(
      "src",
      /^blob:/,
    );
    await expect
      .poll(() =>
        page
          .locator(".answer-reveal img")
          .evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await page.getByText("Card details", { exact: true }).click();
    await expect(page.getByText("Note ID", { exact: true })).toBeVisible();
    const before = await state(page);
    await packagePreview(page, `.impeccable/review/security/${format}.apkg`);
    await page.getByRole("button", { name: "Import 2 cards" }).click();
    await expect(
      page.getByRole("heading", { name: "Import complete" }),
    ).toBeVisible();
    expect((await state(page)).cards.map((c: any) => c.id)).toEqual(
      before.cards.map((c: any) => c.id),
    );
  });
test("untrusted HTML cannot execute, style app, fetch external media or submit forms", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("attacker.example")) requests.push(r.url());
  });
  await importText(
    page,
    "Safety",
    'Safe question?\t<div class="sidebar" style="position:fixed">Safe answer</div><img src=https://attacker.example/tracker onerror="window.hacked=1"><script>window.hacked=2</script><form action="https://attacker.example"><input name="secret"></form><a href="javascript:window.hacked=3">bad link</a>',
  );
  await page.goto("/#today");
  await page.getByRole("button", { name: "Start studying" }).click();
  await page.getByRole("button", { name: "Show answer" }).click();
  const answer = page.getByRole("region", { name: "Answer", exact: true });
  await expect(answer).toContainText("Safe answer");
  expect(
    await answer
      .locator("script,style,form,input,iframe,.sidebar,[onerror],[style]")
      .count(),
  ).toBe(0);
  expect(await answer.locator("[src],[href]").count()).toBe(0);
  expect(await page.evaluate(() => Object.hasOwn(window, "hacked"))).toBe(
    false,
  );
  expect(requests).toEqual([]);
});
test("another tab cannot rate a stale card or overwrite saved work", async ({
  page,
  context,
}) => {
  await importText(page, "Concurrency", "One?\tFirst\nTwo?\tSecond");
  await page.goto("/#study");
  await page.getByRole("button", { name: "Show answer" }).click();
  const other = await context.newPage();
  await other.goto("/#study");
  await other.getByRole("button", { name: "Show answer" }).click();
  await other.getByRole("button", { name: /Easy 4/ }).click();
  await page.getByRole("button", { name: /Good 3/ }).click();
  await expect(page.getByRole("alert")).toContainText("review has changed");
  expect((await state(page)).reviews).toHaveLength(1);
  await other.close();
});
test("mixed assistant notes, sibling separation, compact accessibility and offline reload", async ({
  page,
  context,
}) => {
  await page.goto("/#import");
  await page.getByRole("button", { name: "Assistant / JSON" }).click();
  await page
    .getByRole("textbox", { name: "Deck name", exact: true })
    .fill("Language");
  await page.getByRole("textbox", { name: "Paste Anki Star JSON" }).fill(
    JSON.stringify({
      notes: [
        {
          type: "reversed",
          front: "Dia duit",
          back: "Hello",
          source: "Lesson 1",
        },
        {
          type: "cloze",
          front: "The {{c1::heart}} pumps {{c2::blood}}.",
          extra: "Circulation",
          source: "Textbook",
        },
      ],
    }),
  );
  await page.getByRole("button", { name: "Review notes", exact: true }).click();
  await page.getByRole("button", { name: "Import 2 notes" }).click();
  await page.getByRole("button", { name: "Open deck" }).click();
  await page.getByRole("button", { name: "Study deck" }).click();
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: /Easy 4/ }).click();
  await expect(
    page.getByRole("region", { name: "Question", exact: true }),
  ).toHaveText("The […] pumps blood.");
  await page.getByRole("button", { name: "Show answer" }).click();
  await expect(page.locator(".answer-reveal .cloze")).toHaveText("heart");
  await page.getByRole("button", { name: /Easy 4/ }).click();
  await expect(
    page.getByRole("heading", { name: "Session complete" }),
  ).toBeVisible();
  await page.goto("/#settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 844 });
  await expect
    .poll(() =>
      page
        .locator(".app-header nav a")
        .first()
        .evaluate((el) => getComputedStyle(el).color),
    )
    .toBe("rgb(89, 97, 116)");
  expect(
    (
      await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
    ).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.goto("/#today");
  await expect(
    page.getByRole("heading", { name: "Decks", exact: true }),
  ).toBeVisible();
  expect((await state(page)).reviews).toHaveLength(2);
  await context.setOffline(false);
});
test("malformed archives and backups fail without altering collection", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a 6-card sample deck" }).click();
  await expect(
    page.getByRole("button", { name: "Start studying" }),
  ).toBeVisible();
  const before = await state(page);
  for (const buffer of [
    Buffer.from("not an archive"),
    Buffer.from(
      zipSync({
        "oftly.json": strToU8(
          JSON.stringify({
            version: 1,
            cards: [{ id: "bad" }],
            notes: [],
            decks: [],
            reviews: [],
          }),
        ),
      }),
    ),
  ]) {
    await packagePreview(page, {
      name: "bad.apkg",
      mimeType: "application/zip",
      buffer,
    });
    await expect(page.getByRole("alert")).toBeVisible();
    expect((await state(page)).revision).toBe(before.revision);
    expect((await state(page)).cards).toHaveLength(6);
  }
});
