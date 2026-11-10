import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SuggestionsProvider } from "./lib/suggestions";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SuggestionsProvider>
      <App />
    </SuggestionsProvider>
  </React.StrictMode>,
);
