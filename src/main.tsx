import React from "react";
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
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SuggestionsProvider>
      <App />
    </SuggestionsProvider>
  </React.StrictMode>,
);
