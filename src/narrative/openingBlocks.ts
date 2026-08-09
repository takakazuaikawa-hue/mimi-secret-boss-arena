import mainStageOneEpisodeOneSource from "./content/main.s1.ep1.json";
import mainStageOneEpisodeTwoSource from "./content/main.s1.ep2.json";
import mainStageOneEpisodeThreeSource from "./content/main.s1.ep3.json";
import mainStageOneEpisodeFourSource from "./content/main.s1.ep4.json";
import mainStageOneEpisodeFiveSource from "./content/main.s1.ep5.json";
import mainStageTwoEp1Source from "./content/main.s2.ep1.json";
import mainStageTwoEp2Source from "./content/main.s2.ep2.json";
import mainStageTwoEp3Source from "./content/main.s2.ep3.json";
import mainStageTwoEp4Source from "./content/main.s2.ep4.json";
import mainStageTwoEp5Source from "./content/main.s2.ep5.json";
import mainStageThreeEp1Source from "./content/main.s3.ep1.json";
import mainStageThreeEp2Source from "./content/main.s3.ep2.json";
import mainStageThreeEp3Source from "./content/main.s3.ep3.json";
import mainStageThreeEp4Source from "./content/main.s3.ep4.json";
import mainStageThreeEp5Source from "./content/main.s3.ep5.json";
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

export const mainStageTwoEpisodeBlocks = [
  mainStageTwoEp1Source,
  mainStageTwoEp2Source,
  mainStageTwoEp3Source,
  mainStageTwoEp4Source,
  mainStageTwoEp5Source,
].map((source) => narrativeEventBlockSchema.parse(source));

export const mainStageThreeEpisodeBlocks = [
  mainStageThreeEp1Source,
  mainStageThreeEp2Source,
  mainStageThreeEp3Source,
  mainStageThreeEp4Source,
  mainStageThreeEp5Source,
].map((source) => narrativeEventBlockSchema.parse(source));

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
  ...mainStageTwoEpisodeBlocks,
  ...mainStageThreeEpisodeBlocks,
];

export const legacyOpeningNarrativeBlockById = new Map(
  legacyOpeningNarrativeBlocks.map((block) => [block.id, block]),
);


