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

const log = (...args) => console.log("[qa]", ...args);
const shot = async (name) => {
  const p = join(shotDir, `${name}.png`);
  await page.screenshot({ path: p });
  log("shot saved:", p);
};

await page.goto("http://localhost:5173/?gameCanvas=1", { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page
  .locator(".game-loading-screen")
  .waitFor({ state: "hidden", timeout: 20000 })
  .catch(() => {});
await page.getByRole("button", { name: /派遣初日から始める/ }).first().click();
log("new game started");

const snap = () =>
  page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("mimi-secret-boss-arena") || "{}");
    const run = raw?.state?.run;
    if (!run) return null;
    const recruited = Object.values(run.fighters || {})
      .filter((f) => f.recruited)
      .map((f) => f.id);
    const encountered = Object.values(run.fighters || {})
      .filter((f) => f.encountered)
      .map((f) => f.id);
    return {
      week: run.week,
      history: run.eventHistory,
      current: run.currentEvent?.scene?.id,
      recruited,
      encountered,
    };
  });

const historyLog = []; // { week, sceneId }
let lastHistoryLength = 0;
let lastWeek = 1;
let shotWeek3Meet = false;
let shotWeek4Join = false;
let week5SavedState = null;
const seenAtWeek5 = { done: false };

const recordHistory = (s) => {
  if (!s) return;
  if (s.history.length > lastHistoryLength) {
    for (let i = lastHistoryLength; i < s.history.length; i++) {
      historyLog.push({ week: s.week, sceneId: s.history[i] });
    }
    lastHistoryLength = s.history.length;
  }
  lastWeek = s.week;
};

let stuckCounter = 0;
let lastActionTag = "";
for (let step = 0; step < 9000; step++) {
  await page.waitForTimeout(45);
  const s = await snap();
  if (s) {
    recordHistory(s);
    if (s.week === 3 && s.current && s.current.endsWith(".meet") && !shotWeek3Meet) {
      await page.waitForTimeout(250);
      await shot("week3-meet");
      shotWeek3Meet = true;
    }
    if (s.week === 4 && s.current && s.current.endsWith(".join") && !shotWeek4Join) {
      await page.waitForTimeout(250);
      await shot("week4-join");
      shotWeek4Join = true;
    }
    if (s.week === 5 && !week5SavedState && s.history.some((h) => h.startsWith("main.s1.w0"))) {
      // 週5に到達した直後の localStorage をそのまま保持しておく(後で week25 検証に流用)。
      week5SavedState = await page.evaluate(() => localStorage.getItem("mimi-secret-boss-arena"));
      log("captured week5 localStorage snapshot");
    }
    if (s.week >= 5 && s.recruited.length >= 0 && week5SavedState) {
      // week5 に入って十分安定したら通しプレイを終了
      seenAtWeek5.week = s.week;
    }
  }

  // 週5の週行動選択画面まで来たら通しプレイ終了
  if (s && s.week === 5 && week5SavedState) {
    const ticketVisible = await page.locator(".week-action-ticket").first().isVisible().catch(() => false);
    if (ticketVisible) {
      log("week5 action screen reached, stopping walkthrough");
      break;
    }
  }

  let actionTag = "idle";

  const entryGate = page.locator(".battle-entry-gate").first();
  if (await entryGate.isVisible().catch(() => false)) {
    const autoBtn = page.getByRole("button", { name: /AUTO/ }).first();
    if (await autoBtn.isVisible().catch(() => false)) {
      actionTag = "battle-auto-entry";
      await autoBtn.click().catch(() => {});
      continue;
    }
  }

  const battleResult = page.locator(".battle-result").first();
  if (await battleResult.isVisible().catch(() => false)) {
    actionTag = "battle-result";
    const proceedBtn = page
      .locator("main button:not([disabled])")
      .filter({ hasText: /次へ|閉じる|続ける|週へ戻る|終了/ })
      .first();
    if (await proceedBtn.isVisible().catch(() => false)) {
      await proceedBtn.click().catch(() => {});
    } else {
      const any = page.locator("main button:not([disabled])").first();
      if (await any.isVisible().catch(() => false)) await any.click().catch(() => {});
    }
    continue;
  }

  const commandPanel = page.locator(".command-panel").first();
  if (await commandPanel.isVisible().catch(() => false)) {
    actionTag = "battle-command";
    const leaveBtn = page.locator(".command-grid button", { hasText: "任せる" }).first();
    if (await leaveBtn.isVisible().catch(() => false)) {
      await leaveBtn.click().catch(() => {});
      continue;
    }
  }

  const instantResult = page.getByRole("button", { name: /即時結果/ }).first();
  if (await instantResult.isVisible().catch(() => false)) {
    actionTag = "battle-instant-result";
    await instantResult.click().catch(() => {});
    continue;
  }

  const lightboxClose = page.locator(".scene-image-lightbox__close").first();
  if (await lightboxClose.isVisible().catch(() => false)) {
    actionTag = "close-lightbox";
    await lightboxClose.click().catch(() => {});
    continue;
  }

  const choice = page.locator(".choice-option, .choice-list button, .choice-panel button").first();
  if (await choice.isVisible().catch(() => false)) {
    actionTag = "choice";
    await choice.click().catch(() => {});
    continue;
  }

  const panel = page.locator(".dialogue-panel").first();
  if (await panel.isVisible().catch(() => false)) {
    actionTag = "dialogue-panel";
    await panel.evaluate((el) => el.click()).catch(() => {});
    continue;
  }

  const ticket = page.locator(".week-action-ticket").first();
  if (await ticket.isVisible().catch(() => false)) {
    actionTag = "week-action-ticket";
    // 週5の行動画面まで来たら上のブレークで抜けるはずだが、保険として選ばず待つ
    if (!(s && s.week === 5)) {
      await ticket.click().catch(() => {});
      const confirm = page.locator(".week-action-confirm").first();
      if (await confirm.isVisible().catch(() => false)) {
        await confirm.click().catch(() => {});
      }
    }
    continue;
  }

  const proceed = page
    .locator("main button:not([disabled])")
    .filter({
      hasText:
        /この予定で進める|次の週へ|週を終える|次へ|続ける|受け取る|閉じる|確定|試合開始|結果を確定|入場する/,
    })
    .first();
  if (await proceed.isVisible().catch(() => false)) {
    actionTag = "proceed:" + (await proceed.innerText().catch(() => "")).trim();
    await proceed.click().catch(() => {});
    continue;
  }

  const any = page.locator("main button:not([disabled])").first();
  if (await any.isVisible().catch(() => false)) {
    const t = (await any.innerText().catch(() => "")).trim();
    if (!/タイトルへ|やり直す|NEW GAME|MEMORIES/.test(t)) {
      actionTag = "any:" + t;
      await any.click().catch(() => {});
      continue;
    }
  }

  if (actionTag === "idle") stuckCounter++;
  else stuckCounter = 0;
  lastActionTag = actionTag;
  if (stuckCounter > 0 && stuckCounter % 400 === 0) {
    log("idle for", stuckCounter, "ticks at step", step, "week", s?.week, "current", s?.current);
    await shot("idle-" + step);
  }
  if (stuckCounter > 3000) {
    log("appears genuinely stuck at step", step, "week", s?.week, "current", s?.current);
    await shot("stuck-" + step);
    break;
  }
}

const final = await snap();
log("final week:", final?.week);
log("final recruited:", JSON.stringify(final?.recruited));
log("final encountered:", JSON.stringify(final?.encountered));
log("history (week:sceneId):");
for (const h of historyLog) console.log(`  w${h.week}: ${h.sceneId}`);

// 重複検出
const seenIds = new Map();
const duplicates = [];
for (const h of historyLog) {
  if (seenIds.has(h.sceneId)) {
    duplicates.push({ sceneId: h.sceneId, firstWeek: seenIds.get(h.sceneId), againWeek: h.week });
  } else {
    seenIds.set(h.sceneId, h.week);
  }
}
log("duplicate sceneIds in eventHistory:", duplicates.length ? JSON.stringify(duplicates) : "none");

log("console/page errors:", errors.length ? JSON.stringify(errors.slice(0, 10)) : "none");

// ---- Week25 本命選択の検証(週5到達時点の保存を week=25 に書き換えて検証) ----
if (week5SavedState) {
  log("=== week25 honmei-select check ===");
  await page.evaluate((saved) => {
    const parsed = JSON.parse(saved);
    if (parsed?.state?.run) {
      parsed.state.run.week = 25;
      parsed.state.run.weekActionDone = false;
      parsed.state.run.currentEvent = undefined;
      parsed.state.run.lastEventOutcome = undefined;
      parsed.state.run.pendingWeeklyAction = undefined;
    }
    localStorage.setItem("mimi-secret-boss-arena", JSON.stringify(parsed));
  }, week5SavedState);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .locator(".game-loading-screen")
    .waitFor({ state: "hidden", timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(500);
  await shot("week25-00-after-reload");

  const week25History = [];
  let week25Reached = false;
  let honmeiSelectSeen = false;
  let eveSceneSeen = false;
  for (let step = 0; step < 2500; step++) {
    await page.waitForTimeout(45);
    const s = await snap();
    if (s) {
      if (s.week !== 25 && !week25Reached) {
        // week書き換えが反映されなかった場合の検知
      } else {
        week25Reached = true;
      }
      if (s.current && week25History.at(-1) !== s.current) week25History.push(s.current);
    }

    if (s && s.current === "main.s1.honmei-select" && !honmeiSelectSeen) {
      honmeiSelectSeen = true;
      await page.waitForTimeout(300);
      await shot("week25-honmei-select");
      const labels = await page.evaluate(() =>
        [...document.querySelectorAll(".choice-option, .choice-list button, .choice-panel button")].map((b) =>
          b.innerText.trim(),
        ),
      );
      log("honmei-select choice labels:", JSON.stringify(labels));
    }
    if (s && s.current && s.current.startsWith("main.s1.eve.") && !eveSceneSeen) {
      eveSceneSeen = true;
      await page.waitForTimeout(300);
      await shot("week25-eve-scene");
    }

    if (eveSceneSeen) break; // 前夜シーンまで確認できたら終了

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
    const lightboxClose2 = page.locator(".scene-image-lightbox__close").first();
    if (await lightboxClose2.isVisible().catch(() => false)) {
      await lightboxClose2.click().catch(() => {});
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

  const finalWeek25 = await snap();
  log("week25 scene sequence:", JSON.stringify(week25History));
  log("week25 reached:", week25Reached);
  log("honmei-select seen:", honmeiSelectSeen);
  log("eve scene seen:", eveSceneSeen);
  log("final honmeiFighterId:", finalWeek25?.honmeiFighterId ?? "(not in snap, check raw)");
  const rawHonmei = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("mimi-secret-boss-arena") || "{}");
    return raw?.state?.run?.honmeiFighterId;
  });
  log("run.honmeiFighterId:", rawHonmei);
  log("errors after week25 test:", errors.length ? JSON.stringify(errors.slice(0, 10)) : "none");
} else {
  log("week5 localStorage snapshot was not captured; skipping week25 check");
}

await browser.close();
