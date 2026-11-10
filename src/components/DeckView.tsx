import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  Plus,
  Search,
  Pencil,
  Trash2,
  Pause,
  Play,
  ArrowRight,
  Check,
} from "lucide-react";
import { api, navigate, cleanText, type Deck } from "../lib/api";
import CardGuidance from "./CardGuidance";
import DeckBrowser from "./DeckBrowser";
import { QueueCounts, NextRepeat } from "./QueueCounts";
import { deckTitle, deckTree, findDeckNode } from "../lib/decks";
type Note = {
  id: string;
  fields: string[];
  fieldNames: string[];
  model: string;
  front: string;
  back: string;
  suspended: boolean;
};
function fieldIndex(
  names: string[] | undefined,
  pattern: RegExp,
  fallback: number,
) {
  const index = names?.findIndex((n) => pattern.test(n)) ?? -1;
  return index >= 0 ? index : fallback;
}
export default function DeckView({
  deck,
  decks,
  onNewFolder,
  onChange,
}: {
  deck: Deck;
  decks: Deck[];
  onNewFolder: (parentId?: string) => void;
  onChange: () => void;
}) {
  const node = findDeckNode(deckTree(decks), deck.id)!;
  const ancestors = deck.name
    .split("::")
    .slice(0, -1)
    .map((_, i, parts) =>
      decks.find((d) => d.name === parts.slice(0, i + 1).join("::")),
    )
    .filter((d): d is Deck => !!d);
  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<Note | null>();
  const [fields, setFields] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string>();
  const [status, setStatus] = useState("");
  const load = useCallback(async () => {
    const data = await api<{ notes: Note[]; total: number }>(
      `/decks/${deck.id}/notes?q=${encodeURIComponent(query)}&offset=${offset}`,
    );
    setNotes(data.notes);
    setTotal(data.total);
  }, [deck.id, query, offset]);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);
  function edit(note: Note | null) {
    setEditing(note);
    setFields(note?.fields ?? ["", "", "", ""]);
    setError("");
    setStatus("");
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <nav className="breadcrumbs" aria-label="Folder path">
        <a href="#library">Decks</a>
        {ancestors.map((ancestor) => (
          <span key={ancestor.id}>
            <ChevronRight size={14} aria-hidden="true" />
            <a href={"#deck/" + ancestor.id}>{deckTitle(ancestor.name)}</a>
          </span>
        ))}
      </nav>
      <div className="page-heading">
        <div>
          <h1>{deckTitle(deck.name)}</h1>
          <p>
            {node.total} cards{node.folder ? " in this folder" : ""} ·{" "}
            {deck.ready} ready today
          </p>
          <div className="deck-queue-line">
            <QueueCounts counts={deck} />
            <NextRepeat at={deck.nextLearningAt} onDue={onChange} />
          </div>
        </div>
        <div className="actions">
          <button className="secondary" onClick={() => edit(null)}>
            <Plus size={16} /> Add cards
          </button>
          <button
            className="primary"
            disabled={!deck.ready}
            onClick={() => navigate("study/" + deck.id)}
          >
            {node.folder ? "Study folder" : "Study deck"}{" "}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      {node.folder && (
        <DeckBrowser
          decks={decks}
          parentId={deck.id}
          onNewFolder={onNewFolder}
        />
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {status && (
        <p className="success" role="status">
          <Check size={16} />
          {status}
        </p>
      )}
      {editing !== undefined && (
        <form
          className="note-editor"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api(
                editing ? "/notes/" + editing.id : "/notes",
                { deckId: deck.id, fields },
                editing ? "PUT" : "POST",
              );
              if (editing) setEditing(undefined);
              else setFields(["", "", "", ""]);
              setStatus(
                editing
                  ? "Changes saved."
                  : "Card added. Add another, or close the editor.",
              );
            });
          }}
        >
          <div className="section-heading">
            <h2>{editing ? "Edit note" : "Add a card"}</h2>
            <button
              type="button"
              className="text-button"
              onClick={() => setEditing(undefined)}
            >
              Close editor
            </button>
          </div>
          {fields.map((field, i) => (
            <label key={i}>
              {editing?.fieldNames[i] ??
                [
                  "Question",
                  "Answer",
                  "Explanation (optional)",
                  "Source (optional)",
                ][i]}
              <textarea
                rows={3}
                required={i === 0 || (!editing && i === 1)}
                value={field}
                onChange={(e) =>
                  setFields((values) =>
                    values.map((v, j) => (j === i ? e.target.value : v)),
                  )
                }
                placeholder={
                  i === 0
                    ? "Ask one clear question."
                    : "Keep the answer focused."
                }
              />
            </label>
          ))}
          <CardGuidance
            question={
              fields[
                fieldIndex(
                  editing?.fieldNames,
                  /^(question|front|prompt|term|text)$/i,
                  0,
                )
              ] ?? ""
            }
            answer={
              fields[
                fieldIndex(
                  editing?.fieldNames,
                  /^(answer|back|definition)$/i,
                  1,
                )
              ] ?? ""
            }
            source={
              editing
                ? fields[
                    editing.fieldNames.findIndex((n) =>
                      /^(source|sources|reference)$/i.test(n),
                    )
                  ]
                : fields[3]
            }
            type={
              editing?.model.toLowerCase().includes("cloze") ? "cloze" : "basic"
            }
          />
          <p className="hint left">
            Basic formatting is supported. Imported notes keep their fields and
            Anki card identities. Custom designs use Oftly’s layout.
          </p>
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Add card"}
          </button>
        </form>
      )}
      {(!node.folder || deck.total > 0 || editing !== undefined) && (
        <>
          <div className="section-heading">
            <h2>{node.folder ? "Cards in this folder" : "Cards"}</h2>
            <label className="search">
              <Search size={16} />
              <input
                aria-label="Search cards"
                placeholder="Search this deck"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOffset(0);
                }}
              />
            </label>
          </div>
          {!notes.length ? (
            <div className="empty-inline">
              <h3>{query ? "No matching cards." : "No cards yet."}</h3>
              <p>
                {query
                  ? "Try a different word or clear your search."
                  : "Add your first question and answer to this deck."}
              </p>
              {!query && (
                <button className="secondary" onClick={() => edit(null)}>
                  <Plus size={16} /> Add a card
                </button>
              )}
            </div>
          ) : (
            <div className="notes-table">
              {notes.map((note) => (
                <div
                  className={"note-row" + (note.suspended ? " suspended" : "")}
                  key={note.id}
                >
                  <div className="note-copy">
                    <strong>{cleanText(note.front)}</strong>
                    <p>{cleanText(note.back)}</p>
                    {note.suspended && (
                      <span className="status-label">Paused</span>
                    )}
                    {note.model !== "Recall Basic" && (
                      <span className="note-type">{note.model}</span>
                    )}
                  </div>
                  {deleteId === note.id ? (
                    <div className="delete-confirm">
                      <span>Delete this note and its cards?</span>
                      <button
                        className="danger-button"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await api("/notes/" + note.id, {}, "DELETE");
                            setDeleteId(undefined);
                          })
                        }
                      >
                        Delete
                      </button>
                      <button
                        className="text-button"
                        onClick={() => setDeleteId(undefined)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        aria-label="Edit note"
                        title="Edit note"
                        onClick={() => edit(note)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        disabled={busy}
                        aria-label={
                          note.suspended ? "Resume note" : "Pause note"
                        }
                        title={note.suspended ? "Resume" : "Pause"}
                        onClick={() =>
                          run(async () => {
                            await api("/notes/" + note.id + "/suspend", {});
                          })
                        }
                      >
                        {note.suspended ? (
                          <Play size={16} />
                        ) : (
                          <Pause size={16} />
                        )}
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Delete note"
                        title="Delete"
                        onClick={() => setDeleteId(note.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {total > 100 && (
            <div className="pagination">
              <button
                className="secondary"
                disabled={offset === 0}
                onClick={() => setOffset((v) => Math.max(0, v - 100))}
              >
                Previous
              </button>
              <span>
                {offset + 1}–{Math.min(total, offset + 100)} of {total}
              </span>
              <button
                className="secondary"
                disabled={offset + 100 >= total}
                onClick={() => setOffset((v) => v + 100)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
