import { describe, expect, it } from "vitest";
import {
  campaignStages,
  unlockedCampaignStage,
} from "../data/campaignStages";
import {
  chooseWeeklyAction,
  createRun,
  maybeCreateCastIntroductionFollowup,
  maybeCreateLiberationFollowup,
  maybeCreateMainStoryFollowup,
  maybeCreateOpeningOwnershipFollowup,
  nextCampaignWeek,
  resolveCurrentEvent,
} from "./engine";
import type { RunState } from "./types";
import { legacyCharacterNarrativeBlockById } from "../narrative/characterBlocks";
import {
  mainStageOneWeeklyBlocks,
  mainStageThreeEpisodeBlocks,
  mainStageTwoEpisodeBlocks,
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
  bridge("s2.ep1", mainStageTwoEpisodeBlocks[0], "amara"),
  bridge("s2.ep2", mainStageTwoEpisodeBlocks[1], "night-eater"),
  bridge("s2.ep3", mainStageTwoEpisodeBlocks[2], "shahar"),
  bridge("s2.ep4", mainStageTwoEpisodeBlocks[3], "sazanami"),
  bridge("s2.ep5", mainStageTwoEpisodeBlocks[4], "cassim-bell"),
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
  const afterMainStory = afterLiberation.currentEvent
    ? afterLiberation
    : maybeCreateMainStoryFollowup(afterLiberation);
  return afterMainStory.currentEvent
    ? afterMainStory
    : maybeCreateCastIntroductionFollowup(afterMainStory);
};

// 1週ぶんを最後まで再生し、再生されたイベントIDを返す
const playWeek = (
  source: RunState,
  action: "work" | "play" | "rest" | "search" = "work",
): { run: RunState; played: string[] } => {
  const played: string[] = [];
  let run = chooseWeeklyAction(source, action);
  let guard = 0;
  while (run.currentEvent && guard < 12) {
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

  it("完走しなくても、主軸と出会った実績で次の勤務週が解放される", () => {
    const seenAllStageOne = campaignStages[0].mainFighterIds.map(
      (id) => `${id}.meet`,
    );
    expect(unlockedCampaignStage({ seenEvents: [] })).toBe(1);
    expect(unlockedCampaignStage({ seenEvents: seenAllStageOne })).toBe(2);
    expect(
      unlockedCampaignStage({
        seenEvents: [
          ...seenAllStageOne,
          ...campaignStages[1].mainFighterIds.map((id) => `${id}.meet`),
        ],
      }),
    ).toBe(3);
    // 完走した場合は従来どおり進む
    expect(unlockedCampaignStage({ completedRuns: 1 })).toBe(2);
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
