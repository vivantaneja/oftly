import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { clientFor } from "./client";
import {
  allMedia,
  readCollection,
  readMeta,
  saveCollection,
  storageScope,
  writeMeta,
} from "../browser/storage";
import {
  apply,
  changed,
  emptyMeta,
  equal,
  mediaRecords,
  merge,
  records,
  toCollection,
  type RecordMap,
  type SyncMeta,
  type MediaRecord,
  type Item,
} from "./model";
import type { ImportedPackage } from "../browser/types";
export type SyncStatus = {
  status: "idle" | "syncing" | "saved" | "offline" | "conflict" | "error";
  message: string;
  lastSynced?: number;
};
let status: SyncStatus = { status: "idle", message: "Saved on this device" };
const listeners = new Set<() => void>();
export const syncSnapshot = () => status;
export const subscribeSync = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
function report(value: SyncStatus) {
  status = value;
  for (const fn of listeners) fn();
}
let active: Session | null = null,
  running: Promise<void> | null = null,
  timer: ReturnType<typeof setTimeout> | undefined;
let conflict: {
  local: RecordMap;
  remote: RecordMap;
  revision: number;
  localRevision: number;
  userId: string;
} | null = null;
const current = (uid: string) =>
  active?.user.id === uid && storageScope() === uid;
const locked = <T>(fn: () => Promise<T>) =>
  navigator.locks.request("oftly-collection", fn);
export function startSync(session: Session | null) {
  active = session;
  conflict = null;
  clearTimeout(timer);
  report({
    status: "idle",
    message: session ? "Checking your saved library…" : "Saved on this device",
  });
  if (session) scheduleSync(0);
}
export function scheduleSync(delay = 1500) {
  clearTimeout(timer);
  if (active) timer = setTimeout(() => void syncNow(), delay);
}
window.addEventListener("oftly-saved", () => {
  if (active && !conflict)
    report({ status: "idle", message: "Changes saved here · waiting to sync" });
  scheduleSync();
});
window.addEventListener("online", () => scheduleSync(0));
window.addEventListener("offline", () => {
  if (active)
    report({ status: "offline", message: "Offline · changes saved here" });
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") scheduleSync(0);
});
setInterval(() => {
  if (active && document.visibilityState === "visible") scheduleSync(0);
}, 30000);
async function localRecords() {
  const collection = await readCollection();
  const media = await allMedia();
  const manifest: MediaRecord[] = [];
  for (const item of media) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      await item.blob.arrayBuffer(),
    );
    const hash = [...new Uint8Array(digest)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    manifest.push({
      name: item.name,
      hash,
      type: item.blob.type || "application/octet-stream",
      size: item.blob.size,
    });
  }
  return {
    collection,
    media,
    map: records(
      collection,
      manifest,
      (await readMeta<Record<string, unknown>>("plan")) ?? null,
    ),
  };
}
async function downloadMissing(
  client: SupabaseClient,
  uid: string,
  map: RecordMap,
): Promise<ImportedPackage["media"]> {
  const existing = new Map((await allMedia(uid)).map((x) => [x.name, x.blob]));
  const result: ImportedPackage["media"] = [];
  for (const item of mediaRecords(map)) {
    const local = existing.get(item.name);
    if (local && local.size === item.size) {
      const hash = [
        ...new Uint8Array(
          await crypto.subtle.digest("SHA-256", await local.arrayBuffer()),
        ),
      ]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
      if (hash === item.hash) continue;
    }
    const { data, error } = await client.storage
      .from("oftly-media")
      .download(`${uid}/${item.hash}`);
    if (error || !data)
      throw Error(
        "Could not download a card attachment. Your saved library is unchanged; try syncing again.",
      );
    const bytes = new Uint8Array(await data.arrayBuffer());
    const digest = [
      ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    ]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    if (digest !== item.hash || bytes.byteLength !== item.size)
      throw Error("A synced attachment did not pass its integrity check.");
    result.push({ name: item.name, data: bytes, type: item.type });
  }
  return result;
}
async function cycle(session: Session) {
  const uid = session.user.id,
    client = clientFor(session);
  if (!current(uid)) return;
  if (!navigator.onLine) {
    report({ status: "offline", message: "Offline · changes saved here" });
    return;
  }
  if (conflict) {
    report({
      status: "conflict",
      message:
        "Two devices changed the same material. Choose which version to keep.",
    });
    return;
  }
  report({ status: "syncing", message: "Syncing…" });
  const snapshot = await locked(async () => {
    if (!current(uid)) return null;
    return {
      ...(await localRecords()),
      meta: (await readMeta<SyncMeta>("sync")) ?? emptyMeta(),
    };
  });
  if (!snapshot || !current(uid)) return;
  const { data: pull, error: pullError } = await client.rpc("oftly_pull", {
    after_revision: snapshot.meta.revision,
  });
  if (pullError)
    throw Error(
      "Could not reach your account. Changes are saved here; try syncing again.",
    );
  if (!current(uid)) return;
  const remote = apply(snapshot.meta.base, pull.items as Item[]);
  const combined = merge(snapshot.meta.base, snapshot.map, remote);
  if (combined.conflicts.length) {
    conflict = {
      local: snapshot.map,
      remote,
      revision: pull.revision,
      localRevision: snapshot.collection.revision,
      userId: uid,
    };
    report({
      status: "conflict",
      message:
        "Both devices changed " +
        combined.conflicts.length +
        " item" +
        (combined.conflicts.length === 1 ? "" : "s") +
        ". Both versions are still saved.",
    });
    return;
  }
  const changes = changed(remote, combined.result);
  for (const item of changes.filter((x) => x.kind === "media" && x.data)) {
    const descriptor = item.data as unknown as MediaRecord;
    const blob = snapshot.media.find((x) => x.name === descriptor.name)?.blob;
    if (!blob)
      throw Error(
        "A local attachment is missing. Export a backup and check the card before syncing.",
      );
    const { error } = await client.storage
      .from("oftly-media")
      .upload(`${uid}/${descriptor.hash}`, blob, {
        upsert: false,
        contentType: descriptor.type,
      });
    if (
      error &&
      !["Duplicate", "409"].includes(String(error.name)) &&
      !/already exists/i.test(error.message)
    )
      throw Error(
        "Could not upload a card attachment. Changes remain saved on this device.",
      );
  }
  let revision = pull.revision as number;
  if (changes.length) {
    const { data, error } = await client.rpc("oftly_push", {
      expected_revision: revision,
      changes,
    });
    if (error?.code === "40001") {
      scheduleSync(100);
      return;
    }
    if (error)
      throw Error(
        error.message.includes("limit")
          ? "Your cloud library has reached its size limit. Download a backup and reduce imported media."
          : "Sync could not save this change. It remains saved on this device.",
      );
    revision = data as number;
  }
  const incoming = await downloadMissing(client, uid, combined.result);
  if (!current(uid)) return;
  await locked(async () => {
    if (!current(uid)) return;
    const latest = await readCollection();
    let localResult = combined.result;
    if (latest.revision !== snapshot.collection.revision) {
      const updated = await localRecords();
      const rebased = merge(snapshot.map, updated.map, combined.result);
      if (rebased.conflicts.length) {
        conflict = {
          local: updated.map,
          remote: combined.result,
          revision,
          localRevision: latest.revision,
          userId: uid,
        };
        report({
          status: "conflict",
          message: "A card changed while syncing. Both versions are saved.",
        });
        return;
      }
      localResult = rebased.result;
      scheduleSync(0);
    }
    const next = toCollection(localResult);
    next.revision = latest.revision;
    const metadata = {
      sync: { revision, base: combined.result },
      plan: localResult["plan/current"]?.data ?? null,
    };
    if (!equal(snapshot.map, combined.result) || incoming.length) {
      await saveCollection(next, incoming, metadata);
      window.dispatchEvent(new Event("oftly-remote"));
    } else await writeMeta("sync", metadata.sync);
    if (changed(combined.result, localResult).length) {
      report({
        status: "idle",
        message: "Changes saved here · waiting to sync",
      });
      scheduleSync(100);
    } else
      report({ status: "saved", message: "Synced", lastSynced: Date.now() });
  });
}
export async function syncNow() {
  if (running) {
    scheduleSync(2000);
    return running;
  }
  const session = active;
  if (!session) return;
  running = cycle(session)
    .catch((error) => {
      if (current(session.user.id))
        report({
          status: navigator.onLine ? "error" : "offline",
          message: (error as Error).message,
        });
    })
    .finally(() => {
      running = null;
    });
  return running;
}
export async function resolveConflict(choice: "local" | "remote") {
  const entry = conflict,
    session = active;
  if (!entry || !session || !current(entry.userId)) return;
  const client = clientFor(session);
  const selected = entry[choice];
  // Preserve both versions before making a choice. Media stays immutable in storage.
  const incoming = await downloadMissing(client, entry.userId, selected);
  await locked(async () => {
    if (!current(entry.userId)) return;
    const latest = await readCollection();
    if (latest.revision !== entry.localRevision) {
      conflict = null;
      scheduleSync(0);
      throw Error(
        "You made another change. Sync again to review the latest versions.",
      );
    }
    const next = toCollection(selected);
    next.revision = latest.revision;
    await saveCollection(next, incoming, {
      recovery: { at: Date.now(), local: entry.local, remote: entry.remote },
      sync: { revision: entry.revision, base: entry.remote },
      plan: selected["plan/current"]?.data ?? null,
    });
    conflict = null;
    window.dispatchEvent(new Event("oftly-remote"));
  });
  await syncNow();
}
export async function exportRecovery() {
  const session = active;
  if (!session) return;
  const recovery = await readMeta<{ local: RecordMap; remote: RecordMap }>(
    "recovery",
    session.user.id,
  );
  const data = conflict ?? recovery;
  if (!data) return;
  const { zipSync } = await import("fflate");
  const { backupBytes, downloadBlob } = await import("../browser/packages");
  const files: Record<string, Uint8Array> = {};
  for (const name of ["local", "remote"] as const) {
    const incoming = await downloadMissing(
      clientFor(session),
      session.user.id,
      data[name],
    );
    const media = (await allMedia(session.user.id)).concat(
      incoming.map((x) => ({
        name: x.name,
        blob: new Blob([new Uint8Array(x.data)], { type: x.type }),
      })),
    );
    const names = new Set(mediaRecords(data[name]).map((x) => x.name));
    files[`${name}.oftly.zip`] = await backupBytes(
      toCollection(data[name]),
      media.filter((x) => names.has(x.name)),
    );
  }
  if (!current(session.user.id)) return;
  downloadBlob(
    new Blob([new Uint8Array(zipSync(files))]),
    "oftly-both-versions.zip",
  );
}
