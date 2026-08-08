// 再建闘技場・新条文集(正本)
//
// 各人物の後日談が一条ずつ条文を残す(docs/WORLD_CONTINUITY.md §6)。
// status "final" は改稿済みの後日談本文と一致していることを示す。
// status "draft" は当該人物の物語改稿波で本文と突き合わせて確定させる。
// 全条が集まった周回のクリアで、真エンディング「十五人の開廷日」に到達する。

export interface CharterArticle {
  article: number;
  text: string;
  fighterId: string;
  status: "final" | "draft";
}

export const arenaCharter: CharterArticle[] = [
  {
    article: 1,
    text: "出場しない自由を、妨げない",
    fighterId: "amara",
    status: "final",
  },
  {
    article: 2,
    text: "休憩時間は、第一条より長く書く",
    fighterId: "amara",
    status: "final",
  },
  {
    article: 3,
    text: "閉店後の限定営業を認める。ただし、安全灯は消さない",
    fighterId: "night-eater",
    status: "final",
  },
  {
    article: 4,
    text: "窓際の二人席は、予約なしで待てる",
    fighterId: "gidonozeaas",
    status: "final",
  },
  {
    article: 5,
    text: "昼食は、誰も救わずに選んでよい",
    fighterId: "minato",
    status: "final",
  },
  {
    article: 6,
    text: "屋上庭園は、人の形をしていなくても入園できる",
    fighterId: "shahar",
    status: "draft",
  },
  {
    article: 7,
    text: "荷物にも、丁寧に扱われる権利がある",
    fighterId: "teirei",
    status: "draft",
  },
  {
    article: 8,
    text: "迷子は、急いで見つからなくてよい",
    fighterId: "peony",
    status: "draft",
  },
  {
    article: 9,
    text: "受付には、一分間の休止札を掲げる権利がある",
    fighterId: "cassim-bell",
    status: "draft",
  },
  {
    article: 10,
    text: "海は、思い出を一つだけ持ち帰ってよい",
    fighterId: "sazanami",
    status: "draft",
  },
  {
    article: 11,
    text: "治療を断る権利は、治す力より重い",
    fighterId: "marian",
    status: "draft",
  },
  {
    article: 12,
    text: "写真には、写りたい影だけが写ってよい",
    fighterId: "ushiro",
    status: "draft",
  },
  {
    article: 13,
    text: "群れは、一匹から数えてよい",
    fighterId: "wolf-nine",
    status: "draft",
  },
  {
    article: 14,
    text: "どの扉から入っても、帰る扉は自分で選んでよい",
    fighterId: "room-seventeen",
    status: "draft",
  },
  {
    article: 15,
    text: "未来は、見ないまま賭けてよい",
    fighterId: "rinne",
    status: "draft",
  },
  {
    article: 16,
    text: "道具にも、有給休暇を認める",
    fighterId: "mumyo",
    status: "draft",
  },
];

// 真エンディング「十五人の開廷日」での点呼台詞。
// 各人物、一行だけ。柿落とし興行の開場前、順に声が上がる。
export const grandFinaleLines: Record<string, string> = {
  amara: "開廷します。本日の議題——この闘技場の、これから。",
  gidonozeaas: "本日の窓際は、全席自由です。……もう、並ばなくていい。",
  minato: "本日の予定は、俺が決めた。四十九件目——柿落としの警備だ。",
  "night-eater": "開場の明かり、全部で星五つ。……今夜は、食べずに眺めるわ。",
  shahar: "屋上の花、満開です。竜の水やり当番、本日も出勤しています。",
  teirei: "搬入、全件完了。壊れものは、ひとつもありません。",
  peony: "迷子案内所より。本日、迷子ゼロ。……全員、帰る場所を覚えたので。",
  "cassim-bell": "受付は一分間の休止中です。——この拍手が、終わるまで。",
  sazanami: "海より祝電。持ち帰りたい思い出が、また一つ増えた。",
  marian: "本日の救護予定、なし。……それが、いちばんの診断結果。",
  ushiro: "記念撮影、承ります。写りたい影だけ、どうぞ前へ。",
  "wolf-nine": "群れの点呼、十五。……一匹から数えて、十五。",
  "room-seventeen": "本日の出口は、全部正解です。またのお越しを。",
  rinne: "賭けてもいい。今日の続きは、誰にも見えないくらい、良い。",
  mumyo: "本日、有給休暇。……最高の使い道が、見つかったので。",
};

export const charterArticlesByFighter = (fighterId: string): CharterArticle[] =>
  arenaCharter.filter((entry) => entry.fighterId === fighterId);

// 解放済み人物の集合から、開示済みの条文を条番号順で返す。
export const unlockedCharterArticles = (
  liberatedIds: readonly string[],
): CharterArticle[] => {
  const liberated = new Set(liberatedIds);
  return arenaCharter.filter((entry) => liberated.has(entry.fighterId));
};

export const isCharterComplete = (liberatedIds: readonly string[]): boolean => {
  const liberated = new Set(liberatedIds);
  return arenaCharter.every((entry) => liberated.has(entry.fighterId));
};
