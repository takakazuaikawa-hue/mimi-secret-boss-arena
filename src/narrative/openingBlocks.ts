import mainStageOneEpisodeOneSource from "./content/main.s1.ep1.json";
import mainStageOneEpisodeTwoSource from "./content/main.s1.ep2.json";
import mainStageOneEpisodeThreeSource from "./content/main.s1.ep3.json";
import mainStageOneEpisodeFourSource from "./content/main.s1.ep4.json";
import mainStageOneEpisodeFiveSource from "./content/main.s1.ep5.json";
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

export const mainStageOneEpisodeThreeBlock = narrativeEventBlockSchema.parse(
  mainStageOneEpisodeThreeSource,
);

export const mainStageOneEpisodeFourBlock = narrativeEventBlockSchema.parse(
  mainStageOneEpisodeFourSource,
);

export const mainStageOneEpisodeFiveBlock = narrativeEventBlockSchema.parse(
  mainStageOneEpisodeFiveSource,
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
  mainStageOneEpisodeThreeBlock,
  mainStageOneEpisodeFourBlock,
  mainStageOneEpisodeFiveBlock,
];

export const legacyOpeningNarrativeBlockById = new Map(
  legacyOpeningNarrativeBlocks.map((block) => [block.id, block]),
);

