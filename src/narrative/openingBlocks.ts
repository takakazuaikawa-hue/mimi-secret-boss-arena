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
import mainStageOneWeek04Source from "./content/main.s1.w04.json";
import mainStageOneWeek05Source from "./content/main.s1.w05.json";
import mainStageOneWeek08Source from "./content/main.s1.w08.json";
import mainStageOneWeek09Source from "./content/main.s1.w09.json";
import mainStageOneWeek10Source from "./content/main.s1.w10.json";
import mainStageOneWeek11Source from "./content/main.s1.w11.json";
import mainStageOneWeek12Source from "./content/main.s1.w12.json";
import mainStageOneWeek13Source from "./content/main.s1.w13.json";
import mainStageOneWeek14Source from "./content/main.s1.w14.json";
import mainStageOneWeek15Source from "./content/main.s1.w15.json";
import mainStageOneWeek16Source from "./content/main.s1.w16.json";
import mainStageOneWeek17Source from "./content/main.s1.w17.json";
import mainStageOneWeek18Source from "./content/main.s1.w18.json";
import mainStageOneWeek19Source from "./content/main.s1.w19.json";
import mainStageOneWeek20Source from "./content/main.s1.w20.json";
import mainStageOneWeek21Source from "./content/main.s1.w21.json";
import mainStageOneWeek22Source from "./content/main.s1.w22.json";
import mainStageOneWeek23Source from "./content/main.s1.w23.json";
import mainStageOneWeek24Source from "./content/main.s1.w24.json";
import mainStageOneWeek25Source from "./content/main.s1.w25.json";
import mainStageOneWeek26Source from "./content/main.s1.w26.json";
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

export const mainStageOneWeeklyBlocks = [
  mainStageOneWeek04Source,
  mainStageOneWeek05Source,
  mainStageOneWeek08Source,
  mainStageOneWeek09Source,
  mainStageOneWeek10Source,
  mainStageOneWeek11Source,
  mainStageOneWeek12Source,
  mainStageOneWeek13Source,
  mainStageOneWeek14Source,
  mainStageOneWeek15Source,
  mainStageOneWeek16Source,
  mainStageOneWeek17Source,
  mainStageOneWeek18Source,
  mainStageOneWeek19Source,
  mainStageOneWeek20Source,
  mainStageOneWeek21Source,
  mainStageOneWeek22Source,
  mainStageOneWeek23Source,
  mainStageOneWeek24Source,
  mainStageOneWeek25Source,
  mainStageOneWeek26Source,
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
  ...mainStageOneWeeklyBlocks,
  ...mainStageTwoEpisodeBlocks,
  ...mainStageThreeEpisodeBlocks,
];

export const legacyOpeningNarrativeBlockById = new Map(
  legacyOpeningNarrativeBlocks.map((block) => [block.id, block]),
);


