import { legacyCharacterNarrativeBlocks } from "./characterBlocks";
import { legacyOpeningNarrativeBlocks } from "./openingBlocks";
import type { NarrativeEventBlock } from "./schema";
import { legacyWorldNarrativeBlocks } from "./worldBlocks";

export const legacyNarrativeBlocks: NarrativeEventBlock[] = [
  ...legacyOpeningNarrativeBlocks,
  ...legacyCharacterNarrativeBlocks,
  ...legacyWorldNarrativeBlocks,
];

export const legacyNarrativeBlockById = new Map(
  legacyNarrativeBlocks.map((block) => [block.id, block]),
);
