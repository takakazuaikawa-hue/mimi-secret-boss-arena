import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const root = resolve(".");
const sourceRoots = ["src", "docs", "scripts"];
const runtimeRoots = ["src"];
const mediaExtensions = new Set([".png", ".webp", ".jpg", ".jpeg", ".ogg"]);
const textExtensions = new Set([
  ".css",
  ".html",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
]);

const walk = (directory) => {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
};

const projectPath = (path) => relative(root, path).split(sep).join("/");
const sourceFiles = sourceRoots.flatMap((directory) => walk(resolve(directory)));
const runtimeFiles = runtimeRoots.flatMap((directory) => walk(resolve(directory)));
const textFiles = sourceFiles.filter((file) =>
  textExtensions.has(extname(file).toLowerCase()),
);
const sourceText = new Map(
  textFiles.map((file) => [file, readFileSync(file, "utf8")]),
);
const allSourceText = [...sourceText.values()].join("\n");

const assetReferencePattern = /\/assets\/[A-Za-z0-9_./-]+/g;
const assetReferences = new Set(
  [...sourceText.values()].flatMap((text) =>
    [...text.matchAll(assetReferencePattern)].map((match) => match[0]),
  ),
);
const missingAssetReferences = [...assetReferences]
  .filter((reference) => !existsSync(resolve("public", reference.slice(1))))
  .sort();

const mediaFiles = walk(resolve("public", "assets")).filter((file) =>
  mediaExtensions.has(extname(file).toLowerCase()),
);
const unreferencedMedia = mediaFiles
  .filter((file) => {
    const reference = `/${projectPath(file).replace(/^public\//, "")}`;
    return !assetReferences.has(reference);
  })
  .map(projectPath)
  .sort();

const largestMedia = mediaFiles
  .map((file) => ({ path: projectPath(file), bytes: statSync(file).size }))
  .sort((left, right) => right.bytes - left.bytes)
  .slice(0, 20);

const largeSourceFiles = textFiles
  .map((file) => {
    const text = sourceText.get(file);
    return {
      path: projectPath(file),
      lines: text.split(/\r?\n/).length,
      bytes: statSync(file).size,
    };
  })
  .filter((entry) => entry.lines >= 500)
  .sort((left, right) => right.lines - left.lines);

const cssPath = resolve("src", "styles.css");
const css = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
const selectorCounts = new Map();
for (const match of css.matchAll(/(?:^|})\s*([^@{}][^{}]*)\{/g)) {
  const selector = match[1].trim();
  if (!selector || selector.includes("%") || selector === "to") continue;
  selectorCounts.set(selector, (selectorCounts.get(selector) ?? 0) + 1);
}
const repeatedCssSelectors = [...selectorCounts]
  .filter(([, count]) => count >= 4)
  .map(([selector, count]) => ({ selector, count }))
  .sort((left, right) => right.count - left.count);

const temporaryFiles = [
  ...walk(resolve("tmp")),
  ...readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^tmp[-_.]/i.test(entry.name))
    .map((entry) => resolve(entry.name)),
].map(projectPath).sort();

const markerPattern =
  /\b(?:TODO|FIXME|HACK|PLACEHOLDER|STUB)\b|未実装|仮実装|暫定/gi;
const explicitMarkers = runtimeFiles
  .filter((file) => textExtensions.has(extname(file).toLowerCase()))
  .flatMap((file) => {
    const text = readFileSync(file, "utf8");
    return [...text.matchAll(markerPattern)].map((match) => ({
      path: projectPath(file),
      marker: match[0],
      line: text.slice(0, match.index).split(/\r?\n/).length,
    }));
  });

const report = {
  generatedAt: new Date().toISOString(),
  source: {
    textFiles: textFiles.length,
    largeFiles: largeSourceFiles,
    explicitMarkers,
  },
  assets: {
    references: assetReferences.size,
    missingReferences: missingAssetReferences,
    mediaFiles: mediaFiles.length,
    unreferencedMedia,
    largestMedia,
  },
  css: {
    lines: css.split(/\r?\n/).length,
    importantDeclarations: (css.match(/!important/g) ?? []).length,
    mediaQueries: (css.match(/@media/g) ?? []).length,
    repeatedSelectors: repeatedCssSelectors,
  },
  projectHygiene: {
    temporaryFiles,
  },
  sourceContainsLegacyTitle:
    allSourceText.includes("function LegacyTitleScreen"),
};

console.log(JSON.stringify(report, null, 2));
