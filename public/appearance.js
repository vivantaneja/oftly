// Run before the first paint on both the app and the standalone privacy page.
(() => {
  const key = "oftly-appearance";
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const listeners = new Set();
  const valid = (value) => ["light", "dark", "system"].includes(value);
  const read = () => {
    try {
      const value = localStorage.getItem(key);
      return valid(value) ? value : "light";
    } catch {
      return "light";
    }
  };
  let preference = read();
  const apply = () => {
    const dark =
      preference === "dark" || (preference === "system" && system.matches);
    root.dataset.theme = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#151b25" : "#fcfaf6");
    listeners.forEach((listener) => listener());
  };
  window.oftlyAppearance = {
    get: () => preference,
    set: (value) => {
      if (!valid(value)) return false;
      preference = value;
      let saved = true;
      try {
        localStorage.setItem(key, value);
      } catch {
        saved = false;
      }
      apply();
      return saved;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  system.addEventListener("change", apply);
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) {
      preference = read();
      apply();
    }
  });
  apply();
})();
