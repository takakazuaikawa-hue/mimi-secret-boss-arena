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
      "海の底の工房から流れてきた、封印具のあまり玉。ひと晩かけて磨いておいたの。胸元に着けると、体の芯がしゃんとするわよ。",
    statBoosts: { hp: 8, defense: 2 },
  },
  {
    id: "jackpot-chip",
    name: "大当たりチップ",
    cost: 4200,
    note: "攻撃+3、魔力+3。換金はできないが、なぜか力は出る。",
    pitch:
      "賭場の大当たり記念チップ。換金は、できないの。できないのにね、持ってると強気になれるのよ。験担ぎって、そういうもの。",
    statBoosts: { attack: 3, magic: 3 },
  },
  {
    id: "night-shift-shoes",
    name: "深夜勤務靴",
    cost: 3600,
    note: "速度+4、MP+4。労務管理上は休憩を推奨。",
    pitch:
      "夜勤あがりの妖精たちが履いてた靴。足のほうが先に、楽な走り方を覚えてるの。……ちゃんと休みなさいね? 靴だけじゃ、足りないから。",
    statBoosts: { speed: 4, mp: 4 },
  },
  {
    id: "white-clause",
    name: "白紙条項のお守り",
    cost: 6800,
    note: "HP+5、全能力+1。何も書かれていない部分だけが効く。",
    pitch:
      "白紙のお守り。何も書いてないところだけが、効くのよ。欲張って書き込むと、ただのお守りになっちゃう。——この街では、一番の売れ筋。",
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

// 縁起物の売店の店主(粋なお姉さん)の店先の声。
// 本編の「売店のおばちゃん」(城壁のかけらの人)とは別の店。
export const stallKeeperTalk = {
  greet:
    "いらっしゃい、監督さん。見ていくだけでも、いいことのある店よ。気になる子は、手に取ってみて。",
  sold: "まいど。験担ぎはね、買ったその日から効くの。さ、着けてお行きなさいな。",
  broke:
    "あら、お代が足りないみたい。うちは現金掛け値なし、ツケも無し。——稼いでらっしゃい。監督さんなら、早いでしょ?",
  back: "はい、また今度。棚は逃げないから、いつでも見にいらっしゃい。",
  equip: "あら、その子はもう連れてるじゃない。眠らせておくのは勿体ないわ。着けてお行き。",
} as const;
