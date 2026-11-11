import { useEffect, useRef, useState } from "react";

const firstCurves = {
  good: "M10 18C70 30 110 100 240 112",
  again: "M10 18C40 30 60 100 130 112",
};
const curves = {
  good: [
    `${firstCurves.good}V18`,
    "C370 24 440 55 640 68V18",
    "C760 20 880 27 990 34",
  ],
  again: [
    `${firstCurves.again}V18`,
    "C220 28 275 68 430 84V18",
    "C600 22 770 42 990 54",
  ],
};
// Both paths share the same first attempt; only further reviews change the curve.
const withoutReview = {
  good: `${firstCurves.good}C370 139 480 146 640 148S880 150 990 150`,
  again: `${firstCurves.again}C220 139 300 146 430 148S800 150 990 150`,
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
      stageElement = content.current!,
      trackElement = track.current!,
      cardElement = card.current!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    // Keep chapter changes aligned to the actual review peaks on both curves.
    const measurePath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    const lengths = segments.map((_, i) => {
      measurePath.setAttribute("d", segments.slice(0, i + 1).join(""));
      return measurePath.getTotalLength();
    });
    const peaks = lengths.slice(0, -1).map((length) => length / lengths[2]);
    // A modest slowdown near each peak, with continuous speed through it.
    // No flat sections: every scroll input still advances the illustration.
    const progressAt = (position: number) => {
      let previous = 0;
      for (const end of [...peaks, 1]) {
        if (position <= end) {
          const t = (position - previous) / (end - previous);
          return (
            previous +
            (end - previous) *
              (t - (0.25 * Math.sin(2 * Math.PI * t)) / (2 * Math.PI))
          );
        }
        previous = end;
      }
      return 1;
    };
    let frame = 0,
      currentStage = -1,
      lastTime = 0;
    let oversized = false,
      stationary = false,
      needsMeasure = true,
      resetMotion = true;
    let target = 0,
      progress = 0,
      velocity = 0,
      travel = 0;
    let measuredHeight = 0;

    const measure = () => {
      needsMeasure = false;
      const contentHeight = stageElement.offsetHeight;
      // Keep the large-text fallback stable when its wider card changes height.
      oversized ||= contentHeight > innerHeight - 32;
      stationary = motion.matches || oversized;
      root.dataset.stationary = String(stationary);
      if (contentHeight !== measuredHeight) {
        measuredHeight = contentHeight;
        root.style.setProperty("--story-height", `${contentHeight}px`);
      }
      const bounds = root.getBoundingClientRect();
      const distance = Math.max(1, root.offsetHeight - contentHeight);
      const position = Math.max(0, Math.min(1, (16 - bounds.top) / distance));
      target = stationary ? 1 : progressAt(position);
      travel = Math.max(0, trackElement.clientWidth - cardElement.offsetWidth);
      if (
        resetMotion ||
        stationary ||
        document.hidden ||
        bounds.bottom < 0 ||
        bounds.top > innerHeight
      ) {
        progress = target;
        velocity = 0;
        resetMotion = false;
      }
    };
    const paint = (time: number) => {
      frame = 0;
      if (!root.isConnected) return;
      if (needsMeasure) measure();
      const delta = lastTime ? Math.min(64, time - lastTime) / 1000 : 1 / 60;
      lastTime = time;
      // Exact critically damped response: soften wheel ticks without bounce.
      // Timing uses elapsed seconds, so high-refresh screens feel the same.
      const offset = progress - target;
      const decay = Math.exp(-26 * delta);
      const change = (velocity + 26 * offset) * delta;
      let next = target + (offset + change) * decay;
      velocity = (velocity - 26 * change) * decay;
      if (
        (target - progress) * (target - next) < 0 ||
        (Math.abs(next - target) < 0.0001 && Math.abs(velocity) < 0.001)
      ) {
        next = target;
        velocity = 0;
      }
      progress = next;
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
      const moving = progress !== target || velocity !== 0;
      root.dataset.moving = String(moving);
      if (moving) frame = requestAnimationFrame(paint);
      else lastTime = 0;
    };
    const request = () => {
      if (!root.isConnected) return;
      needsMeasure = true;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const reset = () => {
      resetMotion = true;
      request();
    };
    const remeasure = () => {
      oversized = false;
      reset();
    };
    const resize = new ResizeObserver(request);
    resize.observe(stageElement);
    resize.observe(trackElement);
    resize.observe(cardElement);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", remeasure);
    motion.addEventListener("change", remeasure);
    document.addEventListener("visibilitychange", reset);
    paint(performance.now());
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", remeasure);
      motion.removeEventListener("change", remeasure);
      document.removeEventListener("visibilitychange", reset);
    };
  }, [segments]);

  return {
    section,
    content,
    track,
    card,
    stage,
    path: segments.join(""),
    withoutReview: withoutReview[missed ? "again" : "good"],
  };
}
