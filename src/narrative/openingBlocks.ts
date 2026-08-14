import mainStageOneEveGidonoSource from "./content/main.s1.eve.gidonozeaas.json";
import mainStageOneEveMinatoSource from "./content/main.s1.eve.minato.json";
import mainStageOneEveTeireiSource from "./content/main.s1.eve.teirei.json";
import mainStageOneEvePeonySource from "./content/main.s1.eve.peony.json";
import mainStageOneEveUshiroSource from "./content/main.s1.eve.ushiro.json";
import mainStageOneWeek01Source from "./content/main.s1.w01.json";
import mainStageOneWeek02Source from "./content/main.s1.w02.json";
import mainStageOneWeek03Source from "./content/main.s1.w03.json";
import mainStageOneWeek06Source from "./content/main.s1.w06.json";
import mainStageOneWeek07Source from "./content/main.s1.w07.json";
import mainStageTwoEp1Source from "./content/main.s2.ep1.json";
import mainStageTwoEp2Source from "./content/main.s2.ep2.json";
import mainStageTwoEp3Source from "./content/main.s2.ep3.json";
import mainStageTwoEp4Source from "./content/main.s2.ep4.json";
import mainStageTwoEp5Source from "./content/main.s2.ep5.json";
import mainStageTwoWeek01Source from "./content/main.s2.w01.json";
import mainStageTwoWeek02Source from "./content/main.s2.w02.json";
import mainStageTwoWeek03Source from "./content/main.s2.w03.json";
import mainStageTwoWeek04Source from "./content/main.s2.w04.json";
import mainStageTwoWeek05Source from "./content/main.s2.w05.json";
import mainStageTwoWeek06Source from "./content/main.s2.w06.json";
import mainStageTwoWeek07Source from "./content/main.s2.w07.json";
import mainStageTwoWeek08Source from "./content/main.s2.w08.json";
import mainStageTwoWeek09Source from "./content/main.s2.w09.json";
import mainStageTwoWeek10Source from "./content/main.s2.w10.json";
import mainStageTwoWeek11Source from "./content/main.s2.w11.json";
import mainStageTwoWeek12Source from "./content/main.s2.w12.json";
import mainStageTwoWeek13Source from "./content/main.s2.w13.json";
import mainStageTwoWeek14Source from "./content/main.s2.w14.json";
import mainStageTwoWeek15Source from "./content/main.s2.w15.json";
import mainStageTwoWeek16Source from "./content/main.s2.w16.json";
import mainStageTwoWeek17Source from "./content/main.s2.w17.json";
import mainStageTwoWeek18Source from "./content/main.s2.w18.json";
import mainStageTwoWeek19Source from "./content/main.s2.w19.json";
import mainStageTwoWeek20Source from "./content/main.s2.w20.json";
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

export const mainStageTwoEpisodeBlocks = [
  mainStageTwoEp1Source,
  mainStageTwoEp2Source,
  mainStageTwoEp3Source,
  mainStageTwoEp4Source,
  mainStageTwoEp5Source,
].map((source) => narrativeEventBlockSchema.parse(source));

// 第二区分の週替わりメイン本体。添字0=週1、添字1=週2、…、添字19=週20。
// エンジンの mainStoryEpisodes が添字で参照するため、途中挿入はしないこと。
export const mainStageTwoWeeklyBlocks = [
  mainStageTwoWeek01Source,
  mainStageTwoWeek02Source,
  mainStageTwoWeek03Source,
  mainStageTwoWeek04Source,
  mainStageTwoWeek05Source,
  mainStageTwoWeek06Source,
  mainStageTwoWeek07Source,
  mainStageTwoWeek08Source,
  mainStageTwoWeek09Source,
  mainStageTwoWeek10Source,
  mainStageTwoWeek11Source,
  mainStageTwoWeek12Source,
  mainStageTwoWeek13Source,
  mainStageTwoWeek14Source,
  mainStageTwoWeek15Source,
  mainStageTwoWeek16Source,
  mainStageTwoWeek17Source,
  mainStageTwoWeek18Source,
  mainStageTwoWeek19Source,
  mainStageTwoWeek20Source,
].map((source) => narrativeEventBlockSchema.parse(source));

export const mainStageThreeEpisodeBlocks = [
  mainStageThreeEp1Source,
  mainStageThreeEp2Source,
  mainStageThreeEp3Source,
  mainStageThreeEp4Source,
  mainStageThreeEp5Source,
].map((source) => narrativeEventBlockSchema.parse(source));

// 週替わりメインの本体。末尾5つ(添字21〜25)は週1・2・3・6・7ぶん。
// 添字はエンジンの mainStoryEpisodes が参照するため、途中挿入はしないこと。
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
  mainStageOneWeek01Source,
  mainStageOneWeek02Source,
  mainStageOneWeek03Source,
  mainStageOneWeek06Source,
  mainStageOneWeek07Source,
].map((source) => narrativeEventBlockSchema.parse(source));

// 本命の前夜シーン(週25の本命選択から連鎖再生)。人物IDで引く。
export const mainStageOneEveBlocks = new Map(
  [
    ["gidonozeaas", mainStageOneEveGidonoSource],
    ["minato", mainStageOneEveMinatoSource],
    ["teirei", mainStageOneEveTeireiSource],
    ["peony", mainStageOneEvePeonySource],
    ["ushiro", mainStageOneEveUshiroSource],
  ].map(([fighterId, source]) => [
    fighterId as string,
    narrativeEventBlockSchema.parse(source),
  ]),
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
  ...mainStageOneWeeklyBlocks,
  ...mainStageOneEveBlocks.values(),
  ...mainStageTwoWeeklyBlocks,
  ...mainStageThreeEpisodeBlocks,
];

export const legacyOpeningNarrativeBlockById = new Map(
  legacyOpeningNarrativeBlocks.map((block) => [block.id, block]),
);


