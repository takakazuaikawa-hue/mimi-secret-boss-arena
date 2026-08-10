import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page.locator(".game-loading-screen").waitFor({ state: "hidden", timeout: 30000 }).catch(() => {});
await page.getByRole("button", { name: /派遣初日から始める/ }).first().click();

const snapshot = () =>
  page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("mimi-secret-boss-arena") || "{}");
    const run = raw?.state?.run;
    return run
      ? {
          week: run.week,
          stage: run.campaignStage,
          history: run.eventHistory,
          deck: run.encounterDeck,
          roster: run.roster,
          current: run.currentEvent?.scene?.id,
        }
      : null;
  });

const seen = [];
for (let step = 0; step < 700; step++) {
  await page.waitForTimeout(90);
  const s = await snapshot();
  if (s?.current && seen.at(-1) !== s.current) seen.push(s.current);
  if (s && s.week >= 4) break;

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
    .filter({ hasText: /この予定で進める|次の週へ|週を終える|次へ|続ける|受け取る|閉じる|確定/ })
    .first();
  if (await proceed.isVisible().catch(() => false)) {
    await proceed.click().catch(() => {});
    continue;
  }
  const any = page.locator("main button:not([disabled])").first();
  if (await any.isVisible().catch(() => false)) {
    const t = (await any.innerText().catch(() => "")).trim();
    if (!/タイトルへ|やり直す|NEW GAME|MEMORIES/.test(t)) await any.click().catch(() => {});
  }
}

const final = await snapshot();
console.log("played order:", JSON.stringify(seen, null, 1));
console.log("history:", JSON.stringify(final?.history));
console.log("week/stage:", final?.week, final?.stage);
console.log("errors:", errors.slice(0, 3));
await browser.close();
