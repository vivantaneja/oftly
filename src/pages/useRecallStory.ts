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
    const visited = new Set<number>();
    let frame = 0,
      timer = 0,
      currentStage = -1;
    let oversized = false,
      stationary = false,
      inputDriven = false;
    let start = 0,
      distance = 1,
      previousY = scrollY;
    let held: number | null = null;
    let touchY: number | null = null;

    const release = () => {
      clearTimeout(timer);
      held = null;
      delete root.dataset.paused;
    };
    const cancelInput = () => {
      release();
      inputDriven = false;
    };
    const peakY = (index: number) =>
      Math.round(start + distance * peaks[index]);
    const request = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const pause = (index: number) => {
      held = index;
      visited.add(index);
      root.dataset.paused = "true";
      window.scrollTo({ top: peakY(index), behavior: "instant" });
      previousY = scrollY;
      timer = window.setTimeout(() => {
        release();
        request();
      }, 1000);
    };
    const crossing = (from: number, to: number) =>
      peaks.findIndex(
        (_, i) => !visited.has(i) && from <= peakY(i) && to >= peakY(i),
      );
    function paint() {
      frame = 0;
      const contentHeight = stageElement.offsetHeight;
      // Keep the large-text fallback stable when its wider card changes height.
      oversized ||= contentHeight > innerHeight - 32;
      stationary = motion.matches || oversized;
      root.dataset.stationary = String(stationary);
      root.style.setProperty("--story-height", `${contentHeight}px`);
      start = scrollY + root.getBoundingClientRect().top - 16;
      distance = Math.max(1, root.offsetHeight - contentHeight);
      if (stationary) cancelInput();
      if (scrollY < start - 8) visited.clear();

      // Catch touch momentum that crosses a peak after the finger is lifted.
      if (inputDriven && !stationary && held === null && scrollY > previousY) {
        const index = crossing(previousY, scrollY);
        if (index !== -1) pause(index);
      }
      if (held !== null)
        window.scrollTo({ top: peakY(held), behavior: "instant" });
      previousY = scrollY;
      let progress = stationary
        ? 1
        : Math.max(0, Math.min(1, (scrollY - start) / distance));
      // Preserve an exact stroke endpoint despite whole-pixel scroll rounding.
      const atPeak = peaks.findIndex(
        (_, i) => Math.abs(scrollY - peakY(i)) < 1,
      );
      if (!stationary && atPeak !== -1) progress = peaks[atPeak];
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
    }

    const advance = (delta: number, event: Event) => {
      if (stationary || !delta) return;
      if (delta < 0) {
        cancelInput();
        return;
      }
      inputDriven = true;
      if (held !== null) {
        event.preventDefault();
        return;
      }
      const index = crossing(scrollY, scrollY + delta);
      if (index !== -1) {
        event.preventDefault();
        pause(index);
        request();
      }
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
        return;
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      advance(event.deltaY * unit, event);
    };
    const touchStart = (event: TouchEvent) => {
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
      if (touchY === null) cancelInput();
    };
    const touchMove = (event: TouchEvent) => {
      if (touchY === null || event.touches.length !== 1) {
        cancelInput();
        return;
      }
      const nextY = event.touches[0].clientY;
      advance(touchY - nextY, event);
      touchY = nextY;
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Tab") {
        cancelInput();
        return;
      }
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target instanceof Element &&
          event.target.closest(
            "button, a, input, select, textarea, [contenteditable]",
          ))
      )
        return;
      const delta =
        event.key === "ArrowDown"
          ? 40
          : event.key === "ArrowUp"
            ? -40
            : event.key === "PageDown" || (event.key === " " && !event.shiftKey)
              ? innerHeight * 0.85
              : event.key === "PageUp" ||
                  event.key === "Home" ||
                  (event.key === " " && event.shiftKey)
                ? -innerHeight
                : event.key === "End"
                  ? document.documentElement.scrollHeight
                  : 0;
      advance(delta, event);
    };
    const scrollEnd = () => {
      inputDriven = false;
    };
    const remeasure = () => {
      oversized = false;
      cancelInput();
      request();
    };
    const resize = new ResizeObserver(request);
    resize.observe(stageElement);
    resize.observe(track.current!);
    resize.observe(card.current!);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("scrollend", scrollEnd);
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: false });
    window.addEventListener("keydown", keyboard);
    window.addEventListener("focusin", cancelInput);
    window.addEventListener("blur", cancelInput);
    window.addEventListener("resize", remeasure);
    motion.addEventListener("change", remeasure);
    paint();
    return () => {
      cancelInput();
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("scrollend", scrollEnd);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("keydown", keyboard);
      window.removeEventListener("focusin", cancelInput);
      window.removeEventListener("blur", cancelInput);
      window.removeEventListener("resize", remeasure);
      motion.removeEventListener("change", remeasure);
    };
  }, [segments]);

  return { section, content, track, card, stage, path: segments.join("") };
}
