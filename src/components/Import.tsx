import { useState, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  Check,
  ExternalLink,
} from "lucide-react";
import { api, navigate } from "../lib/api";
import StarImport from "./StarImport";
type Preview = {
  token: string;
  kind: string;
  count: number;
  preview: { front: string; back: string }[];
  warnings: string[];
  warningCount: number;
};
export default function Import({ onChange }: { onChange: () => void }) {
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [separator, setSeparator] = useState("auto");
  const [skipHeader, setSkipHeader] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<Preview>();
  const [scheduling, setScheduling] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    added: number;
    skipped: number;
    message?: string;
  }>();
  const lock = useRef(false);
  function clear() {
    setPreview(undefined);
    setError("");
  }
  async function perform(fn: () => Promise<void>) {
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
  const doPreview = () =>
    perform(async () => {
      if (tab === "text") {
        setPreview(
          await api("/import/text/preview", { text, separator, skipHeader }),
        );
      } else if (file) {
        const data = new FormData();
        data.append("file", file);
        setPreview(await api("/import/anki/preview", data));
      }
    });
  const commit = () =>
    perform(async () => {
      if (!preview) return;
      setResult(
        await api("/import/commit", {
          token: preview.token,
          name: name.trim() || "Imported cards",
          scheduling,
        }),
      );
      onChange();
    });
  if (result)
    return (
      <section className="narrow-page">
        <div className="session-complete">
          <div className="done-symbol">
            <Check size={28} />
          </div>
          <h1>Your cards are home.</h1>
          <p>
            {result.added} cards added
            {result.skipped
              ? `, ${result.skipped} duplicates skipped`
              : ""}.{" "}
            {result.message || "They’re ready for your next study session."}
          </p>
          <button className="primary" onClick={() => navigate("library")}>
            Go to your library <ArrowRight size={17} />
          </button>
          <button
            className="text-button"
            onClick={() => {
              setResult(undefined);
              setPreview(undefined);
              setText("");
              setFile(undefined);
            }}
          >
            Import another set
          </button>
        </div>
      </section>
    );
  return (
    <section className="narrow-page">
      <button className="text-button back" onClick={() => navigate("library")}>
        <ArrowLeft size={16} /> Library
      </button>
      <h1>Bring your cards with you.</h1>
      <p className="page-description">
        A fresh start, without starting over. Imports stay on your device.
      </p>
      <div className="tabs" role="group" aria-label="Import format">
        {[
          ["text", "Quizlet / text"],
          ["anki", "Anki package"],
          ["star", "Assistant / JSON"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={tab === id}
            disabled={busy}
            onClick={() => {
              setTab(id);
              clear();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "star" ? (
        <StarImport onChange={onChange} />
      ) : tab === "text" ? (
        <div className="import-form">
          <div className="import-instructions">
            <FileText size={21} />
            <div>
              <strong>From Quizlet to Recall</strong>
              <p>
                Open a set you created on Quizlet’s website. Choose{" "}
                <b>Export</b>, select a tab between terms and definitions, then
                copy the text.
              </p>
              <a
                href="https://help.quizlet.com/hc/en-us/articles/360034345672-Exporting-your-sets"
                target="_blank"
                rel="noreferrer"
              >
                Quizlet export guide <ExternalLink size={13} />
              </a>
            </div>
          </div>
          <label>
            Deck name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Biology · Cell structure"
              maxLength={120}
            />
          </label>
          <label>
            Paste your cards
            <textarea
              rows={8}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                clear();
              }}
              placeholder={
                "Mitochondria\tThe site of aerobic respiration\nRibosome\tThe site of protein synthesis"
              }
            />
          </label>
          <div className="form-row">
            <label>
              Between question and answer
              <select
                value={separator}
                onChange={(e) => {
                  setSeparator(e.target.value);
                  clear();
                }}
              >
                <option value="auto">Detect automatically</option>
                <option value="tab">Tab</option>
                <option value="comma">Comma (CSV)</option>
                <option value="semicolon">Semicolon</option>
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={skipHeader}
                onChange={(e) => {
                  setSkipHeader(e.target.checked);
                  clear();
                }}
              />{" "}
              First row is a heading
            </label>
          </div>
          <label className="file-link">
            Or choose a .txt, .csv or .tsv file
            <input
              type="file"
              accept=".txt,.csv,.tsv"
              disabled={busy}
              onChange={async (e) => {
                const selected = e.target.files?.[0];
                if (selected) {
                  if (selected.size > 2_000_000) {
                    setError("Choose a text file smaller than 2 MB.");
                    return;
                  }
                  setText(await selected.text());
                  setName(selected.name.replace(/\.[^.]+$/, ""));
                  clear();
                }
              }}
            />
          </label>
          <p className="hint left">
            Two columns: question, answer. Anki metadata lines are skipped.
            Quizlet images are not included in its text exports.
          </p>
        </div>
      ) : (
        <div className="import-form">
          <label className="upload-zone">
            <Upload size={30} />
            <strong>{file?.name || "Choose an Anki package"}</strong>
            <span>.apkg · up to 50 MB</span>
            <input
              type="file"
              accept=".apkg"
              disabled={busy}
              onChange={(e) => {
                setFile(e.target.files?.[0]);
                clear();
              }}
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={scheduling}
              onChange={(e) => setScheduling(e.target.checked)}
            />{" "}
            Keep my review history and schedule
          </label>
          <p className="hint left">
            Read by the official Anki engine. Deck names, note types, and
            supported media come with you. Your existing Anki profile stays
            separate.
          </p>
        </div>
      )}
      {tab !== "star" && error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {tab !== "star" &&
        (!preview ? (
          <button
            className="primary"
            disabled={busy || (tab === "text" ? !text.trim() : !file)}
            onClick={doPreview}
          >
            {busy ? "Reading your cards…" : "Preview import"}{" "}
            <ArrowRight size={16} />
          </button>
        ) : (
          <div className="import-preview" aria-live="polite">
            <div className="section-heading">
              <h2>{preview.count} cards found</h2>
              <span>First {preview.preview.length} shown</span>
            </div>
            <div className="preview-table">
              <div className="preview-header">
                <span>Question</span>
                <span>Answer</span>
              </div>
              {preview.preview.map((row, i) => (
                <div key={i}>
                  <span>{row.front}</span>
                  <span>{row.back}</span>
                </div>
              ))}
            </div>
            {preview.warnings.length > 0 && (
              <details className="warnings">
                <summary>
                  {preview.warningCount} import note
                  {preview.warningCount === 1 ? "" : "s"}
                </summary>
                <ul>
                  {preview.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </details>
            )}
            <button className="primary" disabled={busy} onClick={commit}>
              {busy ? "Importing…" : `Import ${preview.count} cards`}{" "}
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
    </section>
  );
}
