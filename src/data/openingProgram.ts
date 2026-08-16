// 柿落とし・演目表(正本)
//
// 再建闘技場の柿落とし興行に、自由になった人物が一幕ずつ演目を出す
// (docs/WORLD_CONTINUITY.md §6)。会社(物語資産管理部)が終わった物語を
// 勝手に再演する「世界滅亡ショー」への、本人たちの返答が「新作の舞台」。
//
// status "final" は改稿済みの後日談本文と一致していることを示す。
// status "draft" は当該人物の改稿波で本文と突き合わせて確定させる。
// 全幕そろった周回のクリアで、真エンディング「柿落とし、十五幕」に到達する。

export interface ProgramAct {
  act: number;
  title: string;
  note?: string;
  fighterId: string;
  status: "final" | "draft";
}

export const openingProgram: ProgramAct[] = [
  {
    act: 1,
    title: "開幕宣言と、勝敗のない落書き裁判",
    note: "判決は出ません。続きが見たいので",
    fighterId: "amara",
    status: "final",
  },
  {
    act: 2,
    title: "冷めないコーヒーの実演",
    note: "窓際の二人席は、当日も予約なしで待てます",
    fighterId: "gidonozeaas",
    status: "final",
  },
  {
    act: 3,
    title: "刃のない剣舞・四十七の物語",
    note: "上演後の昼食は、誰も救わずに選びます",
    fighterId: "minato",
    status: "final",
  },
  {
    act: 4,
    title: "天の川、点灯",
    note: "客席の照明はおいしくいただきます。安全灯は残します",
    fighterId: "night-eater",
    status: "final",
  },
  {
    act: 5,
    title: "古竜通過日——空の祭り、三分間限定",
    note: "振替便は、ありません",
    fighterId: "shahar",
    status: "final",
  },
  {
    act: 6,
    title: "機械花の点灯式(実用性、ゼロ)",
    note: "照準は、花にだけ合わせます",
    fighterId: "teirei",
    status: "final",
  },
  {
    act: 7,
    title: "巨大専用椅子、着席式",
    note: "拍手は、ご自由に",
    fighterId: "peony",
    status: "final",
  },
  {
    act: 8,
    title: "公開・十五分休止(七世界のお客様、立ち会い歓迎)",
    note: "残り一分は、非公開です",
    fighterId: "cassim-bell",
    status: "final",
  },
  {
    act: 9,
    title: "第二回・浅瀬味青のり品評会",
    note: "胴長、貸し出します",
    fighterId: "sazanami",
    status: "final",
  },
  {
    act: 10,
    title: "救護席は舞台袖に(出番がないことが、演目です)",
    note: "相談は、いつでも",
    fighterId: "marian",
    status: "final",
  },
  {
    act: 11,
    title: "全館記念撮影(写りたい影だけ、どうぞ前へ)",
    note: "人数確認は、しません",
    fighterId: "ushiro",
    status: "final",
  },
  {
    act: 12,
    title: "休憩時間決闘祭(全九種目)",
    note: "第九種目の結果は、非公表",
    fighterId: "wolf-nine",
    status: "final",
  },
  {
    act: 13,
    title: "お化け屋敷ではありません(出口は全部正解)",
    note: "当日は全フロア休業。客席で観ます",
    fighterId: "room-seventeen",
    status: "final",
  },
  {
    act: 14,
    title: "元手ゼロ杯・持っていないもの選手権",
    note: "賭けたのは、まだない物ばかり",
    fighterId: "rinne",
    status: "final",
  },
  {
    act: 15,
    title: "抜かない居合、十四連続",
    note: "刃は、見せません",
    fighterId: "mumyo",
    status: "final",
  },
];

// 大取り。openingProgram には含めない(完成判定は十五幕で行う)。
// 真エンディングの場で、十五人に頼まれてミミが書き入れる最後の一幕。
// 記録室では到達前は「予告」、到達後に本文を開示する。
export const finalAct = {
  act: 16,
  title: "カーテンコール——出演、全員",
  author: "ミミ(と、十五人の指名)",
} as const;

// 真エンディング「柿落とし、十五幕」での前口上。各人物、一行だけ。
// 開場前、舞台袖から順に声が上がる。
export const grandFinaleLines: Record<string, string> = {
  amara: "開廷——いえ。開幕します。本日の議題は、この闘技場のこれから。",
  gidonozeaas: "本日の窓際は、全席自由です。……もう、並ばなくていい。",
  minato: "本日の予定は、俺が決めた。四十九件目——柿落としの警備だ。",
  "night-eater": "開場の明かり、全部で星五つ。……今夜は、食べずに眺めるわ。",
  shahar: "本日の空は、一回きりの限定色です。……お見逃しなく。",
  teirei: "点検、全項目完了。本日の照準は、花にだけ。",
  peony: "ほんじつの会場、こわれもの注意。……だいじょうぶ、わたしが、まもるので。",
  "cassim-bell": "受付は一分間の休止中です。——この拍手が、終わるまで。",
  sazanami: "海より祝電。持ち帰りたい思い出が、また一つ増えた。",
  marian: "本日の救護予定、なし。……それが、いちばんの診断結果。",
  ushiro: "記念撮影、承ります。写りたい影だけ、どうぞ前へ。",
  "wolf-nine": "点呼、十五名、全員そろい踏み！　本日の種目——祭りだ！",
  "room-seventeen": "本日の出口は、全部正解です。またのお越しを。",
  rinne: "賭けてもいい。今日の続きは、誰にも見えないくらい、良い。",
  mumyo: "本日、有給休暇。……最高の使い道が、見つかったので。",
};

// 大取りの幕が上がる直前、舞台袖で本命だけが隣に立ち、名前で呼ぶ。
// 「全員に台詞、一人にカメラ」のカメラ側。各人、前夜シーンで確立した声と呼び方で。
export const grandHonmeiLines: Record<string, string> = {
  gidonozeaas: "ミミ。今夜は100点だ。……減点は、もう探さない。",
  minato: "ミミさん。次の依頼です。最後の一幕——隣で、どうぞ。",
  teirei: "ミミ。自己命令、実行します。隣にいる。理由は、空欄のまま。",
  peony: "ミミ。こわさないよ、今夜は。……手だけ、つよく、にぎる。",
  ushiro: "ミミは、前だけ見ていればいい。うしろと——隣は、おれがいる。",
  amara: "ミミさん。判決を先に言い渡します。——両者、主役。",
  "night-eater": "ミミさん。今夜いちばんの光は、食べずに取っておきました。……あなたの目の、それです。",
  shahar: "ミミ。空は晴らしておいた。胸を、張って。",
  sazanami: "みみ さいてん ふのう。だから となり で みる。",
  "cassim-bell": "ミミさん。ここからの一分は——非公開に、しましょう。",
  "wolf-nine": "ミミ。九つ目の種目だ。名前は、次の祭りまでに二人で決めよう。",
  marian: "ミミ。手、冷えてませんね。今夜は治すものが何もない。……良い夜です。",
  "room-seventeen": "ミミさん。帰りの扉は、舞台袖に出してあります。今夜は、私があなたの楽屋です。",
  rinne: "ミミ。この続きには、ぜんぶ賭けてある。……見ないで、賭けた。",
  mumyo: "ミミ。呼んでくれ。今夜の私の銘は、あなたの隣だ。",
};

export const programActsByFighter = (fighterId: string): ProgramAct[] =>
  openingProgram.filter((entry) => entry.fighterId === fighterId);

// 解放済み人物の集合から、埋まった幕を幕番号順で返す。
export const unlockedProgramActs = (
  liberatedIds: readonly string[],
): ProgramAct[] => {
  const liberated = new Set(liberatedIds);
  return openingProgram.filter((entry) => liberated.has(entry.fighterId));
};

export const isProgramComplete = (liberatedIds: readonly string[]): boolean => {
  const liberated = new Set(liberatedIds);
  return openingProgram.every((entry) => liberated.has(entry.fighterId));
};
