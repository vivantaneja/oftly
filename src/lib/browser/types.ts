import { DefaultScheduler } from "ts-fsrs";
export const schedulerFor = (retention: number) =>
  DefaultScheduler({
    version: "FSRS-6",
    desiredRetention: retention,
    learningSteps: ["1m", "10m"],
    relearningSteps: ["10m"],
    enableFuzz: false,
    maximumInterval: 36500,
  });
export type Memory = ReturnType<
  Awaited<ReturnType<typeof schedulerFor>>["newCard"]
>;
export type LocalDeck = { id: string; name: string; folder: boolean };
export type LocalNote = {
  id: string;
  guid: string;
  fields: string[];
  fieldNames: string[];
  model: string;
  kind: "basic" | "reversed" | "typing" | "cloze";
  tags: string[];
};
export type LocalCard = {
  id: string;
  nid: string;
  did: string;
  ord: number;
  suspended: boolean;
  memory: Memory;
};
export type Review = {
  id: string;
  cid: string;
  nid: string;
  did: string;
  at: number;
  rating: number;
  state: number;
  ms: number;
  log?: unknown;
};
export type Suggestions = {
  enabled: boolean;
  split: boolean;
  length: boolean;
  clarity: boolean;
  cloze: boolean;
  source: boolean;
};
export type Collection = {
  version: 1;
  revision: number;
  decks: LocalDeck[];
  notes: LocalNote[];
  cards: LocalCard[];
  reviews: Review[];
  settings: { newPerDay: number; retention: number };
  suggestions: Suggestions;
};
export type ImportedPackage = {
  decks: LocalDeck[];
  notes: LocalNote[];
  cards: LocalCard[];
  reviews: Review[];
  media: { name: string; data: Uint8Array; type: string }[];
  warnings: string[];
  backup?: Pick<Collection, "settings" | "suggestions">;
};
export const emptyCollection = (): Collection => ({
  version: 1,
  revision: 0,
  decks: [],
  notes: [],
  cards: [],
  reviews: [],
  settings: { newPerDay: 10, retention: 0.9 },
  suggestions: {
    enabled: true,
    split: true,
    length: true,
    clarity: true,
    cloze: true,
    source: true,
  },
});
export const day = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function reviveMemory(memory: Memory): Memory {
  return {
    ...memory,
    dueAt: new Date(memory.dueAt),
    lastReviewAt: memory.lastReviewAt ? new Date(memory.lastReviewAt) : null,
  };
}
