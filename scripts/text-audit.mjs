import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const files = [
  "src/data/prologue.ts",
  "src/data/characters.ts",
  "src/data/characterStoryExpansions.ts",
  "src/data/weeklyNarratives.ts",
  "src/data/ambientEvents.ts",
  "src/data/extendedAmbientEvents.ts",
  "src/data/routeEvents.ts",
  "src/data/matches.ts",
  "src/data/items.ts",
];

const japanese = /[\u3040-\u30ff\u3400-\u9fff]/;
const results = [];

for (const file of files) {
  const sourceText = readFileSync(resolve(file), "utf8");
  const source = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let strings = 0;
  let characters = 0;
  let longest = 0;

  const visit = (node) => {
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      japanese.test(node.text)
    ) {
      strings += 1;
      characters += node.text.length;
      longest = Math.max(longest, node.text.length);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  results.push({ file, strings, characters, longest });
}

const totals = results.reduce(
  (sum, entry) => ({
    strings: sum.strings + entry.strings,
    characters: sum.characters + entry.characters,
  }),
  { strings: 0, characters: 0 },
);

console.table(results);
console.log(
  JSON.stringify(
    {
      totals,
      scenes: {
        fighterStoryArcs: 15,
        fighterScenes: 15 * 7,
        ambientEvents: 80,
      },
    },
    null,
    2,
  ),
);
