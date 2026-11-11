export type Appearance = "light" | "dark" | "system";

declare global {
  interface Window {
    oftlyAppearance: {
      get: () => Appearance;
      set: (value: Appearance) => boolean;
      subscribe: (listener: () => void) => () => void;
    };
  }
}

// The shared store starts in appearance.js before React or CSS can paint.
export const appearance = window.oftlyAppearance;
