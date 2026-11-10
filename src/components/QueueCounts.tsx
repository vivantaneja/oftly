import { useEffect, useRef, useState } from "react";
import type { QueueCounts as Counts } from "../lib/api";

export function QueueCounts({
  counts,
  active,
}: {
  counts: Counts;
  active?: "new" | "learning" | "review";
}) {
  const items = [
    {
      key: "new",
      label: "New",
      count: counts.new,
      hint: "Unseen cards available within today's limit",
    },
    {
      key: "learning",
      label: "Learning",
      count: counts.learning + counts.waiting,
      hint: "Learning and missed cards to repeat today, including waiting steps",
    },
    {
      key: "review",
      label: "Due",
      count: counts.review,
      hint: "Previously learned cards due for review",
    },
  ];
  return (
    <div className="queue-counts" role="group" aria-label="Study queue">
      {items.map(({ key, label, count, hint }) => (
        <span
          key={key}
          className={`queue-count queue-${key}${count ? "" : " zero-count"}${active === key ? " current-queue" : ""}`}
          title={hint}
        >
          <span>{label}</span> <strong>{count}</strong>
        </span>
      ))}
    </div>
  );
}

export function NextRepeat({
  at,
  onDue,
}: {
  at: number | null;
  onDue?: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  const notified = useRef<number | null>(null);
  useEffect(() => {
    if (at === null) return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= at * 1000) {
        if (onDue && notified.current !== at) {
          notified.current = at;
          onDue();
        }
        return true;
      }
      return false;
    };
    if (tick()) return;
    const timer = window.setInterval(() => {
      if (tick()) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [at, onDue]);
  if (at === null) return null;
  const seconds = Math.max(0, Math.ceil(at - now / 1000));
  const minutes = Math.ceil(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const time = hours
    ? `${hours}h ${minutes % 60}m`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <span className="next-repeat" role="timer" aria-live="off">
      {seconds ? (
        <>
          Next repeat in{" "}
          <time dateTime={new Date(at * 1000).toISOString()}>{time}</time>
        </>
      ) : (
        "Repeat ready"
      )}
    </span>
  );
}
