import {
  useEffect,
  useState,
  useCallback,
  Component,
  type ReactNode,
} from "react";
import { Check, Download, HardDrive } from "lucide-react";
import { api, navigate, type Dashboard, type Stats } from "./lib/api";
import Study from "./components/Study";
import Import from "./components/Import";
import DeckView from "./components/DeckView";
import DeckBrowser from "./components/DeckBrowser";
import { NextRepeat } from "./components/QueueCounts";
import { deckPath, isFolder } from "./lib/decks";
import { SuggestionSettings } from "./components/CardGuidance";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="empty-inline">
        <h1>Let’s reopen your workspace.</h1>
        <p>Your collection is saved locally.</p>
        <button className="primary" onClick={() => location.reload()}>
          Reload Oftly
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Week({ stats, large = false }: { stats: Stats; large?: boolean }) {
  const max = Math.max(5, ...stats.days.map((d) => d.count));
  return (
    <div
      className={large ? "week-chart large" : "week-chart"}
      aria-label="Reviews over the last seven study days"
    >
      {stats.days.map((day, i) => (
        <div className={"day" + (i === 6 ? " current" : "")} key={day.date}>
          <span className="day-value">{day.count}</span>
          <div className="bar-track">
            <div
              className="bar"
              style={{
                height: day.count
                  ? Math.max(8, (day.count / max) * 100) + "%"
                  : "3px",
              }}
            />
          </div>
          <span>{day.label}</span>
        </div>
      ))}
    </div>
  );
}
function Preferences({ onChange }: { onChange: () => void }) {
  const browserLocal = import.meta.env.VITE_STORAGE === "browser";
  const [values, setValues] = useState<{
    newPerDay: number;
    retention: number;
    engine: string;
  }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api<typeof values>("/settings")
      .then(setValues)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="narrow-page">
      <h1>Settings</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {values && (
        <form
          className="settings-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("/settings", values, "PUT");
              setSaved(true);
              onChange();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="setting-row">
            <div>
              <h2>New cards per deck, per day</h2>
              <p>Start small. New cards add to your future reviews.</p>
            </div>
            <input
              aria-label="New cards per deck per day"
              type="number"
              min={0}
              max={100}
              required
              value={values.newPerDay}
              onChange={(e) => {
                setValues({ ...values, newPerDay: Number(e.target.value) });
                setSaved(false);
              }}
            />
          </div>
          <div className="setting-row">
            <div>
              <h2>Target retention</h2>
              <p>
                90% is a useful starting point. Higher targets mean more
                reviews, not a guarantee of recall.
              </p>
            </div>
            <select
              aria-label="Target retention"
              value={Math.round(values.retention * 100)}
              onChange={(e) => {
                setValues({
                  ...values,
                  retention: Number(e.target.value) / 100,
                });
                setSaved(false);
              }}
            >
              {[80, 85, 90, 95, 97].map((v) => (
                <option key={v} value={v}>
                  {v}%
                </option>
              ))}
            </select>
          </div>
          <p className="hint left">
            Applies to all deck presets on future reviews. Existing due dates
            stay in place. Related cards are separated until the next day.
          </p>
          <div className="actions">
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save preferences"}
            </button>
            {saved && (
              <span className="success" role="status">
                <Check size={16} /> Saved
              </span>
            )}
          </div>
        </form>
      )}
      <SuggestionSettings />
      <div className="data-section">
        <h2>Backups</h2>
        <p>
          {browserLocal
            ? "Cards, review history and media stay in this browser on this device. Download regular backups: clearing site data or using private browsing can erase your collection. Devices and browsers do not sync."
            : "Cards, review history, and media are stored in a separate local Anki collection. Export a backup to keep elsewhere or open in Anki."}
        </p>
        {browserLocal ? (
          <button
            className="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await api("/export");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Download size={16} /> Download Oftly backup
          </button>
        ) : (
          <a className="secondary" href="/api/export" download>
            <Download size={16} /> Download Anki backup
          </a>
        )}
        <p className="hint left">
          {browserLocal
            ? "Restore an .oftly.zip backup from Import → Anki / backup. Matching notes and schedules are restored from the backup. This backup format is for Oftly; use the local edition for native Anki exports."
            : "To restore, open Import and choose the backup. Matching notes are merged by Anki."}
        </p>
      </div>
      <div className="engine-note">
        <HardDrive size={19} />
        <p>
          {browserLocal
            ? "FSRS-6 scheduling · saved in your browser."
            : `Powered by Anki ${values?.engine ?? ""} · native FSRS scheduling.`}
          <br />
          No account, analytics, or cloud uploads.
          <br />
          <a
            href="https://github.com/vivantaneja/oftly"
            target="_blank"
            rel="noreferrer"
          >
            Source code and project information
          </a>
        </p>
      </div>
    </section>
  );
}
function AppContent() {
  const [route, setRoute] = useState(location.hash.slice(1) || "today");
  const [data, setData] = useState<Dashboard>();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState<"deck" | "folder" | null>(null);
  const [parentId, setParentId] = useState("");
  const [createError, setCreateError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => {
    api<Dashboard>("/dashboard")
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    refresh();
    const handler = () => {
      setRoute(location.hash.slice(1) || "today");
      setCreating(null);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, [refresh]);
  useEffect(() => {
    const update = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", update);
    const timer = window.setInterval(update, 60000);
    return () => {
      document.removeEventListener("visibilitychange", update);
      clearInterval(timer);
    };
  }, [refresh]);
  const [page, id] = route.split("/");
  const study = page === "study";
  const ready =
    data?.decks
      .filter(
        (d) =>
          !data.decks.some((parent) => d.name.startsWith(parent.name + "::")),
      )
      .reduce((n, d) => n + d.ready, 0) ?? 0;
  function beginCreation(kind: "deck" | "folder", parent?: string) {
    setCreating(kind);
    setParentId(parent ?? "");
    setName("");
    setCreateError("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function newFolder(parent?: string) {
    beginCreation("folder", parent);
  }
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (name.includes("::"))
        throw new Error(
          "Choose a location below instead of using :: in the name.",
        );
      const result = await api<{ id: string }>("/decks", {
        name,
        parentId: parentId || null,
        folder: creating === "folder",
      });
      setData(await api<Dashboard>("/dashboard"));
      setCreating(null);
      setName("");
      navigate("deck/" + result.id);
    } catch (e) {
      setCreateError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function sample() {
    setBusy(true);
    try {
      await api("/sample", {});
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={"app-shell" + (study ? " focused" : "")}>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="app-header">
        <a className="brand" href="#today" aria-label="Oftly home">
          <img className="brand-icon" src="/brand/oftly-icon.svg" alt="" />
          <img
            className="brand-wordmark"
            src="/brand/oftly-wordmark-ink.svg"
            alt="oftly"
          />
        </a>
        <nav aria-label="Main navigation">
          {[
            ["today", "Decks"],
            ["progress", "Progress"],
            ["settings", "Settings"],
          ].map(([target, label]) => {
            const selected =
              page === target ||
              (target === "today" &&
                ["library", "deck", "import"].includes(page));
            return (
              <a
                key={target}
                href={"#" + target}
                className={selected ? "selected" : ""}
                aria-current={selected ? "page" : undefined}
              >
                {label}
              </a>
            );
          })}
        </nav>
        {!study && (
          <div className="header-actions">
            <button className="text-button" onClick={() => navigate("import")}>
              Import
            </button>
            <button
              className="secondary compact"
              onClick={() => {
                const current = data?.decks.find((d) => d.id === id);
                const parent =
                  current && data
                    ? isFolder(current, data.decks)
                      ? current
                      : data.decks.find(
                          (d) =>
                            d.name ===
                            current.name.split("::").slice(0, -1).join("::"),
                        )
                    : undefined;
                beginCreation("deck", parent?.id);
              }}
            >
              New deck
            </button>
          </div>
        )}
      </header>
      <div className="workspace">
        <main id="main" tabIndex={-1} className={study ? "study-main" : ""}>
          {creating && (
            <form className="create-deck" onSubmit={create} key={creating}>
              <label>
                Name your new {creating}
                <input
                  autoFocus
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    creating === "folder"
                      ? "e.g. School subjects"
                      : "What are you learning?"
                  }
                />
              </label>
              <label>
                Location
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">All decks</option>
                  {data?.decks
                    .filter((d) => isFolder(d, data.decks))
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {deckPath(d.name)}
                      </option>
                    ))}
                </select>
              </label>
              <div className="actions">
                <button className="primary" disabled={busy || !name.trim()}>
                  {busy ? "Creating…" : `Create ${creating}`}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setCreating(null)}
                >
                  Cancel
                </button>
              </div>
              {createError && (
                <p className="error create-error" role="alert">
                  {createError}
                </p>
              )}
            </form>
          )}
          {error && (
            <div className="error" role="alert">
              {error} <button onClick={refresh}>Try again</button>
            </div>
          )}
          {!data ? (
            <div className="loading" role="status">
              {error
                ? import.meta.env.VITE_STORAGE === "browser"
                  ? "Your browser could not open this collection. Check site-storage permissions and try again."
                  : "Open the local service with npm run dev to reconnect."
                : "Opening your workspace…"}
            </div>
          ) : page === "study" ? (
            <Study key={id ?? "all"} deck={id} onChange={refresh} />
          ) : page === "import" ? (
            <Import onChange={refresh} />
          ) : page === "deck" ? (
            data.decks.find((d) => d.id === id) ? (
              <DeckView
                key={id}
                deck={data.decks.find((d) => d.id === id)!}
                decks={data.decks}
                onNewFolder={newFolder}
                onChange={refresh}
              />
            ) : (
              <div className="empty-inline">
                <h1>Deck not found</h1>
                <button
                  className="secondary"
                  onClick={() => navigate("library")}
                >
                  Back to decks
                </button>
              </div>
            )
          ) : page === "settings" ? (
            <Preferences onChange={refresh} />
          ) : page === "progress" ? (
            <section>
              <div className="page-heading">
                <div>
                  <h1>Progress</h1>
                  <p>Your review history.</p>
                </div>
              </div>
              <div className="progress-summary">
                <div>
                  <strong>{data.stats.reviewedToday}</strong>
                  <span>reviews today</span>
                </div>
                <div>
                  <strong>{data.stats.minutesToday}</strong>
                  <span>minutes today</span>
                </div>
                <div>
                  <strong>
                    {data.stats.recallRate === null
                      ? "—"
                      : data.stats.recallRate + "%"}
                  </strong>
                  <span>recall on review cards · 30 days</span>
                </div>
              </div>
              <div className="section-heading">
                <h2>Your last seven days</h2>
                <span>Reviews completed</span>
              </div>
              <Week stats={data.stats} large />
              <p className="hint left">
                Recall rate uses {data.stats.recallSample} scheduled review
                answers, excluding learning steps. A small sample can fluctuate.
              </p>
              <details className="learning-note quiet-details">
                <summary>About spaced repetition</summary>
                <div>
                  <h2>Progress is remembering later.</h2>
                  <p>
                    Spacing and retrieval support long-term retention. More
                    flips in one sitting aren’t the goal. Give your memory time,
                    then come back.
                  </p>
                  <a
                    href="https://pubmed.ncbi.nlm.nih.gov/16719566/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read the spacing research
                  </a>
                </div>
              </details>
            </section>
          ) : (
            <section className="collection-page">
              <div className="page-heading">
                <div>
                  <h1>Decks</h1>
                  <p>
                    {ready} ready today · {data.stats.reviewedToday} reviewed
                  </p>
                  <NextRepeat at={data.stats.nextLearningAt} onDue={refresh} />
                </div>
                {data.stats.totalCards > 0 && (
                  <button
                    className="primary"
                    disabled={!ready}
                    onClick={() => navigate("study")}
                  >
                    Start studying
                  </button>
                )}
              </div>
              <DeckBrowser
                key={page}
                decks={data.decks}
                onNewFolder={newFolder}
              />
              {data.stats.totalCards === 0 && (
                <button
                  className="text-button sample-link"
                  disabled={busy}
                  onClick={sample}
                >
                  Try a 6-card sample deck
                </button>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
