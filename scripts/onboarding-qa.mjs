import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.MIMI_QA_URL ?? "http://127.0.0.1:5175/";
const launchOptions = process.env.CHROME_PATH
  ? { executablePath: process.env.CHROME_PATH }
  : {};
const browser = await chromium.launch({ headless: true, ...launchOptions });
const results = [];

const requireState = (condition, message) => {
  if (!condition) throw new Error(message);
};

const runOpening = async (name, viewport) => {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
  const game = page.frameLocator(".game-canvas-shell__frame");
  await game.locator(".game-loading-screen").waitFor({ state: "hidden", timeout: 240_000 });
  await game.locator(".title-screen").waitFor({ state: "visible", timeout: 240_000 });

  const titleShot = join(tmpdir(), `mimi-onboarding-${name}-title.png`);
  await page.screenshot({ path: titleShot });
  await game.getByRole("button", { name: /派遣初日から始める/ }).click();
  const routeStart = game.getByRole("button", { name: /この興行で26週を始める/ });
  if (await routeStart.isVisible().catch(() => false)) await routeStart.click();
  await game.locator(".dialogue-panel").waitFor({ timeout: 30_000 });

  const firstText = await game.locator(".dialogue-panel").innerText();
  requireState(
    firstText.includes("世界を三度救った") && firstText.includes("ポイントカード"),
    `${name}: 現行のコメディ導入から始まっていない: ${firstText}`,
  );
  const prologueShot = join(tmpdir(), `mimi-onboarding-${name}-prologue.png`);
  await page.screenshot({ path: prologueShot });

  let advances = 0;
  while (!(await game.locator(".week-hub").isVisible().catch(() => false))) {
    requireState(advances < 45, `${name}: 45送り以内に派遣初週へ到達しない`);
    const panel = game.locator(".dialogue-panel");
    if (await panel.isVisible().catch(() => false)) {
      await panel.evaluate((element) => element.click());
    }
    await page.waitForTimeout(120);
    advances += 1;
  }

  const week = game.locator(".week-hub");
  const weekText = await week.innerText();
  requireState(weekText.includes("派遣初日の目標"), `${name}: 初週の目的がない`);
  requireState(weekText.includes("仕事を一つ選んで"), `${name}: 最初の操作が分からない`);
  requireState(
    (await game.locator(".week-action-ticket").count()) === 4,
    `${name}: 週行動が4つ揃っていない`,
  );
  requireState(
    (await game.locator(".week-action-confirm").count()) === 1,
    `${name}: 選択と実行が分離されていない`,
  );

  await game.locator(".week-action-ticket--search").click();
  requireState(
    (await game.locator(".week-stage__selection").innerText()).includes("日給 +750 G") ||
      (await game.locator(".week-stage__selection").innerText()).includes("倉庫手当 +750 G"),
    `${name}: 選択前に倉庫確認の結果が読めない`,
  );
  const weekShot = join(tmpdir(), `mimi-onboarding-${name}-week1.png`);
  await page.screenshot({ path: weekShot });

  const fit = await page.evaluate(() => ({
    viewportWidth: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    fits: document.documentElement.scrollWidth <= innerWidth,
    stage: (() => {
      const box = document.querySelector(".game-canvas-shell__stage")?.getBoundingClientRect();
      return box
        ? { width: Math.round(box.width), height: Math.round(box.height) }
        : null;
    })(),
    overflow: [...document.querySelectorAll("body *")]
      .map((element) => ({
        tag: element.tagName,
        className: element.className,
        right: Math.round(element.getBoundingClientRect().right),
      }))
      .filter((entry) => typeof entry.className === "string" && entry.right > innerWidth + 1)
      .slice(0, 8),
  }));
  requireState(fit.fits, `${name}: 横方向にはみ出している ${JSON.stringify(fit)}`);
  requireState(errors.length === 0, `${name}: console error: ${errors.join(" | ")}`);

  results.push({ name, advances, titleShot, prologueShot, weekShot, fit });
  await page.close();
};

try {
  await runOpening("desktop", { width: 1280, height: 720 });
  await runOpening("mobile-landscape", { width: 844, height: 390 });
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
