import type { RunState } from "../game/types";
import { legacyNarrativeBlockById } from "./legacyBlocks";
import { legacyFlagAliasToId } from "./registry/flags";
import { asEventId } from "./schema";

const addUnique = (values: string[], value: string) =>
  values.includes(value) ? values : [...values, value];

const migrateFlagList = (source: readonly string[]) => {
  let flags = [...source];

  source.forEach((entry) => {
    const canonicalFlagId = legacyFlagAliasToId.get(entry);
    if (canonicalFlagId) {
      flags = addUnique(flags, canonicalFlagId);
    }

    const legacyChoice = entry.match(/^choice:(.+):(\d+)$/);
    if (!legacyChoice) return;
    const [, sceneId, indexText] = legacyChoice;
    const block = legacyNarrativeBlockById.get(asEventId(sceneId));
    const choice = block?.nodes
      .find((node) => node.type === "choice")
      ?.choices.at(Number(indexText));
    if (choice) {
      flags = addUnique(flags, `choice:${choice.id}`);
    }
  });

  return flags;
};

export const migrateNarrativeRunState = (source: RunState): RunState => {
  const currentEvent = source.currentEvent;
  const currentBlock = currentEvent
    ? legacyNarrativeBlockById.get(asEventId(currentEvent.scene.id))
    : undefined;

  return {
    ...source,
    flags: migrateFlagList(source.flags),
    ...(currentEvent
      ? {
          currentEvent: {
            ...currentEvent,
            ...(currentBlock
              ? { narrativeBlockId: currentBlock.id }
              : {}),
          },
        }
      : {}),
  };
};
