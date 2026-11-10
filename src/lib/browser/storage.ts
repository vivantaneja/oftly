import {
  emptyCollection,
  type Collection,
  type ImportedPackage,
} from "./types";
import { registerMedia } from "../html";
let database: Promise<IDBDatabase> | undefined;
function db() {
  return (database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("oftly", 1);
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
  }));
}
function request<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function readCollection() {
  const database = await db();
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
  void navigator.storage?.persist?.().catch(() => false);
}
export async function allMedia() {
  const database = await db();
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
