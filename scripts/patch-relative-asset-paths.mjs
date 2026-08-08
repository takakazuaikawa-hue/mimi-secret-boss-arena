// GitHub Pages などサブパス配信向けに、dist 内の絶対アセット参照を相対化する。
// `vite build --base=./` が書き換えない残り(JS文字列リテラル、CSSのpublic参照、
// HTML内の残存絶対参照)を対象にする。
//
// 置換規則:
// - .html / .js: "/assets/ → "assets/  (文書URL基準で解決されるため)
// - .css:        url(/assets/ → url(../assets/  (CSSファイル位置基準で解決されるため)
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const distDir = join(process.cwd(), "dist");

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

let patchedFiles = 0;
let replacements = 0;

for (const file of walk(distDir)) {
  const ext = extname(file);
  if (![".html", ".js", ".css"].includes(ext)) continue;
  const source = readFileSync(file, "utf8");
  let next = source;
  if (ext === ".css") {
    next = next
      .replaceAll("url(/assets/", "url(../assets/")
      .replaceAll('url("/assets/', 'url("../assets/')
      .replaceAll("url('/assets/", "url('../assets/");
  } else {
    next = next
      .replaceAll('"/assets/', '"assets/')
      .replaceAll("'/assets/", "'assets/")
      .replaceAll("`/assets/", "`assets/")
      // Zodのアセットパス検証 /^\/assets\// を相対化後の値も通す形に緩める。
      .replaceAll(
        String.raw`/^\/assets\//`,
        String.raw`/^\/?assets\//`,
      );
  }
  if (next !== source) {
    const count =
      source.split("/assets/").length - next.split("/assets/").length;
    writeFileSync(file, next);
    patchedFiles += 1;
    replacements += count;
  }
}

// 置換漏れの検査。残っていれば失敗させる。
const leftovers = [];
for (const file of walk(distDir)) {
  if (![".html", ".js", ".css"].includes(extname(file))) continue;
  const text = readFileSync(file, "utf8");
  if (
    text.includes('"/assets/') ||
    text.includes("'/assets/") ||
    text.includes("url(/assets/")
  ) {
    leftovers.push(file);
  }
}

if (leftovers.length > 0) {
  console.error("絶対パスが残っています:", leftovers);
  process.exit(1);
}

console.log(
  `相対化完了: ${patchedFiles}ファイル、${replacements}箇所を置換しました。`,
);
