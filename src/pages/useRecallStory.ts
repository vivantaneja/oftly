import { useEffect, useRef, useState } from "react";

const curves = {
  good: [
    "M10 18C70 30 110 100 240 112V18",
    "C370 18 440 85 640 106V18",
    "C760 18 880 34 990 48",
  ],
  again: [
    "M10 18C40 30 60 100 130 112V18",
    "C220 18 275 95 430 112V18",
    "C600 18 770 55 990 78",
  ],
};

export function useRecallStory(missed: boolean) {
  const section = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const segments = curves[missed ? "again" : "good"];

  useEffect(() => {
    const root = section.current!,
      stageElement = content.current!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    // Dash progress follows path length, so pauses land at the tops of the
    // vertical review strokes, including the shorter missed-answer curve.
    const measurePath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    const lengths = segments.map((_, i) => {
      measurePath.setAttribute("d", segments.slice(0, i + 1).join(""));
      return measurePath.getTotalLength();
    });
    const peaks = lengths.slice(0, -1).map((length) => length / lengths[2]);
    // Give each review a short stretch of scroll to breathe. The page keeps
    // moving natively; only the illustration dwells, with zero speed on arrival
    // and departure so it never feels like hitting a scroll barrier.
    const dwell = 0.1;
    const progressAt = (position: number) => {
      let scrollStart = 0,
        pathStart = 0;
      for (let i = 0; i <= peaks.length; i++) {
        const pathEnd = peaks[i] ?? 1;
        const movingEnd = pathEnd * (1 - dwell * peaks.length) + dwell * i;
        if (position <= movingEnd) {
          const t = Math.max(
            0,
            Math.min(1, (position - scrollStart) / (movingEnd - scrollStart)),
          );
          const eased = t * t * t * (t * (6 * t - 15) + 10);
          return pathStart + (pathEnd - pathStart) * eased;
        }
        if (position <= movingEnd + dwell) return pathEnd;
        scrollStart = movingEnd + dwell;
        pathStart = pathEnd;
      }
      return 1;
    };
    let frame = 0,
      currentStage = -1,
      oversized = false;
    const paint = () => {
      frame = 0;
      const contentHeight = stageElement.offsetHeight;
      // Keep the large-text fallback stable when its wider card changes height.
      oversized ||= contentHeight > innerHeight - 32;
      const stationary = motion.matches || oversized;
      root.dataset.stationary = String(stationary);
      root.style.setProperty("--story-height", `${contentHeight}px`);
      const distance = Math.max(1, root.offsetHeight - contentHeight);
      const position = Math.max(
        0,
        Math.min(1, (16 - root.getBoundingClientRect().top) / distance),
      );
      const progress = stationary ? 1 : progressAt(position);
      const travel = Math.max(
        0,
        track.current!.clientWidth - card.current!.offsetWidth,
      );
      root.style.setProperty(
        "--card-x",
        `${stationary ? 0 : travel * progress}px`,
      );
      root.style.setProperty(
        "--curve-progress",
        String(Math.max(0.02, progress)),
      );
      const nextStage = peaks.filter((peak) => progress >= peak).length;
      if (nextStage !== currentStage) {
        currentStage = nextStage;
        setStage(nextStage);
      }
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const remeasure = () => {
      oversized = false;
      request();
    };
    const resize = new ResizeObserver(request);
    resize.observe(stageElement);
    resize.observe(track.current!);
    resize.observe(card.current!);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", remeasure);
    motion.addEventListener("change", remeasure);
    paint();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", remeasure);
      motion.removeEventListener("change", remeasure);
    };
  }, [segments]);

  return { section, content, track, card, stage, path: segments.join("") };
}
