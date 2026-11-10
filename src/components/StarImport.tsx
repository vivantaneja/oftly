import { useEffect, useRef, useState } from "react";
import { ArrowRight, Copy, Download, Check } from "lucide-react";
import { api, navigate } from "../lib/api";
import CardGuidance from "./CardGuidance";
type Draft = {
  type: string;
  front: string;
  back: string;
  extra: string;
  source: string;
  tags: string[];
};
function cardCount(note: Draft) {
  if (note.type === "reversed") return 2;
  if (note.type === "cloze")
    return new Set(
      [...note.front.matchAll(/{{c([1-9]\d*)::/g)].map((m) => m[1]),
    ).size;
  return 1;
}
export default function StarImport({ onChange }: { onChange: () => void }) {
  const [raw, setRaw] = useState("");
  const [name, setName] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [context, setContext] = useState("");
  const [focus, setFocus] = useState("");
  const [understanding, setUnderstanding] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    added: number;
    cards: number;
    skipped: number;
    deckId: string;
  }>();
  const lock = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ block: "center" });
      errorRef.current?.focus({ preventScroll: true });
    }
  }, [error]);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (result) resultRef.current?.focus();
    else if (drafts.length) reviewRef.current?.focus();
  }, [!!result, drafts.length, page]);
  async function run(fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function changeRaw(value: string) {
    setRaw(value);
    setDrafts([]);
    setSelected([]);
    setError("");
  }
  function edit(index: number, changes: Partial<Draft>) {
    setDrafts((values) =>
      values.map((n, i) => (i === index ? { ...n, ...changes } : n)),
    );
  }
  const chosen = drafts.filter((_, i) => selected[i]);
  function exportDrafts() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ notes: chosen }, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "oftly-notes.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (result)
    return (
      <div className="session-complete">
        <div className="done-symbol">
          <Check size={28} />
        </div>
        <h2 ref={resultRef} tabIndex={-1}>
          Import complete
        </h2>
        <p>
          {result.added} {result.added === 1 ? "note" : "notes"} created{" "}
          {result.cards} {result.cards === 1 ? "card" : "cards"}.{" "}
          {result.skipped ? `${result.skipped} duplicates skipped.` : ""}
        </p>
        <button
          className="primary"
          onClick={() => navigate("deck/" + result.deckId)}
        >
          Open deck <ArrowRight size={16} />
        </button>
      </div>
    );
  return (
    <div className="star-import" aria-busy={busy}>
      <details className="prompt-builder">
        <summary>Create a prompt for your assistant</summary>
        <p>
          Prepare it here, then paste it into the assistant you use with your
          course material. Nothing is sent automatically.
        </p>
        <label>
          Source material{" "}
          <textarea
            rows={4}
            value={context}
            maxLength={100000}
            onChange={(e) => {
              setContext(e.target.value);
              setPrompt("");
            }}
            placeholder="Paste your notes, or leave empty if your sources are already attached in your assistant."
          />
        </label>
        <label>
          Focus{" "}
          <input
            value={focus}
            maxLength={500}
            onChange={(e) => {
              setFocus(e.target.value);
              setPrompt("");
            }}
            placeholder="e.g. Explain and apply database normalisation"
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={understanding}
            onChange={(e) => {
              setUnderstanding(e.target.checked);
              setPrompt("");
            }}
          />
          Include explanation, comparison and application questions where the
          source supports them
        </label>
        <button
          className="secondary"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const data = await api<{ prompt: string }>(
                "/import/star/prompt",
                { context, focus, understanding },
              );
              setPrompt(data.prompt);
              setCopied(false);
            })
          }
        >
          Prepare prompt
        </button>
        {prompt && (
          <div className="prepared-prompt">
            <label>
              Prepared prompt
              <textarea readOnly rows={7} value={prompt} />
            </label>
            <button
              className="secondary"
              onClick={() =>
                run(async () => {
                  await navigator.clipboard.writeText(prompt);
                  setCopied(true);
                })
              }
            >
              <Copy size={16} />
              {copied ? "Copied" : "Copy prompt"}
            </button>
            <p className="hint left">
              Ask your assistant to return JSON. Check its facts and sources
              before importing.
            </p>
          </div>
        )}
      </details>
      <label>
        Deck name
        <input
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Computer science · Databases"
        />
      </label>
      <label>
        Paste Anki Star JSON
        <textarea
          rows={7}
          value={raw}
          onChange={(e) => changeRaw(e.target.value)}
          placeholder={
            '{"notes":[{"type":"basic","front":"Question?","back":"Answer","source":"Lecture 1"}]}'
          }
        />
      </label>
      <label className="file-link">
        Or choose a .json file
        <input
          type="file"
          accept=".json"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              void run(async () => {
                if (file.size > 2000000)
                  throw new Error("Choose a JSON file smaller than 2 MB.");
                changeRaw(await file.text());
              });
          }}
        />
      </label>
      <p className="hint left">
        Up to 500 basic, reversed, typed or cloze notes. Imports use Oftly’s
        layout. Exact first-field duplicates within an Anki Star note type are
        skipped across decks.
      </p>
      {error && (
        <p ref={errorRef} tabIndex={-1} className="error" role="alert">
          {error}
        </p>
      )}
      {!drafts.length ? (
        <button
          className="primary"
          disabled={busy || !raw.trim()}
          onClick={() =>
            run(async () => {
              const data = await api<{ notes: Draft[] }>(
                "/import/star/preview",
                { text: raw },
              );
              setDrafts(data.notes);
              setSelected(data.notes.map(() => true));
              setPage(0);
            })
          }
        >
          {busy ? "Checking notes…" : "Review notes"}
          <ArrowRight size={16} />
        </button>
      ) : (
        <div className="draft-review">
          <div className="section-heading">
            <h2 ref={reviewRef} tabIndex={-1}>
              Review {drafts.length} {drafts.length === 1 ? "note" : "notes"}
            </h2>
            <span>
              {chosen.length} selected ·{" "}
              {chosen.reduce((n, d) => n + cardCount(d), 0)}{" "}
              {chosen.reduce((n, d) => n + cardCount(d), 0) === 1
                ? "card"
                : "cards"}
            </span>
          </div>
          <p className="hint left">
            Edit anything that needs correcting. Uncheck notes you don’t want to
            keep.
          </p>
          {drafts.slice(page * 10, page * 10 + 10).map((note, offset) => {
            const i = page * 10 + offset;
            return (
              <fieldset className="draft-note" key={i} disabled={busy}>
                <legend>Note {i + 1}</legend>
                <div className="form-row">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={selected[i]}
                      onChange={(e) =>
                        setSelected((values) =>
                          values.map((v, j) =>
                            j === i ? e.target.checked : v,
                          ),
                        )
                      }
                    />
                    Include note {i + 1}
                  </label>
                  <label>
                    Card type
                    <select
                      value={note.type}
                      onChange={(e) => edit(i, { type: e.target.value })}
                    >
                      <option value="basic">Basic</option>
                      <option value="reversed">Reversed</option>
                      <option value="typing">Typed answer</option>
                      <option value="cloze">Cloze</option>
                    </select>
                  </label>
                </div>
                <label>
                  Question
                  <textarea
                    rows={2}
                    value={note.front}
                    onChange={(e) => edit(i, { front: e.target.value })}
                  />
                </label>
                {note.type !== "cloze" && (
                  <label>
                    Answer
                    <textarea
                      rows={2}
                      value={note.back}
                      onChange={(e) => edit(i, { back: e.target.value })}
                    />
                  </label>
                )}
                <label>
                  Source
                  <input
                    value={note.source}
                    onChange={(e) => edit(i, { source: e.target.value })}
                  />
                </label>
                <details>
                  <summary>Explanation and tags</summary>
                  <label>
                    Explanation
                    <textarea
                      rows={2}
                      value={note.extra}
                      onChange={(e) => edit(i, { extra: e.target.value })}
                    />
                  </label>
                  <label>
                    Tags, separated by spaces
                    <input
                      value={note.tags.join(" ")}
                      onChange={(e) =>
                        edit(i, { tags: e.target.value.split(" ") })
                      }
                      onBlur={() =>
                        edit(i, { tags: note.tags.filter(Boolean) })
                      }
                    />
                  </label>
                </details>
                <CardGuidance
                  question={note.front}
                  answer={note.back}
                  source={note.source}
                  type={note.type}
                />
              </fieldset>
            );
          })}
          {drafts.length > 10 && (
            <div className="pagination">
              <button
                className="secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous notes
              </button>
              <span>
                {page * 10 + 1}–{Math.min(page * 10 + 10, drafts.length)}
              </span>
              <button
                className="secondary"
                disabled={(page + 1) * 10 >= drafts.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next notes
              </button>
            </div>
          )}
          <div className="actions">
            <button
              className="primary"
              disabled={busy || !chosen.length || !name.trim()}
              onClick={() =>
                run(async () => {
                  setResult(
                    await api("/import/star/commit", {
                      name: name.trim(),
                      notes: chosen,
                    }),
                  );
                  onChange();
                })
              }
            >
              {busy
                ? "Importing…"
                : `Import ${chosen.length} ${chosen.length === 1 ? "note" : "notes"}`}
              <ArrowRight size={16} />
            </button>
            <button
              className="secondary"
              disabled={!chosen.length}
              onClick={exportDrafts}
            >
              <Download size={16} />
              Save JSON
            </button>
          </div>
          {!name.trim() && (
            <p className="hint left">Give this deck a name to import.</p>
          )}
        </div>
      )}
    </div>
  );
}
