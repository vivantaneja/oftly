import {
  emptyCollection,
  type Collection,
  type ImportedPackage,
} from "./types";
import { registerMedia, clearMedia } from "../html";
let scope = "guest";
const databases = new Map<string, Promise<IDBDatabase>>();
export const storageScope = () => scope;
export async function selectStorage(userId: string | null) {
  await navigator.locks.request("oftly-collection", async () => {
    scope = userId ?? "guest";
    loadedRevision = -1;
    clearMedia();
    window.dispatchEvent(new Event("oftly-scope"));
  });
}
export function db(target = scope) {
  const existing = databases.get(target);
  if (existing) return existing;
  const opening = new Promise((resolve, reject) => {
    const request = indexedDB.open(
      target === "guest" ? "oftly" : "oftly-user-" + target,
      1,
    );
    request.onupgradeneeded = () => {
      request.result.createObjectStore("collection");
      request.result.createObjectStore("media");
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () =>
      reject(
        new Error(
          "Browser storage is unavailable. Enable site storage to use Oftly.",
        ),
      );
  });
  databases.set(target, opening as Promise<IDBDatabase>);
  return opening as Promise<IDBDatabase>;
}
export function request<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function readCollection(target = scope) {
  const database = await db(target);
  return (
    ((await request(
      database
        .transaction("collection")
        .objectStore("collection")
        .get("current"),
    )) as Collection | undefined) ?? emptyCollection()
  );
}
export async function saveCollection(
  value: Collection,
  media: ImportedPackage["media"] = [],
  metadata?: Record<string, unknown>,
) {
  // Keep every backup within the same 50 MB restore limit, including incompressible media.
  const sizes = new Map(
    (await allMedia()).map((item) => [item.name, item.blob.size]),
  );
  for (const item of media) sizes.set(item.name, item.data.byteLength);
  if (
    new TextEncoder().encode(JSON.stringify(value)).byteLength +
      [...sizes.values()].reduce((n, size) => n + size, 0) >
    45 * 1024 * 1024
  )
    throw new Error(
      "This collection is approaching its 45 MB browser limit. Export a backup before importing more media.",
    );
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(["collection", "media"], "readwrite");
    const store = tx.objectStore("collection");
    const check = store.get("current");
    check.onsuccess = () => {
      if ((check.result?.revision ?? 0) !== value.revision) {
        tx.abort();
        return;
      }
      value.revision++;
      store.put(value, "current");
      for (const [key, data] of Object.entries(metadata ?? {}))
        store.put(data, key);
      for (const item of media)
        tx.objectStore("media").put(
          new Blob([new Uint8Array(item.data)], { type: item.type }),
          item.name,
        );
    };
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () =>
      reject(
        new Error(
          tx.error?.name === "QuotaExceededError"
            ? "Your browser is out of storage. Free some space, then try again; this change was not saved."
            : "The collection changed in another tab. Reload and try again.",
        ),
      );
  });
  for (const item of media)
    registerMedia(
      item.name,
      new Blob([new Uint8Array(item.data)], { type: item.type }),
    );
  window.dispatchEvent(new Event("oftly-saved"));
  void navigator.storage?.persist?.().catch(() => false);
}
export async function allMedia(target = scope) {
  const database = await db(target);
  const tx = database.transaction("media");
  const store = tx.objectStore("media");
  const [keys, values] = await Promise.all([
    request(store.getAllKeys()),
    request(store.getAll()),
  ]);
  return keys.map((key, i) => ({ name: String(key), blob: values[i] as Blob }));
}
let loadedRevision = -1;
export async function loadMedia(revision: number) {
  if (loadedRevision === revision) return;
  for (const item of await allMedia()) registerMedia(item.name, item.blob);
  loadedRevision = revision;
}

export async function readMeta<T>(
  key: string,
  target = scope,
): Promise<T | undefined> {
  const database = await db(target);
  return request(
    database.transaction("collection").objectStore("collection").get(key),
  );
}
export async function writeMeta(key: string, value: unknown) {
  const database = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction("collection", "readwrite");
    tx.objectStore("collection").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function savePlan(plan: unknown, expectedScope = scope) {
  await navigator.locks.request("oftly-collection", async () => {
    if (scope !== expectedScope)
      throw Error(
        "Your account changed. Save this plan again in the current account.",
      );
    const collection = await readCollection();
    await saveCollection(collection, [], { plan });
  });
}
export async function forgetAccountCache(userId: string) {
  const pending = databases.get(userId);
  if (pending) (await pending).close();
  databases.delete(userId);
  await new Promise<void>((resolve, reject) => {
    const r = indexedDB.deleteDatabase("oftly-user-" + userId);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
    r.onblocked = () =>
      reject(
        Error(
          "Close other Oftly tabs, then clear this site’s data to remove the offline copy.",
        ),
      );
  });
}
