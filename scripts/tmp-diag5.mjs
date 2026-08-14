import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const shotDir =
  "C:/Users/takakazu/AppData/Local/Temp/claude/C--Users-takakazu-projects-mimi-secret-boss-arena/ed2ced32-da7a-405c-8767-da34e3f03798/scratchpad/shots";
mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 800, height: 450 } });

await page.goto("http://localhost:5173/?gameCanvas=1", { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page.locator(".game-loading-screen").waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
await page.getByRole("button", { name: /派遣初日から始める/ }).first().click();

const snap = () =>
  page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("mimi-secret-boss-arena") || "{}");
    const run = raw?.state?.run;
    if (!run) return null;
    return { week: run.week, current: run.currentEvent?.scene?.id };
  });

let autoClicked = false;
for (let step = 0; step < 900 && !autoClicked; step++) {
  await page.waitForTimeout(40);
  const entryGate = page.locator(".battle-entry-gate").first();
  if (await entryGate.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: /AUTO/ }).first().click().catch(() => {});
    autoClicked = true;
    console.log("clicked AUTO at step", step);
    break;
  }
  const outcomeContinue = page.locator(".outcome-cinematic__continue").first();
  if (await outcomeContinue.isVisible().catch(() => false)) { await outcomeContinue.click().catch(() => {}); continue; }
  const outcomeRevealAll = page.locator(".outcome-cinematic__reveal-all").first();
  if (await outcomeRevealAll.isVisible().catch(() => false)) { await outcomeRevealAll.click().catch(() => {}); continue; }
  const outcomeAdvance = page.locator(".outcome-cinematic__advance-area").first();
  if (await outcomeAdvance.isVisible().catch(() => false)) { await outcomeAdvance.click().catch(() => {}); continue; }
  const choice = page.locator(".choice-option, .choice-list button, .choice-panel button").first();
  if (await choice.isVisible().catch(() => false)) { await choice.click().catch(() => {}); continue; }
  const panel = page.locator(".dialogue-panel").first();
  if (await panel.isVisible().catch(() => false)) { await panel.evaluate((el) => el.click()).catch(() => {}); continue; }
  const ticket = page.locator(".week-action-ticket").first();
  if (await ticket.isVisible().catch(() => false)) {
    await ticket.click().catch(() => {});
    const confirm = page.locator(".week-action-confirm").first();
    if (await confirm.isVisible().catch(() => false)) await confirm.click().catch(() => {});
    continue;
  }
  const proceed = page.locator("main button:not([disabled])").filter({ hasText: /この予定で進める|次の週へ|週を終える|次へ|続ける|受け取る|閉じる|確定|試合開始|結果を確定|入場する/ }).first();
  if (await proceed.isVisible().catch(() => false)) { await proceed.click().catch(() => {}); continue; }
  const any = page.locator("main button:not([disabled])").first();
  if (await any.isVisible().catch(() => false)) {
    const t = (await any.innerText().catch(() => "")).trim();
    if (!/タイトルへ|やり直す|NEW GAME|MEMORIES/.test(t)) await any.click().catch(() => {});
  }
}

// AUTO をクリックした直後から数秒間、画面がどう変化するか逐次観察する
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(300);
  const s = await snap();
  const buttons = await page.evaluate(() =>
    [...document.querySelectorAll("main button, body button")].slice(0, 8).map((b) => ({
      text: b.innerText.trim().slice(0, 20),
      cls: b.className.slice(0, 60),
    })),
  );
  const mainClass = await page.evaluate(() => document.querySelector("main")?.className ?? "(no main)");
  console.log(`t+${(i + 1) * 0.3}s week=${s?.week} current=${s?.current} mainClass=${mainClass} buttons=${JSON.stringify(buttons)}`);
  if (i % 5 === 0) await page.screenshot({ path: join(shotDir, `diag5-t${i}.png`) });
}

await browser.close();
