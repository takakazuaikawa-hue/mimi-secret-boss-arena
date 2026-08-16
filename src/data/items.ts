import type { Stats } from "../game/types";

export interface ItemDefinition {
  id: string;
  name: string;
  cost: number;
  note: string;
  // 売店のおばちゃんの口上。手に取ったときに聞ける、来歴と売り文句。
  pitch: string;
  statBoosts: Partial<Stats>;
}

export const itemDefinitions: ItemDefinition[] = [
  {
    id: "pearl-pin",
    name: "真珠の留め具",
    cost: 2400,
    note: "HP+8、防御+2。封印具の余りを丁寧に磨いたもの。",
    pitch:
      "海の底の工房の、封印具のあまり玉。……夜中に磨いてたら、綺麗すぎて、ちょっとこわかった。着けると、芯が強くなるよ。ぼくのおすすめ。",
    statBoosts: { hp: 8, defense: 2 },
  },
  {
    id: "jackpot-chip",
    name: "大当たりチップ",
    cost: 4200,
    note: "攻撃+3、魔力+3。換金はできないが、なぜか力は出る。",
    pitch:
      "大当たりの記念チップ。換金は、できない。……できないのに強くなれるの、呪いっぽくて、いいよね。いいほうの呪い、だけど。",
    statBoosts: { attack: 3, magic: 3 },
  },
  {
    id: "night-shift-shoes",
    name: "深夜勤務靴",
    cost: 3600,
    note: "速度+4、MP+4。労務管理上は休憩を推奨。",
    pitch:
      "夜勤あがりの妖精さんの靴。足のほうが先に、楽な走り方をおぼえてる。……ちゃんと寝なよ? 寝ないと、ぼくみたいになる。",
    statBoosts: { speed: 4, mp: 4 },
  },
  {
    id: "white-clause",
    name: "白紙条項のお守り",
    cost: 6800,
    note: "HP+5、全能力+1。何も書かれていない部分だけが効く。",
    pitch:
      "白紙のお守り。なにも書いてないとこだけが、効く。……余白って、つよいよね。ぼくも、余白になりたい。——一番の、売れ筋です。",
    statBoosts: {
      hp: 5,
      mp: 1,
      attack: 1,
      defense: 1,
      magic: 1,
      speed: 1,
    },
  },
];

export const itemById = new Map(
  itemDefinitions.map((item) => [item.id, item]),
);

// 縁起物の売店の店主(ちょっと陰のある、気だるい今どきのお姉さん。一人称「ぼく」)。
// 本編の「売店のおばちゃん」(城壁のかけらの人)とは別の店。
export const stallKeeperTalk = {
  greet:
    "……いらっしゃい、監督さん。ここ、縁起物のお店。見てくだけでも、いいよ。ぼくは、ずっといるし。",
  sold: "お買い上げ。……えらい。験担ぎは、買った日がいちばん効くから。今日、勝ちなよ。",
  broke:
    "お金、足りないね。……うん、そういう日も、ある。ツケは無し。でも取り置きは、しといてあげる。たぶん。",
  back: "戻すんだ。……いいよ、別に。棚の子たちは、待つの得意だから。ぼくも。",
  equip: "それ、もう連れてるよ。……使ってあげて。しまわれてるのが、いちばん、さみしいから。",
} as const;
