import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

const touch = window.matchMedia("(any-pointer: coarse)");
const subscribeTouch = (notify: () => void) => {
  touch.addEventListener("change", notify);
  return () => touch.removeEventListener("change", notify);
};

function TimeWheel({
  label,
  value,
  max,
  step,
  onChange,
}: {
  label: string;
  value: string;
  max: number;
  step: number;
  onChange: (value: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const emitted = useRef<number | null>(null);
  // Keep an existing precisely typed minute value until the user chooses another.
  const [options] = useState(() => {
    const values = Array.from(
      { length: Math.floor(max / step) + 1 },
      (_, i) => i * step,
    );
    const original = Number(value);
    if (
      Number.isInteger(original) &&
      original >= 0 &&
      original <= max &&
      !values.includes(original)
    )
      values.push(original);
    return values.sort((a, b) => a - b);
  });
  const selected = Math.max(0, options.indexOf(Number(value)));
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  useLayoutEffect(() => {
    const element = scroller.current!;
    if (emitted.current !== Number(value)) {
      emitted.current = Number(value);
      element.scrollTop =
        selected * element.children[0].getBoundingClientRect().height;
    }
  }, [selected, value]);
  useLayoutEffect(() => {
    const element = scroller.current!;
    const resize = new ResizeObserver(() => {
      element.scrollTop =
        selectedRef.current *
        element.children[0].getBoundingClientRect().height;
    });
    resize.observe(element);
    return () => resize.disconnect();
  }, []);

  function choose(index: number) {
    const next = Math.max(0, Math.min(options.length - 1, index));
    const element = scroller.current!;
    emitted.current = options[next];
    element.scrollTop =
      next * element.children[0].getBoundingClientRect().height;
    onChange(String(options[next]));
  }
  return (
    <div className="time-wheel-field">
      <div className="time-wheel-frame">
        <div
          ref={scroller}
          className="time-wheel"
          role="spinbutton"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={options[options.length - 1]}
          aria-valuenow={Number(value)}
          aria-valuetext={`${value} ${label.toLowerCase()}`}
          onKeyDown={(event) => {
            const next = {
              ArrowUp: selected + 1,
              ArrowDown: selected - 1,
              Home: 0,
              End: options.length - 1,
              PageUp: selected + 5,
              PageDown: selected - 5,
            }[event.key];
            if (next !== undefined) {
              event.preventDefault();
              choose(next);
            }
          }}
          onScroll={(event) => {
            const element = event.currentTarget;
            const height = element.children[0].getBoundingClientRect().height;
            if (!height) return;
            const index = Math.max(
              0,
              Math.min(
                options.length - 1,
                Math.round(element.scrollTop / height),
              ),
            );
            if (emitted.current !== options[index]) {
              emitted.current = options[index];
              onChange(String(options[index]));
            }
          }}
        >
          {options.map((option, index) => (
            <div
              key={option}
              aria-hidden="true"
              className={`time-wheel-option ${index === selected ? "selected" : ""}`}
              onClick={() => {
                choose(index);
                scroller.current?.focus({ preventScroll: true });
              }}
            >
              {String(option).padStart(2, "0")}
            </div>
          ))}
        </div>
      </div>
      <span>{label}</span>
    </div>
  );
}

export function StudyTime({
  hours,
  minutes,
  onChange,
}: {
  hours: string;
  minutes: string;
  onChange: (value: { hours?: string; minutes?: string }) => void;
}) {
  const useWheels = useSyncExternalStore(subscribeTouch, () => touch.matches);
  return useWheels ? (
    <div
      className="setup-time setup-time-wheels"
      role="group"
      aria-label="Daily study time"
    >
      <TimeWheel
        label="Hours"
        value={hours}
        max={24}
        step={1}
        onChange={(hours) => onChange({ hours })}
      />
      <span aria-hidden="true">:</span>
      <TimeWheel
        label="Minutes"
        value={minutes}
        max={59}
        step={10}
        onChange={(minutes) => onChange({ minutes })}
      />
    </div>
  ) : (
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
          value={hours}
          onChange={(event) => onChange({ hours: event.target.value })}
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
          step="10"
          required
          value={minutes}
          onChange={(event) => onChange({ minutes: event.target.value })}
        />
        Minutes
      </label>
    </div>
  );
}
