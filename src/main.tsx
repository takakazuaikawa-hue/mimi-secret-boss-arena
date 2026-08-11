import "./styles.css";
import "./styles/battle-v2.css";
import "./styles/prep-result-v2.css";
import "./styles/battle-character-showcase.css";
import "./styles/battle-entry-gate.css";
import "./styles/battle-decision-dock.css";
import "./styles/battle-broadcast.css";
import "./styles/system-commercial.css";

const GAME_CANVAS_QUERY = "gameCanvas";

async function mountGame() {
  document.documentElement.classList.add("game-canvas-document");
  document.body.classList.add("game-canvas-document");

  const [{ default: React }, { default: ReactDOM }, { App }, { validateContent }] =
    await Promise.all([
      import("react"),
      import("react-dom/client"),
      import("./App"),
      import("./game/content"),
    ]);

  validateContent();
  ReactDOM.createRoot(document.getElementById("root")!).render(
    React.createElement(React.StrictMode, null, React.createElement(App)),
  );
  window.requestAnimationFrame(() => {
    window.parent.postMessage({ type: "mimi-game-ready" }, window.location.origin);
    if (window.parent !== window) {
      window.parent.dispatchEvent(new Event("mimi-game-ready"));
    }
  });
}

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  if (params.get(GAME_CANVAS_QUERY) === "1") {
    await mountGame();
    return;
  }

  const { mountFixedGameCanvas } = await import("./fixedGameCanvas");
  mountFixedGameCanvas(document.getElementById("root")!, GAME_CANVAS_QUERY);
}

void bootstrap();
