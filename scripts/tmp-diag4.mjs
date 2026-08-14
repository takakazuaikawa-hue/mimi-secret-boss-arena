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
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

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
    const recruited = Object.values(run.fighters || {}).filter((f) => f.recruited).map((f) => f.id);
    return { week: run.week, historyLen: run.eventHistory.length, current: run.currentEvent?.scene?.id, recruited };
  });

let lastTag = "";
let stopAtStep = null;
for (let step = 0; step < 5000; step++) {
  await page.waitForTimeout(40);
  const s = await snap();
  let actionTag = "idle";

  const entryGate = page.locator(".battle-entry-gate").first();
  if (await entryGate.isVisible().catch(() => false)) {
    actionTag = "battle-auto-entry";
    await page.getByRole("button", { name: /AUTO/ }).first().click().catch(() => {});
  } else {
    const battleResult = page.locator(".battle-result").first();
    if (await battleResult.isVisible().catch(() => false)) {
      actionTag = "battle-result";
      const proceedBtn = page.locator("main button:not([disabled])").filter({ hasText: /次へ|閉じる|続ける|週へ戻る|終了/ }).first();
      if (await proceedBtn.isVisible().catch(() => false)) await proceedBtn.click().catch(() => {});
      else { const any = page.locator("main button:not([disabled])").first(); if (await any.isVisible().catch(() => false)) await any.click().catch(() => {}); }
    } else {
      const commandPanel = page.locator(".command-panel").first();
      if (await commandPanel.isVisible().catch(() => false)) {
        actionTag = "battle-command";
        await page.locator(".command-grid button", { hasText: "任せる" }).first().click().catch(() => {});
      } else {
        const outcomeContinue = page.locator(".outcome-cinematic__continue").first();
        if (await outcomeContinue.isVisible().catch(() => false)) {
          actionTag = "outcome-continue";
          await outcomeContinue.click().catch(() => {});
        } else {
          const outcomeRevealAll = page.locator(".outcome-cinematic__reveal-all").first();
          if (await outcomeRevealAll.isVisible().catch(() => false)) {
            actionTag = "outcome-reveal-all";
            await outcomeRevealAll.click().catch(() => {});
          } else {
            const outcomeAdvance = page.locator(".outcome-cinematic__advance-area").first();
            if (await outcomeAdvance.isVisible().catch(() => false)) {
              actionTag = "outcome-advance";
              await outcomeAdvance.click().catch(() => {});
            } else {
              const instantResult = page.getByRole("button", { name: /即時結果/ }).first();
              if (await instantResult.isVisible().catch(() => false)) {
                actionTag = "battle-instant-result";
                await instantResult.click().catch(() => {});
              } else {
                const lightboxClose = page.locator(".scene-image-lightbox__close").first();
                if (await lightboxClose.isVisible().catch(() => false)) {
                  actionTag = "close-lightbox";
                  await lightboxClose.click().catch(() => {});
                } else {
                  const choice = page.locator(".choice-option, .choice-list button, .choice-panel button").first();
                  if (await choice.isVisible().catch(() => false)) {
                    actionTag = "choice:" + (await choice.innerText().catch(() => "")).slice(0, 12).replace(/\n/g, "|");
                    await choice.click().catch(() => {});
                  } else {
                    const panel = page.locator(".dialogue-panel").first();
                    if (await panel.isVisible().catch(() => false)) {
                      actionTag = "dialogue-panel";
                      await panel.evaluate((el) => el.click()).catch(() => {});
                    } else {
                      const ticket = page.locator(".week-action-ticket").first();
                      if (await ticket.isVisible().catch(() => false)) {
                        actionTag = "week-action-ticket";
                        await ticket.click().catch(() => {});
                        const confirm = page.locator(".week-action-confirm").first();
                        if (await confirm.isVisible().catch(() => false)) await confirm.click().catch(() => {});
                      } else {
                        const proceed = page.locator("main button:not([disabled])").filter({ hasText: /この予定で進める|次の週へ|週を終える|次へ|続ける|受け取る|閉じる|確定|試合開始|結果を確定|入場する/ }).first();
                        if (await proceed.isVisible().catch(() => false)) {
                          actionTag = "proceed:" + (await proceed.innerText().catch(() => "")).trim().replace(/\n/g, "|");
                          await proceed.click().catch(() => {});
                        } else {
                          const any = page.locator("main button:not([disabled])").first();
                          if (await any.isVisible().catch(() => false)) {
                            const t = (await any.innerText().catch(() => "")).trim();
                            if (!/タイトルへ|やり直す|NEW GAME|MEMORIES/.test(t)) {
                              actionTag = "any:" + t.replace(/\n/g, "|");
                              await any.click().catch(() => {});
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  if (actionTag !== lastTag) {
    console.log(`step=${step} tag=${actionTag} week=${s?.week} histLen=${s?.historyLen} current=${s?.current} recruited=${JSON.stringify(s?.recruited)}`);
    lastTag = actionTag;
  }
  if (s && s.week >= 5) {
    console.log("reached week5, stopping");
    break;
  }
  if (step % 300 === 299) {
    await page.screenshot({ path: join(shotDir, `diag4-${step}.png`) });
  }
}

const final = await snap();
console.log("FINAL:", JSON.stringify(final));
console.log("errors:", JSON.stringify(errors.slice(0, 10)));
await page.screenshot({ path: join(shotDir, "diag4-final.png") });
await browser.close();
