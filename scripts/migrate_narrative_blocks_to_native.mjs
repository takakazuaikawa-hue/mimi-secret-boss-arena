import { createServer } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const idsArgument = process.argv[2];
const outputDirectory = resolve(
  process.argv[3] ?? resolve(root, "src", "narrative", "content"),
);

if (!idsArgument) {
  throw new Error(
    "Usage: node scripts/migrate_narrative_blocks_to_native.mjs <id,id,...> [output-directory]",
  );
}

const requestedIds = idsArgument
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const server = await createServer({
  root,
  appType: "custom",
  logLevel: "error",
  server: { middlewareMode: true },
});

const pad = (value, width = 3) => String(value).padStart(width, "0");

const migrateBlock = (source) => {
  const assetIdMap = new Map();
  const assetCounters = new Map();
  const assets = source.presentation.assets.map((asset) => {
    const nextIndex = (assetCounters.get(asset.kind) ?? 0) + 1;
    assetCounters.set(asset.kind, nextIndex);
    const id = `${source.id}.asset.${asset.kind}.${pad(nextIndex)}`;
    assetIdMap.set(asset.id, id);
    return { ...asset, id };
  });

  const nodeIdMap = new Map();
  const counters = new Map();
  source.nodes.forEach((node) => {
    const nextIndex = (counters.get(node.type) ?? 0) + 1;
    counters.set(node.type, nextIndex);
    nodeIdMap.set(
      node.id,
      `${source.id}.node.${node.type}.${pad(nextIndex)}`,
    );
  });

  let lineIndex = 0;
  let choiceIndex = 0;
  const nodes = source.nodes.map((node) => {
    const id = nodeIdMap.get(node.id);
    if (node.type === "line") {
      lineIndex += 1;
      return {
        ...node,
        id,
        lineId: `${source.id}.line.${pad(lineIndex)}`,
      };
    }
    if (node.type === "direction") {
      const command =
        "assetId" in node.command
          ? {
              ...node.command,
              assetId: assetIdMap.get(node.command.assetId),
            }
          : node.command;
      return { ...node, id, command };
    }
    if (node.type === "choice") {
      return {
        ...node,
        id,
        choices: node.choices.map((choice) => {
          choiceIndex += 1;
          return {
            ...choice,
            id: `${source.id}.choice.${pad(choiceIndex)}`,
            goto: nodeIdMap.get(choice.goto) ?? choice.goto,
          };
        }),
      };
    }
    if (node.type === "jump") {
      return {
        ...node,
        id,
        target: nodeIdMap.get(node.target) ?? node.target,
      };
    }
    return { ...node, id };
  });

  return {
    ...source,
    presentation: { ...source.presentation, assets },
    nodes,
    debug: {
      ...source.debug,
      sourceDocument: "native narrative block migration",
      authorNote:
        "正式IDへ移行済み。以後の本文・選択肢・演出変更はこのブロックを正本とする。",
      legacyGeneratedIds: false,
    },
  };
};

try {
  const narrative = await server.ssrLoadModule(
    "/src/narrative/legacyBlocks.ts",
  );
  await mkdir(outputDirectory, { recursive: true });

  const results = [];
  for (const id of requestedIds) {
    const source = narrative.legacyNarrativeBlockById.get(id);
    if (!source) throw new Error(`Narrative block not found: ${id}`);
    const migrated = migrateBlock(source);
    const outputPath = resolve(outputDirectory, `${id}.json`);
    await writeFile(
      outputPath,
      `${JSON.stringify(migrated, null, 2)}\n`,
      "utf8",
    );
    results.push({
      id,
      file: basename(outputPath),
      lines: migrated.nodes.filter((node) => node.type === "line").length,
      choices: migrated.nodes
        .filter((node) => node.type === "choice")
        .reduce((sum, node) => sum + node.choices.length, 0),
      assets: migrated.presentation.assets.length,
    });
  }

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
} finally {
  await server.close();
}
