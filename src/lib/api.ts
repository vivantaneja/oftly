export type Deck = {
  id: string;
  name: string;
  total: number;
  new: number;
  review: number;
  learning: number;
  ready: number;
  folder?: boolean;
};
export type Stats = {
  reviewedToday: number;
  minutesToday: number;
  days: { date: string; label: string; count: number }[];
  recallRate: number | null;
  recallSample: number;
  totalCards: number;
  nextLearningAt: number | null;
  engine: string;
};
export type Dashboard = { decks: Deck[]; stats: Stats };
export async function api<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const form = body instanceof FormData;
  let response: Response;
  try {
    response = await fetch("/api" + path, {
      method: method ?? (body ? "POST" : "GET"),
      headers: {
        "X-Recall-Request": "1",
        ...(!form && body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? (form ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error(
      "The local engine is unavailable. Start Recall, then try again.",
    );
  }
  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ detail: "Something went wrong. Please try again." }));
    throw new Error(
      typeof err.detail === "string"
        ? err.detail
        : "Check the values and try again.",
    );
  }
  return response.json();
}
export const navigate = (route: string) => {
  window.location.hash = route;
};
export const cleanText = (value: string) =>
  new DOMParser().parseFromString(value, "text/html").body.textContent ?? "";
