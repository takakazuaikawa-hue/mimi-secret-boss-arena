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
    return { week: run.week, historyLen: run.eventHistory.length, current: run.currentEvent?.scene?.id, hasOutcome: Boolean(run.lastEventOutcome) };
  });

for (let step = 0; step < 100; step++) {
  await page.waitForTimeout(45);
  const s = await snap();
  if (s && s.hasOutcome) {
    console.log("outcome reached at step", step);
    break;
  }
  const ticket = page.locator(".week-action-ticket").first();
  if (await ticket.isVisible().catch(() => false)) {
    await ticket.click().catch(() => {});
    const confirm = page.locator(".week-action-confirm").first();
    if (await confirm.isVisible().catch(() => false)) await confirm.click().catch(() => {});
    continue;
  }
  const choice = page.locator(".choice-option, .choice-list button, .choice-panel button").first();
  if (await choice.isVisible().catch(() => false)) {
    await choice.click().catch(() => {});
    continue;
  }
  const panel = page.locator(".dialogue-panel").first();
  if (await panel.isVisible().catch(() => false)) {
    await panel.evaluate((el) => el.click()).catch(() => {});
    continue;
  }
  const proceed = page.locator("main button:not([disabled])").filter({ hasText: /CONTINUE|続ける/ }).first();
  if (await proceed.isVisible().catch(() => false)) {
    await proceed.click().catch(() => {});
    continue;
  }
}

await page.waitForTimeout(500);
await page.screenshot({ path: join(shotDir, "diag3-outcome.png") });

const buttons = await page.evaluate(() =>
  [...document.querySelectorAll("main button")].map((b) => ({
    text: b.innerText.trim(),
    cls: b.className,
    disabled: b.disabled,
    rect: (() => {
      const r = b.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    })(),
  })),
);
console.log("BUTTONS:", JSON.stringify(buttons, null, 1));

const outcomeHtml = await page.evaluate(() => {
  const el = document.querySelector('[class*="outcome"], [class*="result-toast"], [class*="notification"]');
  return el ? el.outerHTML.slice(0, 2000) : "(no outcome-ish element found)";
});
console.log("OUTCOME HTML SNIPPET:", outcomeHtml);

await browser.close();
