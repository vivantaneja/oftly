import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
const { env } = JSON.parse(
  readFileSync("supabase/.temp/local-status.json", "utf8"),
);
const client = () =>
  createClient(env.API_URL, env.PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const admin = createClient(env.API_URL, env.SECRET_KEY, {
  auth: { persistSession: false },
});
const users: string[] = [];
async function account() {
  const email = `oftly-${randomUUID()}@example.test`,
    password = randomUUID() + randomUUID();
  const result = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (result.error) throw result.error;
  users.push(result.data.user.id);
  const c = client();
  const r = await c.auth.signInWithPassword({ email, password });
  if (r.error) throw r.error;
  return { client: c, session: r.data.session!, id: result.data.user.id };
}
async function login(context: BrowserContext, session: any) {
  await context.addInitScript(
    (session) =>
      localStorage.setItem("sb-127-auth-token", JSON.stringify(session)),
    session,
  );
}
async function importText(page: Page, name: string) {
  await page.goto("/#import");
  await page
    .getByRole("button", { name: "Quizlet / text", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Deck name", exact: true })
    .fill(name);
  await page
    .getByRole("textbox", { name: "Paste your cards" })
    .fill(
      "What is recall?\tRetrieving an answer from memory.\nWhat is spacing?\tReturning after a gap.",
    );
  await page.getByRole("button", { name: "Preview import" }).click();
  await page.getByRole("button", { name: /^Import \d+ cards$/ }).click();
  await expect(
    page.getByRole("heading", { name: "Import complete" }),
  ).toBeVisible();
}
async function localState(page: Page) {
  return page.evaluate(async () => {
    const storage = await import("/src/lib/browser/storage.ts");
    return {
      scope: storage.storageScope(),
      collection: await storage.readCollection(),
    };
  });
}
test.afterAll(async () => {
  for (const id of users) {
    await admin.storage
      .from("oftly-media")
      .list(id)
      .then(async ({ data }) => {
        if (data?.length)
          await admin.storage
            .from("oftly-media")
            .remove(data.map((x) => `${id}/${x.name}`));
      });
    await admin.auth.admin.deleteUser(id);
  }
});
test("private RPC, optimistic writes, immutable media and account isolation", async () => {
  const a = await account(),
    b = await account(),
    anon = client();
  expect((await anon.rpc("oftly_pull")).error).toBeTruthy();
  expect((await a.client.rpc("oftly_pull")).error).toBeNull();
  const changes = [
    {
      kind: "decks",
      id: "one",
      data: { id: "one", name: "Private biology", folder: false },
    },
  ];
  const push = await a.client.rpc("oftly_push", {
    expected_revision: 0,
    changes,
  });
  expect(push.error).toBeNull();
  expect(push.data).toBe(1);
  const stale = await a.client.rpc("oftly_push", {
    expected_revision: 0,
    changes,
  });
  expect(stale.error?.code).toBe("40001");
  expect(
    (await b.client.from("oftly_items").select("*").eq("user_id", a.id)).data,
  ).toEqual([]);
  expect(
    (
      await a.client
        .from("oftly_items")
        .insert({ user_id: b.id, ...changes[0], revision: 2 })
    ).error,
  ).toBeTruthy();
  const path = a.id + "/" + "a".repeat(64),
    blob = new Blob(["test"], { type: "application/octet-stream" });
  expect(
    (await a.client.storage.from("oftly-media").upload(path, blob)).error,
  ).toBeNull();
  expect(
    (await b.client.storage.from("oftly-media").download(path)).error,
  ).toBeTruthy();
  expect(
    (
      await b.client.storage
        .from("oftly-media")
        .upload(a.id + "/" + "b".repeat(64), blob)
    ).error,
  ).toBeTruthy();
  expect(
    (
      await a.client.storage
        .from("oftly-media")
        .upload(path, blob, { upsert: true })
    ).error,
  ).toBeTruthy();
});
test("guided setup requires an action, retains answers and supports an eight-hour day", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /One card\.\s*A longer-lasting memory\./,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Set up my study plan" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Reveal answer", exact: true })
    .click();
  await expect(
    page.getByText("The Pacific Ocean.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "I missed it", exact: true }).click();
  await expect(
    page.getByText("Oftly brings missed cards back sooner."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Set up my study plan" }).click();
  await page
    .getByRole("button", { name: "College / university", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Practice questions", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "How much do you study each day?" }),
  ).toBeFocused();
  await page.getByLabel("Hours", { exact: true }).fill("8");
  await page.getByLabel("Minutes", { exact: true }).fill("0");
  await page.reload();
  await expect(page.getByLabel("Hours", { exact: true })).toHaveValue("8");
  await page.getByRole("button", { name: "See my plan" }).click();
  await expect(
    page.getByText("College / university · 8 hours a day"),
  ).toBeVisible();
  await expect(page.getByText("4 × 15 minutes", { exact: true })).toBeVisible();
  await expect(page.getByText("7 hours", { exact: true })).toBeVisible();
  await page.getByText("How this plan works").click();
  await expect(
    page.getByText(/not a learning prediction or a study limit/),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Hours", { exact: true })).toHaveValue("8");
  await page.getByRole("button", { name: "See my plan" }).click();
  await page.getByRole("button", { name: "Use this plan" }).click();
  expect(
    await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("oftly-onboarding")!),
    ),
  ).toEqual({
    version: 2,
    context: "college",
    method: "practice",
    minutes: 480,
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
    context: "college",
    method: "practice",
    minutes: 480,
  });
});
test("two devices sync progress, offline edits survive reload, sign-out isolates guest cards", async ({
  browser,
}) => {
  const a = await account();
  const c1 = await browser.newContext(),
    c2 = await browser.newContext();
  await login(c1, a.session);
  await login(c2, a.session);
  const p1 = await c1.newPage(),
    p2 = await c2.newPage();
  await importText(p1, "Cloud biology");
  await expect(p1.locator(".cloud-status")).toContainText("Synced", {
    timeout: 30000,
  });
  await p2.goto("/#today");
  await expect(p2.getByText("Cloud biology", { exact: true })).toBeVisible({
    timeout: 30000,
  });
  const beforeReview = await localState(p1);
  await p1.goto("/#study/" + beforeReview.collection.decks[0].id);
  await p1.getByRole("button", { name: "Show answer" }).click();
  await p1.getByRole("button", { name: /Good 3/ }).click();
  await expect
    .poll(async () => (await localState(p1)).collection.reviews.length)
    .toBe(1);
  const reviewed = (await localState(p1)).collection;
  // Include a synthetic attachment in the same account snapshot.
  await p1.evaluate(async () => {
    const storage = await import("/src/lib/browser/storage.ts");
    await navigator.locks.request("oftly-collection", async () => {
      await storage.saveCollection(await storage.readCollection(), [
        {
          name: "test.png",
          type: "image/png",
          data: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
        },
      ]);
    });
  });
  await expect(p1.locator(".cloud-status")).toContainText("Synced", {
    timeout: 30000,
  });
  await p2.goto("/#account");
  await p2.getByRole("button", { name: "Sync now", exact: true }).click();
  await expect
    .poll(async () => (await localState(p2)).collection.reviews.length)
    .toBe(1);
  const received = (await localState(p2)).collection;
  expect(JSON.parse(JSON.stringify(received.reviews))).toEqual(
    JSON.parse(JSON.stringify(reviewed.reviews)),
  );
  expect(JSON.parse(JSON.stringify(received.cards))).toEqual(
    JSON.parse(JSON.stringify(reviewed.cards)),
  );
  const media = await p2.evaluate(async () => {
    const { allMedia } = await import("/src/lib/browser/storage.ts");
    return Promise.all(
      (await allMedia()).map(async (item) => ({
        name: item.name,
        bytes: Array.from(new Uint8Array(await item.blob.arrayBuffer())),
      })),
    );
  });
  expect(media).toEqual([
    { name: "test.png", bytes: [137, 80, 78, 71, 13, 10, 26, 10] },
  ]);
  // Replacing a restored attachment with the same name must update the other device's bytes.
  await p1.evaluate(async () => {
    const storage = await import("/src/lib/browser/storage.ts");
    await navigator.locks.request("oftly-collection", async () =>
      storage.saveCollection(await storage.readCollection(), [
        {
          name: "test.png",
          type: "image/png",
          data: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 11]),
        },
      ]),
    );
  });
  await expect(p1.locator(".cloud-status")).toContainText("Synced", {
    timeout: 30000,
  });
  await p2.getByRole("button", { name: "Sync now", exact: true }).click();
  await expect
    .poll(() =>
      p2.evaluate(async () => {
        const { allMedia } = await import("/src/lib/browser/storage.ts");
        return Array.from(
          new Uint8Array(await (await allMedia())[0].blob.arrayBuffer()),
        );
      }),
    )
    .toEqual([137, 80, 78, 71, 13, 10, 26, 11]);
  await c1.setOffline(true);
  await p1.goto("/#settings");
  await p1.getByLabel("New cards per deck per day").fill("7");
  await p1.getByRole("button", { name: "Save preferences" }).click();
  await expect(p1.getByText("Saved", { exact: true })).toBeVisible();
  await c1.setOffline(false);
  await p1.reload();
  await expect(p1.locator(".cloud-status")).toContainText("Synced", {
    timeout: 30000,
  });
  await p2.goto("/#account");
  await p2.getByRole("button", { name: "Sync now", exact: true }).click();
  await expect
    .poll(async () => (await localState(p2)).collection.settings.newPerDay)
    .toBe(7);
  await p1.goto("/#account");
  await p1.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    p1.getByRole("heading", { name: /One card\.\s*A longer-lasting memory\./ }),
  ).toBeVisible();
  await p1.goto("/#today");
  expect((await localState(p1)).collection.notes).toHaveLength(0);
  expect((await localState(p1)).scope).toBe("guest");
  await c1.close();
  await c2.close();
});
test("three-way merge keeps independent edits and flags concurrent schedule/deletion changes", async ({
  page,
}) => {
  await page.goto("/#today");
  const result = await page.evaluate(async () => {
    const { records, merge, equal } = await import("/src/lib/cloud/model.ts");
    const { emptyCollection } = await import("/src/lib/browser/types.ts");
    const base = records(emptyCollection());
    const local = {
      ...base,
      "decks/a": {
        kind: "decks",
        id: "a",
        data: { id: "a", name: "A", folder: false },
      },
    };
    const remote = {
      ...base,
      "decks/b": {
        kind: "decks",
        id: "b",
        data: { id: "b", name: "B", folder: false },
      },
    };
    const combined = merge(base, local, remote);
    const changed = {
      ...base,
      "settings/current": {
        kind: "settings",
        id: "current",
        data: { newPerDay: 5, retention: 0.9 },
      },
    };
    const other = {
      ...base,
      "settings/current": {
        kind: "settings",
        id: "current",
        data: { newPerDay: 8, retention: 0.9 },
      },
    };
    return {
      keys: Object.keys(combined.result),
      conflicts: combined.conflicts,
      conflict: merge(base, changed, other).conflicts,
      reorderedEqual: equal(
        { newPerDay: 5, retention: 0.9 },
        { retention: 0.9, newPerDay: 5 },
      ),
    };
  });
  expect(result.keys).toContain("decks/a");
  expect(result.keys).toContain("decks/b");
  expect(result.conflicts).toEqual([]);
  expect(result.conflict).toEqual(["settings/current"]);
  expect(result.reorderedEqual).toBe(true);
});

test("email link completes PKCE and retains the onboarding plan", async ({
  page,
  request,
}) => {
  const email = `oftly-email-${randomUUID()}@example.test`;
  await page.goto("/#account");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "oftly-onboarding",
      JSON.stringify({
        subject: "Spanish",
        method: "practice",
        minutes: 15,
        weeks: 8,
        cards: 300,
      }),
    ),
  );
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByText(/Check your inbox/)).toBeVisible();
  let message: any;
  await expect
    .poll(
      async () => {
        const response = await request.get(
          env.MAILPIT_URL + "/api/v1/messages",
        );
        const data = await response.json();
        message = data.messages.find((m: any) =>
          m.To?.some((to: any) => to.Address === email),
        );
        return Boolean(message);
      },
      { timeout: 30000 },
    )
    .toBe(true);
  const body = await (
    await request.get(env.MAILPIT_URL + "/api/v1/message/" + message.ID)
  ).json();
  const link = (body.HTML as string)
    .match(/href="([^"]+\/auth\/v1\/verify[^\"]*)"/)?.[1]
    .replaceAll("&amp;", "&");
  expect(link).toBeTruthy();
  expect(new URL(link!).origin).toBe(env.API_URL);
  await page.goto(link!);
  await expect(page.locator(".cloud-status")).toContainText("Synced", {
    timeout: 30000,
  });
  const state = await localState(page);
  users.push(state.scope);
  await page.goto("/#account");
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await expect(page.getByText("Spanish · 15 minutes a day")).toBeVisible();
});

test("same-record conflict retains both copies and can be resolved", async ({
  browser,
}) => {
  const a = await account(),
    c1 = await browser.newContext(),
    c2 = await browser.newContext();
  await login(c1, a.session);
  await login(c2, a.session);
  const p1 = await c1.newPage(),
    p2 = await c2.newPage();
  await importText(p1, "Conflicts");
  await expect(p1.locator(".cloud-status")).toContainText("Synced", {
    timeout: 30000,
  });
  await p2.goto("/#today");
  await expect(p2.getByText("Conflicts", { exact: true })).toBeVisible({
    timeout: 30000,
  });
  await c1.setOffline(true);
  await c2.setOffline(true);
  for (const [page, value] of [
    [p1, "5"],
    [p2, "8"],
  ] as const) {
    await page.goto("/#settings");
    await page.getByLabel("New cards per deck per day").fill(value);
    await page.getByRole("button", { name: "Save preferences" }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  }
  await c1.setOffline(false);
  await expect(p1.locator(".cloud-status")).toContainText("Synced", {
    timeout: 30000,
  });
  await c2.setOffline(false);
  await expect(p2.locator(".cloud-status")).toContainText(
    "Both devices changed",
    { timeout: 30000 },
  );
  await p2.goto("/#account");
  await p2.getByRole("button", { name: "Use the cloud library" }).click();
  await expect
    .poll(async () => (await localState(p2)).collection.settings.newPerDay)
    .toBe(5);
  const recovery = await p2.evaluate(async () => {
    const { readMeta } = await import("/src/lib/browser/storage.ts");
    return readMeta<any>("recovery");
  });
  expect(recovery.local["settings/current"].data.newPerDay).toBe(8);
  expect(recovery.remote["settings/current"].data.newPerDay).toBe(5);
  await c1.close();
  await c2.close();
});

test("deletion authenticates the caller and removes only that account", async ({
  request,
}) => {
  const a = await account(),
    b = await account();
  const endpoint = env.API_URL + "/functions/v1/delete-account";
  expect(
    (
      await request.post(endpoint, { data: { confirm: "delete my account" } })
    ).status(),
  ).toBe(401);
  const headers = {
    Authorization: "Bearer " + a.session.access_token,
    apikey: env.PUBLISHABLE_KEY,
  };
  expect(
    (
      await request.post(endpoint, { headers, data: { confirm: "no" } })
    ).status(),
  ).toBe(400);
  await a.client.rpc("oftly_pull");
  const path = a.id + "/" + "d".repeat(64);
  expect(
    (
      await a.client.storage
        .from("oftly-media")
        .upload(path, new Blob(["test"], { type: "application/octet-stream" }))
    ).error,
  ).toBeNull();
  const result = await request.post(endpoint, {
    headers,
    data: { confirm: "delete my account", userId: b.id },
  });
  expect(result.status()).toBe(200);
  expect((await admin.auth.admin.getUserById(a.id)).error).toBeTruthy();
  expect((await admin.auth.admin.getUserById(b.id)).error).toBeNull();
  expect(
    (await admin.from("oftly_accounts").select("user_id").eq("user_id", a.id))
      .data,
  ).toEqual([]);
  expect((await admin.storage.from("oftly-media").list(a.id)).data).toEqual([]);
});

test("a queued planner save cannot follow an account switch", async ({
  page,
}) => {
  await page.goto("/#today");
  const result = await page.evaluate(async () => {
    const { selectStorage, savePlan, readMeta } =
      await import("/src/lib/browser/storage.ts");
    await selectStorage("test-account-a");
    let release!: () => void, acquired!: () => void;
    const started = new Promise<void>((resolve) => {
      acquired = resolve;
    });
    const held = navigator.locks.request("oftly-collection", async () => {
      acquired();
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    });
    await started;
    const switchAccount = selectStorage("test-account-b");
    const save = savePlan(
      { subject: "Private subject" },
      "test-account-a",
    ).then(
      () => "saved",
      (error) => error.message,
    );
    release();
    await held;
    await switchAccount;
    return {
      outcome: await save,
      plan: await readMeta("plan", "test-account-b"),
    };
  });
  expect(result.outcome).toContain("account changed");
  expect(result.plan).toBeUndefined();
});
