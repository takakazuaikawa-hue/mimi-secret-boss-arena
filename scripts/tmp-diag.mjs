import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const shotDir =
  "C:/Users/takakazu/AppData/Local/Temp/claude/C--Users-takakazu-projects-mimi-secret-boss-arena/ed2ced32-da7a-405c-8767-da34e3f03798/scratchpad/shots";
mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text());
});

await page.goto("http://localhost:5173/?gameCanvas=1", { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page.locator(".game-loading-screen").waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
await page.getByRole("button", { name: /派遣初日から始める/ }).first().click();
console.log("new game started");

const snap = () =>
  page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("mimi-secret-boss-arena") || "{}");
    const run = raw?.state?.run;
    if (!run) return null;
    return { week: run.week, historyLen: run.eventHistory.length, current: run.currentEvent?.scene?.id };
  });

for (let step = 0; step < 400; step++) {
  await page.waitForTimeout(60);
  const s = await snap();

  let tag = "idle";
  const dialoguePanelVisible = await page.locator(".dialogue-panel").first().isVisible().catch(() => false);
  const choiceVisible = await page.locator(".choice-option, .choice-list button, .choice-panel button").first().isVisible().catch(() => false);
  const lightboxVisible = await page.locator(".scene-image-lightbox__close").first().isVisible().catch(() => false);
  const anyBtn = page.locator("main button:not([disabled])").first();
  const anyBtnVisible = await anyBtn.isVisible().catch(() => false);
  const anyBtnText = anyBtnVisible ? (await anyBtn.innerText().catch(() => "")).trim() : "";

  if (step % 10 === 0) {
    console.log(
      `step=${step} week=${s?.week} histLen=${s?.historyLen} current=${s?.current} dlgVisible=${dialoguePanelVisible} choiceVisible=${choiceVisible} lightbox=${lightboxVisible} anyBtn="${anyBtnText}"`,
    );
    await page.screenshot({ path: join(shotDir, `diag-${String(step).padStart(3, "0")}.png`) });
  }

  if (lightboxVisible) {
    await page.locator(".scene-image-lightbox__close").first().click().catch(() => {});
    continue;
  }
  if (choiceVisible) {
    await page.locator(".choice-option, .choice-list button, .choice-panel button").first().click().catch(() => {});
    continue;
  }
  if (dialoguePanelVisible) {
    await page.locator(".dialogue-panel").first().evaluate((el) => el.click()).catch(() => {});
    continue;
  }
  if (anyBtnVisible && !/タイトルへ|やり直す|NEW GAME|MEMORIES/.test(anyBtnText)) {
    await anyBtn.click().catch(() => {});
    continue;
  }
}

const final = await snap();
console.log("FINAL:", JSON.stringify(final));
console.log("errors:", JSON.stringify(errors.slice(0, 10)));
await browser.close();
