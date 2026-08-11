const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 450;
const PORTRAIT_SESSION_OVERRIDE = "mimi-portrait-session-override";

function makeElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

export function mountFixedGameCanvas(root: HTMLElement, queryKey: string) {
  document.documentElement.classList.add("game-canvas-host");
  document.body.classList.add("game-canvas-host");

  const shell = makeElement("main", "game-canvas-shell");
  shell.setAttribute("aria-label", "ミミのときめき裏ボス闘技場");
  const safeArea = makeElement("div", "game-canvas-shell__safe-area");
  const stage = makeElement("div", "game-canvas-shell__stage");
  const loading = makeElement("p", "game-canvas-shell__loading");
  loading.textContent = "ゲームを準備しています…";

  const frame = makeElement("iframe", "game-canvas-shell__frame");
  frame.title = "ミミのときめき裏ボス闘技場 ゲーム画面";
  frame.width = String(LOGICAL_WIDTH);
  frame.height = String(LOGICAL_HEIGHT);
  frame.allow = "autoplay; fullscreen";
  frame.setAttribute("allowfullscreen", "");
  const gameUrl = new URL(window.location.href);
  gameUrl.searchParams.set(queryKey, "1");
  frame.src = gameUrl.toString();
  const revealGame = () => {
    loading.hidden = true;
    stage.classList.add("game-canvas-shell__stage--ready");
  };
  const handleGameReady = (event: MessageEvent) => {
    if (
      event.origin === window.location.origin &&
      event.source === frame.contentWindow &&
      event.data?.type === "mimi-game-ready"
    ) {
      revealGame();
    }
  };
  window.addEventListener("message", handleGameReady);
  window.addEventListener("mimi-game-ready", revealGame, { once: true });

  stage.append(loading, frame);
  safeArea.append(stage);
  shell.append(safeArea);

  const gate = makeElement("section", "game-canvas-orientation-gate");
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "orientation-gate-title");
  const device = makeElement("div", "game-canvas-orientation-gate__device");
  device.setAttribute("aria-hidden", "true");
  device.textContent = "↻";
  const eyebrow = makeElement("span", "game-canvas-orientation-gate__eyebrow");
  eyebrow.textContent = "BEST VIEW";
  const heading = makeElement("h1");
  heading.id = "orientation-gate-title";
  heading.textContent = "スマホを横向きにしてください";
  const copy = makeElement("p");
  copy.textContent =
    "このゲームは横長の一枚絵と会話画面を、16:9のまま楽しめるように作られています。";
  const continueButton = makeElement("button");
  continueButton.type = "button";
  continueButton.textContent = "縦向きのまま続ける";

  try {
    if (window.sessionStorage.getItem(PORTRAIT_SESSION_OVERRIDE) === "1") {
      shell.classList.add("game-canvas-shell--portrait-allowed");
    }
  } catch {
    // The gate remains available when storage is restricted.
  }

  continueButton.addEventListener("click", () => {
    try {
      window.sessionStorage.setItem(PORTRAIT_SESSION_OVERRIDE, "1");
    } catch {
      // The class below is enough for the current page session.
    }
    shell.classList.add("game-canvas-shell--portrait-allowed");
  });

  gate.append(device, eyebrow, heading, copy, continueButton);
  shell.append(gate);
  root.replaceChildren(shell);

  const fitCanvas = () => {
    const scale = Math.min(
      safeArea.clientWidth / LOGICAL_WIDTH,
      safeArea.clientHeight / LOGICAL_HEIGHT,
    );
    stage.style.setProperty("--game-canvas-scale", String(scale));
    stage.style.width = `${LOGICAL_WIDTH * scale}px`;
    stage.style.height = `${LOGICAL_HEIGHT * scale}px`;
  };

  const resizeObserver = new ResizeObserver(fitCanvas);
  resizeObserver.observe(safeArea);
  fitCanvas();
  window.addEventListener(
    "pagehide",
    () => {
      resizeObserver.disconnect();
      window.removeEventListener("message", handleGameReady);
      window.removeEventListener("mimi-game-ready", revealGame);
    },
    { once: true },
  );
}
