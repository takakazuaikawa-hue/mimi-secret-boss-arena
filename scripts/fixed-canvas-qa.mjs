import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";

const baseUrl = process.env.MIMI_QA_URL ?? "http://127.0.0.1:5175/";
const outputDir = process.env.MIMI_QA_OUTPUT ?? join(tmpdir(), "mimi-fixed-canvas-qa");
const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

await mkdir(outputDir, { recursive: true });

const vite = await createViteServer({
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true },
});
let storageValue;
try {
  const { useGameStore } = await vite.ssrLoadModule("/src/game/store.ts");
  useGameStore.getState().startRun("normal", "fixed-canvas-click", 1);
  storageValue = JSON.stringify({
    state: {
      profile: useGameStore.getState().profile,
      run: useGameStore.getState().run,
    },
    version: 11,
  });
} finally {
  await vite.close();
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const issues = [];

try {
  const landscape = await browser.newPage({ viewport: { width: 844, height: 390 } });
  landscape.on("console", (message) => {
    if (message.type() === "error") issues.push(`console: ${message.text()}`);
  });
  landscape.on("pageerror", (error) => issues.push(`page: ${String(error)}`));
  await landscape.addInitScript(({ persisted }) => {
    localStorage.setItem("mimi-secret-boss-arena", persisted);
  }, { persisted: storageValue });
  await landscape.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

  const frame = landscape.frameLocator(".game-canvas-shell__frame");
  await frame.locator(".title-screen").waitFor({ state: "visible", timeout: 240_000 });
  const continueButton = frame.locator(".title-menu-button", { hasText: "CONTINUE" });
  const newGameButton = frame.getByRole("button", { name: /派遣初日から始める/ });
  const beforeClick = {
    continueBox: await continueButton.boundingBox(),
    newGameBox: await newGameButton.boundingBox(),
  };
  await continueButton.click();
  await frame.locator(".week-hub").waitFor({ state: "visible", timeout: 30_000 });
  await frame.locator(".week-action-confirm").click();
  await frame.locator(".scene-screen--event").waitFor({ state: "visible", timeout: 30_000 });
  await frame.locator(".scene-backdrop").evaluate((image) => {
    if (image instanceof HTMLImageElement && !image.complete) {
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }
    return undefined;
  });
  await landscape.waitForTimeout(300);

  const landscapePath = join(outputDir, "event-landscape-844x390.png");
  await landscape.screenshot({ path: landscapePath, animations: "disabled", timeout: 90_000 });
  const layout = await landscape.evaluate(() => {
    const box = (selector) => {
      const element = document.querySelector(selector);
      const rect = element?.getBoundingClientRect();
      return rect
        ? {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          }
        : null;
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      shell: box(".game-canvas-shell"),
      stage: box(".game-canvas-shell__stage"),
      frame: box(".game-canvas-shell__frame"),
      orientationGate: getComputedStyle(
        document.querySelector(".game-canvas-orientation-gate"),
      ).display,
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
    };
  });
  await landscape.close();

  const desktop = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await desktop.addInitScript(({ persisted }) => {
    localStorage.setItem("mimi-secret-boss-arena", persisted);
  }, { persisted: storageValue });
  await desktop.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const desktopFrame = desktop.frameLocator(".game-canvas-shell__frame");
  await desktopFrame.locator(".title-screen").waitFor({ state: "visible", timeout: 240_000 });
  const desktopContinue = desktopFrame.locator(".title-menu-button", { hasText: "CONTINUE" });
  const desktopContinueBox = await desktopContinue.boundingBox();
  await desktopContinue.click();
  await desktopFrame.locator(".week-hub").waitFor({ state: "visible", timeout: 30_000 });
  const desktopPath = join(outputDir, "week-desktop-1920x1080.png");
  await desktop.screenshot({ path: desktopPath, animations: "disabled", timeout: 90_000 });
  const desktopStage = await desktop.locator(".game-canvas-shell__stage").boundingBox();
  await desktop.close();

  const portrait = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await portrait.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const gate = portrait.locator(".game-canvas-orientation-gate");
  await gate.waitFor({ state: "visible", timeout: 30_000 });
  const portraitPath = join(outputDir, "orientation-gate-390x844.png");
  await portrait.screenshot({ path: portraitPath, animations: "disabled", timeout: 90_000 });
  await portrait.close();

  console.log(JSON.stringify({
    beforeClick,
    landscapePath,
    portraitPath,
    layout,
    desktop: { desktopPath, desktopStage, desktopContinueBox },
    issues,
  }, null, 2));
  if (issues.length > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
