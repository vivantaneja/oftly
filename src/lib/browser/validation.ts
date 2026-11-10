import { reviveMemory, type Collection } from "./types";
export function validateBackup(data: unknown): Collection {
  if (!data || typeof data !== "object") throw Error("Invalid Oftly backup.");
  const s = data as Collection;
  if (
    s.version !== 1 ||
    !Array.isArray(s.notes) ||
    !Array.isArray(s.cards) ||
    !Array.isArray(s.decks) ||
    !Array.isArray(s.reviews) ||
    s.notes.length > 50000 ||
    s.cards.length > 100000 ||
    s.decks.length > 5000 ||
    s.reviews.length > 500000
  )
    throw Error("Unsupported or oversized backup.");
  const str = (x: unknown, max = 100000) =>
    typeof x === "string" && x.length <= max && !x.includes("\0");
  for (const d of s.decks)
    if (
      !str(d.id, 100) ||
      !str(d.name, 2000) ||
      !d.name.trim() ||
      typeof d.folder !== "boolean"
    )
      throw Error("Invalid backup deck.");
  for (const n of s.notes)
    if (
      !str(n.id, 100) ||
      !str(n.guid, 100) ||
      !str(n.model, 500) ||
      !["basic", "reversed", "typing", "cloze"].includes(n.kind) ||
      !Array.isArray(n.fields) ||
      !Array.isArray(n.fieldNames) ||
      n.fields.length !== n.fieldNames.length ||
      !n.fields.length ||
      n.fields.length > 100 ||
      !n.fields.every((v) => str(v)) ||
      !n.fieldNames.every((v) => str(v, 500)) ||
      !Array.isArray(n.tags) ||
      !n.tags.every((t) => str(t, 500))
    )
      throw Error("Invalid backup note.");
  const nids = new Set(s.notes.map((n) => n.id)),
    dids = new Set(s.decks.map((d) => d.id)),
    cids = new Set(s.cards.map((c) => c.id));
  if (
    nids.size !== s.notes.length ||
    dids.size !== s.decks.length ||
    cids.size !== s.cards.length
  )
    throw Error("Duplicate backup identities.");
  for (const c of s.cards) {
    if (
      !str(c.id, 100) ||
      !nids.has(c.nid) ||
      !dids.has(c.did) ||
      !Number.isInteger(c.ord) ||
      c.ord < 0 ||
      c.ord > 100 ||
      typeof c.suspended !== "boolean" ||
      !c.memory
    )
      throw Error("Invalid backup card.");
    c.memory = reviveMemory(c.memory);
    const m = c.memory;
    if (
      !Number.isFinite(m.dueAt.getTime()) ||
      (m.lastReviewAt && !Number.isFinite(m.lastReviewAt.getTime())) ||
      ![0, 1, 2, 3].includes(m.state) ||
      !["new", "learning", "review", "relearning"].includes(m.scheduleStatus) ||
      ![
        "stability",
        "difficulty",
        "reps",
        "lapses",
        "scheduledDays",
        "learningStep",
      ].every(
        (k) =>
          typeof (m as unknown as Record<string, unknown>)[k] === "number" &&
          Number.isFinite((m as unknown as Record<string, number>)[k]),
      ) ||
      m.stability < 0 ||
      m.stability > 365000 ||
      m.difficulty < 0 ||
      m.difficulty > 10
    )
      throw Error("Invalid backup schedule.");
  }
  for (const r of s.reviews)
    if (
      !str(r.id, 100) ||
      !cids.has(r.cid) ||
      !Number.isFinite(r.at) ||
      !Number.isFinite(r.ms) ||
      r.ms < 0 ||
      r.ms > 3600000 ||
      ![1, 2, 3, 4].includes(r.rating) ||
      ![0, 1, 2, 3].includes(r.state)
    )
      throw Error("Invalid backup history.");
  if (
    !s.settings ||
    !Number.isInteger(s.settings.newPerDay) ||
    s.settings.newPerDay < 0 ||
    s.settings.newPerDay > 100 ||
    !Number.isFinite(s.settings.retention) ||
    s.settings.retention < 0.8 ||
    s.settings.retention > 0.97 ||
    !s.suggestions ||
    !["enabled", "split", "length", "clarity", "cloze", "source"].every(
      (k) =>
        typeof (s.suggestions as unknown as Record<string, unknown>)[k] ===
        "boolean",
    )
  )
    throw Error("Invalid backup settings.");
  return s;
}
