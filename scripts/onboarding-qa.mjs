import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.MIMI_QA_URL ?? "http://127.0.0.1:5175/";
const flowUrl = new URL(baseUrl);
flowUrl.searchParams.set("gameCanvas", "1");
const launchOptions = process.env.CHROME_PATH
  ? { executablePath: process.env.CHROME_PATH }
  : {};
const browser = await chromium.launch({ headless: true, ...launchOptions });
const results = [];

const requireState = (condition, message) => {
  if (!condition) throw new Error(message);
};

const capture = async (locator, path) => {
  if (process.env.MIMI_QA_SCREENSHOTS !== "1") return;
  await locator
    .screenshot({ path, animations: "disabled", timeout: 10_000 })
    .catch(() => undefined);
};

const runOpening = async (name, viewport) => {
  console.log(`[${name}] start`);
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  page.setDefaultTimeout(60_000);

  await page.goto(flowUrl.href, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate(() => localStorage.clear());
  await page
    .reload({ waitUntil: "commit", timeout: 20_000 })
    .catch(() => undefined);
  const game = page;
  await game.locator(".game-loading-screen").waitFor({ state: "hidden", timeout: 240_000 });
  await game.locator(".title-screen").waitFor({ state: "visible", timeout: 240_000 });
  console.log(`[${name}] title`);

  const titleShot = join(tmpdir(), `mimi-onboarding-${name}-title.png`);
  await capture(game.locator("body"), titleShot);
  await game.locator(".title-main-menu").evaluate((menu) => {
    const button = [...menu.querySelectorAll("button")].find((candidate) =>
      candidate.textContent?.includes("NEW GAME"),
    );
    if (!(button instanceof HTMLButtonElement)) throw new Error("NEW GAME button not found");
    button.click();
  });
  const routeStart = game.getByRole("button", { name: /この興行で26週を始める/ });
  if (
    await routeStart
      .waitFor({ state: "visible", timeout: 8_000 })
      .then(() => true)
      .catch(() => false)
  ) {
    await routeStart.evaluate((element) => element.click());
  }
  await game.locator(".dialogue-panel").waitFor({ timeout: 60_000 });
  console.log(`[${name}] prologue`);

  const firstText = await game.locator(".dialogue-panel").innerText();
  requireState(
    firstText.includes("世界を三度救った") && firstText.includes("ポイントカード"),
    `${name}: 現行のコメディ導入から始まっていない: ${firstText}`,
  );
  const prologueShot = join(tmpdir(), `mimi-onboarding-${name}-prologue.png`);
  await capture(game.locator("body"), prologueShot);

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
  console.log(`[${name}] week`);
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

  await game
    .locator(".week-action-ticket--search")
    .evaluate((element) => element.click());
  const selectedActionDetail = await game.locator(".week-action-detail").innerText();
  requireState(
    selectedActionDetail.includes("日給 +750 G") ||
      selectedActionDetail.includes("倉庫手当 +750 G"),
    `${name}: 選択前に倉庫確認の結果が読めない`,
  );
  const weekShot = join(tmpdir(), `mimi-onboarding-${name}-week1.png`);
  await capture(game.locator("body"), weekShot);

  await game.locator(".week-action-confirm").evaluate((element) => element.click());
  const eventScreen = game.locator(".scene-screen--event");
  await eventScreen.waitFor({ state: "visible", timeout: 30_000 });
  const skipToDecision = game.getByRole("button", { name: "選択肢まで送る" });
  if (await skipToDecision.isVisible().catch(() => false)) {
    await skipToDecision.evaluate((element) => element.click());
  } else {
    let storyAdvances = 0;
    while (!(await game.locator(".choice-panel").isVisible().catch(() => false))) {
      requireState(storyAdvances < 30, `${name}: 出来事の決定へ進めない`);
      await game.locator(".dialogue-panel").evaluate((element) => element.click());
      await page.waitForTimeout(80);
      storyAdvances += 1;
    }
  }
  await game.locator(".choice-panel").waitFor({ state: "visible", timeout: 10_000 });
  const firstChoice = game.locator(".choice-option").first();
  if (await firstChoice.isVisible().catch(() => false)) {
    await firstChoice.evaluate((element) => element.click());
  } else {
    await game.getByRole("button", { name: "続ける", exact: true }).click();
  }
  const outcome = game.locator(".outcome-screen");
  await outcome.waitFor({ state: "visible", timeout: 30_000 });
  console.log(`[${name}] outcome`);
  const outcomeShot = join(tmpdir(), `mimi-onboarding-${name}-outcome.png`);
  await capture(game.locator("body"), outcomeShot);
  const outcomeContinue = game.locator(".outcome-continue");
  requireState(await outcomeContinue.isEnabled(), `${name}: 起こったことから進む操作が無効`);
  await outcomeContinue.evaluate((element) => element.click());
  await outcome.waitFor({ state: "hidden", timeout: 30_000 });
  const nextScreen = game.locator(
    ".opening-management-screen, .management-screen, .scene-screen--event, .growth-screen, .week-hub",
  );
  await nextScreen.first().waitFor({ state: "visible", timeout: 30_000 });
  console.log(`[${name}] after-outcome`);
  const afterOutcomeShot = join(tmpdir(), `mimi-onboarding-${name}-after-outcome.png`);
  await capture(game.locator("body"), afterOutcomeShot);

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

  results.push({
    name,
    advances,
    titleShot,
    prologueShot,
    weekShot,
    outcomeShot,
    afterOutcomeShot,
    fit,
  });
  await page.close();
};

try {
  await runOpening("desktop", { width: 1280, height: 720 });
  await runOpening("mobile-landscape", { width: 844, height: 390 });
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
