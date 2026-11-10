import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, cleanText } from "./api";
export const suggestionKinds = {
  split: "Splitting cards",
  length: "Long questions and answers",
  clarity: "Unclear questions",
  cloze: "Cloze structure",
  source: "Missing sources",
} as const;
export type SuggestionKind = keyof typeof suggestionKinds;
export type SuggestionPreferences = { enabled: boolean } & Record<
  SuggestionKind,
  boolean
>;
const defaults: SuggestionPreferences = {
  enabled: true,
  split: true,
  length: true,
  clarity: true,
  cloze: true,
  source: true,
};
const Context = createContext<{
  preferences: SuggestionPreferences;
  ready: boolean;
  busy: boolean;
  error: string;
  update: (change: Partial<SuggestionPreferences>) => Promise<void>;
}>({
  preferences: defaults,
  ready: false,
  busy: false,
  error: "",
  update: async () => {},
});
export function SuggestionsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    let current = true;
    api<SuggestionPreferences>("/suggestions")
      .then((value) => {
        if (current) {
          setPreferences(value);
          setReady(true);
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, []);
  async function update(change: Partial<SuggestionPreferences>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const next = { ...preferences, ...change };
    setPreferences(next);
    try {
      const saved = await api<SuggestionPreferences>(
        "/suggestions",
        next,
        "PUT",
      );
      setPreferences(saved);
      setReady(true);
    } catch (e) {
      setPreferences(preferences);
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={{ preferences, ready, busy, error, update }}>
      {children}
    </Context.Provider>
  );
}
export const useSuggestions = () => useContext(Context);
export type DraftText = {
  question: string;
  answer: string;
  source?: string;
  type?: string;
};
export function analyzeCard(
  draft: DraftText,
): { kind: SuggestionKind; message: string }[] {
  const question = cleanText(draft.question).trim();
  const answer = cleanText(draft.answer).trim();
  if (!question) return [];
  const result: { kind: SuggestionKind; message: string }[] = [];
  const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
  const multiAsk =
    (question.match(/\?/g) ?? []).length > 1 ||
    /\b(?:and|then)\s+(?:explain|describe|compare|list|define|name|why|how|what)\b/i.test(
      question,
    );
  if (multiAsk)
    result.push({
      kind: "split",
      message:
        "This may test more than one thing. Consider splitting it into two cards so you can review each idea separately.",
    });
  if (words(answer) > 60 || words(question) > 50)
    result.push({
      kind: "length",
      message:
        "This is a long recall target. Consider a shorter answer and move supporting detail into Explanation.",
    });
  if (
    draft.type !== "cloze" &&
    (/^(?:what (?:is|are|does)|why (?:is|does)|how does) (?:it|this|that|these|those)(?:[ ?.]|$)/i.test(
      question,
    ) ||
      words(question) < 3)
  )
    result.push({
      kind: "clarity",
      message:
        "Make the cue specific enough to stand on its own. Name the idea or object you want to recall.",
    });
  const blanks = [...question.matchAll(/{{c([1-9]\d*)::([^{}]+)}}/g)];
  if (draft.type === "cloze" || blanks.length) {
    if (!blanks.length)
      result.push({
        kind: "cloze",
        message:
          "Add a cloze deletion such as {{c1::answer}} so this note can generate a card.",
      });
    else if (
      blanks.some((m) => words(m[2].split("::")[0]) > 12) ||
      blanks.filter((m) => m[1] === blanks[0][1]).length > 2
    )
      result.push({
        kind: "cloze",
        message:
          "This deletion hides a lot at once. Consider a smaller recall target or separate deletion numbers.",
      });
  }
  if (
    draft.source !== undefined &&
    !cleanText(draft.source).trim() &&
    (answer || blanks.length)
  )
    result.push({
      kind: "source",
      message:
        "Add a source if you have one, so you can check the answer later.",
    });
  return result;
}
