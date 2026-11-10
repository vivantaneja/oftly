import { useEffect, useRef, useState } from "react";
import { Lightbulb, X } from "lucide-react";
import {
  analyzeCard,
  suggestionKinds,
  useSuggestions,
  type DraftText,
  type SuggestionKind,
} from "../lib/suggestions";
export default function CardGuidance(props: DraftText) {
  const { preferences, ready, busy, error, update } = useSuggestions();
  const [draft, setDraft] = useState(props);
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDraft(props), 400);
    return () => clearTimeout(timer);
  }, [props.question, props.answer, props.source, props.type]);
  const suggestions = analyzeCard(draft).filter((s) => preferences[s.kind]);
  if (!ready || !preferences.enabled || !suggestions.length) return null;
  async function disable(kind?: SuggestionKind) {
    const target = section.current
      ?.closest(".note-editor,.draft-note")
      ?.querySelector("textarea");
    await update(kind ? { [kind]: false } : { enabled: false });
    target?.focus({ preventScroll: true });
  }
  return (
    <section
      ref={section}
      className="card-guidance"
      aria-label="Card suggestions"
    >
      <div className="guidance-heading">
        <span>
          <Lightbulb size={16} />
          Suggestions
        </span>
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={() => disable()}
        >
          Turn off all
        </button>
      </div>
      <ul>
        {suggestions.map((s) => (
          <li key={s.kind}>
            <p>{s.message}</p>
            <button
              type="button"
              className="icon-button"
              disabled={busy}
              title={`Turn off ${suggestionKinds[s.kind].toLowerCase()} suggestions`}
              aria-label={`Turn off ${suggestionKinds[s.kind].toLowerCase()} suggestions`}
              onClick={() => disable(s.kind)}
            >
              <X size={15} />
            </button>
          </li>
        ))}
      </ul>
      <p className="guidance-note">
        Optional hints. Re-enable any kind in Settings.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
export function SuggestionSettings() {
  const { preferences, ready, busy, error, update } = useSuggestions();
  return (
    <section className="suggestion-settings">
      <h2>Card suggestions</h2>
      <p>Changes save immediately.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <label className="checkbox">
        <input
          type="checkbox"
          checked={preferences.enabled}
          disabled={busy || !ready}
          onChange={(e) => update({ enabled: e.target.checked })}
        />
        Show card suggestions
      </label>
      <fieldset disabled={busy || !ready || !preferences.enabled}>
        <legend>Suggest improvements for</legend>
        {Object.entries(suggestionKinds).map(([kind, label]) => (
          <label className="checkbox" key={kind}>
            <input
              type="checkbox"
              checked={preferences[kind as SuggestionKind]}
              onChange={(e) => update({ [kind]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </fieldset>
    </section>
  );
}
