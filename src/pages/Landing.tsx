import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  Check,
  RotateCcw,
} from "lucide-react";
import { SignIn, useAccount } from "../lib/cloud/auth";
import {
  defaultPlan,
  estimatePlan,
  methodAdvice,
  type StudyPlan,
} from "../lib/plan";
import { savePlan } from "../lib/browser/storage";
import { scheduleSync } from "../lib/cloud/sync";
import "./landing.css";
function Brand() {
  return (
    <a href="#welcome" className="landing-brand" aria-label="Oftly home">
      <img src="/brand/oftly-icon.svg" alt="" />
      <img src="/brand/oftly-wordmark-ink.svg" alt="oftly" />
    </a>
  );
}
type DemoRating = "Again" | "Hard" | "Good" | "Easy";
function MemoryStory({ rating }: { rating: DemoRating | null }) {
  const ref = useRef<HTMLElement>(null),
    reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end end"],
  });
  const pathLength = useTransform(scrollYProgress, [0.05, 0.85], [0.02, 1]);
  const [stage, setStage] = useState(0);
  const cardPosition = useTransform(
    scrollYProgress,
    [0, 0.45, 0.9],
    ["0%", "28%", "62%"],
  );
  const exampleRating = rating ?? "Good";
  const lapsed = exampleRating === "Again";
  useMotionValueEvent(
    scrollYProgress,
    "change",
    (n) => !reduced && setStage(Math.min(2, Math.floor(n * 3))),
  );
  return (
    <section
      className="memory-story"
      id="how-it-works"
      ref={ref}
      aria-labelledby="memory-title"
    >
      <div className="memory-sticky">
        <div className="memory-copy">
          <h2 id="memory-title">
            A useful return.
            <br />A little further apart.
          </h2>
          <p>
            You try to remember. You see the answer. Your rating helps Oftly
            decide when this card should return.
          </p>
        </div>
        <div className="story-card-track">
          <motion.div
            className="story-card"
            style={{ marginLeft: reduced ? 0 : cardPosition }}
          >
            <div className="demo-card-top">
              <span>Spanish · recordar</span>
              <span>
                {
                  [
                    "First encounter",
                    "After your attempt",
                    lapsed ? "Back sooner" : "A later return",
                  ][stage]
                }
              </span>
            </div>
            <p>{stage === 1 ? "To remember." : "What does recordar mean?"}</p>
            <span className="story-card-state">
              {stage === 0
                ? "Try to retrieve the answer."
                : stage === 1
                  ? `Your rating: ${exampleRating}`
                  : "Same question. A fresh retrieval."}
            </span>
          </motion.div>
        </div>
        <div className="graph-top-labels" aria-hidden="true">
          <span>Recall after a review</span>
          <span>Longer gaps as recall strengthens</span>
        </div>
        <svg
          className="memory-graph"
          viewBox="0 0 1000 310"
          preserveAspectRatio="none"
          role="img"
          aria-label="Illustrative memory curves: recall falls between reviews, then rises after each successful retrieval. Later gaps are longer."
        >
          <path className="graph-baseline" d="M30 260H970M30 260V20" />
          <path
            className="graph-forgetting"
            d="M30 45C85 70 100 222 230 235S650 255 970 257"
          />
          <motion.path
            className="graph-recall"
            d="M30 45C80 70 100 170 180 185L180 45C265 45 300 135 450 160L450 45C650 45 780 80 970 105"
            style={{ pathLength: reduced ? 1 : pathLength }}
          />
          <g className="graph-dots">
            <circle cx="180" cy="45" r="7" />
            <circle cx="450" cy="45" r="7" />
          </g>
        </svg>
        <div className="graph-time-labels" aria-hidden="true">
          <span>First try</span>
          <span>Return</span>
          <span>Time passes →</span>
        </div>
        <p className="graph-caption">
          The same sample card, after successful returns. This curve is
          illustrative, not your recall data.{" "}
          {lapsed
            ? "An Again rating brings a card back sooner to relearn."
            : "Your actual intervals depend on your reviews."}
        </p>
        <div className="story-steps">
          {[
            [
              "Try before you turn.",
              "Try to retrieve the answer before revealing it. Then compare your attempt with the card.",
            ],
            [
              "Tell it how that went.",
              "Again, Hard, Good or Easy. Each review updates an estimate of this card’s difficulty and how long its memory may last.",
            ],
            [
              "Come back when it matters.",
              "FSRS-6 uses that estimate to schedule a return. Stronger recall can earn a longer gap; a lapse brings a card back sooner.",
            ],
          ].map(([title, body], i) => (
            <article key={title} className={stage === i ? "current" : ""}>
              <h3>
                <button aria-pressed={stage === i} onClick={() => setStage(i)}>
                  {title}
                </button>
              </h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
function PlanBuilder() {
  const { session } = useAccount(),
    heading = useRef<HTMLHeadingElement>(null);
  const [plan, setPlan] = useState<StudyPlan>(() => {
    try {
      return {
        ...defaultPlan,
        ...JSON.parse(sessionStorage.getItem("oftly-onboarding") ?? "{}"),
      };
    } catch {
      return defaultPlan;
    }
  });
  const [step, setStep] = useState(0),
    [error, setError] = useState("");
  const estimate = estimatePlan(plan);
  const update = (change: Partial<StudyPlan>) =>
    setPlan((value) => ({ ...value, ...change }));
  useEffect(() => {
    if (step > 0) heading.current?.focus();
  }, [step]);
  function next() {
    sessionStorage.setItem("oftly-onboarding", JSON.stringify(plan));
    setStep((n) => n + 1);
  }
  const finish = async () => {
    setError("");
    try {
      await savePlan(plan);
      scheduleSync(0);
      location.hash = "today";
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <section
      className="plan-section"
      id="study-plan"
      aria-labelledby="plan-title"
    >
      <div className="plan-intro">
        <h2 id="plan-title">
          Make room <br />
          for remembering.
        </h2>
        <p>A few questions. A starting rhythm you can change.</p>
        <p className="plan-privacy">
          Your answers stay in this browser until you choose to save them to an
          account.
        </p>
      </div>
      <div className="plan-builder">
        {step < 4 ? (
          <>
            <div
              className="plan-progress"
              aria-label={`Question ${step + 1} of 4`}
            >
              {[0, 1, 2, 3].map((n) => (
                <span key={n} className={n <= step ? "complete" : ""} />
              ))}
              <span>{step + 1} of 4</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              <h3 ref={heading} tabIndex={-1}>
                {
                  [
                    "What are you studying?",
                    "What does studying look like now?",
                    "What fits into an ordinary day?",
                    "Give your plan a horizon.",
                  ][step]
                }
              </h3>
              {step === 0 && (
                <>
                  <label htmlFor="study-subject">Subject or goal</label>
                  <input
                    id="study-subject"
                    required
                    maxLength={80}
                    placeholder="Biology, Spanish, a professional exam…"
                    value={plan.subject}
                    onChange={(e) => update({ subject: e.target.value })}
                  />
                  <div className="subject-options">
                    {["Biology", "Languages", "Medicine", "Something else"].map(
                      (subject) => (
                        <button
                          className="secondary"
                          type="button"
                          key={subject}
                          onClick={() =>
                            update({
                              subject:
                                subject === "Something else" ? "" : subject,
                            })
                          }
                        >
                          {subject}
                        </button>
                      ),
                    )}
                  </div>
                </>
              )}
              {step === 1 && (
                <fieldset className="method-options">
                  <legend className="sr-only">Your main study method</legend>
                  {(
                    [
                      ["rereading", "Reading it again"],
                      ["notes", "Writing notes or summaries"],
                      ["flashcards", "Using flashcards"],
                      ["practice", "Working through questions"],
                    ] as const
                  ).map(([id, label]) => (
                    <label key={id}>
                      <input
                        type="radio"
                        name="method"
                        value={id}
                        checked={plan.method === id}
                        onChange={() => update({ method: id })}
                      />
                      <span>{label}</span>
                      {plan.method === id && <Check size={18} />}
                    </label>
                  ))}
                </fieldset>
              )}
              {step === 2 && (
                <>
                  <div className="time-value">
                    <output htmlFor="study-minutes">{plan.minutes}</output>
                    <span>minutes a day</span>
                  </div>
                  <label htmlFor="study-minutes">Daily study time</label>
                  <input
                    id="study-minutes"
                    type="range"
                    min="5"
                    max="45"
                    step="5"
                    value={plan.minutes}
                    onChange={(e) =>
                      update({ minutes: Number(e.target.value) })
                    }
                  />
                  <div className="range-labels">
                    <span>5 minutes</span>
                    <span>45 minutes</span>
                  </div>
                  <p>
                    Include time for both new cards and reviews. You can change
                    this budget later.
                  </p>
                </>
              )}
              {step === 3 && (
                <>
                  <label htmlFor="study-weeks">
                    Weeks until your goal or next check-in
                  </label>
                  <select
                    id="study-weeks"
                    value={plan.weeks}
                    onChange={(e) => update({ weeks: Number(e.target.value) })}
                  >
                    {[2, 4, 8, 12, 16].map((n) => (
                      <option key={n} value={n}>
                        {n} weeks
                      </option>
                    ))}
                  </select>
                  <label htmlFor="study-cards">
                    Approximate number of cards
                  </label>
                  <input
                    id="study-cards"
                    type="number"
                    required
                    min={10}
                    max={10000}
                    step={10}
                    value={plan.cards}
                    onChange={(e) => update({ cards: Number(e.target.value) })}
                  />
                  <p className="hint left">
                    Not sure yet? Keep 300 as an example and adjust it later. A
                    card should test one idea.
                  </p>
                </>
              )}
              <div className="plan-navigation">
                {step > 0 && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setStep((n) => n - 1)}
                  >
                    <ArrowLeft size={17} /> Back
                  </button>
                )}
                <button className="primary">
                  {step === 3 ? "See my study rhythm" : "Continue"}{" "}
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 ref={heading} tabIndex={-1}>
              {plan.subject || "Your subject"}, in {estimate.minutes}-minute
              returns.
            </h3>
            <p>{methodAdvice[plan.method]}</p>
            <div
              className="rhythm-strip"
              aria-label={`${estimate.newMinutes} minutes for new cards and ${estimate.reviewMinutes} minutes for reviews`}
            >
              <span style={{ flex: estimate.newMinutes }}>
                {estimate.newMinutes} min
                <br />
                <b>New ideas</b>
              </span>
              <span style={{ flex: estimate.reviewMinutes }}>
                {estimate.reviewMinutes} min
                <br />
                <b>Return to cards</b>
              </span>
            </div>
            <p className="plan-insight">
              That’s{" "}
              <strong>
                {Math.floor(estimate.weeklyMinutes / 60)
                  ? `${Math.floor(estimate.weeklyMinutes / 60)}h `
                  : ""}
                {estimate.weeklyMinutes % 60
                  ? `${estimate.weeklyMinutes % 60}m`
                  : ""}
              </strong>{" "}
              across a week, built from short sessions.
            </p>
            <div className="plan-projection">
              <h4>A first pass, with space to return.</h4>
              <p>
                Budgeting {estimate.newMinutes} minutes for new cards gives
                roughly{" "}
                <strong>
                  {estimate.low}–{estimate.high} new cards a day
                </strong>
                . A first pass through {estimate.cards} cards would take around{" "}
                <strong>
                  {estimate.fastDays}–{estimate.slowDays} study days
                </strong>
                .
              </p>
              <p>
                {estimate.fastDays > estimate.deadlineDays
                  ? "Your current card count is bigger than this time budget comfortably allows. Start with the most useful ideas or extend the horizon."
                  : estimate.slowDays > estimate.deadlineDays
                    ? "Your chosen horizon falls inside that range. Prioritise the most useful cards and check your pace after a week."
                    : "Your horizon leaves some room beyond a first pass. Keep returning to older cards instead of filling every session with new ones."}
              </p>
            </div>
            <details className="plan-assumptions">
              <summary>How this estimate works</summary>
              <p>
                This is a time budget, not a prediction of memory, mastery or
                grades. It assumes daily study, 45–90 seconds per new card and{" "}
                {estimate.reviewMinutes} minutes reserved for returns. Writing
                cards, missed days and harder material take extra time. Your
                actual review queue may need more time; reduce new cards when it
                does. No personal recall data has been measured yet.
              </p>
            </details>
            <button className="text-button" onClick={() => setStep(0)}>
              <RotateCcw size={16} /> Change my answers
            </button>
            {session ? (
              <div className="plan-save">
                <button className="primary" onClick={finish}>
                  Save my rhythm and open Oftly <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <SignIn onGuest={finish} />
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
export default function Landing() {
  const [demoRating, setDemoRating] = useState<DemoRating | null>(null);
  const [revealed, setRevealed] = useState(false),
    reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const rotation = useTransform(scrollYProgress, [0, 0.7], [-3, 0]),
    y = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const timelineProgress = useTransform(scrollYProgress, [0, 0.65], [0.1, 1]);
  function toPlan() {
    document
      .getElementById("study-plan")
      ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  }
  return (
    <div className="landing">
      <a
        href="#study-plan"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          toPlan();
          document
            .querySelector<HTMLInputElement>("#study-subject")
            ?.focus({ preventScroll: true });
        }}
      >
        Skip to study planner
      </a>
      <header className="landing-header">
        <Brand />
        <nav aria-label="Introduction">
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
            }}
          >
            How it works
          </a>
          <a href="#account">
            Sign in <ArrowRight size={16} />
          </a>
        </nav>
      </header>
      <main>
        <section className="landing-hero" ref={heroRef}>
          <h1>
            One card.
            <br />A longer-lasting memory.
          </h1>
          <p>
            Oftly brings it back when it’s useful.
            <br />
            You bring a few minutes.
          </p>
          <button className="primary hero-action" onClick={toPlan}>
            Find my study rhythm <ArrowRight size={18} />
          </button>
          <motion.div
            className="hero-card"
            style={{ rotate: reduced ? 0 : rotation, y: reduced ? 0 : y }}
          >
            <div className="demo-card-top">
              <span>Spanish</span>
              <span>A sample card</span>
            </div>
            <div className="demo-question">
              What does <em>recordar</em> mean?
            </div>
            <div className="demo-answer" aria-live="polite">
              {demoRating ? (
                <span className="demo-return">
                  Rated {demoRating}. This card will return{" "}
                  {demoRating === "Again" ? "sooner" : "after a gap"}.
                </span>
              ) : revealed ? (
                <>
                  <span>To remember.</span>
                </>
              ) : (
                <button className="secondary" onClick={() => setRevealed(true)}>
                  Try to recall. Then reveal.
                </button>
              )}
            </div>
            {revealed && !demoRating && (
              <div className="demo-ratings" aria-label="Rate the sample card">
                {(["Again", "Hard", "Good", "Easy"] as const).map((rating) => (
                  <button
                    className="secondary"
                    key={rating}
                    onClick={() => setDemoRating(rating)}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            )}
            {demoRating && (
              <button
                className="text-button"
                onClick={() => {
                  setDemoRating(null);
                  setRevealed(false);
                }}
              >
                <RotateCcw size={15} /> Try the sample again
              </button>
            )}
          </motion.div>
          <div
            className="hero-timeline"
            aria-label="Illustrative review timeline"
          >
            <motion.div
              className="timeline-progress"
              style={{ scaleX: reduced || demoRating ? 1 : timelineProgress }}
            />
            <span>
              <i />
              First encounter
            </span>
            <span>
              <i />
              Recall & rate
            </span>
            <span>
              <i />A later return
            </span>
          </div>
          <p className="scroll-invite">
            <ArrowDown size={17} /> Follow the return
          </p>
        </section>
        <MemoryStory rating={demoRating} />
        <section className="landing-bridge">
          <h2>
            Bring your cards.
            <br />
            Keep their sources.
          </h2>
          <div>
            <p>
              Start with your Anki decks, a Quizlet text export, or a question
              of your own. Keep sources and explanations close. Leave custom
              card clutter behind.
            </p>
            <p>
              We built Oftly during our study period because we wanted Anki’s
              scheduling with a simpler place to use it.
            </p>
            <a
              href="https://github.com/vivantaneja/oftly/blob/main/docs/LEARNING-RESEARCH.md"
              target="_blank"
              rel="noreferrer"
            >
              Read the research and its limits <ArrowRight size={16} />
            </a>
          </div>
        </section>
        <PlanBuilder />
      </main>
      <footer className="landing-footer">
        <Brand />
        <p>A little, often.</p>
        <div>
          <a href="#today">Open the study app</a>
          <a href="/privacy.html">Privacy & data</a>
          <a
            href="https://github.com/vivantaneja/oftly"
            target="_blank"
            rel="noreferrer"
          >
            Open source
          </a>
        </div>
      </footer>
    </div>
  );
}
export { Brand };
