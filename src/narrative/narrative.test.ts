import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ambientEvents } from "../data/ambientEvents";
import { fighterDefinitions } from "../data/characters";
import {
  hotSpringTripScene,
  ownershipTransferScene,
} from "../data/openingEvents";
import { routeEvents } from "../data/routeEvents";
import {
  chooseWeeklyAction,
  clearEventOutcome,
  createRun,
  maybeCreateMainStoryFollowup,
  maybeCreateOpeningOwnershipFollowup,
  nextCampaignWeek,
  resolveCurrentEvent,
} from "../game/engine";
import { auditNarrativeBlocks } from "./audit";
import { adaptLegacyScene } from "./legacySceneAdapter";
import { legacyNarrativeBlockById, legacyNarrativeBlocks } from "./legacyBlocks";
import {
  galleryEntriesFromNarrativeBlocks,
  isNarrativeGalleryEntryUnlocked,
} from "./gallery";
import {
  openingHotSpringBlock,
  openingOwnershipBlock,
} from "./openingBlocks";
import {
  materializeNarrativeBlock,
  resolveNarrativeBlock,
} from "./runtime";
import { asEventId, repeatRuleSchema } from "./schema";
import { legacyWorldNarrativeBlockById } from "./worldBlocks";

const publicAssetExists = (path: string) =>
  existsSync(join(process.cwd(), "public", path.replace(/^\//, "")));

// 毎週まずメインストーリーが再生されるため、
// 人物・世界の場面を見るには、メインを消化してから followup を取る。
const weeklyEventAfterMain = (
  source: ReturnType<typeof createRun>,
  action: "work" | "play" | "rest" | "search",
) => {
  const withMain = chooseWeeklyAction(source, action);
  if (!withMain.currentEvent?.scene.id.startsWith("main.s")) return withMain;
  const resolved = clearEventOutcome(resolveCurrentEvent(withMain, 0));
  return maybeCreateMainStoryFollowup(resolved);
};

describe("narrative block migration", () => {
  it("derives one memory-gallery record from every authored still", () => {
    const stillCount = legacyNarrativeBlocks.flatMap((block) =>
      block.presentation.assets.filter((asset) => asset.kind === "still"),
    ).length;
    const gallery = galleryEntriesFromNarrativeBlocks(legacyNarrativeBlocks);

    expect(gallery).toHaveLength(stillCount);
    expect(new Set(gallery.map((entry) => entry.id)).size).toBe(gallery.length);
    gallery.forEach((entry) => {
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.chapter.length).toBeGreaterThan(0);
      expect(entry.caption.length).toBeGreaterThan(0);
      expect(entry.image).toMatch(/^\/assets\//);
    });
  });

  it("keeps viewed memories unlocked after the current run is replaced", () => {
    const [entry] = galleryEntriesFromNarrativeBlocks(legacyNarrativeBlocks);
    expect(entry).toBeDefined();
    expect(
      isNarrativeGalleryEntryUnlocked(entry!, {
        seenEvents: [entry!.eventId],
        liberatedCharacterIds: [],
      }),
    ).toBe(true);
    expect(
      isNarrativeGalleryEntryUnlocked(entry!, {
        seenEvents: [],
        liberatedCharacterIds: [],
      }),
    ).toBe(false);
  });

  it("keeps unchosen branch memories locked", () => {
    const choiceEntry = galleryEntriesFromNarrativeBlocks(
      legacyNarrativeBlocks,
    ).find((entry) => entry.choiceId);
    expect(choiceEntry).toBeDefined();
    expect(
      isNarrativeGalleryEntryUnlocked(choiceEntry!, {
        seenEvents: [choiceEntry!.eventId],
        flags: [`choice:${choiceEntry!.choiceId}`],
        liberatedCharacterIds: [],
      }),
    ).toBe(true);
    expect(
      isNarrativeGalleryEntryUnlocked(choiceEntry!, {
        seenEvents: [choiceEntry!.eventId],
        flags: [`choice:${choiceEntry!.eventId}.choice.not-selected`],
        liberatedCharacterIds: [],
      }),
    ).toBe(false);
  });
  it("adapts every existing CharacterScene exactly once", () => {
    const expectedCount =
      // opening: 所有権移譲・温泉旅行・メイン各区分の全話・本命前夜5話
      43 +
      fighterDefinitions.length * 7 +
      Object.values(ambientEvents).flat().length +
      Object.values(routeEvents).flatMap((scenes) => scenes ?? []).length;

    expect(legacyNarrativeBlocks).toHaveLength(expectedCount);
    expect(legacyNarrativeBlockById.size).toBe(expectedCount);
  });

  it("passes structural, transition, flag, and asset audits", () => {
    const issues = auditNarrativeBlocks(legacyNarrativeBlocks, {
      assetExists: publicAssetExists,
    });
    expect(issues.filter((entry) => entry.severity === "error")).toEqual([]);
    expect(
      issues.filter((entry) => entry.code === "migration.generated-ids"),
    ).toHaveLength(
      legacyNarrativeBlocks.filter(
        (block) => block.debug.legacyGeneratedIds,
      ).length,
    );
  });

  it("makes opening and character progression effects explicit", () => {
    const ownershipBlock = legacyNarrativeBlockById.get(
      asEventId(ownershipTransferScene.id),
    );
    const openingEffects =
      ownershipBlock?.nodes.flatMap((node) =>
        node.type === "effect" ? node.effects : [],
      ) ?? [];
    expect(openingEffects).toEqual(
      expect.arrayContaining([
        { type: "setOwnershipStage", stage: "provisional" },
        { type: "setArenaRank", rank: "provisional" },
        {
          type: "setFlag",
          flagId: "opening.owner-transfer.completed",
          value: true,
        },
      ]),
    );

    fighterDefinitions.forEach((fighter) => {
      const effectsFor = (stage: keyof typeof fighter.scenes) =>
        legacyNarrativeBlockById
          .get(asEventId(fighter.scenes[stage].id))
          ?.nodes.flatMap((node) =>
            node.type === "effect" ? node.effects : [],
          ) ?? [];

      expect(effectsFor("meet")).toEqual(
        expect.arrayContaining([
          {
            type: "markEncountered",
            fighterId: fighter.id,
            encountered: true,
          },
          { type: "setStoryStage", fighterId: fighter.id, stage: 1 },
        ]),
      );
      expect(effectsFor("crisis")).toContainEqual({
        type: "setLiberationEligible",
        fighterId: fighter.id,
        eligible: true,
      });
      expect(effectsFor("liberation")).toEqual(
        expect.arrayContaining([
          {
            type: "setLiberated",
            fighterId: fighter.id,
            liberated: true,
          },
          {
            type: "relationship",
            target: { type: "fighter", fighterId: fighter.id },
            mode: "set",
            ownership: 0,
          },
        ]),
      );
    });
  });

  it("uses registered asset IDs and produces stable compatibility IDs", () => {
    const first = adaptLegacyScene(hotSpringTripScene, {
      kind: "opening",
      arcId: "opening.hot-spring",
    });
    const second = adaptLegacyScene(hotSpringTripScene, {
      kind: "opening",
      arcId: "opening.hot-spring",
    });

    expect(first).toEqual(second);
    expect(first.debug.legacyGeneratedIds).toBe(true);
    first.nodes
      .filter((node) => node.type === "direction" && "assetId" in node.command)
      .forEach((node) => {
        if (node.type !== "direction") return;
        const command = node.command;
        if (!("assetId" in command)) return;
        expect(command.assetId).not.toMatch(/^\/assets\//);
        expect(
          first.presentation.assets.some(
            (asset) => asset.id === command.assetId,
          ),
        ).toBe(true);
      });
  });

  it("rejects incomplete cooldown rules", () => {
    expect(
      repeatRuleSchema.safeParse({ mode: "cooldown" }).success,
    ).toBe(false);
  });

  it("projects opening blocks into the current dialogue UI without losing content", () => {
    const ownershipScene = materializeNarrativeBlock(openingOwnershipBlock);
    const hotSpringScene = materializeNarrativeBlock(openingHotSpringBlock);

    expect(ownershipScene.lines.map((line) => line.text)).toEqual(
      ownershipTransferScene.lines.map((line) => line.text),
    );
    expect(ownershipScene.choices?.map((choice) => choice.label)).toEqual(
      ownershipTransferScene.choices?.map((choice) => choice.label),
    );
    expect(hotSpringScene.lines.map((line) => line.text)).toEqual(
      hotSpringTripScene.lines.map((line) => line.text),
    );
    expect(openingOwnershipBlock.debug.legacyGeneratedIds).toBe(false);
    expect(openingHotSpringBlock.debug.legacyGeneratedIds).toBe(false);
    expect(
      openingOwnershipBlock.nodes
        .filter((node) => node.type === "line")
        .every((node) => !node.lineId.includes(".legacy-")),
    ).toBe(true);
  });

  it("uses native blocks for every stage of migrated character stories", () => {
    for (const fighter of fighterDefinitions.slice(0, 9)) {
      for (const stage of [
        "meet",
        "join",
        "bond",
        "power",
        "crisis",
        "liberation",
        "epilogue",
      ] as const) {
        const block = legacyNarrativeBlockById.get(
          asEventId(fighter.scenes[stage].id),
        );
        expect(block?.debug.legacyGeneratedIds).toBe(false);
        expect(
          block?.nodes
            .filter((node) => node.type === "line")
            .every((node) => !node.lineId.includes(".legacy-")),
        ).toBe(true);
        expect(
          block?.nodes
            .filter((node) => node.type === "choice")
            .flatMap((node) => node.choices)
            .every((choice) => !choice.id.includes(".legacy-")),
        ).toBe(true);
      }
    }
  });

  it("presents native Gidono directions instead of legacy scene lines", () => {
    let run = createRun("normal", "native-gidono-presentation");
    run = {
      ...run,
      week: 8,
      encounterDeck: [],
      fighters: {
        ...run.fighters,
        gidonozeaas: {
          ...run.fighters.gidonozeaas,
          encountered: true,
          recruited: true,
          storyStage: 4,
        },
      },
      roster: ["gidonozeaas"],
      activeTeam: ["gidonozeaas"],
    };

    run = weeklyEventAfterMain(run, "work");

    expect(run.currentEvent?.scene.id).toBe("gidonozeaas.crisis");
    expect(
      run.currentEvent?.scene.lines.find((line) =>
        line.text.startsWith("私は預かっていた鍵"),
      )?.direction?.still,
    ).toBe("/assets/story/events/gidonozeaas-crisis-key-v2.png");
  });

  it("runs the ownership-transfer follow-up through stable block effects", () => {
    let run = createRun("normal", "narrative-runtime-opening");
    // 週1はメイン第1話 → ギドノの出会い → 権利移譲、の順で再生される
    run = chooseWeeklyAction(run, "work");
    run = resolveCurrentEvent(run, 0);
    run = clearEventOutcome(run);
    run = maybeCreateMainStoryFollowup(run);
    run = resolveCurrentEvent(run, 0);
    run = clearEventOutcome(run);
    run = maybeCreateOpeningOwnershipFollowup(run);

    expect(run.currentEvent?.narrativeBlockId).toBe(
      openingOwnershipBlock.id,
    );
    expect(run.currentEvent?.scene.id).toBe(ownershipTransferScene.id);

    const resolved = resolveCurrentEvent(run, 0);
    expect(resolved.ownershipStage).toBe("provisional");
    expect(resolved.arenaRank).toBe("provisional");
    expect(resolved.flags).toContain("opening.owner-transfer.completed");
    expect(resolved.flags).toContain("opening:owner-transfer-complete");

    const stableChoiceId = openingOwnershipBlock.nodes
      .find((node) => node.type === "choice")
      ?.choices.at(0)?.id;
    if (stableChoiceId) {
      expect(resolved.flags).toContain(`choice:${stableChoiceId}`);
      expect(resolved.flags).not.toContain(
        `choice:${ownershipTransferScene.id}:0`,
      );
    }
  });

  it("applies only the selected branch and reachable completion effects", () => {
    const source = createRun("normal", "narrative-pure-runtime");
    const result = resolveNarrativeBlock(
      source,
      openingOwnershipBlock,
      0,
    );

    expect(result.run).not.toBe(source);
    expect(source.ownershipStage).toBe("employee");
    expect(result.run.ownershipStage).toBe("provisional");
    expect(result.selectedChoice?.id).toBe(
      openingOwnershipBlock.nodes
        .find((node) => node.type === "choice")
        ?.choices.at(0)?.id,
    );
  });

  it("recalls a stable prior choice in the next character event", () => {
    let run = createRun("normal", "stable-choice-memory");
    // メイン第1話 → 出会い(選択肢2) → 権利移譲
    run = chooseWeeklyAction(run, "work");
    run = resolveCurrentEvent(run, 0);
    run = clearEventOutcome(run);
    run = maybeCreateMainStoryFollowup(run);
    const remembered =
      fighterDefinitions[0].scenes.meet.choices?.[1]?.memory;
    run = resolveCurrentEvent(run, 1);
    run = clearEventOutcome(run);
    run = maybeCreateOpeningOwnershipFollowup(run);
    run = resolveCurrentEvent(run, 0);
    run = clearEventOutcome(run);
    // 翌週、メインの後に個別の続きが再生される
    run = { ...nextCampaignWeek(run), week: 8 };
    run = weeklyEventAfterMain(run, "work");

    expect(run.currentEvent?.scene.id).toBe(
      fighterDefinitions[0].scenes.join.id,
    );
    expect(
      run.currentEvent?.scene.lines.some((line) => line.text === remembered),
    ).toBe(true);
  });

  it("attaches a narrative block to fallback world events", () => {
    let run = createRun("normal", "world-event-runtime");
    run = {
      ...run,
      week: 8,
      fighters: Object.fromEntries(
        Object.entries(run.fighters).map(([fighterId, fighter]) => [
          fighterId,
          {
            ...fighter,
            encountered: true,
            recruited: true,
            storyStage: 6,
          },
        ]),
      ),
      roster: fighterDefinitions.slice(0, 3).map((fighter) => fighter.id),
      activeTeam: fighterDefinitions.slice(0, 3).map((fighter) => fighter.id),
    };
    run = weeklyEventAfterMain(run, "rest");

    expect(run.currentEvent?.narrativeBlockId).toBeTruthy();
    expect(
      legacyWorldNarrativeBlockById.has(
        asEventId(run.currentEvent?.narrativeBlockId ?? ""),
      ),
    ).toBe(true);
  });
});
