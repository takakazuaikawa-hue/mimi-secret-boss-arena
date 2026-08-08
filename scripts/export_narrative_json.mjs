import { createServer } from "vite";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(
  process.argv[2] ?? resolve(root, "exports", "mimi_narrative_export.json"),
);

const server = await createServer({
  root,
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true },
});

try {
  const [
    prologue,
    opening,
    characters,
    matches,
    weekly,
    routes,
    narrative,
  ] = await Promise.all([
    server.ssrLoadModule("/src/data/prologueV2.ts"),
    server.ssrLoadModule("/src/data/openingEvents.ts"),
    server.ssrLoadModule("/src/data/characters.ts"),
    server.ssrLoadModule("/src/data/matches.ts"),
    server.ssrLoadModule("/src/data/weeklyNarratives.ts"),
    server.ssrLoadModule("/src/data/routes.ts"),
    server.ssrLoadModule("/src/narrative/legacyBlocks.ts"),
  ]);

  const sceneStages = [
    "meet",
    "join",
    "bond",
    "power",
    "crisis",
    "liberation",
    "epilogue",
  ];

  const sourcePayload = {
    schemaVersion: 2,
    projectTitle: "ミミのときめき裏ボス闘技場",
    editingRule:
      "角括弧内のIDは変更・削除しない。本文、話者名、選択肢文は自由に編集できる。",
    prologue: {
      full: prologue.fullProloguePages,
      condensed: prologue.condensedProloguePages,
    },
    openingScenes: [
      opening.ownershipTransferScene,
      opening.hotSpringTripScene,
    ],
    fighters: characters.fighterDefinitions.map((fighter) => ({
      id: fighter.id,
      name: fighter.name,
      reading: fighter.reading,
      kind: fighter.kind,
      role: fighter.role,
      summary: fighter.summary,
      currentLimit: fighter.currentLimit,
      traitName: fighter.traitName,
      traitText: fighter.traitText,
      scenes: sceneStages.map((stage) => ({
        stage,
        ...fighter.scenes[stage],
      })),
    })),
    weeklyNarratives: weekly.weeklyNarratives,
    officialMatches: matches.officialMatches,
    dominationMatches: matches.dominationAssessmentMatches,
    routes: Object.values(routes.routeDefinitions),
    narrativeBlocks: narrative.legacyNarrativeBlocks,
  };
  const sourceVersion = createHash("sha256")
    .update(JSON.stringify(sourcePayload))
    .digest("hex")
    .slice(0, 16);
  const payload = {
    ...sourcePayload,
    sourceVersion,
    exportedAt: new Date().toISOString(),
  };

  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  process.stdout.write(outputPath);
} finally {
  await server.close();
}
