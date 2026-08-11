import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.MIMI_QA_URL ?? "http://127.0.0.1:5175/";
const outputDir =
  process.env.MIMI_QA_OUTPUT ?? join(tmpdir(), "mimi-debug-navigation-qa");
const chromePath =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const targets = [
  ["title", ".title-screen"],
  ["prologue", ".scene-screen--prologue"],
  ["week", ".week-hub"],
  ["event", ".scene-screen--event"],
  ["outcome", ".outcome-screen"],
  ["management", ".management-screen, .opening-management-screen"],
  ["match-prep", ".match-prep"],
  ["battle", ".battle-screen"],
  ["ending", ".ending-screen"],
  ["archive-hall", ".archive-screen .hall-list"],
  ["archive-collection", ".archive-screen .collection-grid"],
  ["archive-charter", ".archive-screen .charter-list"],
  ["archive-gallery", ".archive-screen .memory-gallery-grid"],
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const results = [];
const issues = [];
const debugUrl = (target) => {
  const url = new URL(baseUrl);
  url.searchParams.set("gameCanvas", "1");
  url.searchParams.set("debugUi", target);
  return url.toString();
};

try {
  for (const [target, selector] of targets) {
    const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
    const pageIssues = [];
    page.on("console", (message) => {
      if (message.type() === "error") pageIssues.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => pageIssues.push(`page: ${String(error)}`));
    await page.goto(debugUrl(target), {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.locator(selector).first().waitFor({ state: "visible", timeout: 120_000 });
    const layout = await page.locator("body").evaluate((body) => ({
      width: body.clientWidth,
      scrollWidth: body.scrollWidth,
      height: body.clientHeight,
      scrollHeight: body.scrollHeight,
    }));
    if (layout.scrollWidth > layout.width) {
      pageIssues.push(`horizontal overflow: ${layout.scrollWidth}/${layout.width}`);
    }
    if (target === "archive-gallery") {
      const galleryText = await page.locator(".archive-screen").innerText();
      if (!galleryText.includes("8/8 解放")) {
        pageIssues.push("gallery fixture did not unlock all 8 memories");
      }
    }
    const screenshotPath = join(outputDir, `${target}-1280x720.png`);
    if (target.startsWith("archive-")) {
      await page.screenshot({ path: screenshotPath, animations: "disabled" });
    }
    results.push({ target, layout, screenshotPath, issues: pageIssues });
    issues.push(...pageIssues.map((issue) => `${target}: ${issue}`));
    await page.close();
  }

  const interaction = await browser.newPage({ viewport: { width: 800, height: 450 } });
  await interaction.goto(debugUrl("1"), {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  const numberInput = interaction.getByLabel("画面番号", { exact: true });
  await numberInput.fill("13");
  await numberInput.press("Enter");
  await interaction
    .locator(".archive-screen .memory-gallery-grid")
    .waitFor({ state: "visible", timeout: 30_000 });
  const interactionUrl = interaction.url();
  if (!interactionUrl.includes("debugUi=archive-gallery")) {
    issues.push(`interaction URL was not updated: ${interactionUrl}`);
  }
  await interaction.close();
} finally {
  await browser.close();
}

console.log(JSON.stringify({ results, issues }, null, 2));
if (issues.length > 0) process.exitCode = 1;
