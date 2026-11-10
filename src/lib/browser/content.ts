import { cardHTML, escapeHTML, plainHTML } from "../html";
import type { LocalNote, LocalCard } from "./types";
export const aliases = {
  question: ["question", "front", "prompt", "term", "expression", "text"],
  answer: ["answer", "back", "definition", "meaning"],
  extra: ["extra", "explanation", "explanations", "notes", "backextra"],
  source: [
    "source",
    "sources",
    "reference",
    "references",
    "citation",
    "citations",
  ],
  details: [
    "id",
    "uid",
    "guid",
    "noteid",
    "cardid",
    "externalid",
    "module",
    "kind",
    "topic",
    "chapter",
    "section",
    "unit",
    "category",
  ],
};
export function role(name: string) {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (Object.keys(aliases) as (keyof typeof aliases)[]).find((k) =>
    aliases[k].includes(key),
  );
}
export function notePreview(note: LocalNote) {
  const first = (kind: keyof typeof aliases) =>
    note.fields[note.fieldNames.findIndex((n) => role(n) === kind)];
  const content = note.fields.filter(
    (_, i) =>
      !["source", "extra", "details"].includes(role(note.fieldNames[i]) ?? ""),
  );
  return {
    front: first("question") ?? content[0] ?? "",
    back: first("answer") ?? first("extra") ?? content[1] ?? "",
  };
}
export function present(note: LocalNote, card: LocalCard) {
  let { front: question, back: answer } = notePreview(note);
  if (note.kind === "reversed" && card.ord === 1)
    [question, answer] = [answer, question];
  if (note.kind === "cloze") {
    const text = note.fields.find((f) => /\{\{c[1-9]\d*::/.test(f)) ?? question;
    const cloze = /\{\{c([1-9]\d*)::([^{}]*?)\}\}/g;
    question = text.replace(cloze, (_, n: string, value: string) =>
      Number(n) === card.ord + 1
        ? `<span class="cloze">[${value.split("::").slice(1).join("::") || "…"}]</span>`
        : value.split("::")[0],
    );
    answer = text.replace(cloze, (_, n: string, value: string) =>
      Number(n) === card.ord + 1
        ? `<span class="cloze">${value.split("::")[0]}</span>`
        : value.split("::")[0],
    );
  }
  const entries = (kind: keyof typeof aliases) =>
    note.fieldNames.flatMap((label, i) =>
      role(label) === kind && note.fields[i]?.trim()
        ? [{ label, html: cardHTML(note.fields[i]) }]
        : [],
    );
  return {
    question: cardHTML(question),
    answer: cardHTML(answer),
    requiresTypedAnswer: note.kind === "typing",
    extras: entries("extra"),
    sources: entries("source"),
    details: entries("details"),
    tags: note.tags,
    identity: { noteId: note.id, cardId: card.id, noteType: note.model },
  };
}
export type Draft = {
  type: LocalNote["kind"];
  front: string;
  back: string;
  extra: string;
  source: string;
  tags: string[];
};
export function validateDraft(value: unknown): Draft {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Each note must be an object.");
  const obj = value as Record<string, unknown>;
  if (
    Object.keys(obj).some(
      (k) => !["type", "front", "back", "extra", "source", "tags"].includes(k),
    )
  )
    throw Error(
      "Notes can contain only type, front, back, extra, source and tags.",
    );
  const type = obj.type ?? "basic";
  if (!["basic", "reversed", "typing", "cloze"].includes(String(type)))
    throw Error("Choose basic, reversed, typing or cloze.");
  const read = (key: string) => {
    const val = obj[key] ?? "";
    if (
      typeof val !== "string" ||
      val.length > 100000 ||
      /[\x00\x1f]/.test(val)
    )
      throw Error("Note fields must be text, up to 100,000 characters.");
    return val.trim();
  };
  const front = read("front"),
    back = read("back");
  if (!front || (type !== "cloze" && !back))
    throw Error("Each note needs a question and an answer.");
  if (type === "cloze") {
    const matches = [...front.matchAll(/\{\{c([1-9]\d*)::([^{}]+?)\}\}/g)];
    if (
      !matches.length ||
      /\{\{c/i.test(front.replace(/\{\{c([1-9]\d*)::([^{}]+?)\}\}/g, "")) ||
      matches.some((m) => !m[2].split("::")[0].trim() || Number(m[1]) > 100)
    )
      throw Error(
        "Use non-nested clozes such as {{c1::answer}}, with numbers from 1 to 100.",
      );
  } else if (front.includes("{{c"))
    throw Error("Choose the cloze type for cloze deletions.");
  const tags =
    typeof obj.tags === "string"
      ? obj.tags.split(/\s+/).filter(Boolean)
      : (obj.tags ?? []);
  if (
    !Array.isArray(tags) ||
    tags.length > 100 ||
    tags.some(
      (t) =>
        typeof t !== "string" ||
        !t ||
        /[\s\x00-\x1f]/.test(t) ||
        t.length > 200,
    )
  )
    throw Error("Tags must be words without spaces.");
  return {
    type: type as Draft["type"],
    front,
    back,
    extra: read("extra"),
    source: read("source"),
    tags: [...new Set(tags)],
  };
}
export function parseStar(text: string) {
  if (text.length > 2000000)
    throw Error("Import up to 2 MB of notes at a time.");
  const raw = text.trim().replace(/^```(?:json)?\s*\n([\s\S]*)\n```$/, "$1");
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    throw Error("Paste a complete JSON object containing a notes list.");
  }
  if (
    obj &&
    !Array.isArray(obj) &&
    typeof obj === "object" &&
    Object.keys(obj).join(",") === "notes"
  )
    obj = (obj as { notes: unknown }).notes;
  if (!Array.isArray(obj) || !obj.length || obj.length > 500)
    throw Error("Import between 1 and 500 notes at a time.");
  return obj.map(validateDraft);
}
export const asTextHTML = (text: string) =>
  escapeHTML(text).replace(/\n/g, "<br>");
export function parseText(
  text: string,
  separator: string,
  skipHeader: boolean,
) {
  if (text.length > 2000000) throw Error("Text imports are limited to 2 MB.");
  let lines = text.replace(/^\ufeff/, "").split(/\r?\n/);
  const declared = lines
    .find((l) => l.startsWith("#separator:"))
    ?.split(":")[1]
    .trim();
  if (separator === "auto")
    separator = declared ?? (text.includes("\t") ? "tab" : "comma");
  const delimiter = (
    { tab: "\t", comma: ",", semicolon: ";" } as Record<string, string>
  )[separator];
  if (!delimiter) throw Error("Choose a tab, comma or semicolon separator.");
  lines = lines.filter((l) => !l.startsWith("#"));
  // CSV state machine supports quoted delimiters, escaped quotes and newlines.
  const source = lines.join("\n"),
    rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i <= source.length; i++) {
    const c = source[i];
    if (c === '"' && (quoted || !cell)) {
      if (quoted && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === delimiter || c === "\n" || c === undefined)) {
      row.push(cell);
      cell = "";
      if (c !== delimiter) {
        rows.push(row);
        row = [];
      }
    } else if (c !== undefined) cell += c;
  }
  if (quoted) throw Error("A quoted field is missing its closing quote.");
  if (skipHeader) rows.shift();
  const warnings: string[] = [],
    seen = new Set<string>();
  const pairs: { front: string; back: string }[] = [];
  for (const [i, row] of rows.entries()) {
    if (!row.some((v) => v.trim())) continue;
    if (
      row.length < 2 ||
      !plainHTML(row[0]).trim() ||
      !plainHTML(row[1]).trim()
    ) {
      warnings.push(`Row ${i + 1}: a question and answer are required.`);
      continue;
    }
    const key = JSON.stringify(
      row.slice(0, 2).map((v) => plainHTML(v).toLowerCase()),
    );
    if (seen.has(key)) {
      warnings.push(`Row ${i + 1}: duplicate skipped.`);
      continue;
    }
    seen.add(key);
    pairs.push({ front: row[0], back: row[1] });
    if (row.length > 2)
      warnings.push(
        `Row ${i + 1}: only the first two columns will be imported.`,
      );
  }
  if (!pairs.length || pairs.length > 10000)
    throw Error("Import between 1 and 10,000 question-and-answer pairs.");
  return { pairs, warnings };
}
