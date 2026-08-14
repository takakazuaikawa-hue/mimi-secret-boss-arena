import { beforeEach, describe, expect, it } from "vitest";
import {
  campaignStages,
  unlockedCampaignStage,
} from "../data/campaignStages";
import { officialMatches } from "../data/matches";
import { createBattle } from "./battle";
import {
  availableRosterIds,
  chooseWeeklyAction,
  createInitialProfile,
  createRun,
  maybeCreateCastIntroductionFollowup,
  maybeCreateHonmeiFollowup,
  maybeCreateLiberationFollowup,
  maybeCreateMainStoryFollowup,
  maybeCreateOpeningCupRosterFollowup,
  maybeCreateOpeningOwnershipFollowup,
  nextCampaignWeek,
  resolveCurrentEvent,
} from "./engine";
import { createRandom } from "./rng";
import { useGameStore } from "./store";
import type { RunState } from "./types";
import { legacyCharacterNarrativeBlockById } from "../narrative/characterBlocks";
import {
  mainStageOneWeeklyBlocks,
  mainStageThreeEpisodeBlocks,
  mainStageTwoWeeklyBlocks,
} from "../narrative/openingBlocks";
import { asEventId } from "../narrative/schema";

// 場面の同一性が分かる固有語(場所・小道具・時刻)
const SCENE_KEYWORDS = [
  "窓際",
  "整理券",
  "閉店五分前",
  "台車",
  "午後二時",
  "彫像",
  "案内所",
  "滝みたいな汗",
  "苦情",
  "相談室",
  "照明管理室",
  "限定傘",
  "見切り",
  "ベンチ",
  "無限遺失物保管庫",
  "呼び鈴",
  "八通",
  "救護室",
  "十七",
  "裏口",
  "景品番号",
  "鏡",
];

const lastLineText = (block: { nodes: Array<Record<string, unknown>> }) => {
  const lines = block.nodes.filter((node) => node.type === "line");
  return String(lines.at(-1)?.text ?? "");
};

const meetOpeningText = (fighterId: string) => {
  const block = legacyCharacterNarrativeBlockById.get(
    asEventId(`${fighterId}.meet`),
  );
  const lines = (block?.nodes ?? []).filter((node) => node.type === "line");
  return lines
    .slice(0, 2)
    .map((node) => String((node as { text?: string }).text ?? ""))
    .join("");
};

const bridge = (
  id: string,
  block: { nodes: Array<Record<string, unknown>> },
  fighterId: string,
) => ({
  id,
  closingText: lastLineText(block),
  meetOpeningText: meetOpeningText(fighterId),
});

const mainEpisodeBridges = [
  bridge("s1.w01", mainStageOneWeeklyBlocks[21], "gidonozeaas"),
  bridge("s1.w02", mainStageOneWeeklyBlocks[22], "minato"),
  bridge("s1.w03", mainStageOneWeeklyBlocks[23], "teirei"),
  bridge("s1.w06", mainStageOneWeeklyBlocks[24], "peony"),
  bridge("s1.w07", mainStageOneWeeklyBlocks[25], "ushiro"),
  bridge("s2.w01", mainStageTwoWeeklyBlocks[0], "amara"),
  bridge("s2.w02", mainStageTwoWeeklyBlocks[1], "night-eater"),
  bridge("s2.w03", mainStageTwoWeeklyBlocks[2], "shahar"),
  bridge("s2.w04", mainStageTwoWeeklyBlocks[3], "sazanami"),
  bridge("s2.w05", mainStageTwoWeeklyBlocks[4], "cassim-bell"),
  bridge("s3.ep1", mainStageThreeEpisodeBlocks[0], "wolf-nine"),
  bridge("s3.ep2", mainStageThreeEpisodeBlocks[1], "marian"),
  bridge("s3.ep3", mainStageThreeEpisodeBlocks[2], "room-seventeen"),
  bridge("s3.ep4", mainStageThreeEpisodeBlocks[3], "rinne"),
  bridge("s3.ep5", mainStageThreeEpisodeBlocks[4], "mumyo"),
];

// store.continueEvent と同じ followup 連鎖を再現する
const continueChain = (source: RunState): RunState => {
  const cleared: RunState = { ...source, lastEventOutcome: undefined };
  const opening = maybeCreateOpeningOwnershipFollowup(cleared);
  const afterLiberation = opening.currentEvent
    ? opening
    : maybeCreateLiberationFollowup(opening);
  const afterHonmei = afterLiberation.currentEvent
    ? afterLiberation
    : maybeCreateHonmeiFollowup(afterLiberation);
  const afterMainStory = afterHonmei.currentEvent
    ? afterHonmei
    : maybeCreateMainStoryFollowup(afterHonmei);
  const afterCastIntroduction = afterMainStory.currentEvent
    ? afterMainStory
    : maybeCreateCastIntroductionFollowup(afterMainStory);
  return afterCastIntroduction.currentEvent
    ? afterCastIntroduction
    : maybeCreateOpeningCupRosterFollowup(afterCastIntroduction);
};

// 1週ぶんを最後まで再生し、再生されたイベントIDを返す
const playWeek = (
  source: RunState,
  action: "work" | "play" | "rest" | "search" = "work",
): { run: RunState; played: string[] } => {
  const played: string[] = [];
  let run = chooseWeeklyAction(source, action);
  let guard = 0;
  while (run.currentEvent && guard < 20) {
    played.push(run.currentEvent.scene.id);
    run = resolveCurrentEvent(run, 0);
    run = continueChain(run);
    guard += 1;
  }
  return { run, played };
};

describe("メイン話と個別meetの橋渡し", () => {
  it("メイン話の締めが、続く出会いの冒頭と同じ場面を先に描かない", () => {
    // 締めの一行と、橋先meetの冒頭2行に、同じ固有語が並ばないこと。
    // (同じ場面を二度読ませる「出会いが二回」の再発防止)
    const overlaps: string[] = [];
    for (const episode of mainEpisodeBridges) {
      const closing = episode.closingText;
      const meetOpening = episode.meetOpeningText;
      const shared = SCENE_KEYWORDS.filter(
        (word) => closing.includes(word) && meetOpening.includes(word),
      );
      if (shared.length > 0) {
        overlaps.push(`${episode.id}: ${shared.join("・")}`);
      }
    }
    expect(overlaps).toEqual([]);
  });
});

describe("キャンペーン進行の実流", () => {
  it("1周目の週1: メイン第1話とギドノの出会いが一度ずつだけ再生される", () => {
    const run = createRun("normal", "flow-week1", {
      campaignStage: campaignStages[0],
    });
    const { played } = playWeek(run);
    expect(played.filter((id) => id === "main.s1.w01")).toHaveLength(1);
    expect(played.filter((id) => id === "gidonozeaas.meet")).toHaveLength(1);
  });

  it("1周目を通しで再生しても、同じ出会いが二度出ない", () => {
    let run = createRun("normal", "flow-run1", {
      campaignStage: campaignStages[0],
    });
    const all: string[] = [];
    for (let week = 1; week <= 10; week += 1) {
      const result = playWeek(run, week % 2 === 0 ? "search" : "work");
      all.push(...result.played);
      run = nextCampaignWeek(result.run);
    }
    const meets = all.filter((id) => id.endsWith(".meet"));
    expect(new Set(meets).size).toBe(meets.length);
  });

  it("完走しなくても、区分1の主軸と出会った実績で区分2の勤務週が解放される", () => {
    const seenAllStageOne = campaignStages[0].mainFighterIds.map(
      (id) => `${id}.meet`,
    );
    expect(unlockedCampaignStage({ seenEvents: [] })).toBe(1);
    expect(unlockedCampaignStage({ seenEvents: seenAllStageOne })).toBe(2);
    // 完走した場合は従来どおり進む(勝敗を問わない)
    expect(unlockedCampaignStage({ completedRuns: 1 })).toBe(2);
  });

  it("区分3は、区分2主軸との遭遇や完走回数では解放されず、main.s2.cleared がある場合だけ解放される", () => {
    const seenAllStageOne = campaignStages[0].mainFighterIds.map(
      (id) => `${id}.meet`,
    );
    const seenAllStageTwo = campaignStages[1].mainFighterIds.map(
      (id) => `${id}.meet`,
    );
    // 区分2の主軸5人と全員出会っていても、区分3は解禁されない
    // (区分2は「本当に勝たないと解禁されない」仕様のため)。
    expect(
      unlockedCampaignStage({
        seenEvents: [...seenAllStageOne, ...seenAllStageTwo],
      }),
    ).toBe(2);
    // 完走回数(勝敗を問わない finishRun 経由)を積んでも区分3は解禁されない。
    expect(unlockedCampaignStage({ completedRuns: 2 })).toBe(2);
    expect(unlockedCampaignStage({ completedRuns: 9 })).toBe(2);
    // main.s2.cleared(週26の勝利記録)があれば区分3が解禁される。
    expect(unlockedCampaignStage({ seenEvents: ["main.s2.cleared"] })).toBe(
      3,
    );
    expect(
      unlockedCampaignStage({
        completedRuns: 1,
        seenEvents: ["main.s2.cleared"],
      }),
    ).toBe(3);
  });

  it("週3終了時点で、その区分の主軸5人が全員 encountered=true になる(出場者不足バグの回帰)", () => {
    let run = createRun("normal", "flow-cast-intro-stage1", {
      campaignStage: campaignStages[0],
    });
    for (let week = 1; week <= 3; week += 1) {
      const result = playWeek(run, week % 2 === 0 ? "search" : "work");
      run = nextCampaignWeek(result.run);
    }
    for (const id of campaignStages[0].mainFighterIds) {
      expect(run.fighters[id].encountered).toBe(true);
    }
  });

  it("2周目・3周目でも、週3終了時点でその区分の主軸5人が全員 encountered=true になる", () => {
    for (const stageIndex of [1, 2] as const) {
      const carried = campaignStages
        .filter((candidate) => candidate.stage < campaignStages[stageIndex].stage)
        .flatMap((candidate) => candidate.mainFighterIds)
        .map((id) => ({
          id,
          trust: 70,
          ownership: 10,
          storyStage: 7,
          liberated: false,
        }));
      let run = createRun("normal", `flow-cast-intro-stage${stageIndex + 1}`, {
        campaignStage: campaignStages[stageIndex],
        carriedAllies: carried,
      });
      for (let week = 1; week <= 3; week += 1) {
        const result = playWeek(run, week % 2 === 0 ? "search" : "work");
        run = nextCampaignWeek(result.run);
      }
      for (const id of campaignStages[stageIndex].mainFighterIds) {
        expect(run.fighters[id].encountered).toBe(true);
      }
    }
  });

  it("週4(初心者大会)終了時点で、加入済みが3人以上になる(出場者不足バグの回帰)", () => {
    let run = createRun("normal", "flow-opening-cup-roster-stage1", {
      campaignStage: campaignStages[0],
    });
    for (let week = 1; week <= 4; week += 1) {
      const result = playWeek(run, week % 2 === 0 ? "search" : "work");
      run = nextCampaignWeek(result.run);
    }
    expect(availableRosterIds(run).length).toBeGreaterThanOrEqual(3);
  });

  it("2周目・3周目は持ち越し仲間だけで週4時点の加入3人以上を満たす", () => {
    for (const stageIndex of [1, 2] as const) {
      const carried = campaignStages
        .filter((candidate) => candidate.stage < campaignStages[stageIndex].stage)
        .flatMap((candidate) => candidate.mainFighterIds)
        .map((id) => ({
          id,
          trust: 70,
          ownership: 10,
          storyStage: 7,
          liberated: false,
        }));
      let run = createRun(
        "normal",
        `flow-opening-cup-roster-stage${stageIndex + 1}`,
        {
          campaignStage: campaignStages[stageIndex],
          carriedAllies: carried,
        },
      );
      for (let week = 1; week <= 4; week += 1) {
        const result = playWeek(run, week % 2 === 0 ? "search" : "work");
        run = nextCampaignWeek(result.run);
      }
      expect(availableRosterIds(run).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("2周目: 新しい主軸5人と出会える", () => {
    const carried = campaignStages[0].mainFighterIds.map((id) => ({
      id,
      trust: 70,
      ownership: 10,
      storyStage: 7,
      liberated: false,
    }));
    let run = createRun("normal", "flow-run2", {
      campaignStage: campaignStages[1],
      carriedAllies: carried,
    });
    const all: string[] = [];
    for (let week = 1; week <= 12; week += 1) {
      const result = playWeek(run, week % 2 === 0 ? "search" : "work");
      all.push(...result.played);
      run = nextCampaignWeek(result.run);
    }
    const encountered = campaignStages[1].mainFighterIds.filter(
      (id) => run.fighters[id].encountered,
    );
    expect(encountered.length).toBeGreaterThanOrEqual(3);
  });
});

describe("決勝前夜(週25)の本命選択", () => {
  const playToWeek25 = (seed: string) => {
    let run = createRun("normal", seed, {
      campaignStage: campaignStages[0],
    });
    const all: string[] = [];
    for (let week = 1; week <= 25; week += 1) {
      const result = playWeek(run, week % 2 === 0 ? "search" : "work");
      all.push(...result.played);
      run = nextCampaignWeek(result.run);
    }
    return { run, all };
  };

  it("週25で本命選択が一度だけ再生され、選んだ相手の前夜シーンへ続く", () => {
    const { run, all } = playToWeek25("flow-honmei-stage1");
    expect(all.filter((id) => id === "main.s1.honmei-select")).toHaveLength(
      1,
    );
    expect(run.honmeiFighterId).toBeTruthy();
    expect(run.flags).toContain(`honmei:${run.honmeiFighterId}`);
    const eveId = `main.s1.eve.${run.honmeiFighterId}`;
    expect(all.filter((id) => id === eveId)).toHaveLength(1);
  });

  it("翌週(週26)まで進めても、本命選択・前夜シーンは再び発火しない", () => {
    const { run, all } = playToWeek25("flow-honmei-once-stage1");
    const eveId = `main.s1.eve.${run.honmeiFighterId}`;
    const result26 = playWeek(run, "work");
    const combined = [...all, ...result26.played];
    expect(
      combined.filter((id) => id === "main.s1.honmei-select"),
    ).toHaveLength(1);
    expect(combined.filter((id) => id === eveId)).toHaveLength(1);
  });

  it("本命選択の選択肢は、その時点で加入済みの主軸に限られる", () => {
    const { run } = playToWeek25("flow-honmei-candidates-stage1");
    expect(
      campaignStages[0].mainFighterIds.includes(run.honmeiFighterId ?? ""),
    ).toBe(true);
    expect(run.fighters[run.honmeiFighterId ?? ""]?.recruited).toBe(true);
  });
});

describe("区分2: 週26の勝敗と main.s2.cleared の記録", () => {
  beforeEach(() => {
    useGameStore.setState({
      profile: createInitialProfile(),
      run: undefined,
    });
  });

  // 区分2(更新後の勤務週)で週26の最終戦だけを直接組み立てる。
  const buildStageTwoFinalRun = (seed: string): RunState => {
    const run = createRun("normal", seed, {
      campaignStage: campaignStages[1],
    });
    const fighterId = campaignStages[1].mainFighterIds[0];
    run.fighters[fighterId] = {
      ...run.fighters[fighterId],
      recruited: true,
      encountered: true,
    };
    run.week = 26;
    run.roster = [fighterId];
    run.activeTeam = [fighterId];
    const finalMatch = officialMatches.at(-1)!;
    run.pendingMatchId = finalMatch.id;
    run.battle = createBattle(run, finalMatch, createRandom(seed));
    return run;
  };

  it("(a) 区分2で週26の最終戦に勝利すると main.s2.cleared が記録される", () => {
    const run = buildStageTwoFinalRun("s2-final-win");
    run.battle!.status = "won";
    useGameStore.setState({ run });
    const result = useGameStore.getState().settleBattle();
    expect(result.ended).toBe(true);
    expect(result.won).toBe(true);
    expect(useGameStore.getState().profile.seenEvents).toContain(
      "main.s2.cleared",
    );
    expect(unlockedCampaignStage(useGameStore.getState().profile)).toBe(3);
  });

  it("(b) 区分2で週26の最終戦に敗北すると main.s2.cleared は記録されない", () => {
    const run = buildStageTwoFinalRun("s2-final-lose");
    run.battle!.status = "lost";
    useGameStore.setState({ run });
    const result = useGameStore.getState().settleBattle();
    expect(result.ended).toBe(true);
    expect(result.won).toBe(false);
    expect(useGameStore.getState().profile.seenEvents).not.toContain(
      "main.s2.cleared",
    );
    expect(unlockedCampaignStage(useGameStore.getState().profile)).toBe(2);
  });

  it("(c) unlockedCampaignStage は main.s2.cleared の有無で区分3/2を返す", () => {
    expect(unlockedCampaignStage({ seenEvents: ["main.s2.cleared"] })).toBe(
      3,
    );
    expect(unlockedCampaignStage({ seenEvents: [] })).toBe(1);
    expect(unlockedCampaignStage({ completedRuns: 3 })).toBe(2);
  });
});
