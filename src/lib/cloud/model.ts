import { emptyCollection, type Collection } from "../browser/types";
import { validateBackup } from "../browser/validation";
export type Item = {
  kind: string;
  id: string;
  data: Record<string, unknown> | null;
};
export type RecordMap = Record<string, Item>;
export type MediaRecord = {
  name: string;
  hash: string;
  type: string;
  size: number;
};
export type SyncMeta = { revision: number; base: RecordMap };
export const keyOf = (item: Pick<Item, "kind" | "id">) =>
  `${item.kind}/${item.id}`;
// PostgreSQL JSONB reorders object keys. Compare values, not serialization order.
export function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a == null && b == null;
  if (a instanceof Date || b instanceof Date)
    return equal(
      a instanceof Date ? a.toJSON() : a,
      b instanceof Date ? b.toJSON() : b,
    );
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, index) => equal(value, b[index]))
    );
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) => Object.hasOwn(right, key) && equal(left[key], right[key]),
    )
  );
}
export function records(
  collection: Collection,
  media: MediaRecord[] = [],
  plan: Record<string, unknown> | null = null,
): RecordMap {
  const result: RecordMap = Object.create(null);
  const put = (kind: string, id: string, value: unknown) => {
    const item = { kind, id, data: JSON.parse(JSON.stringify(value)) };
    result[keyOf(item)] = item;
  };
  for (const kind of ["decks", "notes", "cards", "reviews"] as const)
    for (const value of collection[kind]) put(kind, value.id, value);
  put("settings", "current", collection.settings);
  put("suggestions", "current", collection.suggestions);
  if (plan) put("plan", "current", plan);
  for (const item of media) put("media", item.name, item);
  return result;
}
export const emptyMeta = (): SyncMeta => ({
  revision: 0,
  base: records(emptyCollection()),
});
export function changed(base: RecordMap, next: RecordMap): Item[] {
  return [...new Set([...Object.keys(base), ...Object.keys(next)])]
    .filter((key) => !equal(base[key]?.data, next[key]?.data))
    .map((key) => next[key] ?? { ...base[key], data: null });
}
export function apply(base: RecordMap, items: Item[]): RecordMap {
  const result = { ...base };
  for (const item of items) {
    if (item.data === null) delete result[keyOf(item)];
    else result[keyOf(item)] = item;
  }
  return result;
}
export function merge(base: RecordMap, local: RecordMap, remote: RecordMap) {
  const result = { ...remote };
  const conflicts: string[] = [];
  for (const item of changed(base, local)) {
    const key = keyOf(item);
    if (
      !equal(base[key]?.data, remote[key]?.data) &&
      !equal(item.data, remote[key]?.data)
    )
      conflicts.push(key);
    if (item.data === null) delete result[key];
    else result[key] = item;
  }
  // A deletion on one device and a new child/review on another are related edits.
  if (!conflicts.length) {
    try {
      toCollection(result);
    } catch {
      conflicts.push("related records");
    }
  }
  return { result, conflicts };
}
export function toCollection(map: RecordMap): Collection {
  const s = emptyCollection();
  for (const item of Object.values(map)) {
    if (!item.data) continue;
    if (["decks", "notes", "cards", "reviews"].includes(item.kind))
      (s[item.kind as "decks"] as unknown[]).push(item.data);
    else if (item.kind === "settings")
      s.settings = item.data as Collection["settings"];
    else if (item.kind === "suggestions")
      s.suggestions = item.data as Collection["suggestions"];
  }
  return validateBackup(structuredClone(s));
}
export function mediaRecords(map: RecordMap): MediaRecord[] {
  return Object.values(map)
    .filter((x) => x.kind === "media" && x.data)
    .map((x) => {
      const d = x.data as unknown as MediaRecord;
      if (
        !/^[a-f0-9]{64}$/.test(d.hash) ||
        d.name !== x.id ||
        /[\x00-\x1f/\\:?#]/.test(d.name) ||
        !Number.isSafeInteger(d.size) ||
        d.size < 0 ||
        d.size > 45 * 1024 * 1024 ||
        typeof d.type !== "string"
      )
        throw Error("Invalid synced media. Your local library is unchanged.");
      return d;
    });
}
