import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { validateContent } from "./game/content";
import "./styles.css";
import "./styles/battle-v2.css";
import "./styles/prep-result-v2.css";
import "./styles/battle-character-showcase.css";
import "./styles/battle-entry-gate.css";
import "./styles/battle-decision-dock.css";
import "./styles/battle-broadcast.css";

validateContent();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
