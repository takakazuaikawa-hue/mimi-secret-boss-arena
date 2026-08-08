import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const baseUrl = process.env.MIMI_QA_URL ?? "http://127.0.0.1:5175/";
const chromePath =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
});

const results = [];

const runVisualFlow = async (name, viewport) => {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });

  await page.locator(".game-loading-screen").waitFor();
  const loadingShot = join(tmpdir(), `mimi-visual-${name}-loading.png`);
  await page.screenshot({ path: loadingShot });

  await page.locator(".game-loading-screen").waitFor({ state: "hidden" });
  await page.waitForTimeout(700);
  const titleShot = join(tmpdir(), `mimi-visual-${name}-title.png`);
  await page.screenshot({ path: titleShot });
  await page.getByRole("button", { name: /新しい興行/ }).click();
  await page
    .getByRole("button", { name: /26週を始める/ })
    .waitFor();
  await page.getByRole("button", { name: /26週を始める/ }).click();
  await page.locator(".scene-transition").waitFor();
  const transitionShot = join(
    tmpdir(),
    `mimi-visual-${name}-transition.png`,
  );
  await page.screenshot({ path: transitionShot });

  await page.locator(".dialogue-panel").waitFor();
  let advances = 0;
  while (!(await page.locator(".week-screen").isVisible().catch(() => false))) {
    if (advances > 30) throw new Error(`${name}: opening did not finish`);
    await page.locator(".dialogue-panel").click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(190);
    advances += 1;
  }

  const homeShot = join(tmpdir(), `mimi-visual-${name}-home.png`);
  await page.screenshot({ path: homeShot });
  await page.getByRole("button", { name: "ゲームメニュー" }).click();
  await page.locator(".game-menu").waitFor();
  const menuShot = join(tmpdir(), `mimi-visual-${name}-menu.png`);
  await page.screenshot({ path: menuShot });

  await page
    .getByRole("button", { name: /記録室と記憶画廊/ })
    .click();
  await page.getByRole("button", { name: /記憶画廊/ }).click();
  await page.locator(".memory-gallery-grid").waitFor();
  const galleryShot = join(tmpdir(), `mimi-visual-${name}-gallery.png`);
  await page.screenshot({ path: galleryShot });

  await page
    .getByRole("button", { name: /朝のチームラウンジを大きく見る/ })
    .click();
  await page.locator(".memory-lightbox").waitFor();
  await page.waitForTimeout(450);
  const lightboxShot = join(tmpdir(), `mimi-visual-${name}-lightbox.png`);
  await page.screenshot({ path: lightboxShot });

  const fit = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    fits: document.documentElement.scrollWidth <= window.innerWidth,
  }));
  if (!fit.fits) throw new Error(`${name}: horizontal overflow`);
  if (errors.length > 0) {
    throw new Error(`${name}: console errors: ${errors.join(" | ")}`);
  }

  results.push({
    name,
    loadingShot,
    titleShot,
    transitionShot,
    homeShot,
    menuShot,
    galleryShot,
    lightboxShot,
    fit,
  });
  await page.close();
};

try {
  await runVisualFlow("desktop", { width: 1280, height: 800 });
  await runVisualFlow("mobile", { width: 390, height: 844 });
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
