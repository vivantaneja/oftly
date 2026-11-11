export const studyContexts = {
  school: "School",
  college: "College / university",
  independent: "Work or personal study",
  other: "Other",
} as const;
export type StudyContext = keyof typeof studyContexts;
export type StudyMethod = "notes" | "flashcards" | "practice";
export type StudyPlan = {
  version: 2;
  context: StudyContext;
  method: StudyMethod;
  minutes: number;
};
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60),
    rest = minutes % 60;
  if (!hours) return `${rest} minutes`;
  return `${hours} ${hours === 1 ? "hour" : "hours"}${rest ? ` ${rest} minutes` : ""}`;
}
export function estimatePlan(plan: StudyPlan) {
  const minutes = Math.min(
    1440,
    Math.max(5, Math.round(Number(plan.minutes) || 60)),
  );
  // A disclosed starting allocation, not a measured or scientifically optimal dosage.
  const sessions = Math.max(1, Math.ceil(minutes / 120));
  const sessionMinutes = Math.min(
    15,
    Math.max(5, Math.floor(minutes / sessions / 4 / 5) * 5),
  );
  const recallMinutes = Math.min(minutes, sessions * sessionMinutes);
  return {
    minutes,
    sessions,
    sessionMinutes,
    recallMinutes,
    otherMinutes: minutes - recallMinutes,
  };
}
export const methodAdvice: Record<StudyMethod, string> = {
  notes:
    "Turn the key ideas in your notes into questions. Try answering before you reveal.",
  flashcards:
    "Import your existing cards, then start with the ones due for review.",
  practice:
    "Keep doing practice questions. Make cards for the facts and steps you keep missing.",
};
export function savedPlanLabel(plan: Record<string, unknown>) {
  const context =
    typeof plan.context === "string" && plan.context in studyContexts
      ? studyContexts[plan.context as StudyContext]
      : String(plan.subject || "Study plan");
  const minutes = Math.min(1440, Math.max(5, Number(plan.minutes) || 60));
  return `${context} · ${formatDuration(minutes)} a day`;
}
