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
  maybeCreateOpeningOwnershipFollowup,
  nextCampaignWeek,
  resolveCurrentEvent,
} from "../game/engine";
import { auditNarrativeBlocks } from "./audit";
import { adaptLegacyScene } from "./legacySceneAdapter";
import { legacyNarrativeBlockById, legacyNarrativeBlocks } from "./legacyBlocks";
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

describe("narrative block migration", () => {
  it("adapts every existing CharacterScene exactly once", () => {
    const expectedCount =
      2 +
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

    run = chooseWeeklyAction(run, "work");

    expect(run.currentEvent?.scene.id).toBe("gidonozeaas.crisis");
    expect(
      run.currentEvent?.scene.lines.find((line) =>
        line.text.startsWith("私は預かっていた鍵"),
      )?.direction?.still,
    ).toBe("/assets/story/events/gidonozeaas-crisis-key-v2.png");
  });

  it("runs the ownership-transfer follow-up through stable block effects", () => {
    let run = createRun("normal", "narrative-runtime-opening");
    run = chooseWeeklyAction(run, "work");
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
    run = chooseWeeklyAction(run, "work");
    const remembered =
      fighterDefinitions[0].scenes.meet.choices?.[1]?.memory;
    run = resolveCurrentEvent(run, 1);
    run = clearEventOutcome(run);
    run = maybeCreateOpeningOwnershipFollowup(run);
    run = resolveCurrentEvent(run, 0);
    run = clearEventOutcome(run);
    run = nextCampaignWeek(run);
    run = chooseWeeklyAction(run, "work");

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
    run = chooseWeeklyAction(run, "rest");

    expect(run.currentEvent?.narrativeBlockId).toBeTruthy();
    expect(
      legacyWorldNarrativeBlockById.has(
        asEventId(run.currentEvent?.narrativeBlockId ?? ""),
      ),
    ).toBe(true);
  });
});
