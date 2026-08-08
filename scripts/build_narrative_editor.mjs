import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const sourcePath = path.join(projectRoot, "exports", "mimi_narrative_export.json");
const templatePath = path.join(scriptDir, "narrative_editor.template.html");
const publicPath = path.join(projectRoot, "public", "text-editor.html");
const exportPath = path.join(
  projectRoot,
  "exports",
  "ミミのときめき裏ボス闘技場_テキスト編集ツール.html",
);

const [sourceText, template] = await Promise.all([
  fs.readFile(sourcePath, "utf8"),
  fs.readFile(templatePath, "utf8"),
]);

const source = JSON.parse(sourceText);
const safeSource = JSON.stringify(source)
  .replaceAll("<", "\\u003c")
  .replaceAll("\u2028", "\\u2028")
  .replaceAll("\u2029", "\\u2029");

const output = template.replace("__NARRATIVE_SOURCE_JSON__", safeSource);
if (output === template) {
  throw new Error("Narrative source placeholder was not found.");
}

await Promise.all([
  fs.writeFile(publicPath, output, "utf8"),
  fs.writeFile(exportPath, output, "utf8"),
]);

console.log(
  JSON.stringify(
    {
      publicPath,
      exportPath,
      bytes: Buffer.byteLength(output),
      sourceExportedAt: source.exportedAt,
    },
    null,
    2,
  ),
);
