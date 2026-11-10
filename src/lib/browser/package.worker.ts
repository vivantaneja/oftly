import initSqlJs, { type Database, type SqlValue } from "sql.js";
import wasmURL from "sql.js/dist/sql-wasm.wasm?url";
import {
  unpack,
  zstd,
  protobuf,
  protoText,
  mediaType,
  validMediaName,
  MAX_EXPANDED,
} from "./archive";
import {
  schedulerFor,
  reviveMemory,
  type ImportedPackage,
  type LocalNote,
  type LocalCard,
  type Review,
  type Collection,
} from "./types";
import { validateBackup } from "./validation";
const text = new TextDecoder();
const rows = (db: Database, sql: string) => {
  const result = db.exec(sql)[0];
  return (
    result?.values.map((row) =>
      Object.fromEntries(result.columns.map((key, i) => [key, row[i]])),
    ) ?? []
  );
};
function safeCount(db: Database, table: string, max: number) {
  const n = Number(rows(db, `SELECT count(*) AS n FROM ${table}`)[0]?.n ?? 0);
  if (n > max)
    throw Error(`This package has too many ${table}. Export a smaller deck.`);
}
async function parse(data: Uint8Array): Promise<ImportedPackage> {
  const files = unpack(data);
  let expanded = [...files.values()].reduce((sum, f) => sum + f.length, 0);
  const warnings = [
    "Imported cards use Oftly’s layout. Scripts, custom designs, external media and add-on interactions are removed.",
  ];
  const media: ImportedPackage["media"] = [];
  const addMedia = (name: string, bytes: Uint8Array) => {
    const type = mediaType(name);
    if (!type || !validMediaName(name)) return;
    if (media.some((m) => m.name === name))
      throw Error("Duplicate media name.");
    media.push({ name, data: bytes, type });
  };
  if (files.has("oftly.json")) {
    const s = validateBackup(JSON.parse(text.decode(files.get("oftly.json"))));
    const manifest = JSON.parse(
      text.decode(files.get("media") ?? new Uint8Array([123, 125])),
    ) as Record<string, string>;
    for (const [key, name] of Object.entries(manifest)) {
      if (typeof name !== "string" || !/^\d+$/.test(key))
        throw Error("Invalid backup media.");
      const file = files.get(key);
      if (file) addMedia(name, file);
    }
    return {
      ...s,
      media,
      warnings: [
        "This restores matching notes, scheduling and preferences from your Oftly backup.",
      ],
      backup: { settings: s.settings, suggestions: s.suggestions },
    };
  }
  const modern = files.has("collection.anki21b");
  let bytes =
    files.get("collection.anki21b") ??
    files.get("collection.anki21") ??
    files.get("collection.anki2");
  if (!bytes) throw Error("This is not an Anki or Oftly package.");
  if (modern) {
    bytes = zstd(bytes);
    expanded += bytes.length;
  }
  if (expanded > MAX_EXPANDED) throw Error("Expanded package exceeds 128 MB.");
  if (text.decode(bytes.subarray(0, 16)) !== "SQLite format 3\0")
    throw Error("Invalid Anki database.");
  const SQL = await initSqlJs({ locateFile: () => wasmURL });
  let db = new SQL.Database(bytes);
  try {
    // Anki's custom Unicode collation is unavailable in stock SQLite WASM.
    // Normalize only the disposable schema copy; we never query by name or
    // export this database, and the user's original package remains untouched.
    db.run(
      "PRAGMA trusted_schema=OFF; PRAGMA writable_schema=ON; UPDATE sqlite_master SET sql=replace(sql,'COLLATE unicase','COLLATE nocase') WHERE type IN ('table','index'); PRAGMA writable_schema=OFF;",
    );
    const portable = db.export();
    db.close();
    db = new SQL.Database(portable);
    db.run("PRAGMA trusted_schema=OFF; PRAGMA query_only=ON;");
    for (const [table, max] of [
      ["notes", 50000],
      ["cards", 100000],
      ["revlog", 500000],
    ] as const)
      safeCount(db, table, max);
    const normalized =
      rows(
        db,
        "SELECT name FROM sqlite_master WHERE type='table' AND name='notetypes'",
      ).length > 0;
    const col = rows(db, "SELECT crt,models,decks FROM col LIMIT 1")[0];
    if (!col) throw Error("Missing collection metadata.");
    const models = new Map<
      string,
      { name: string; fields: string[]; kind: LocalNote["kind"] }
    >();
    let decks: ImportedPackage["decks"];
    if (normalized) {
      const fields = rows(
          db,
          "SELECT ntid,ord,name FROM fields ORDER BY ntid,ord",
        ),
        templates = rows(
          db,
          "SELECT ntid,ord,config FROM templates ORDER BY ntid,ord",
        );
      for (const nt of rows(db, "SELECT id,name,config FROM notetypes")) {
        const config = protobuf(nt.config as Uint8Array),
          tmpls = templates.filter((t) => t.ntid === nt.id),
          q = tmpls.map((t) => protoText(protobuf(t.config as Uint8Array), 1));
        const names = fields
          .filter((f) => f.ntid === nt.id)
          .map((f) => String(f.name));
        models.set(String(nt.id), {
          name: String(nt.name),
          fields: names,
          kind:
            config.get(1)?.[0] === 1
              ? "cloze"
              : q.some((t) => t.includes("{{type:"))
                ? "typing"
                : tmpls.length === 2
                  ? "reversed"
                  : "basic",
        });
        if (tmpls.length > 2)
          warnings.push(
            `${String(nt.name)} uses more than two templates. Check its imported cards.`,
          );
      }
      decks = rows(db, "SELECT id,name FROM decks").map((d) => ({
        id: String(d.id),
        name: String(d.name).replace(/\x1f/g, "::"),
        folder: false,
      }));
    } else {
      type Model = {
        name: string;
        type: number;
        flds: { name: string }[];
        tmpls: { qfmt: string }[];
      };
      for (const [id, m] of Object.entries(
        JSON.parse(String(col.models)) as Record<string, Model>,
      ))
        models.set(id, {
          name: m.name,
          fields: m.flds.map((f) => f.name),
          kind:
            m.type === 1
              ? "cloze"
              : m.tmpls.some((t) => t.qfmt.includes("{{type:"))
                ? "typing"
                : m.tmpls.length === 2
                  ? "reversed"
                  : "basic",
        });
      decks = Object.entries(
        JSON.parse(String(col.decks)) as Record<string, { name: string }>,
      ).map(([id, d]) => ({ id, name: d.name, folder: false }));
    }
    if (decks.length > 5000 || models.size > 5000)
      throw Error("Too many decks or note types.");
    const notes: LocalNote[] = rows(
      db,
      "SELECT id,guid,mid,flds,tags FROM notes",
    ).map((n) => {
      const model = models.get(String(n.mid));
      if (!model) throw Error("Missing note type.");
      const fields = String(n.flds).split("\x1f");
      if (fields.length > 100 || fields.some((f) => f.length > 100000))
        throw Error("A note exceeds the field limit.");
      return {
        id: String(n.id),
        guid: String(n.guid),
        model: model.name,
        kind: model.kind,
        fields,
        fieldNames: fields.map((_, i) => model.fields[i] ?? `Field ${i + 1}`),
        tags: String(n.tags).split(/\s+/).filter(Boolean),
      };
    });
    const scheduler = await schedulerFor(0.9);
    const rawReviews = rows(
      db,
      "SELECT id,cid,ease,type,time FROM revlog WHERE ease BETWEEN 1 AND 4 ORDER BY id",
    );
    const last = new Map<string, number>();
    for (const r of rawReviews) last.set(String(r.cid), Number(r.id));
    let estimated = 0;
    const cards: LocalCard[] = rows(
      db,
      "SELECT id,nid,did,ord,type,queue,due,ivl,reps,lapses,data,odid,odue FROM cards",
    ).map((c) => {
      const id = String(c.id),
        memory = scheduler.newCard({ now: new Date(), cardId: id }),
        state = Number(c.type);
      memory.state = (
        [0, 1, 2, 3].includes(state) ? state : 0
      ) as typeof memory.state;
      memory.scheduleStatus = (
        ["new", "learning", "review", "learning"] as const
      )[memory.state];
      memory.reps = Math.max(0, Number(c.reps));
      memory.lapses = Math.max(0, Number(c.lapses));
      memory.scheduledDays = Math.max(0, Number(c.ivl));
      const due = Number(c.odid) ? Number(c.odue) : Number(c.due);
      memory.dueAt =
        state === 0
          ? new Date()
          : new Date(
              Number(c.queue) === 1 ||
                (Number(c.queue) === 3 && due > 1000000000)
                ? due * 1000
                : (Number(col.crt) + due * 86400) * 1000,
            );
      memory.lastReviewAt = last.has(id)
        ? new Date(last.get(id)!)
        : state
          ? new Date(Date.now() - Math.max(1, Number(c.ivl)) * 86400000)
          : null;
      let extra: Record<string, SqlValue> = {};
      try {
        extra = JSON.parse(String(c.data || "{}"));
      } catch {
        /* Older Anki versions used non-JSON card data. */
      }
      if (state) {
        if (
          typeof extra.s === "number" &&
          Number.isFinite(extra.s) &&
          extra.s > 0 &&
          typeof extra.d === "number" &&
          extra.d >= 1 &&
          extra.d <= 10
        ) {
          memory.stability = extra.s;
          memory.difficulty = extra.d;
        } else {
          memory.stability = Math.max(0.1, Number(c.ivl) || 1);
          memory.difficulty = 5;
          estimated++;
        }
      }
      return {
        id,
        nid: String(c.nid),
        did: String(Number(c.odid) || c.did),
        ord: Number(c.ord),
        suspended: Number(c.queue) === -1,
        memory,
      };
    });
    const cardMap = new Map(cards.map((c) => [c.id, c])),
      nids = new Set(notes.map((n) => n.id)),
      dids = new Set(decks.map((d) => d.id));
    if (
      cards.some(
        (c) =>
          !nids.has(c.nid) ||
          !dids.has(c.did) ||
          !Number.isFinite(c.memory.dueAt.getTime()),
      )
    )
      throw Error("Package contains invalid card references.");
    const reviews: Review[] = rawReviews.flatMap((r) => {
      const c = cardMap.get(String(r.cid));
      return c
        ? [
            {
              id: String(r.id),
              cid: c.id,
              nid: c.nid,
              did: c.did,
              at: Number(r.id),
              rating: Number(r.ease),
              state: Number(r.type) === 1 ? 2 : 1,
              ms: Math.min(3600000, Math.max(0, Number(r.time))),
            },
          ]
        : [];
    });
    if (estimated)
      warnings.push(
        `${estimated} cards lack FSRS memory values. Their due dates are kept; starting memory estimates use the existing interval. Future scheduling uses FSRS-6, so intervals may differ from Anki.`,
      );
    const rawMedia = files.get("media");
    if (rawMedia) {
      const names: [string, string][] = [];
      if (modern) {
        const map = protobuf(zstd(rawMedia));
        for (const [i, item] of (map.get(1) ?? []).entries()) {
          if (!(item instanceof Uint8Array))
            throw Error("Invalid media manifest.");
          const entry = protobuf(item);
          names.push([String(entry.get(255)?.[0] ?? i), protoText(entry, 1)]);
        }
      } else
        names.push(
          ...Object.entries(
            JSON.parse(text.decode(rawMedia)) as Record<string, string>,
          ),
        );
      for (const [key, name] of names) {
        if (typeof name !== "string" || !/^\d+$/.test(key))
          throw Error("Invalid media manifest.");
        let content = files.get(key);
        if (!content || !mediaType(name) || !validMediaName(name)) continue;
        if (modern) {
          content = zstd(content);
          expanded += content.length;
          if (expanded > MAX_EXPANDED)
            throw Error("Expanded media exceeds 128 MB.");
        }
        addMedia(name, content);
      }
    }
    return {
      decks,
      notes,
      cards,
      reviews,
      media,
      warnings: [...new Set(warnings)],
    };
  } finally {
    db.close();
  }
}
self.onmessage = async (event: MessageEvent<Uint8Array>) => {
  try {
    self.postMessage({ result: await parse(event.data) });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error ? error.message : "Could not read this package.",
    });
  }
};
