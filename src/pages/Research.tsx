import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import type { Grade } from "ts-fsrs";
import { schedulerFor, type Memory } from "../lib/browser/types";
import "./research.css";

const papers = {
  retrieval:
    "https://learninglab.psych.purdue.edu/downloads/2006/2006_Roediger_Karpicke_PsychSci.pdf",
  spacing: "https://pubmed.ncbi.nlm.nih.gov/16719566/",
  feedback:
    "https://learninglab.psych.purdue.edu/downloads/2008/2008_Butler_Karpicke_Roediger_JEPLMC.pdf",
  classroom: "https://pubmed.ncbi.nlm.nih.gov/33683913/",
  anki: "https://docs.ankiweb.net/manual/deck-options",
};
function Source({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a className="research-source" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowRight size={12} aria-hidden="true" />
    </a>
  );
}
const results = [
  { delay: "5 minutes", restudy: 81, retrieval: 75 },
  { delay: "2 days", restudy: 54, retrieval: 68 },
  { delay: "1 week", restudy: 42, retrieval: 56 },
];
function RetrievalResults() {
  const [selected, setSelected] = useState(2);
  const result = results[selected];
  return (
    <figure className="retrieval-results">
      <div className="research-figure-heading">
        <h3>What was remembered later?</h3>
        <div
          className="research-horizons"
          role="group"
          aria-label="Time until the final test"
        >
          {results.map(({ delay }, i) => (
            <button
              key={delay}
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
            >
              {delay}
            </button>
          ))}
        </div>
      </div>
      <div
        className="research-bars"
        aria-label={`After ${result.delay}: restudy ${result.restudy} percent, retrieval practice ${result.retrieval} percent.`}
      >
        {[
          ["Restudy", result.restudy],
          ["Retrieval practice", result.retrieval],
        ].map(([name, value], i) => (
          <div className={`research-bar-row bar-${i}`} key={name}>
            <div>
              <span>{name}</span>
              <strong>{value}%</strong>
            </div>
            <div className="research-bar-track">
              <span style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <figcaption>
        <p aria-live="polite">
          {selected === 0
            ? "Rereading helped more on the immediate test. Feeling fluent now is not the same as remembering later."
            : "Trying to recall the passage led to more remembered ideas on the delayed test."}
        </p>
        <span>
          Mean proportion of ideas recalled in one prose-learning experiment.
          These are study results, not a comparison of flashcard apps.
        </span>
        <Source href={papers.retrieval}>
          Roediger & Karpicke, 2006 · Experiment 1
        </Source>
      </figcaption>
    </figure>
  );
}
function SpacingFigure() {
  const figure = useRef<HTMLElement>(null);
  const line = useRef<SVGPathElement>(null);
  const marker = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const element = figure.current!,
      path = line.current!,
      dot = marker.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const length = path.getTotalLength();
    const draw = () => {
      frame = 0;
      const box = element.getBoundingClientRect();
      const progress = reduced.matches
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              (innerHeight * 0.85 - box.top) / (box.height + innerHeight * 0.2),
            ),
          );
      path.style.strokeDashoffset = String(1 - progress);
      const point = path.getPointAtLength(length * progress);
      dot.setAttribute("cx", String(point.x));
      dot.setAttribute("cy", String(point.y));
    };
    const update = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    reduced.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      reduced.removeEventListener("change", update);
    };
  }, []);
  return (
    <figure ref={figure} className="spacing-explainer">
      <div className="spacing-legend">
        <span>With successful reviews</span>
        <span>No further review</span>
      </div>
      <svg
        viewBox="0 0 960 260"
        role="img"
        aria-label="Illustration: successful reviews make memory more durable. Later dips are shallower and the gaps between reviews grow."
      >
        <path className="spacing-guide" d="M20 240H940" />
        <path
          className="spacing-forgetting"
          d="M20 25C40 70 65 150 110 175C160 215 200 227 300 233S750 239 940 239"
        />
        <path
          ref={line}
          className="spacing-return"
          pathLength="1"
          d="M20 25C40 70 65 150 110 175L110 25C160 55 220 100 300 115L300 25C385 45 485 70 590 75L590 25C705 29 835 46 940 50"
        />
        <circle
          ref={marker}
          className="spacing-marker"
          r="7"
          cx="940"
          cy="50"
        />
      </svg>
      <div className="spacing-labels" aria-hidden="true">
        <span>Learn</span>
        <span>Recall</span>
        <span>Return later</span>
        <span>A longer gap</span>
      </div>
      <figcaption>
        Memory can last longer between successful reviews. Illustrative curves,
        not measured recall probabilities or prescribed intervals.
      </figcaption>
    </figure>
  );
}
const grades = ["Again", "Hard", "Good", "Easy"];
const meanings = [
  "Forgot",
  "Remembered with effort",
  "Remembered",
  "Remembered effortlessly",
];
const start = new Date("2026-01-01T12:00:00Z");
type Scheduler = Awaited<ReturnType<typeof schedulerFor>>;
function interval(seconds: number) {
  const [amount, unit] =
    seconds < 3600
      ? [Math.max(1, Math.round(seconds / 60)), "minute"]
      : seconds < 86400
        ? [Math.round(seconds / 3600), "hour"]
        : [Math.round(seconds / 86400), "day"];
  return `${amount} ${unit}${amount === 1 ? "" : "s"}`;
}
function SchedulerDemo() {
  const [scheduler, setScheduler] = useState<Scheduler>();
  const [simulation, setSimulation] = useState<{
    card: Memory;
    now: Date;
    count: number;
    message: string;
  }>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    schedulerFor(0.9)
      .then((engine) => {
        if (!active) return;
        setScheduler(engine);
        setSimulation({
          card: engine.newCard({ now: start, cardId: "research-demo" }),
          now: start,
          count: 0,
          message: "A new card. Choose how well you remembered it.",
        });
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  function reset() {
    if (scheduler)
      setSimulation({
        card: scheduler.newCard({ now: start, cardId: "research-demo" }),
        now: start,
        count: 0,
        message: "A new card. Choose how well you remembered it.",
      });
  }
  function rate(grade: Grade) {
    if (!scheduler || !simulation) return;
    const result = scheduler.review({
      card: simulation.card,
      grade,
      now: simulation.now,
    });
    const seconds =
      (result.card.dueAt.getTime() - simulation.now.getTime()) / 1000;
    setSimulation({
      card: result.card,
      now: result.card.dueAt,
      count: simulation.count + 1,
      message: `${grades[grade - 1]}: next review in ${interval(seconds)}. Time has advanced to that review.`,
    });
  }
  return (
    <div className="scheduler-demo">
      <div className="scheduler-demo-top">
        <h3>Try the timing</h3>
        <button
          className="text-button"
          onClick={reset}
          disabled={!simulation || simulation.count === 0}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reset
        </button>
      </div>
      {error ? (
        <p role="alert">
          The demo couldn’t load.{" "}
          <button
            onClick={() => {
              setError(false);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </button>
        </p>
      ) : (
        <>
          <p className="scheduler-result" role="status">
            {simulation?.message ?? "Loading the scheduler…"}
          </p>
          <div
            className="research-ratings"
            role="group"
            aria-label="Rate this simulated review"
          >
            {grades.map((grade, i) => (
              <button
                key={grade}
                disabled={!simulation}
                title={meanings[i]}
                onClick={() => rate((i + 1) as Grade)}
              >
                {grade}
              </button>
            ))}
          </div>
          <p className="research-caption">
            {simulation?.count ?? 0} simulated reviews · 90% desired retention
          </p>
          <p className="research-caption">
            Each click answers at the next due time. This uses Oftly’s browser
            scheduler with default parameters. It does not change your cards.
          </p>
        </>
      )}
    </div>
  );
}
export default function Research() {
  return (
    <div className="research-page">
      <header className="research-header">
        <a href="#welcome" className="landing-brand" aria-label="Oftly home">
          <img src="/brand/oftly-icon.svg" alt="" />
          <img src="/brand/oftly-wordmark-ink.svg" alt="oftly" />
        </a>
        <a href="#welcome">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Oftly
        </a>
      </header>
      <main id="research-content">
        <div className="research-intro">
          <h1>
            Make it stick.
            <br />
            <span>Here’s the science.</span>
          </h1>
          <p>
            Remembering isn’t just about more time with the page. It’s about
            what you do, and when you return.
          </p>
        </div>
        <section className="research-chapter" aria-labelledby="retrieval-title">
          <div className="research-lead">
            <h2 id="retrieval-title">
              Close the notes.
              <br />
              Try to remember.
            </h2>
            <p>
              Rereading can feel reassuring. Retrieving an answer asks memory to
              do the work you’ll need later. The difference becomes clearer with
              time.
            </p>
          </div>
          <RetrievalResults />
        </section>
        <section className="research-chapter" aria-labelledby="spacing-title">
          <div className="research-lead">
            <h2 id="spacing-title">Let a little time pass.</h2>
            <div>
              <p>
                Space your attempts across time. The useful gap depends on how
                long you want to remember. There is no universal “perfect
                interval” for every card and person.
              </p>
              <Source href={papers.spacing}>
                Cepeda et al., 2006 · spacing meta-analysis
              </Source>
            </div>
          </div>
          <SpacingFigure />
          <p className="research-afterword">
            Oftly uses your review history to decide when each card returns.
            Remember it comfortably and the gap can grow. Forget it and it comes
            back sooner.
          </p>
        </section>
        <section
          className="research-chapter research-feedback"
          aria-labelledby="feedback-title"
        >
          <div>
            <h2 id="feedback-title">
              An attempt needs
              <br />
              an answer.
            </h2>
            <p>
              Check what you recalled, then correct it. Feedback can help after
              a mistake and even after a correct answer you weren’t sure about.
            </p>
            <Source href={papers.feedback}>
              Butler et al., 2008 · feedback and confidence
            </Source>
          </div>
          <div className="feedback-example">
            <span className="research-caption">Try this before revealing</span>
            <p>Which ocean is the largest?</p>
            <details>
              <summary>Show the answer</summary>
              <div>
                <strong>The Pacific Ocean.</strong>
                <p>
                  Compare it with your attempt. In Oftly, explanations and
                  sources stay with the answer, so you can understand a mistake
                  before rating it.
                </p>
              </div>
            </details>
          </div>
        </section>
        <section className="research-chapter" aria-labelledby="engine-title">
          <div className="research-lead">
            <h2 id="engine-title">
              Your history sets
              <br />
              the next return.
            </h2>
            <p>
              FSRS models a card’s difficulty, how stable its memory is, and the
              chance you’ll recall it. After a review, it updates that estimate
              and chooses a new due time.
            </p>
          </div>
          <div className="research-engine">
            <SchedulerDemo />
            <div className="engine-explanation">
              <h3>Adaptive, not a fixed ladder.</h3>
              <p>
                A simple schedule might always use the same gaps. FSRS responds
                to your ratings and the time between reviews. Oftly’s browser
                edition uses FSRS-6, the same algorithm family supported by
                modern Anki.
              </p>
              <p>
                90% is a scheduling target, not a promise that you’ll remember
                90% of everything. Short learning steps bring new and missed
                cards back within a session.
              </p>
              <Source href={papers.anki}>
                Anki manual · FSRS and desired retention
              </Source>
            </div>
          </div>
        </section>
        <section
          className="research-chapter research-comparison"
          aria-labelledby="comparison-title"
        >
          <h2 id="comparison-title">What makes it Oftly?</h2>
          <p>
            We built a calmer way to use these ideas. Anki already offers
            powerful spaced repetition; we aren’t claiming to have beaten its
            memory model.
          </p>
          <dl>
            <div>
              <dt>Shared with Anki</dt>
              <dd>
                Adaptive FSRS scheduling, active recall, answer feedback and
                four recall ratings.
              </dd>
            </div>
            <div>
              <dt>The Oftly approach</dt>
              <dd>
                Card-writing suggestions you control, structured sources and
                explanations, and a simple path from importing a deck to
                reviewing it.
              </dd>
            </div>
            <div>
              <dt>The honest limit</dt>
              <dd>
                No head-to-head study shows Oftly teaches better than Anki. Anki
                can optimize FSRS parameters from your history; Oftly’s web app
                currently uses default parameters while updating each card’s
                memory state.
              </dd>
            </div>
          </dl>
          <details className="research-evidence">
            <summary>How far does the evidence go?</summary>
            <p>
              A classroom meta-analysis combined 222 studies involving 48,478
              students and found an average benefit from quizzing. Effects
              varied with the material, test format, feedback and other
              conditions. That supports retrieval practice, not a guaranteed
              result from any one app.
            </p>
            <Source href={papers.classroom}>
              Yang et al., 2021 · classroom testing meta-analysis
            </Source>
            <p>
              Oftly’s study-plan minutes are a starting suggestion, not a
              scientifically validated prediction of how quickly you will learn.
              The scheduling engine and that time-allocation suggestion are
              separate.
            </p>
          </details>
        </section>
        <footer className="research-end">
          <div>
            <h2>Follow the evidence.</h2>
            <p>Read the papers, inspect our choices, or explore the code.</p>
            <a
              className="research-github"
              href="https://github.com/vivantaneja/oftly/blob/main/docs/LEARNING-RESEARCH.md"
              target="_blank"
              rel="noreferrer"
            >
              Full research notes on GitHub{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <a className="primary" href="#welcome">
            Try Oftly <ArrowRight size={16} aria-hidden="true" />
          </a>
        </footer>
      </main>
    </div>
  );
}
