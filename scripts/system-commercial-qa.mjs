import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";

const baseUrl = process.env.MIMI_QA_URL ?? "http://127.0.0.1:5175/?gameCanvas=1";
const outputDir = process.env.MIMI_QA_OUTPUT ?? join(tmpdir(), "mimi-system-commercial-qa");
const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const seedDevStore = process.env.MIMI_QA_SEED_STORE === "1";

await mkdir(outputDir, { recursive: true });

const makePersistedStates = async () => {
  const vite = await createViteServer({
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true },
  });
  try {
    const { useGameStore } = await vite.ssrLoadModule("/src/game/store.ts");
    useGameStore.getState().startRun("normal", "system-commercial-week", 1);
    const weekState = structuredClone({
      profile: useGameStore.getState().profile,
      run: useGameStore.getState().run,
    });
    const resolveAllEvents = () => {
      for (let step = 0; step < 20; step += 1) {
        const state = useGameStore.getState();
        if (state.run?.currentEvent) state.resolveEvent(0);
        const resolved = useGameStore.getState();
        if (resolved.run?.lastEventOutcome) resolved.continueEvent();
        const next = useGameStore.getState();
        if (!next.run?.currentEvent && !next.run?.lastEventOutcome) break;
      }
    };
    useGameStore.getState().chooseAction("search");
    const eventState = structuredClone({
      profile: useGameStore.getState().profile,
      run: useGameStore.getState().run,
    });
    useGameStore.getState().resolveEvent(0);
    const outcomeState = structuredClone({
      profile: useGameStore.getState().profile,
      run: useGameStore.getState().run,
    });
    resolveAllEvents();
    for (let week = 0; week < 8; week += 1) {
      if ((useGameStore.getState().run?.roster.length ?? 0) > 0) break;
      useGameStore.getState().advanceWeek();
      useGameStore.getState().chooseAction("search");
      resolveAllEvents();
    }
    const managementState = structuredClone({
      profile: useGameStore.getState().profile,
      run: useGameStore.getState().run,
    });
    useGameStore.getState().retireRun();
    const endingState = structuredClone({
      profile: useGameStore.getState().profile,
      run: useGameStore.getState().run,
    });
    return {
      week: JSON.stringify({ state: weekState, version: 11 }),
      event: JSON.stringify({ state: eventState, version: 11 }),
      outcome: JSON.stringify({ state: outcomeState, version: 11 }),
      management: JSON.stringify({ state: managementState, version: 11 }),
      ending: JSON.stringify({ state: endingState, version: 11 }),
      summary: {
        weekActionDone: managementState.run?.weekActionDone,
        currentEvent: managementState.run?.currentEvent?.id ?? null,
        lastEventOutcome: managementState.run?.lastEventOutcome?.eventId ?? null,
        roster: managementState.run?.roster ?? [],
      },
    };
  } finally {
    await vite.close();
  }
};

if (!seedDevStore) {
  throw new Error("Set MIMI_QA_SEED_STORE=1 to generate deterministic screen states.");
}
const persistedStates = await makePersistedStates();
console.log(JSON.stringify({ seededState: persistedStates.summary }));

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
const capture = (path) =>
  page.screenshot({ path, animations: "disabled", timeout: 90_000 });
await page.addInitScript(({ storageValue }) => {
  if (!localStorage.getItem("mimi-secret-boss-arena")) {
    localStorage.setItem("mimi-secret-boss-arena", storageValue);
  }
}, { storageValue: persistedStates.week });
const issues = [];

page.on("console", (message) => {
  if (message.type() === "error") issues.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => issues.push(`page: ${String(error)}`));
page.on("requestfailed", (request) => {
  issues.push(`request: ${request.url()} (${request.failure()?.errorText ?? "failed"})`);
});

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("#root > *").first().waitFor({ state: "visible", timeout: 240_000 });
  const loadingScreen = page.locator(".game-loading-screen");
  if (await loadingScreen.isVisible().catch(() => false)) {
    await loadingScreen.waitFor({ state: "hidden", timeout: 240_000 });
  }
  await page.waitForTimeout(1_000);

  await page.locator(".title-screen").waitFor({ state: "visible", timeout: 30_000 });
  const titlePath = join(outputDir, "title-800x450.png");
  await capture(titlePath);

  await page.locator(".title-menu-button", { hasText: "CONTINUE" }).click();
  try {
    await page.locator(".week-hub").waitFor({ state: "visible", timeout: 30_000 });
  } catch (error) {
    const debugPath = join(outputDir, "continue-debug-800x450.png");
    await capture(debugPath);
    const visibleMains = await page.locator("main").allTextContents();
    throw new Error(`Continue did not reach week screen. ${debugPath}\n${visibleMains.join(" | ")}`, { cause: error });
  }
  const weekPath = join(outputDir, "week-baseline-800x450.png");
  await capture(weekPath);

  const outcomePath = join(outputDir, "outcome-800x450.png");
  const eventPath = join(outputDir, "event-800x450.png");
  const flowOutcomeClicks = [];
  await page.locator(".week-action-confirm").click();
  await page.locator(".scene-screen").waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForFunction(() => {
    const image = document.querySelector(".scene-backdrop");
    return !(image instanceof HTMLImageElement) || (image.complete && image.naturalWidth > 0);
  });
  await page.waitForTimeout(350);
  await capture(eventPath);
  const eventMetrics = await page.evaluate(() => {
    const stage = document.querySelector(".scene-screen--event");
    const overlays = [
      ".event-story-ticket",
      ".scene-background-view, .scene-still-trigger .scene-image-expand",
      ".dialogue-panel",
      ".app-header",
    ];
    const stageBox = stage?.getBoundingClientRect();
    return {
      stage: stageBox
        ? {
            x: Math.round(stageBox.x),
            y: Math.round(stageBox.y),
            width: Math.round(stageBox.width),
            height: Math.round(stageBox.height),
          }
        : null,
      overlays: Object.fromEntries(
        overlays.map((selector) => {
          const element = document.querySelector(selector);
          const box = element?.getBoundingClientRect();
          return [
            selector,
            box
              ? {
                  x: Math.round(box.x),
                  y: Math.round(box.y),
                  width: Math.round(box.width),
                  height: Math.round(box.height),
                }
              : null,
          ];
        }),
      ),
      visibleButtons: Array.from(document.querySelectorAll("button"))
        .filter((button) => {
          const box = button.getBoundingClientRect();
          return box.width > 0 && box.height > 0;
        })
        .map((button) => button.getAttribute("aria-label") ?? button.title ?? button.textContent?.trim())
        .filter(Boolean),
      backdrop: (() => {
        const image = document.querySelector(".scene-backdrop");
        if (!(image instanceof HTMLImageElement)) return null;
        return {
          src: image.getAttribute("src"),
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          renderedWidth: Math.round(image.getBoundingClientRect().width),
          renderedHeight: Math.round(image.getBoundingClientRect().height),
          objectFit: getComputedStyle(image).objectFit,
          objectPosition: getComputedStyle(image).objectPosition,
        };
      })(),
    };
  });
  for (let step = 0; step < 8; step += 1) {
    const transition = page.locator(".scene-transition");
    if (await transition.isVisible().catch(() => false)) {
      await transition.waitFor({ state: "hidden", timeout: 20_000 });
    }
    if (
      await page
        .locator(".management-screen, .opening-management-screen")
        .isVisible()
        .catch(() => false)
    ) {
      break;
    }
    if (await page.locator(".scene-screen").isVisible().catch(() => false)) {
      const skip = page.locator('[aria-label="選択肢まで送る"]');
      await skip.waitFor({ state: "visible", timeout: 20_000 });
      await skip.click({ force: true });
      const choice = page
        .locator(".choice-option, .choice-panel .primary-button")
        .first();
      await choice.waitFor({ state: "visible", timeout: 20_000 });
      await choice.click({ force: true });
    }
    const outcome = page.locator(".outcome-screen");
    await outcome.waitFor({ state: "visible", timeout: 20_000 });
    if (flowOutcomeClicks.length === 0) await capture(outcomePath);
    const continueButton = page.locator(".outcome-continue");
    await continueButton.waitFor({ state: "visible", timeout: 5_000 });
    const buttonBox = await continueButton.boundingBox();
    await continueButton.click();
    await outcome.waitFor({ state: "hidden", timeout: 10_000 });
    flowOutcomeClicks.push({
      index: flowOutcomeClicks.length + 1,
      buttonBox,
      nextScreen: await page.locator("main").first().getAttribute("class"),
    });
  }
  await page
    .locator(".management-screen, .opening-management-screen")
    .waitFor({ state: "visible", timeout: 20_000 });
  const nextWeekButton = page
    .locator(
      ".opening-management__footer .primary-button, .management-nextbar .primary-button",
    )
    .first();
  await nextWeekButton.waitFor({ state: "visible", timeout: 5_000 });
  await nextWeekButton.click();
  await page.locator(".week-hub").waitFor({ state: "visible", timeout: 20_000 });
  const fullFlowFinalScreen = await page.locator("main").first().getAttribute("class");

  await page.evaluate(({ storageValue }) => {
    localStorage.setItem("mimi-secret-boss-arena", storageValue);
  }, { storageValue: persistedStates.management });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
  const managementLoading = page.locator(".game-loading-screen");
  if (await managementLoading.isVisible().catch(() => false)) {
    await managementLoading.waitFor({ state: "hidden", timeout: 240_000 });
  }
  await page.locator(".title-screen").waitFor({ state: "visible", timeout: 30_000 });
  await page.locator(".title-menu-button", { hasText: "CONTINUE" }).click();
  try {
    await page.locator(".management-screen").waitFor({ state: "visible", timeout: 30_000 });
  } catch (error) {
    const debugPath = join(outputDir, "management-debug-800x450.png");
    await capture(debugPath);
    const visibleMains = await page.locator("main").allTextContents();
    throw new Error(`Continue did not reach management. ${debugPath}\n${visibleMains.join(" | ")}`, { cause: error });
  }
  await page.waitForTimeout(500);
  const managementPath = join(outputDir, "management-800x450.png");
  await capture(managementPath);

  const managementMetrics = await page.evaluate(() => {
    const selectors = [
      ".app-header",
      ".management-screen",
      ".management-heading",
      ".management-status",
      ".management-layout",
      ".roster-panel",
      ".fighter-sheet__art",
      ".growth-panel",
      ".management-nextbar",
    ];
    return Object.fromEntries(
      selectors.map((selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return [selector, null];
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return [selector, {
          x: Math.round(box.x), y: Math.round(box.y),
          width: Math.round(box.width), height: Math.round(box.height),
          clientHeight: element.clientHeight, scrollHeight: element.scrollHeight,
          display: style.display,
          margin: style.margin,
          padding: style.padding,
          borderWidth: style.borderWidth,
          alignContent: style.alignContent,
          alignItems: style.alignItems,
        }];
      }),
    );
  });

  await page.locator('[title="殿堂と解放記録"]').click();
  await page.locator(".archive-screen").waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForTimeout(300);
  const archivePath = join(outputDir, "archive-800x450.png");
  await capture(archivePath);
  const galleryTab = page.getByRole("button", { name: /記憶画廊/ });
  if (await galleryTab.isVisible().catch(() => false)) {
    await galleryTab.click();
    await page.waitForTimeout(300);
  }
  const galleryPath = join(outputDir, "gallery-800x450.png");
  await capture(galleryPath);

  const state = await page.evaluate(() => ({
    bodyClass: document.body.className,
    rootText: document.querySelector("#root")?.textContent?.slice(0, 500) ?? "",
    viewport: { width: innerWidth, height: innerHeight },
    document: {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    },
    screens: Array.from(document.querySelectorAll("main"), (element) => element.className),
  }));

  const resumeAudit = [];
  const resumeCases = [
    ["event", persistedStates.event, ".scene-screen--event"],
    ["outcome", persistedStates.outcome, ".outcome-screen"],
    ["management", persistedStates.management, ".management-screen"],
    ["ending", persistedStates.ending, ".ending-screen"],
  ];
  for (const [name, storageValue, expectedSelector] of resumeCases) {
    const resumePage = await browser.newPage({ viewport: { width: 800, height: 450 } });
    const resumeIssues = [];
    resumePage.on("console", (message) => {
      if (message.type() === "error") resumeIssues.push(`console: ${message.text()}`);
    });
    resumePage.on("pageerror", (error) => resumeIssues.push(`page: ${String(error)}`));
    await resumePage.addInitScript(({ value }) => {
      localStorage.setItem("mimi-secret-boss-arena", value);
    }, { value: storageValue });
    await resumePage.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await resumePage.locator(".title-screen").waitFor({ state: "visible", timeout: 240_000 });
    await resumePage.locator(".title-menu-button", { hasText: "CONTINUE" }).click();
    await resumePage.locator(expectedSelector).waitFor({ state: "visible", timeout: 30_000 });
    await resumePage.waitForFunction(() =>
      Array.from(document.images)
        .filter((image) => {
          const box = image.getBoundingClientRect();
          return box.width > 0 && box.height > 0;
        })
        .every((image) => image.complete && image.naturalWidth > 0),
    );
    await resumePage.waitForTimeout(250);
    const resumePath = join(outputDir, `resume-${name}-800x450.png`);
    await resumePage.screenshot({ path: resumePath, animations: "disabled", timeout: 90_000 });
    if (name === "event") {
      const headerActionCount = await resumePage.locator(".app-header--story .header-actions > button:visible").count();
      if (headerActionCount !== 1) {
        resumeIssues.push(`event header actions: expected 1, got ${headerActionCount}`);
      }
      await resumePage.getByRole("button", { name: "ゲームメニュー" }).click();
      await resumePage.locator(".game-menu").waitFor({ state: "visible", timeout: 10_000 });
      await resumePage.getByRole("button", { name: /記録室と記憶画廊/ }).click();
      await resumePage.locator(".archive-screen").waitFor({ state: "visible", timeout: 10_000 });
      await resumePage.locator('.archive-screen [title="戻る"]').click();
      await resumePage.locator(expectedSelector).waitFor({ state: "visible", timeout: 10_000 });
      await resumePage.getByRole("button", { name: "ゲームメニュー" }).click();
      await resumePage.getByRole("button", { name: /プレイ設定/ }).click();
      await resumePage.locator(".settings-dialog").waitFor({ state: "visible", timeout: 10_000 });
      await resumePage.getByRole("button", { name: "瞬時" }).click();
      await resumePage.locator('.settings-dialog [title="閉じる"]').click();
      await resumePage.locator(expectedSelector).waitFor({ state: "visible", timeout: 10_000 });
      await resumePage.locator('.app-header [title="タイトルへ"]').click();
      await resumePage.locator(".title-screen").waitFor({ state: "visible", timeout: 10_000 });
      await resumePage.locator(".title-menu-button", { hasText: "CONTINUE" }).click();
      await resumePage.locator(expectedSelector).waitFor({ state: "visible", timeout: 10_000 });
    }
    resumeAudit.push({ name, expectedSelector, resumePath, issues: resumeIssues });
    issues.push(...resumeIssues.map((issue) => `${name} resume: ${issue}`));
    await resumePage.close();
  }

  const landscapePage = await browser.newPage({ viewport: { width: 844, height: 390 } });
  const landscapeIssues = [];
  landscapePage.on("console", (message) => {
    if (message.type() === "error") landscapeIssues.push(`console: ${message.text()}`);
  });
  landscapePage.on("pageerror", (error) => landscapeIssues.push(`page: ${String(error)}`));
  await landscapePage.addInitScript(({ storageValue }) => {
    localStorage.setItem("mimi-secret-boss-arena", storageValue);
  }, { storageValue: persistedStates.week });
  const shellUrl = new URL(baseUrl);
  shellUrl.searchParams.delete("gameCanvas");
  await landscapePage.goto(shellUrl.toString(), { waitUntil: "domcontentloaded", timeout: 60_000 });
  const gameFrame = landscapePage.frameLocator(".game-canvas-shell__frame");
  await gameFrame.locator(".title-screen").waitFor({ state: "visible", timeout: 240_000 });
  await gameFrame.locator(".title-menu-button", { hasText: "CONTINUE" }).click();
  await gameFrame.locator(".week-hub").waitFor({ state: "visible", timeout: 30_000 });
  await gameFrame.locator(".week-action-confirm").click();
  await gameFrame.locator(".scene-screen--event").waitFor({ state: "visible", timeout: 30_000 });
  await gameFrame.locator(".scene-backdrop").evaluate((image) => {
    if (image instanceof HTMLImageElement && !image.complete) {
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }
    return undefined;
  });
  await landscapePage.waitForTimeout(350);
  const landscapeEventPath = join(outputDir, "event-landscape-844x390.png");
  await landscapePage.screenshot({ path: landscapeEventPath, animations: "disabled", timeout: 90_000 });
  const landscapeMetrics = await landscapePage.evaluate(() => {
    const shell = document.querySelector(".game-canvas-shell");
    const stage = document.querySelector(".game-canvas-shell__stage");
    const frame = document.querySelector(".game-canvas-shell__frame");
    const gate = document.querySelector(".game-canvas-orientation-gate");
    const toBox = (element) => {
      const box = element?.getBoundingClientRect();
      return box
        ? {
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
          }
        : null;
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      shell: toBox(shell),
      stage: toBox(stage),
      frame: toBox(frame),
      gateDisplay: gate ? getComputedStyle(gate).display : null,
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
    };
  });
  await landscapePage.close();

  const portraitPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await portraitPage.goto(shellUrl.toString(), { waitUntil: "domcontentloaded", timeout: 60_000 });
  await portraitPage.locator(".game-canvas-orientation-gate").waitFor({ state: "visible", timeout: 30_000 });
  const portraitGatePath = join(outputDir, "portrait-orientation-gate-390x844.png");
  await portraitPage.screenshot({ path: portraitGatePath, animations: "disabled", timeout: 90_000 });
  const portraitGateVisible = await portraitPage.locator(".game-canvas-orientation-gate").isVisible();
  await portraitPage.close();

  console.log(JSON.stringify({
    titlePath,
    weekPath,
    eventPath,
    eventMetrics,
    outcomePath,
    flowOutcomeClicks,
    fullFlowFinalScreen,
    managementPath,
    archivePath,
    galleryPath,
    managementMetrics,
    state,
    resumeAudit,
    landscapeEventPath,
    landscapeMetrics,
    landscapeIssues,
    portraitGatePath,
    portraitGateVisible,
    issues,
  }, null, 2));
  if (issues.length > 0 || landscapeIssues.length > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
