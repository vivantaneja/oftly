import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  GraduationCap,
  School,
} from "lucide-react";
import { SignIn, useAccount } from "../lib/cloud/auth";
import {
  estimatePlan,
  formatDuration,
  methodAdvice,
  studyContexts,
  type StudyContext,
  type StudyMethod,
  type StudyPlan,
} from "../lib/plan";
import { savePlan } from "../lib/browser/storage";
import { scheduleSync } from "../lib/cloud/sync";
import "./landing.css";

function RecallStory({ missed }: { missed: boolean }) {
  const returnAt = missed ? 100 : 250;
  const path = missed
    ? "M12 18C32 25 55 76 100 82V18C175 18 235 58 348 67"
    : "M12 18C65 18 115 65 250 82V18C285 18 318 24 348 29";
  return (
    <section className="recall-story" aria-labelledby="recall-story-title">
      <div>
        <h2 id="recall-story-title">A useful return.</h2>
        <p role="status">
          {missed
            ? "Oftly brings missed cards back sooner."
            : "As recall gets stronger, Oftly spaces reviews further apart."}
        </p>
      </div>
      <figure>
        <div className="recall-marker" aria-hidden="true">
          <span
            style={{
              left: `clamp(5ch, ${(returnAt / 360) * 100}%, calc(100% - 5ch))`,
            }}
          >
            Next review
          </span>
        </div>
        <svg
          viewBox="0 0 360 108"
          role="img"
          aria-label={
            missed
              ? "Illustration: a missed card has a shorter gap before its next review."
              : "Illustration: a remembered card has a longer gap before its next review."
          }
        >
          <path className="recall-baseline" d="M12 100H348" />
          <path
            className="recall-fade"
            d="M12 18C65 45 80 91 150 94S280 99 348 99"
          />
          <path className="recall-path" d={path} pathLength="1" />
          <circle className="recall-dot" cx={returnAt} cy="18" r="5" />
        </svg>
        <div className="recall-axis" aria-hidden="true">
          <span>Now</span>
          <span>
            Time <ArrowRight size={14} />
          </span>
        </div>
        <figcaption>Illustrative gaps. Your reviews set the timing.</figcaption>
      </figure>
    </section>
  );
}
function Brand() {
  return (
    <a href="#welcome" className="landing-brand" aria-label="Oftly home">
      <img src="/brand/oftly-icon.svg" alt="" />
      <img src="/brand/oftly-wordmark-ink.svg" alt="oftly" />
    </a>
  );
}
type Flow = {
  step: number;
  context: StudyContext | null;
  method: StudyMethod | null;
  hours: string;
  minutes: string;
  demo: "question" | "answer" | "again" | "good";
};
const initial: Flow = {
  step: 0,
  context: null,
  method: null,
  hours: "1",
  minutes: "0",
  demo: "question",
};
function readFlow(): Flow {
  try {
    const saved = JSON.parse(sessionStorage.getItem("oftly-setup") ?? "null");
    if (
      !saved ||
      !Number.isInteger(saved.step) ||
      saved.step < 0 ||
      saved.step > 5
    )
      return initial;
    const context = Object.hasOwn(studyContexts, saved.context)
      ? (saved.context as StudyContext)
      : null;
    const method = ["notes", "flashcards", "practice"].includes(saved.method)
      ? (saved.method as StudyMethod)
      : null;
    return {
      ...initial,
      step: Math.min(saved.step, !context ? 1 : !method ? 2 : 5),
      context,
      method,
      hours: typeof saved.hours === "string" ? saved.hours : "1",
      minutes: typeof saved.minutes === "string" ? saved.minutes : "0",
      demo: ["question", "answer", "again", "good"].includes(saved.demo)
        ? saved.demo
        : "question",
    };
  } catch {
    return initial;
  }
}
export default function Landing() {
  const { session } = useAccount();
  const [flow, setFlow] = useState(readFlow);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const update = (value: Partial<Flow>) => {
    setError("");
    setFlow((old) => ({ ...old, ...value }));
  };
  const total = Number(flow.hours) * 60 + Number(flow.minutes);
  const validTime =
    flow.hours !== "" &&
    flow.minutes !== "" &&
    Number.isInteger(Number(flow.hours)) &&
    Number.isInteger(Number(flow.minutes)) &&
    Number(flow.hours) >= 0 &&
    Number(flow.minutes) >= 0 &&
    Number(flow.minutes) < 60 &&
    total >= 5 &&
    total <= 1440;
  const plan: StudyPlan = {
    version: 2,
    context: flow.context ?? "school",
    method: flow.method ?? "notes",
    minutes: total,
  };
  const estimate = estimatePlan(plan);
  useEffect(() => {
    try {
      sessionStorage.setItem("oftly-setup", JSON.stringify(flow));
    } catch {
      /* A draft is optional; saving the completed plan reports errors. */
    }
  }, [flow]);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [flow.step]);
  function result() {
    if (!validTime) {
      setError("Choose a total between 5 minutes and 24 hours.");
      return;
    }
    update({ step: 4 });
  }
  async function finish() {
    if (busy) return;
    if (!validTime || !flow.context || !flow.method) {
      setError("Go back and complete your study plan first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await savePlan(plan);
      sessionStorage.removeItem("oftly-onboarding");
      sessionStorage.removeItem("oftly-setup");
      scheduleSync(0);
      location.hash = "today";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function account() {
    if (session) {
      void finish();
      return;
    }
    try {
      sessionStorage.setItem("oftly-onboarding", JSON.stringify(plan));
      update({ step: 5 });
    } catch {
      setError(
        "Your browser couldn’t save this plan. Allow site storage, then try again.",
      );
    }
  }
  function back() {
    sessionStorage.removeItem("oftly-onboarding");
    update({ step: Math.max(0, flow.step - 1) });
  }
  const labels = ["Try a card", "Your studies", "Your method", "Daily time"];
  return (
    <div className={`setup-page ${flow.step === 0 ? "setup-welcome" : ""}`}>
      <header className="setup-header">
        <Brand />
        <a href="#account">
          Sign in <ArrowRight size={16} aria-hidden="true" />
        </a>
      </header>
      <main className="setup-main" id="setup-main">
        <div className="setup-screen" key={flow.step}>
          {flow.step === 0 && (
            <>
              <div className="welcome-intro">
                <h1 ref={heading} tabIndex={-1}>
                  One card.
                  <br />A longer-lasting memory.
                </h1>
                <p className="setup-lead">
                  Flashcards that adapt to what you remember.
                </p>
              </div>
              <div className="setup-demo">
                <span className="setup-sample-label">Sample card</span>
                <p className="setup-question">
                  What is the largest ocean on Earth?
                </p>
                {flow.demo === "question" ? (
                  <button
                    className="primary"
                    onClick={() => update({ demo: "answer" })}
                  >
                    Reveal answer <ArrowRight size={17} aria-hidden="true" />
                  </button>
                ) : (
                  <>
                    <p className="setup-answer" role="status">
                      The Pacific Ocean.
                    </p>
                    {flow.demo === "answer" ? (
                      <>
                        <p className="setup-rating-label">
                          Did you remember it?
                        </p>
                        <div className="setup-ratings">
                          <button
                            className="secondary"
                            onClick={() => update({ demo: "again" })}
                          >
                            I missed it
                          </button>
                          <button
                            className="primary"
                            onClick={() => update({ demo: "good" })}
                          >
                            I remembered
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="setup-response">
                        {flow.demo === "again"
                          ? "Your response: I missed it"
                          : "Your response: I remembered"}
                      </p>
                    )}
                  </>
                )}
              </div>
              {(flow.demo === "again" || flow.demo === "good") && (
                <>
                  <RecallStory missed={flow.demo === "again"} />
                  <button
                    className="primary setup-next"
                    onClick={() => update({ step: 1 })}
                  >
                    Set up my study plan{" "}
                    <ArrowRight size={17} aria-hidden="true" />
                  </button>
                </>
              )}
            </>
          )}
          {flow.step === 1 && (
            <>
              <h1 ref={heading} tabIndex={-1}>
                Where are you studying?
              </h1>
              <div className="setup-choices" aria-label="Study setting">
                {(
                  [
                    ["school", School],
                    ["college", GraduationCap],
                    ["independent", BookOpen],
                  ] as const
                ).map(([value, Icon]) => (
                  <button
                    key={value}
                    onClick={() => update({ context: value, step: 2 })}
                  >
                    <Icon size={21} aria-hidden="true" />
                    <span>{studyContexts[value]}</span>
                    {flow.context === value ? (
                      <Check size={18} aria-hidden="true" />
                    ) : (
                      <ArrowRight size={18} aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
          {flow.step === 2 && (
            <>
              <h1 ref={heading} tabIndex={-1}>
                How do you usually study?
              </h1>
              <div className="setup-choices" aria-label="Current study method">
                {(
                  [
                    ["notes", "Reading and notes"],
                    ["flashcards", "Flashcards"],
                    ["practice", "Practice questions"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => update({ method: value, step: 3 })}
                  >
                    <span>{label}</span>
                    {flow.method === value ? (
                      <Check size={18} aria-hidden="true" />
                    ) : (
                      <ArrowRight size={18} aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
          {flow.step === 3 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                result();
              }}
            >
              <h1 ref={heading} tabIndex={-1}>
                How much do you study each day?
              </h1>
              <p className="setup-lead">
                Your usual total, including reading and practice.
              </p>
              <div className="setup-time">
                <label htmlFor="study-hours">
                  <input
                    id="study-hours"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="24"
                    step="1"
                    required
                    value={flow.hours}
                    onChange={(e) => update({ hours: e.target.value })}
                  />
                  Hours
                </label>
                <span aria-hidden="true">:</span>
                <label htmlFor="study-minutes">
                  <input
                    id="study-minutes"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="59"
                    step="1"
                    required
                    value={flow.minutes}
                    onChange={(e) => update({ minutes: e.target.value })}
                  />
                  Minutes
                </label>
              </div>
              <button className="primary setup-next">
                See my plan <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
          )}
          {flow.step === 4 && (
            <>
              <h1 ref={heading} tabIndex={-1}>
                A plan for your study day.
              </h1>
              <p className="setup-lead">
                {studyContexts[plan.context]} ·{" "}
                {formatDuration(estimate.minutes)} a day
              </p>
              <dl className="setup-plan">
                <div>
                  <dt>Flashcard recall</dt>
                  <dd>
                    {estimate.sessions === 1
                      ? `${estimate.sessionMinutes} minutes`
                      : `${estimate.sessions} × ${estimate.sessionMinutes} minutes`}
                  </dd>
                </div>
                {estimate.otherMinutes > 0 && (
                  <div>
                    <dt>Other study & breaks</dt>
                    <dd>{formatDuration(estimate.otherMinutes)}</dd>
                  </div>
                )}
              </dl>
              <p className="setup-advice">{methodAdvice[plan.method]}</p>
              <details className="setup-assumptions">
                <summary>How this plan works</summary>
                <p>
                  This is a suggested starting split, not a learning prediction
                  or a study limit. It sets aside one 5–15 minute card session
                  per two hours of total study, rounded up. Follow your due
                  queue and adjust as you go.
                </p>
              </details>
              <button
                className="primary setup-next"
                disabled={busy}
                onClick={account}
              >
                {busy
                  ? "Saving…"
                  : session
                    ? "Save plan and open Oftly"
                    : "Use this plan"}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </>
          )}
          {flow.step === 5 && (
            <>
              <h1 className="sr-only" ref={heading} tabIndex={-1}>
                Save your study plan
              </h1>
              <SignIn onGuest={finish} />
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        <nav className="setup-navigation" aria-label="Setup steps">
          {flow.step > 0 ? (
            <button className="text-button" disabled={busy} onClick={back}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </button>
          ) : (
            <span />
          )}
          {flow.step < 4 ? (
            <span className="setup-step-count">
              {flow.step + 1} of 4 · {labels[flow.step]}
            </span>
          ) : (
            <span className="setup-step-count">
              {flow.step === 4 ? "Your plan" : "Save your plan"}
            </span>
          )}
        </nav>
        <div className="setup-progress" aria-hidden="true">
          {labels.map((label, i) => (
            <span key={label} className={flow.step >= i ? "complete" : ""} />
          ))}
        </div>
      </main>
      <footer className="setup-footer">
        <a href="/privacy.html">Privacy</a>
        <a
          href="https://github.com/vivantaneja/oftly/blob/main/docs/LEARNING-RESEARCH.md"
          target="_blank"
          rel="noreferrer"
        >
          The research
        </a>
      </footer>
    </div>
  );
}
export { Brand };
