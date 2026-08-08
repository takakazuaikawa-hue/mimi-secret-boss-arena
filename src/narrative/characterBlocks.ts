import { fighterDefinitions } from "../data/characters";
import type { FighterDefinition } from "../game/types";
import { adaptLegacyScene } from "./legacySceneAdapter";
import amaraBondSource from "./content/amara.bond.json";
import amaraCrisisSource from "./content/amara.crisis.json";
import amaraEpilogueSource from "./content/amara.epilogue.json";
import amaraJoinSource from "./content/amara.join.json";
import amaraLiberationSource from "./content/amara.liberation.json";
import amaraMeetSource from "./content/amara.meet.json";
import amaraPowerSource from "./content/amara.power.json";
import cassimBellBondSource from "./content/cassim-bell.bond.json";
import cassimBellCrisisSource from "./content/cassim-bell.crisis.json";
import cassimBellEpilogueSource from "./content/cassim-bell.epilogue.json";
import cassimBellJoinSource from "./content/cassim-bell.join.json";
import cassimBellLiberationSource from "./content/cassim-bell.liberation.json";
import cassimBellMeetSource from "./content/cassim-bell.meet.json";
import cassimBellPowerSource from "./content/cassim-bell.power.json";
import gidonoBondSource from "./content/gidonozeaas.bond.json";
import gidonoCrisisSource from "./content/gidonozeaas.crisis.json";
import gidonoEpilogueSource from "./content/gidonozeaas.epilogue.json";
import gidonoJoinSource from "./content/gidonozeaas.join.json";
import gidonoLiberationSource from "./content/gidonozeaas.liberation.json";
import gidonoMeetSource from "./content/gidonozeaas.meet.json";
import gidonoPowerSource from "./content/gidonozeaas.power.json";
import marianBondSource from "./content/marian.bond.json";
import marianCrisisSource from "./content/marian.crisis.json";
import marianEpilogueSource from "./content/marian.epilogue.json";
import marianJoinSource from "./content/marian.join.json";
import marianLiberationSource from "./content/marian.liberation.json";
import marianMeetSource from "./content/marian.meet.json";
import marianPowerSource from "./content/marian.power.json";
import minatoBondSource from "./content/minato.bond.json";
import minatoCrisisSource from "./content/minato.crisis.json";
import minatoEpilogueSource from "./content/minato.epilogue.json";
import minatoJoinSource from "./content/minato.join.json";
import minatoLiberationSource from "./content/minato.liberation.json";
import minatoMeetSource from "./content/minato.meet.json";
import minatoPowerSource from "./content/minato.power.json";
import nightEaterBondSource from "./content/night-eater.bond.json";
import nightEaterCrisisSource from "./content/night-eater.crisis.json";
import nightEaterEpilogueSource from "./content/night-eater.epilogue.json";
import nightEaterJoinSource from "./content/night-eater.join.json";
import nightEaterLiberationSource from "./content/night-eater.liberation.json";
import nightEaterMeetSource from "./content/night-eater.meet.json";
import nightEaterPowerSource from "./content/night-eater.power.json";
import peonyBondSource from "./content/peony.bond.json";
import peonyCrisisSource from "./content/peony.crisis.json";
import peonyEpilogueSource from "./content/peony.epilogue.json";
import peonyJoinSource from "./content/peony.join.json";
import peonyLiberationSource from "./content/peony.liberation.json";
import peonyMeetSource from "./content/peony.meet.json";
import peonyPowerSource from "./content/peony.power.json";
import roomSeventeenBondSource from "./content/room-seventeen.bond.json";
import roomSeventeenCrisisSource from "./content/room-seventeen.crisis.json";
import roomSeventeenEpilogueSource from "./content/room-seventeen.epilogue.json";
import roomSeventeenJoinSource from "./content/room-seventeen.join.json";
import roomSeventeenLiberationSource from "./content/room-seventeen.liberation.json";
import roomSeventeenMeetSource from "./content/room-seventeen.meet.json";
import roomSeventeenPowerSource from "./content/room-seventeen.power.json";
import rinneBondSource from "./content/rinne.bond.json";
import rinneCrisisSource from "./content/rinne.crisis.json";
import rinneEpilogueSource from "./content/rinne.epilogue.json";
import rinneJoinSource from "./content/rinne.join.json";
import rinneLiberationSource from "./content/rinne.liberation.json";
import rinneMeetSource from "./content/rinne.meet.json";
import rinnePowerSource from "./content/rinne.power.json";
import mumyoBondSource from "./content/mumyo.bond.json";
import mumyoCrisisSource from "./content/mumyo.crisis.json";
import mumyoEpilogueSource from "./content/mumyo.epilogue.json";
import mumyoJoinSource from "./content/mumyo.join.json";
import mumyoLiberationSource from "./content/mumyo.liberation.json";
import mumyoMeetSource from "./content/mumyo.meet.json";
import mumyoPowerSource from "./content/mumyo.power.json";
import sazanamiBondSource from "./content/sazanami.bond.json";
import sazanamiCrisisSource from "./content/sazanami.crisis.json";
import sazanamiEpilogueSource from "./content/sazanami.epilogue.json";
import sazanamiJoinSource from "./content/sazanami.join.json";
import sazanamiLiberationSource from "./content/sazanami.liberation.json";
import sazanamiMeetSource from "./content/sazanami.meet.json";
import sazanamiPowerSource from "./content/sazanami.power.json";
import shaharBondSource from "./content/shahar.bond.json";
import shaharCrisisSource from "./content/shahar.crisis.json";
import shaharEpilogueSource from "./content/shahar.epilogue.json";
import shaharJoinSource from "./content/shahar.join.json";
import shaharLiberationSource from "./content/shahar.liberation.json";
import shaharMeetSource from "./content/shahar.meet.json";
import shaharPowerSource from "./content/shahar.power.json";
import teireiBondSource from "./content/teirei.bond.json";
import teireiCrisisSource from "./content/teirei.crisis.json";
import teireiEpilogueSource from "./content/teirei.epilogue.json";
import teireiJoinSource from "./content/teirei.join.json";
import teireiLiberationSource from "./content/teirei.liberation.json";
import teireiMeetSource from "./content/teirei.meet.json";
import teireiPowerSource from "./content/teirei.power.json";
import ushiroBondSource from "./content/ushiro.bond.json";
import ushiroCrisisSource from "./content/ushiro.crisis.json";
import ushiroEpilogueSource from "./content/ushiro.epilogue.json";
import ushiroJoinSource from "./content/ushiro.join.json";
import ushiroLiberationSource from "./content/ushiro.liberation.json";
import ushiroMeetSource from "./content/ushiro.meet.json";
import ushiroPowerSource from "./content/ushiro.power.json";
import wolfNineBondSource from "./content/wolf-nine.bond.json";
import wolfNineCrisisSource from "./content/wolf-nine.crisis.json";
import wolfNineEpilogueSource from "./content/wolf-nine.epilogue.json";
import wolfNineJoinSource from "./content/wolf-nine.join.json";
import wolfNineLiberationSource from "./content/wolf-nine.liberation.json";
import wolfNineMeetSource from "./content/wolf-nine.meet.json";
import wolfNinePowerSource from "./content/wolf-nine.power.json";
import {
  asEventId,
  narrativeEventBlockSchema,
  type NarrativeEffect,
  type NarrativeEventBlock,
} from "./schema";

type CharacterStage = keyof FighterDefinition["scenes"];

const nativeCharacterBlocks = [
  narrativeEventBlockSchema.parse(amaraMeetSource),
  narrativeEventBlockSchema.parse(amaraJoinSource),
  narrativeEventBlockSchema.parse(amaraBondSource),
  narrativeEventBlockSchema.parse(amaraPowerSource),
  narrativeEventBlockSchema.parse(amaraCrisisSource),
  narrativeEventBlockSchema.parse(amaraLiberationSource),
  narrativeEventBlockSchema.parse(amaraEpilogueSource),
  narrativeEventBlockSchema.parse(gidonoMeetSource),
  narrativeEventBlockSchema.parse(gidonoJoinSource),
  narrativeEventBlockSchema.parse(gidonoBondSource),
  narrativeEventBlockSchema.parse(gidonoPowerSource),
  narrativeEventBlockSchema.parse(gidonoCrisisSource),
  narrativeEventBlockSchema.parse(gidonoLiberationSource),
  narrativeEventBlockSchema.parse(gidonoEpilogueSource),
  narrativeEventBlockSchema.parse(marianMeetSource),
  narrativeEventBlockSchema.parse(marianJoinSource),
  narrativeEventBlockSchema.parse(marianBondSource),
  narrativeEventBlockSchema.parse(marianPowerSource),
  narrativeEventBlockSchema.parse(marianCrisisSource),
  narrativeEventBlockSchema.parse(marianLiberationSource),
  narrativeEventBlockSchema.parse(marianEpilogueSource),
  narrativeEventBlockSchema.parse(minatoMeetSource),
  narrativeEventBlockSchema.parse(minatoJoinSource),
  narrativeEventBlockSchema.parse(minatoBondSource),
  narrativeEventBlockSchema.parse(minatoPowerSource),
  narrativeEventBlockSchema.parse(minatoCrisisSource),
  narrativeEventBlockSchema.parse(minatoLiberationSource),
  narrativeEventBlockSchema.parse(minatoEpilogueSource),
  narrativeEventBlockSchema.parse(shaharMeetSource),
  narrativeEventBlockSchema.parse(shaharJoinSource),
  narrativeEventBlockSchema.parse(shaharBondSource),
  narrativeEventBlockSchema.parse(shaharPowerSource),
  narrativeEventBlockSchema.parse(shaharCrisisSource),
  narrativeEventBlockSchema.parse(shaharLiberationSource),
  narrativeEventBlockSchema.parse(shaharEpilogueSource),
  narrativeEventBlockSchema.parse(teireiMeetSource),
  narrativeEventBlockSchema.parse(teireiJoinSource),
  narrativeEventBlockSchema.parse(teireiBondSource),
  narrativeEventBlockSchema.parse(teireiPowerSource),
  narrativeEventBlockSchema.parse(teireiCrisisSource),
  narrativeEventBlockSchema.parse(teireiLiberationSource),
  narrativeEventBlockSchema.parse(teireiEpilogueSource),
  narrativeEventBlockSchema.parse(nightEaterMeetSource),
  narrativeEventBlockSchema.parse(nightEaterJoinSource),
  narrativeEventBlockSchema.parse(nightEaterBondSource),
  narrativeEventBlockSchema.parse(nightEaterPowerSource),
  narrativeEventBlockSchema.parse(nightEaterCrisisSource),
  narrativeEventBlockSchema.parse(nightEaterLiberationSource),
  narrativeEventBlockSchema.parse(nightEaterEpilogueSource),
  narrativeEventBlockSchema.parse(peonyMeetSource),
  narrativeEventBlockSchema.parse(peonyJoinSource),
  narrativeEventBlockSchema.parse(peonyBondSource),
  narrativeEventBlockSchema.parse(peonyPowerSource),
  narrativeEventBlockSchema.parse(peonyCrisisSource),
  narrativeEventBlockSchema.parse(peonyLiberationSource),
  narrativeEventBlockSchema.parse(peonyEpilogueSource),
  narrativeEventBlockSchema.parse(cassimBellMeetSource),
  narrativeEventBlockSchema.parse(cassimBellJoinSource),
  narrativeEventBlockSchema.parse(cassimBellBondSource),
  narrativeEventBlockSchema.parse(cassimBellPowerSource),
  narrativeEventBlockSchema.parse(cassimBellCrisisSource),
  narrativeEventBlockSchema.parse(cassimBellLiberationSource),
  narrativeEventBlockSchema.parse(cassimBellEpilogueSource),
  narrativeEventBlockSchema.parse(sazanamiMeetSource),
  narrativeEventBlockSchema.parse(sazanamiJoinSource),
  narrativeEventBlockSchema.parse(sazanamiBondSource),
  narrativeEventBlockSchema.parse(sazanamiPowerSource),
  narrativeEventBlockSchema.parse(sazanamiCrisisSource),
  narrativeEventBlockSchema.parse(sazanamiLiberationSource),
  narrativeEventBlockSchema.parse(sazanamiEpilogueSource),
  narrativeEventBlockSchema.parse(ushiroMeetSource),
  narrativeEventBlockSchema.parse(ushiroJoinSource),
  narrativeEventBlockSchema.parse(ushiroBondSource),
  narrativeEventBlockSchema.parse(ushiroPowerSource),
  narrativeEventBlockSchema.parse(ushiroCrisisSource),
  narrativeEventBlockSchema.parse(ushiroLiberationSource),
  narrativeEventBlockSchema.parse(ushiroEpilogueSource),
  narrativeEventBlockSchema.parse(wolfNineMeetSource),
  narrativeEventBlockSchema.parse(wolfNineJoinSource),
  narrativeEventBlockSchema.parse(wolfNineBondSource),
  narrativeEventBlockSchema.parse(wolfNinePowerSource),
  narrativeEventBlockSchema.parse(wolfNineCrisisSource),
  narrativeEventBlockSchema.parse(wolfNineLiberationSource),
  narrativeEventBlockSchema.parse(wolfNineEpilogueSource),
  narrativeEventBlockSchema.parse(roomSeventeenMeetSource),
  narrativeEventBlockSchema.parse(roomSeventeenJoinSource),
  narrativeEventBlockSchema.parse(roomSeventeenBondSource),
  narrativeEventBlockSchema.parse(roomSeventeenPowerSource),
  narrativeEventBlockSchema.parse(roomSeventeenCrisisSource),
  narrativeEventBlockSchema.parse(roomSeventeenLiberationSource),
  narrativeEventBlockSchema.parse(roomSeventeenEpilogueSource),
  narrativeEventBlockSchema.parse(rinneMeetSource),
  narrativeEventBlockSchema.parse(rinneJoinSource),
  narrativeEventBlockSchema.parse(rinneBondSource),
  narrativeEventBlockSchema.parse(rinnePowerSource),
  narrativeEventBlockSchema.parse(rinneCrisisSource),
  narrativeEventBlockSchema.parse(rinneLiberationSource),
  narrativeEventBlockSchema.parse(rinneEpilogueSource),
  narrativeEventBlockSchema.parse(mumyoMeetSource),
  narrativeEventBlockSchema.parse(mumyoJoinSource),
  narrativeEventBlockSchema.parse(mumyoBondSource),
  narrativeEventBlockSchema.parse(mumyoPowerSource),
  narrativeEventBlockSchema.parse(mumyoCrisisSource),
  narrativeEventBlockSchema.parse(mumyoLiberationSource),
  narrativeEventBlockSchema.parse(mumyoEpilogueSource),
];
const nativeCharacterBlockById = new Map(
  nativeCharacterBlocks.map((block) => [block.id, block]),
);

const characterStageEffects = (
  fighterId: string,
  stage: CharacterStage,
): NarrativeEffect[] => {
  switch (stage) {
    case "meet":
      return [
        { type: "markEncountered", fighterId, encountered: true },
        { type: "setStoryStage", fighterId, stage: 1 },
      ];
    case "join":
      // Recruitment itself remains a choice effect.
      return [];
    case "bond":
      return [{ type: "setStoryStage", fighterId, stage: 3 }];
    case "power":
      return [{ type: "setStoryStage", fighterId, stage: 4 }];
    case "crisis":
      return [
        { type: "setStoryStage", fighterId, stage: 5 },
        { type: "setLiberationEligible", fighterId, eligible: true },
      ];
    case "liberation":
      return [
        { type: "setStoryStage", fighterId, stage: 6 },
        { type: "setLiberationEligible", fighterId, eligible: false },
        { type: "setLiberated", fighterId, liberated: true },
        {
          type: "relationship",
          target: { type: "fighter", fighterId },
          mode: "set",
          ownership: 0,
        },
      ];
    case "epilogue":
      return [];
  }
};

export const legacyCharacterNarrativeBlocks: NarrativeEventBlock[] =
  fighterDefinitions.flatMap((fighter) =>
    (Object.entries(fighter.scenes) as Array<
      [CharacterStage, FighterDefinition["scenes"][CharacterStage]]
    >).map(
      ([stage, scene]) =>
        nativeCharacterBlockById.get(asEventId(scene.id)) ??
        adaptLegacyScene(scene, {
          kind: stage === "liberation" ? "liberation" : "character",
          arcId: `character.${fighter.id}`,
          characterId: fighter.id,
          stage,
          priority: stage === "meet" ? 500 : 400,
          completionEffects: characterStageEffects(fighter.id, stage),
        }),
    ),
  );

export const legacyCharacterNarrativeBlockById = new Map(
  legacyCharacterNarrativeBlocks.map((block) => [block.id, block]),
);
