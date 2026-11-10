import {
  useEffect,
  useState,
  useCallback,
  Component,
  type ReactNode,
} from "react";
import {
  BookOpen,
  Sun,
  ChartNoAxesColumnIncreasing,
  Settings,
  Plus,
  ArrowRight,
  Upload,
  ArrowUpRight,
  Search,
  ChevronRight,
  Check,
  Download,
  HardDrive,
  Leaf,
  ArrowLeft,
} from "lucide-react";
import {
  api,
  navigate,
  type Dashboard,
  type Deck,
  type Stats,
} from "./lib/api";
import Study from "./components/Study";
import Import from "./components/Import";
import DeckView from "./components/DeckView";
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
          Reload Recall
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
function Decks({
  decks,
  search,
  onSearch,
}: {
  decks: Deck[];
  search: string;
  onSearch: (q: string) => void;
}) {
  const visible = decks.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="section-heading">
        <h2>
          Your decks <span className="count">{decks.length}</span>
        </h2>
        <label className="search">
          <Search size={16} />
          <input
            aria-label="Search decks"
            placeholder="Find a deck"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </label>
      </div>
      {visible.length ? (
        <div className="deck-table">
          <div className="deck-table-head">
            <span>Deck</span>
            <span>Cards</span>
            <span>Ready</span>
            <span />
          </div>
          {visible.map((deck, i) => (
            <button
              key={deck.id}
              className="deck-row"
              onClick={() => navigate("deck/" + deck.id)}
            >
              <span className="deck-name">
                <span className={"deck-icon tone-" + (i % 3)}>
                  <BookOpen size={20} />
                </span>
                <span>
                  <strong>{deck.name}</strong>
                  <small>
                    {deck.new ? `${deck.new} new` : "No new cards"}
                    {deck.review + deck.learning
                      ? ` · ${deck.review + deck.learning} to revisit`
                      : ""}
                  </small>
                </span>
              </span>
              <span className="deck-total">{deck.total}</span>
              <span>
                <span className={deck.ready ? "due-count" : "quiet-count"}>
                  {deck.ready || "—"}
                </span>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-inline">
          <BookOpen size={26} />
          <h3>
            {search
              ? "No decks match that search."
              : "Your library is ready for its first deck."}
          </h3>
          <p>
            {search
              ? "Try another title."
              : "Bring over your cards or start with one good question."}
          </p>
          {!search && (
            <button className="secondary" onClick={() => navigate("import")}>
              <Upload size={16} /> Import cards
            </button>
          )}
        </div>
      )}
    </>
  );
}
function Preferences({ onChange }: { onChange: () => void }) {
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
      <h1>Keep learning manageable.</h1>
      <p className="page-description">
        A few useful settings. Anki handles the rest.
      </p>
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
            stay in place. Anki’s sibling burying is enabled.
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
        <h2>Your cards belong to you.</h2>
        <p>
          Cards, review history, and media are stored in a separate local Anki
          collection. Export a backup to keep elsewhere or open in Anki.
        </p>
        <a className="secondary" href="/api/export" download>
          <Download size={16} /> Download Anki backup
        </a>
        <p className="hint left">
          To restore, import the backup from Library. Matching notes are merged
          by Anki.
        </p>
      </div>
      <div className="engine-note">
        <HardDrive size={19} />
        <p>
          Powered by Anki {values?.engine ?? ""} · native FSRS scheduling.
          <br />
          No account, analytics, or cloud uploads.
        </p>
      </div>
    </section>
  );
}
function AppContent() {
  const [route, setRoute] = useState(location.hash.slice(1) || "today");
  const [data, setData] = useState<Dashboard>();
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
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
      setCreating(false);
      setSearch("");
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
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await api<{ id: string }>("/decks", { name });
      refresh();
      setCreating(false);
      setName("");
      navigate("deck/" + result.id);
    } catch (e) {
      setError((e as Error).message);
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
      <aside className="sidebar">
        <a className="brand" href="#today" aria-label="Recall home">
          <span className="brand-mark">
            <BookOpen size={23} />
          </span>
          recall<span className="brand-dot">.</span>
        </a>
        <nav aria-label="Main navigation">
          {[
            ["today", "Today", Sun],
            ["library", "Library", BookOpen],
            ["progress", "Progress", ChartNoAxesColumnIncreasing],
          ].map(([target, label, Icon]) => {
            const Symbol = Icon as typeof Sun;
            const selected =
              page === target ||
              (target === "library" && ["deck", "import"].includes(page));
            return (
              <a
                key={target as string}
                href={"#" + target}
                className={selected ? "selected" : ""}
                aria-current={selected ? "page" : undefined}
              >
                <Symbol size={19} />
                <span>{label as string}</span>
                {target === "today" && ready > 0 && (
                  <span className="nav-count">{ready}</span>
                )}
              </a>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <a
            href="#settings"
            className={
              page === "settings" ? "settings-link selected" : "settings-link"
            }
          >
            <Settings size={18} /> Settings
          </a>
          <div className="local-status">
            <span />
            <div>
              On this device<small>Your learning stays yours.</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            {new Intl.DateTimeFormat("en-IE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </span>
          <div className="actions">
            <button
              className="text-button import-nav"
              onClick={() => navigate("import")}
            >
              <Upload size={16} /> Import
            </button>
            <button
              className="secondary compact"
              onClick={() => {
                setCreating((v) => !v);
                setName("");
              }}
            >
              <Plus size={16} /> New deck
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1} className={study ? "study-main" : ""}>
          {creating && (
            <form className="create-deck" onSubmit={create}>
              <label>
                Name your new deck
                <input
                  autoFocus
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What are you learning?"
                />
              </label>
              <div className="actions">
                <button className="primary" disabled={busy || !name.trim()}>
                  Create deck
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </button>
              </div>
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
                ? "Open the local service with npm run dev to reconnect."
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
                onChange={refresh}
              />
            ) : (
              <div className="empty-inline">
                <h1>Deck not found</h1>
                <button
                  className="secondary"
                  onClick={() => navigate("library")}
                >
                  Back to Library
                </button>
              </div>
            )
          ) : page === "settings" ? (
            <Preferences onChange={refresh} />
          ) : page === "progress" ? (
            <section>
              <div className="page-heading">
                <div>
                  <h1>Small steps add up.</h1>
                  <p>Your actual practice, without the pressure.</p>
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
              <div className="learning-note">
                <Leaf size={23} />
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
                    Read the spacing research <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </section>
          ) : page === "library" ? (
            <section>
              <div className="page-heading">
                <div>
                  <h1>A home for your knowledge.</h1>
                  <p>{data.stats.totalCards} cards, ready to grow with you.</p>
                </div>
              </div>
              <Decks decks={data.decks} search={search} onSearch={setSearch} />
              <div className="library-footer">
                <Upload size={18} />
                <p>Already learning somewhere else?</p>
                <button
                  className="text-button"
                  onClick={() => navigate("import")}
                >
                  Import from Anki or Quizlet <ArrowRight size={15} />
                </button>
              </div>
            </section>
          ) : (
            <section>
              <div className="page-heading">
                <div>
                  <h1>Your daily practice.</h1>
                  <p>A little focus today. More to remember tomorrow.</p>
                </div>
              </div>
              <div className="today-grid">
                <div className="daily-focus">
                  {data.stats.totalCards === 0 ? (
                    <>
                      <div className="focus-symbol">
                        <BookOpen size={24} />
                      </div>
                      <h2>
                        Start with something
                        <br />
                        you want to remember.
                      </h2>
                      <p>
                        Bring your flashcards over, or create a deck of your
                        own. We’ll take care of when to review.
                      </p>
                      <button
                        className="primary"
                        onClick={() => navigate("import")}
                      >
                        Import your cards <ArrowRight size={17} />
                      </button>
                      <button
                        className="sample-link"
                        disabled={busy}
                        onClick={sample}
                      >
                        Or try a 6-card sample deck <ArrowUpRight size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="focus-status" aria-hidden="true">
                        <span />
                        {ready ? "Your next small step" : "All clear for now"}
                      </div>
                      <h2>
                        {ready ? (
                          <>
                            {ready} cards.
                            <br />A little time well spent.
                          </>
                        ) : (
                          <>
                            You’ve made space
                            <br />
                            for remembering.
                          </>
                        )}
                      </h2>
                      <p>
                        {ready
                          ? "Recall, reveal, and let Anki find the right time to revisit. Start with what’s ready today."
                          : "Come back when your cards are due. Your next review will meet you here."}
                      </p>
                      {ready ? (
                        <button
                          className="primary"
                          onClick={() => navigate("study")}
                        >
                          Start studying <ArrowRight size={17} />
                        </button>
                      ) : (
                        <button
                          className="secondary"
                          onClick={() => navigate("library")}
                        >
                          Visit your library <ArrowRight size={17} />
                        </button>
                      )}
                      <span className="focus-footnote">
                        {data.stats.reviewedToday
                          ? `${data.stats.reviewedToday} review${data.stats.reviewedToday === 1 ? "" : "s"} completed today`
                          : "One question at a time. At your own pace."}
                      </span>
                    </>
                  )}
                </div>
                <aside className="week-panel">
                  <div className="section-heading">
                    <h2>This week</h2>
                    <span>Reviews</span>
                  </div>
                  <Week stats={data.stats} />
                  <div className="week-note">
                    <span>
                      {data.stats.days.reduce((n, d) => n + d.count, 0)} reviews
                    </span>
                    <p>
                      {data.stats.days.some((d) => d.count)
                        ? "Every return is another chance to remember."
                        : "Your practice will show up here. No streaks to keep alive."}
                    </p>
                  </div>
                  <div className="quiet-tip">
                    <span className="small-leaf">
                      <Leaf size={17} />
                    </span>
                    <p>Try to recall the answer before you turn the card.</p>
                  </div>
                </aside>
              </div>
              <Decks decks={data.decks} search={search} onSearch={setSearch} />
              <div className="app-footnote">
                <span>
                  <HardDrive size={14} /> Saved locally · Powered by Anki
                </span>
                <button
                  className="text-button"
                  onClick={() => navigate("settings")}
                >
                  Your study preferences <ArrowRight size={14} />
                </button>
              </div>
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
