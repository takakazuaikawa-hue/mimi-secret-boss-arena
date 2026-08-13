import { describe, expect, it } from "vitest";
import {
  campaignStages,
  carriedFighterIdsBeforeStage,
  stageForCompletedRuns,
} from "../data/campaignStages";
import { fighterDefinitions } from "../data/characters";
import {
  chooseWeeklyAction,
  createRun,
  maybeCreateMainStoryFollowup,
  resolveCurrentEvent,
} from "./engine";

const allIds = fighterDefinitions.map((fighter) => fighter.id);

describe("三段階キャンペーン構造", () => {
  it("三区分で全15人を重複なく分担する", () => {
    const assigned = campaignStages.flatMap((stage) => [
      ...stage.mainFighterIds,
    ]);
    expect(assigned).toHaveLength(15);
    expect(new Set(assigned).size).toBe(15);
    assigned.forEach((id) => expect(allIds).toContain(id));
    campaignStages.forEach((stage) =>
      expect(stage.mainFighterIds).toHaveLength(5),
    );
  });

  it("完了周回数で区分が進み、3周目以降は最終区分に留まる", () => {
    expect(stageForCompletedRuns(0).stage).toBe(1);
    expect(stageForCompletedRuns(1).stage).toBe(2);
    expect(stageForCompletedRuns(2).stage).toBe(3);
    expect(stageForCompletedRuns(9).stage).toBe(3);
  });

  it("区分1: 遭遇デッキは主軸のみ(ギドノは週1固定のため別枠)", () => {
    const run = createRun("normal", "stage-test-1", {
      campaignStage: campaignStages[0],
    });
    expect(run.campaignStage).toBe(1);
    expect(new Set(run.encounterDeck)).toEqual(
      new Set(["minato", "teirei", "peony", "ushiro"]),
    );
    expect(run.roster).toHaveLength(0);
  });

  it("区分2: 前区分の仲間が状態ごと在籍し、デッキは新主軸5人のみ", () => {
    const carried = carriedFighterIdsBeforeStage(campaignStages[1]).map(
      (id, index) => ({
        id,
        trust: 70 + index,
        ownership: 10,
        storyStage: 7,
        liberated: id === "gidonozeaas",
      }),
    );
    const run = createRun("normal", "stage-test-2", {
      campaignStage: campaignStages[1],
      carriedAllies: carried,
    });
    expect(run.campaignStage).toBe(2);
    expect(new Set(run.encounterDeck)).toEqual(
      new Set(campaignStages[1].mainFighterIds),
    );
    expect(new Set(run.roster)).toEqual(new Set(carried.map((a) => a.id)));
    expect(run.fighters.minato.recruited).toBe(true);
    expect(run.fighters.minato.trust).toBe(71);
    expect(run.fighters.minato.storyStage).toBe(7);
    expect(run.fighters.gidonozeaas.liberated).toBe(true);
    expect(run.fighters.gidonozeaas.ownership).toBe(0);
    // ギドノは在籍済みのため週1固定遭遇の条件が立たない
    expect(run.fighters.gidonozeaas.encountered).toBe(true);
  });

  it("区分1をやり直す場合: 未遭遇の主軸だけがデッキに残る", () => {
    const carried = [
      { id: "minato", trust: 80, ownership: 5, storyStage: 7, liberated: true },
      { id: "peony", trust: 60, ownership: 30, storyStage: 4, liberated: false },
    ];
    const run = createRun("normal", "stage-test-replay", {
      campaignStage: campaignStages[0],
      carriedAllies: carried,
    });
    // 加入済みはデッキに戻らず、未遭遇の主軸(丁零・うしろ)だけが残る
    expect(new Set(run.encounterDeck)).toEqual(new Set(["teirei", "ushiro"]));
    // 途中まで進んだ物語段階は保持され、続きから向き合える
    expect(run.fighters.peony.storyStage).toBe(4);
  });

  it("二段再生: 週1はメイン第1話→ギドノmeetの順で連続再生する", () => {
    const run = createRun("normal", "stage-test-main", {
      campaignStage: campaignStages[0],
    });
    const withMain = chooseWeeklyAction(run, "work");
    expect(withMain.currentEvent?.scene.id).toBe("main.s1.ep1");
    const resolved = resolveCurrentEvent(withMain, 0);
    expect(resolved.eventHistory).toContain("main.s1.ep1");
    const cleared = { ...resolved, lastEventOutcome: undefined };
    const followup = maybeCreateMainStoryFollowup(cleared);
    expect(followup.currentEvent?.fighterId).toBe("gidonozeaas");
  });

  it("二段再生: メインの直後に、その週の場面が続けて再生される", () => {
    const base = createRun("normal", "stage-test-main-2", {
      campaignStage: campaignStages[0],
    });
    const week2 = { ...base, week: 2 };
    const withMain = chooseWeeklyAction(week2, "work");
    expect(withMain.currentEvent?.scene.id).toBe("main.s1.ep2");
    // メインは特定の人物の前座ではない(橋渡しを持たない)
    expect(withMain.currentEvent?.fighterId).toBeUndefined();
    const resolved = resolveCurrentEvent(withMain, 0);
    const cleared = { ...resolved, lastEventOutcome: undefined };
    const followup = maybeCreateMainStoryFollowup(cleared);
    expect(followup.currentEvent).toBeTruthy();
    expect(followup.currentEvent?.scene.id).not.toBe("main.s1.ep2");
  });

  it("二段再生: 区分2・3でも、その区分のメインが先に再生される", () => {
    const stage2 = createRun("normal", "stage-test-main-s2", {
      campaignStage: campaignStages[1],
    });
    const s2main = chooseWeeklyAction(stage2, "work");
    expect(s2main.currentEvent?.scene.id).toBe("main.s2.ep1");
    const s2resolved = {
      ...resolveCurrentEvent(s2main, 0),
      lastEventOutcome: undefined,
    };
    expect(maybeCreateMainStoryFollowup(s2resolved).currentEvent).toBeTruthy();

    const stage3 = createRun("normal", "stage-test-main-s3", {
      campaignStage: campaignStages[2],
    });
    const s3main = chooseWeeklyAction(stage3, "work");
    expect(s3main.currentEvent?.scene.id).toBe("main.s3.ep1");
    const s3resolved = {
      ...resolveCurrentEvent(s3main, 0),
      lastEventOutcome: undefined,
    };
    expect(maybeCreateMainStoryFollowup(s3resolved).currentEvent).toBeTruthy();
  });

  it("区分未指定なら従来挙動(全員デッキ・持ち越しなし)", () => {
    const run = createRun("normal", "stage-test-legacy");
    expect(run.campaignStage).toBeUndefined();
    expect(run.encounterDeck).toHaveLength(allIds.length - 1);
  });
});
