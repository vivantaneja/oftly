import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SuggestionsProvider } from "./lib/suggestions";
import "./styles.css";
if (
  import.meta.env.PROD &&
  import.meta.env.VITE_STORAGE === "browser" &&
  "serviceWorker" in navigator
) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
const CloudRoot = lazy(() => import("./CloudRoot"));
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {import.meta.env.VITE_STORAGE === "browser" ? (
      <Suspense fallback={<p role="status">Opening Oftly…</p>}>
        <CloudRoot />
      </Suspense>
    ) : (
      <SuggestionsProvider>
        <App />
      </SuggestionsProvider>
    )}
  </React.StrictMode>,
);
