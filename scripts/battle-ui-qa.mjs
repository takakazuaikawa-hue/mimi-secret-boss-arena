import { join } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.MIMI_QA_URL ?? "http://localhost:5173/";
const shotDir = "C:/Users/takakazu/AppData/Local/Temp/claude/C--Users-takakazu-projects-mimi-secret-boss-arena/ed2ced32-da7a-405c-8767-da34e3f03798/scratchpad/shots";
import { mkdirSync } from "node:fs";
mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const viewport = process.env.MIMI_QA_MOBILE
  ? { width: 390, height: 844 }
  : { width: 1280, height: 720 };
const page = await browser.newPage({ viewport });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

const log = (...args) => console.log("[qa]", ...args);
const shot = async (name) => {
  const p = join(shotDir, `${process.env.MIMI_QA_MOBILE ? "m-" : ""}${name}.png`);
  await page.screenshot({ path: p });
  log("shot:", name);
};

await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page.locator(".game-loading-screen").waitFor({ state: "hidden", timeout: 30_000 }).catch(() => {});
await page.getByRole("button", { name: /派遣初日から始める/ }).click();
log("new game started");

let matchPrepReached = false;
for (let step = 0; step < 1200 && !matchPrepReached; step++) {
  await page.waitForTimeout(140);
  if (await page.locator(".match-prep").first().isVisible().catch(() => false)) {
    matchPrepReached = true;
    break;
  }
  const choice = page.locator(".choice-list button, .choice-panel button").first();
  if (await choice.isVisible().catch(() => false)) {
    await choice.click().catch(() => {});
    continue;
  }
  const panel = page.locator(".dialogue-panel").first();
  if (await panel.isVisible().catch(() => false)) {
    await panel.evaluate((el) => el.click()).catch(() => {});
    continue;
  }
  const proceed = page
    .locator("main button:not([disabled])")
    .filter({ hasText: /この予定で進める|試合へ|結果へ|次の週へ|週を終える|次へ|続ける|受け取る|閉じる/ })
    .first();
  if (await proceed.isVisible().catch(() => false)) {
    await proceed.click().catch(() => {});
    continue;
  }
  const anyButton = page.locator("main button:not([disabled])").first();
  if (await anyButton.isVisible().catch(() => false)) {
    const text = (await anyButton.innerText().catch(() => "")).trim();
    if (!/タイトルへ|やり直す|NEW GAME|MEMORIES/.test(text)) {
      await anyButton.click().catch(() => {});
    }
  }
  if (step % 100 === 99) await shot(`progress-${step + 1}`);
}

if (!matchPrepReached) {
  await shot("00-stuck");
  console.error("match prep not reached");
  console.error("errors:", errors.slice(0, 5));
  await browser.close();
  process.exit(1);
}
log("match prep reached");
await page.waitForTimeout(500);
await shot("01-prep-members");

const bodyText = async () => (await page.locator("main").innerText()).replace(/\s+/g, " ");

const strategyTab = page.locator("button", { hasText: "作戦" }).first();
if (await strategyTab.isVisible().catch(() => false)) {
  await strategyTab.click();
  await page.waitForTimeout(300);
}
await shot("02-prep-strategy");
const prepText = await bodyText();
log("rules note visible:", prepText.includes("第10ターン終了時"));
log("intervention causality visible:", prepText.includes("信頼"), prepText.includes("所有"));

const memberTab = page.locator("button", { hasText: "出場メンバー" }).first();
if (await memberTab.isVisible().catch(() => false)) {
  await memberTab.click();
  await page.waitForTimeout(300);
}
const memberText = await bodyText();
log("tactic description visible:", /固有技を軸|MP攻撃技を優先|回復。/.test(memberText));
await shot("03-prep-members-tactics");

await page.getByRole("button", { name: /試合開始/ }).click();
await page.locator(".battle-entry-gate").waitFor({ timeout: 15_000 });
await page.waitForTimeout(400);
await shot("04-entry-gate");
const gateText = await bodyText();
log("gate rule visible:", gateText.includes("第10ターン終了時に残りHP"));

await page.getByRole("button", { name: /AUTOで試合を見る/ }).click();
log("battle started (auto)");

let commandSeen = false;
for (let i = 0; i < 400; i++) {
  await page.waitForTimeout(250);
  if (await page.locator(".command-panel").isVisible().catch(() => false)) {
    commandSeen = true;
    break;
  }
  if (await page.locator(".battle-result").isVisible().catch(() => false)) break;
}
if (commandSeen) {
  await page.waitForTimeout(400);
  await shot("05-command-panel");
  const panelText = await bodyText();
  log("link button present:", panelText.includes("連携追撃"));
  log("momentum widget present:", await page.locator(".battle-momentum").isVisible().catch(() => false));
  log("force recoil text:", panelText.includes("反動でHPと防御"));

  const readButton = page.locator(".command-grid button", { hasText: "読む" }).first();
  if (await readButton.isEnabled().catch(() => false)) {
    await readButton.click();
    await page.waitForTimeout(300);
    await shot("06-read-note");
    const readText = await bodyText();
    log("read confidence note:", /構えの確度はおよそ\d+%/.test(readText));
    await page.locator(".command-heading .icon-button").click().catch(() => {});
    await page.waitForTimeout(200);
  }

  const historyButton = page.locator(".battle-feed__history");
  if (await historyButton.isVisible().catch(() => false)) {
    await historyButton.click();
    await page.waitForTimeout(300);
    await shot("07-log-history");
    log("log history open:", await page.locator(".battle-log-history").isVisible().catch(() => false));
    await page.locator(".battle-log-history header .icon-button").click().catch(() => {});
  }

  await page.locator(".command-grid button", { hasText: "任せる" }).first().click().catch(() => {});
}

await page.getByRole("button", { name: /即時結果/ }).click().catch(() => {});
await page.locator(".battle-result").waitFor({ timeout: 20_000 }).catch(() => {});
await page.waitForTimeout(600);
await shot("08-result");

console.log("console errors:", errors.length ? errors.slice(0, 8) : "none");
await browser.close();
