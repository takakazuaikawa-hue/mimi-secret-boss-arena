import type { Stats } from "../game/types";

export interface ItemDefinition {
  id: string;
  name: string;
  cost: number;
  note: string;
  statBoosts: Partial<Stats>;
}

export const itemDefinitions: ItemDefinition[] = [
  {
    id: "pearl-pin",
    name: "真珠の留め具",
    cost: 2400,
    note: "HP+8、防御+2。封印具の余りを丁寧に磨いたもの。",
    statBoosts: { hp: 8, defense: 2 },
  },
  {
    id: "jackpot-chip",
    name: "大当たりチップ",
    cost: 4200,
    note: "攻撃+3、魔力+3。換金はできないが、なぜか力は出る。",
    statBoosts: { attack: 3, magic: 3 },
  },
  {
    id: "night-shift-shoes",
    name: "深夜勤務靴",
    cost: 3600,
    note: "速度+4、MP+4。労務管理上は休憩を推奨。",
    statBoosts: { speed: 4, mp: 4 },
  },
  {
    id: "white-clause",
    name: "白紙条項のお守り",
    cost: 6800,
    note: "HP+5、全能力+1。何も書かれていない部分だけが効く。",
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

