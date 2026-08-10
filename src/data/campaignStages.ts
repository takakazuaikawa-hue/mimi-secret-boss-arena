// 三段階キャンペーン構造(正本)
//
// クリア後の世界は「物語が進まないのに、仲間と報酬だけが積み重なる」。
// その異常を遊びの骨格にするため、周回を三つの勤務区分へ分ける。
// 各周回は主軸5人の物語へ集中し(5人×7段階=35場面が26週へ収まる)、
// 前の区分の仲間は次の周回の開始時から在籍している。
//
// 表示名は業務上の区分として出し、意味は物語の進行で後から変わる
// (最初から「周回」「ループ」等のメタ語をUIに出さない)。

export interface CampaignStageDefinition {
  stage: 1 | 2 | 3;
  /** 画面表示用の業務区分名 */
  label: string;
  /** この周回の主軸5人。遭遇デッキはこの顔ぶれに限定する */
  mainFighterIds: readonly string[];
}

export const campaignStages: readonly CampaignStageDefinition[] = [
  {
    stage: 1,
    label: "第一勤務週",
    // 液状異形・元勇者・機械・巨人・影。見た目も役割も重ならない導入編成。
    // 感情の中心はギドノ一人(週1固定遭遇は既存ロジックを利用)。
    mainFighterIds: ["gidonozeaas", "minato", "teirei", "peony", "ushiro"],
  },
  {
    stage: 2,
    label: "更新後の勤務週",
    mainFighterIds: ["amara", "night-eater", "shahar", "sazanami", "cassim-bell"],
  },
  {
    stage: 3,
    label: "記録外勤務週",
    // 世界の謎(Q1〜Q3)の核心に近い人物を最終区分へ置く。
    mainFighterIds: ["wolf-nine", "marian", "room-seventeen", "rinne", "mumyo"],
  },
];

/** 完了済み周回数から現在の区分を返す(3周目以降は記録外勤務週に留まる) */
export const stageForCompletedRuns = (
  completedRuns: number,
): CampaignStageDefinition =>
  campaignStages[Math.min(campaignStages.length - 1, Math.max(0, completedRuns))];

/**
 * 到達済みの最大区分。
 *
 * 26週の完走だけを条件にすると、途中で始め直したプレイヤーが同じ5人に
 * 閉じ込められてしまう。そこで「その区分の主軸と出会った実績」でも解放する。
 * 出会いの記録(`profile.seenEvents` の `<id>.meet`)は周回を跨いで残るため、
 * 遊び方に関係なく前へ進める。
 */
export const unlockedCampaignStage = (profile: {
  completedRuns?: number;
  hasFinishedRun?: boolean;
  seenEvents?: readonly string[];
}): 1 | 2 | 3 => {
  const seen = new Set(profile.seenEvents ?? []);
  const metCount = (stage: CampaignStageDefinition) =>
    stage.mainFighterIds.filter((id) => seen.has(`${id}.meet`)).length;
  // 主軸5人のうち4人と出会っていれば、その区分は「見た」とみなす。
  const byEncounters = campaignStages.reduce(
    (unlocked, stage) =>
      stage.stage === unlocked && metCount(stage) >= 4
        ? Math.min(campaignStages.length, unlocked + 1)
        : unlocked,
    1,
  );
  const byRuns =
    (profile.completedRuns ?? (profile.hasFinishedRun ? 1 : 0)) + 1;
  return Math.min(
    campaignStages.length,
    Math.max(byEncounters, byRuns),
  ) as 1 | 2 | 3;
};

/** 指定区分より前の区分の主軸(=持ち越し対象の顔ぶれ) */
export const carriedFighterIdsBeforeStage = (
  stage: CampaignStageDefinition,
): string[] =>
  campaignStages
    .filter((candidate) => candidate.stage < stage.stage)
    .flatMap((candidate) => [...candidate.mainFighterIds]);
