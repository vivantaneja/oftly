export type StudyPlan = {
  subject: string;
  method: "rereading" | "notes" | "flashcards" | "practice";
  minutes: number;
  weeks: number;
  cards: number;
};
export const defaultPlan: StudyPlan = {
  subject: "",
  method: "rereading",
  minutes: 15,
  weeks: 8,
  cards: 300,
};
export function estimatePlan(plan: StudyPlan) {
  const minutes = Math.min(60, Math.max(5, Number(plan.minutes) || 15));
  const cards = Math.min(10000, Math.max(10, Number(plan.cards) || 300));
  const weeks = Math.min(52, Math.max(1, Number(plan.weeks) || 8));
  const newMinutes = Math.max(2, Math.round(minutes * 0.4)),
    reviewMinutes = minutes - newMinutes;
  const low = Math.max(1, Math.floor((newMinutes * 60) / 90)),
    high = Math.max(low, Math.floor((newMinutes * 60) / 45));
  return {
    minutes,
    cards,
    weeks,
    newMinutes,
    reviewMinutes,
    low,
    high,
    fastDays: Math.ceil(cards / high),
    slowDays: Math.ceil(cards / low),
    weeklyMinutes: minutes * 7,
    totalMinutes: minutes * 7 * weeks,
    deadlineDays: weeks * 7,
  };
}
export const methodAdvice: Record<StudyPlan["method"], string> = {
  rereading:
    "Keep your reading. Add a moment with the answer hidden, so you practise finding it yourself.",
  notes:
    "Your notes are the source. Turn one idea at a time into a question you can answer without looking.",
  flashcards:
    "You already know the format. Let your recall change the schedule, so each card gets its own return date.",
  practice:
    "Keep solving whole problems. Use short cards for the facts and steps that keep interrupting you.",
};
