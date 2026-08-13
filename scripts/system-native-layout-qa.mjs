import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.MIMI_QA_URL ?? "http://127.0.0.1:5175/";
const outputDir =
  process.env.MIMI_QA_OUTPUT ?? join(tmpdir(), "mimi-system-native-layout-qa");
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
  ["ending", ".ending-screen"],
  ["archive-hall", ".archive-screen .hall-list"],
  ["archive-collection", ".archive-screen .collection-grid"],
  ["archive-charter", ".archive-screen .charter-list"],
  ["archive-gallery", ".archive-screen .memory-gallery-grid"],
];

const requested = new Set(
  (process.env.MIMI_QA_TARGETS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const targetsToRun = requested.size
  ? targets.filter(([target]) => requested.has(target))
  : targets;

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
});
const report = [];

const debugUrl = (target) => {
  const url = new URL(baseUrl);
  url.searchParams.set("gameCanvas", "1");
  url.searchParams.set("debugUi", target);
  return url.toString();
};

try {
  for (const [target, selector] of targetsToRun) {
    const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
    const runtimeIssues = [];
    page.on("console", (message) => {
      if (message.type() === "error") runtimeIssues.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => runtimeIssues.push(`page: ${String(error)}`));
    page.on("requestfailed", (request) =>
      runtimeIssues.push(
        `request: ${request.url()} (${request.failure()?.errorText ?? "failed"})`,
      ),
    );

    await page.goto(debugUrl(target), {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const screen = page.locator(selector).first();
    await screen.waitFor({ state: "visible", timeout: 120_000 });
    await page.waitForFunction(() =>
      Array.from(document.images)
        .filter((image) => {
          const box = image.getBoundingClientRect();
          return box.width > 0 && box.height > 0;
        })
        .every((image) => image.complete),
    );
    await page.waitForTimeout(250);

    const metrics = await screen.evaluate((root) => {
      const viewport = { width: innerWidth, height: innerHeight };
      const roundBox = (box) => ({
        x: Math.round(box.x * 10) / 10,
        y: Math.round(box.y * 10) / 10,
        width: Math.round(box.width * 10) / 10,
        height: Math.round(box.height * 10) / 10,
        right: Math.round(box.right * 10) / 10,
        bottom: Math.round(box.bottom * 10) / 10,
      });
      const isVisible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0 &&
          box.width > 0 &&
          box.height > 0
        );
      };
      const selectorFor = (element) => {
        const id = element.id ? `#${element.id}` : "";
        const classes = Array.from(element.classList).slice(0, 3).join(".");
        return `${element.tagName.toLowerCase()}${id}${classes ? `.${classes}` : ""}`;
      };
      const visible = Array.from(root.querySelectorAll("*"))
        .filter(isVisible);
      const textNodes = visible
        .map((element) => {
          const ownText = Array.from(element.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent?.trim() ?? "")
            .join(" ")
            .trim();
          if (!ownText) return null;
          const style = getComputedStyle(element);
          return {
            selector: selectorFor(element),
            text: ownText.slice(0, 80),
            fontSize: Math.round(Number.parseFloat(style.fontSize) * 10) / 10,
            lineHeight: style.lineHeight,
            color: style.color,
            box: roundBox(element.getBoundingClientRect()),
          };
        })
        .filter(Boolean);
      const controls = visible
        .filter(
          (element) =>
            element.matches("button, input, select, textarea, [role='button']") &&
            !element.closest(".debug-screen-nav"),
        )
        .map((element) => ({
          selector: selectorFor(element),
          label:
            element.getAttribute("aria-label") ??
            element.getAttribute("title") ??
            element.textContent?.trim().slice(0, 80) ??
            "",
          box: roundBox(element.getBoundingClientRect()),
          fontSize:
            Math.round(Number.parseFloat(getComputedStyle(element).fontSize) * 10) /
            10,
        }));
      const images = Array.from(root.querySelectorAll("img"))
        .filter(isVisible)
        .map((image) => {
          const box = image.getBoundingClientRect();
          const style = getComputedStyle(image);
          return {
            selector: selectorFor(image),
            src: image.getAttribute("src"),
            alt: image.getAttribute("alt"),
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            renderedWidth: Math.round(box.width),
            renderedHeight: Math.round(box.height),
            scaleX:
              image.naturalWidth > 0
                ? Math.round((box.width / image.naturalWidth) * 100) / 100
                : null,
            scaleY:
              image.naturalHeight > 0
                ? Math.round((box.height / image.naturalHeight) * 100) / 100
                : null,
            objectFit: style.objectFit,
            objectPosition: style.objectPosition,
          };
        });
      const overflow = visible
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return (
            box.left < -0.5 ||
            box.right > viewport.width + 0.5 ||
            box.top < -0.5 ||
            box.bottom > viewport.height + 0.5 ||
            element.scrollWidth > element.clientWidth + 1 ||
            element.scrollHeight > element.clientHeight + 1
          );
        })
        .slice(0, 40)
        .map((element) => ({
          selector: selectorFor(element),
          box: roundBox(element.getBoundingClientRect()),
          client: [element.clientWidth, element.clientHeight],
          scroll: [element.scrollWidth, element.scrollHeight],
        }));
      const edgeCandidates = visible
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return box.width > viewport.width * 0.35 && box.bottom > viewport.height - 90;
        })
        .map((element) => ({
          selector: selectorFor(element),
          box: roundBox(element.getBoundingClientRect()),
        }))
        .sort((a, b) => b.box.bottom - a.box.bottom || b.box.width - a.box.width)
        .slice(0, 12);
      const rootBox = roundBox(root.getBoundingClientRect());
      return {
        viewport,
        rootBox,
        rootEdgeGap: {
          left: rootBox.x,
          right: Math.round((viewport.width - rootBox.right) * 10) / 10,
          bottom: Math.round((viewport.height - rootBox.bottom) * 10) / 10,
        },
        text: {
          minimum: textNodes.length
            ? Math.min(...textNodes.map((item) => item.fontSize))
            : null,
          below10: textNodes.filter((item) => item.fontSize < 10),
          below12: textNodes.filter((item) => item.fontSize >= 10 && item.fontSize < 12),
        },
        controls: {
          total: controls.length,
          under32: controls.filter(
            (item) => item.box.width < 32 || item.box.height < 32,
          ),
        },
        images,
        upscaledImages: images.filter(
          (item) => (item.scaleX ?? 0) > 1.1 || (item.scaleY ?? 0) > 1.1,
        ),
        overflow,
        edgeCandidates,
        body: {
          clientWidth: document.body.clientWidth,
          clientHeight: document.body.clientHeight,
          scrollWidth: document.body.scrollWidth,
          scrollHeight: document.body.scrollHeight,
        },
      };
    });

    const screenshotPath = join(outputDir, `${target}-800x450.png`);
    await page.screenshot({
      path: screenshotPath,
      animations: "disabled",
      timeout: 90_000,
    });
    report.push({ target, screenshotPath, runtimeIssues, metrics });
    await page.close();
  }
} finally {
  await browser.close();
}

const reportPath = join(outputDir, "report.json");
await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
console.log(
  JSON.stringify(
    {
      outputDir,
      reportPath,
      summary: report.map(({ target, runtimeIssues, metrics }) => ({
        target,
        runtimeIssues,
        rootEdgeGap: metrics.rootEdgeGap,
        minimumFontSize: metrics.text.minimum,
        textBelow10: metrics.text.below10.length,
        textBelow12: metrics.text.below12.length,
        controlsUnder32: metrics.controls.under32.length,
        upscaledImages: metrics.upscaledImages.length,
        overflow: metrics.overflow.length,
      })),
    },
    null,
    2,
  ),
);
