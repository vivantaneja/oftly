import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Clock } from "lucide-react";
import { cardHTML } from "../lib/html";
import { api, navigate, type Stats } from "../lib/api";
import { deckPath } from "../lib/decks";
type Card = {
  token: string;
  id: string;
  deck: string;
  question: string;
  remaining: number;
  isNew: boolean;
  requiresTypedAnswer?: boolean;
};
type Session = { card: Card | null; canUndo: boolean; stats: Stats };
const labels = [
  ["Again", "Forgot"],
  ["Hard", "Recalled with effort"],
  ["Good", "Recalled"],
  ["Easy", "Recalled effortlessly"],
];
export function CardContent({ html }: { html: string }) {
  return (
    <div
      className="card-content"
      dangerouslySetInnerHTML={{
        __html: cardHTML(html, true),
      }}
    />
  );
}
export default function Study({
  deck,
  onChange,
}: {
  deck?: string;
  onChange: () => void;
}) {
  const [session, setSession] = useState<Session>();
  const [answer, setAnswer] = useState<{
    answer: string;
    intervals: string[];
    extras: { label: string; html: string }[];
    sources: { label: string; html: string }[];
    details: { label: string; html: string }[];
    tags: string[];
    identity: { noteId: string; cardId: string; noteType: string };
  }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const [writing, setWriting] = useState(false);
  const [completed, setCompleted] = useState(0);
  const lock = useRef(false);
  const questionRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const completionRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!session) return;
    const target = !session.card
      ? completionRef.current
      : answer
        ? answerRef.current
        : questionRef.current;
    target?.focus({ preventScroll: true });
  }, [session?.card?.token, answer, !!session]);
  const load = useCallback(async () => {
    setSession(
      await api<Session>("/study/next" + (deck ? "?deck=" + deck : "")),
    );
    setAnswer(undefined);
    setTyped("");
  }, [deck]);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);
  async function action(fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  const reveal = () =>
    action(async () => {
      if (session?.card)
        setAnswer(await api("/study/reveal", { token: session.card.token }));
    });
  const rate = (rating: number) =>
    action(async () => {
      if (!session?.card || !answer) return;
      await api("/study/answer", { token: session.card.token, rating });
      setCompleted((v) => v + 1);
      await load();
      onChange();
    });
  const undo = () =>
    action(async () => {
      await api("/study/undo", {});
      setCompleted((v) => Math.max(0, v - 1));
      await load();
      onChange();
    });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.repeat ||
        (e.target instanceof HTMLElement &&
          e.target.closest("input,textarea,select,[contenteditable=true]"))
      )
        return;
      if (
        e.code === "Space" &&
        !answer &&
        session?.card &&
        !(e.target instanceof HTMLElement && e.target.closest("button,a"))
      ) {
        e.preventDefault();
        void reveal();
      }
      if (answer && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        void rate(Number(e.key));
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  if (!session)
    return (
      <div className="loading" role="status">
        {error || "Preparing your study session…"}
      </div>
    );
  return (
    <section className="study-page" aria-busy={busy}>
      <div className="study-toolbar">
        <button className="text-button" onClick={() => navigate("today")}>
          <ArrowLeft size={17} /> Finish for now
        </button>
        <span>{completed} reviewed this session</span>
        <button
          className="text-button"
          disabled={!session.canUndo || busy}
          onClick={undo}
        >
          <RotateCcw size={16} /> Undo
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error} <button onClick={() => action(load)}>Reload session</button>
        </p>
      )}
      {!session.card ? (
        <div className="session-complete">
          <h1 ref={completionRef} tabIndex={-1}>
            {completed ? "Session complete" : "Nothing due"}
          </h1>
          <p>
            {completed
              ? `You completed ${completed} review${completed === 1 ? "" : "s"}. Your next steps are saved.`
              : "There are no cards ready in this session right now."}
          </p>
          {session.stats.nextLearningAt && (
            <p className="next-review">
              <Clock size={16} /> A learning card returns at{" "}
              {new Date(session.stats.nextLearningAt * 1000).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" },
              )}
              .
            </p>
          )}
          <button className="primary" onClick={() => action(load)}>
            Check for due cards <ArrowRight size={16} />
          </button>
          <button className="text-button" onClick={() => navigate("today")}>
            Back to decks
          </button>
        </div>
      ) : (
        <>
          <div className="study-context">
            <span className="deck-label">{deckPath(session.card.deck)}</span>
            <span>
              {session.card.isNew ? "New card" : "Review"} ·{" "}
              {session.card.remaining} ready in this deck
            </span>
          </div>
          <article className="flashcard">
            <div
              className="question"
              ref={questionRef}
              tabIndex={-1}
              role="region"
              aria-label="Question"
            >
              <CardContent html={session.card.question} />
            </div>
            {answer && (
              <div
                className="answer-reveal"
                ref={answerRef}
                tabIndex={-1}
                role="region"
                aria-label="Answer"
              >
                <span className="field-label answer-label">Answer</span>
                <CardContent html={answer.answer} />
                {answer.extras?.map((entry) => (
                  <div className="card-explanation" key={entry.label}>
                    <span className="field-label">Explanation</span>
                    <CardContent html={entry.html} />
                  </div>
                ))}
                {answer.sources?.length > 0 && (
                  <aside className="card-sources" aria-label="Sources">
                    <span className="field-label">Sources</span>
                    {answer.sources.map((entry) => (
                      <CardContent key={entry.label} html={entry.html} />
                    ))}
                  </aside>
                )}
                {answer.identity && (
                  <details className="card-details">
                    <summary>Card details</summary>
                    <dl>
                      {answer.details.map((entry) => (
                        <div key={entry.label}>
                          <dt>{entry.label}</dt>
                          <dd>
                            <CardContent html={entry.html} />
                          </dd>
                        </div>
                      ))}
                      <div>
                        <dt>Note ID</dt>
                        <dd>{answer.identity.noteId}</dd>
                      </div>
                      <div>
                        <dt>Card ID</dt>
                        <dd>{answer.identity.cardId}</dd>
                      </div>
                      <div>
                        <dt>Note type</dt>
                        <dd>{answer.identity.noteType}</dd>
                      </div>
                      {answer.tags.length > 0 && (
                        <div>
                          <dt>Tags</dt>
                          <dd>{answer.tags.join(", ")}</dd>
                        </div>
                      )}
                    </dl>
                  </details>
                )}
              </div>
            )}
          </article>
          <div className="study-controls">
            {!answer ? (
              <>
                <button
                  className="primary reveal"
                  disabled={busy}
                  onClick={reveal}
                >
                  Show answer <span className="keycap">Space</span>
                </button>
                {!session.card.requiresTypedAnswer && (
                  <button
                    className="text-button"
                    onClick={() => setWriting((v) => !v)}
                  >
                    {writing ? "Hide written attempt" : "Write an answer first"}
                  </button>
                )}
                {(writing || session.card.requiresTypedAnswer) && (
                  <label className="attempt">
                    Your attempt{" "}
                    <textarea
                      rows={3}
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      placeholder="Put it in your own words…"
                    />
                  </label>
                )}
              </>
            ) : (
              <>
                {typed && (
                  <div className="your-answer">
                    <span>Your attempt</span>
                    <p>{typed}</p>
                  </div>
                )}

                <div className="ratings">
                  {labels.map(([title, description], i) => (
                    <button
                      className={"rating rating-" + i}
                      title={description}
                      aria-label={`${title} ${i + 1}: ${description}; ${answer.intervals[i]}`}
                      key={title}
                      disabled={busy}
                      onClick={() => rate(i + 1)}
                    >
                      <span>
                        <b>{title}</b>
                        <kbd>{i + 1}</kbd>
                      </span>

                      <span className="interval">{answer.intervals[i]}</span>
                    </button>
                  ))}
                </div>
                <details className="rating-help quiet-details">
                  <summary>Rating guide</summary>
                  <p>
                    Again: forgot. Hard: recalled with effort. Good: recalled.
                    Easy: recalled effortlessly.
                  </p>
                </details>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
