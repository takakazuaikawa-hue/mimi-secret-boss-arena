import mainStageOneEpisodeOneSource from "./content/main.s1.ep1.json";
import mainStageOneEpisodeTwoSource from "./content/main.s1.ep2.json";
import openingHotSpringSource from "./content/opening.hot-spring-trip.json";
import openingOwnershipSource from "./content/opening.owner-transfer.json";
import {
  narrativeEventBlockSchema,
  type NarrativeEventBlock,
} from "./schema";

export const mainStageOneEpisodeOneBlock = narrativeEventBlockSchema.parse(
  mainStageOneEpisodeOneSource,
);

export const mainStageOneEpisodeTwoBlock = narrativeEventBlockSchema.parse(
  mainStageOneEpisodeTwoSource,
);

export const openingOwnershipBlock = narrativeEventBlockSchema.parse(
  openingOwnershipSource,
);

export const openingHotSpringBlock = narrativeEventBlockSchema.parse(
  openingHotSpringSource,
);

export const legacyOpeningNarrativeBlocks: NarrativeEventBlock[] = [
  openingOwnershipBlock,
  openingHotSpringBlock,
  mainStageOneEpisodeOneBlock,
  mainStageOneEpisodeTwoBlock,
];

export const legacyOpeningNarrativeBlockById = new Map(
  legacyOpeningNarrativeBlocks.map((block) => [block.id, block]),
);
