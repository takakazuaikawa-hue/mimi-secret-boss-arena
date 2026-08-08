import type { FighterDefinition, SkillDefinition } from "../game/types";

export type BattleFighterDefinition = Pick<
  FighterDefinition,
  | "id"
  | "name"
  | "role"
  | "color"
  | "accent"
  | "traitName"
  | "traitText"
  | "ai"
  | "strong"
  | "weak"
  | "stats"
  | "skills"
>;

const skill = (
  id: string,
  name: string,
  kind: SkillDefinition["kind"],
  target: SkillDefinition["target"],
  element: SkillDefinition["element"],
  power: number,
  mpCost: number,
  note: string,
  mechanics?: SkillDefinition["mechanics"],
): SkillDefinition => ({
  id,
  name,
  kind,
  target,
  element,
  power,
  mpCost,
  note,
  mechanics,
});

export const openingRookieOpponents: BattleFighterDefinition[] = [
  {
    id: "rookie-piyo-slime",
    name: "ピヨゼリー",
    role: "守備",
    color: "#8de4c5",
    accent: "#e55742",
    traitName: "新人の意地",
    traitText: "試合開始時、震えながらも盾を構えて障壁を張る。",
    ai: "careful",
    strong: "tide",
    weak: "flame",
    stats: { hp: 52, mp: 22, attack: 25, defense: 39, magic: 21, speed: 27 },
    skills: [
      skill("rookie.piyo.bop", "盾ごつん", "damage", "enemy", "neutral", 24, 0, "小さな盾ごと体当たりする"),
      skill("rookie.piyo.bubble", "泡の突進", "damage", "enemy", "tide", 31, 5, "泡をまとって一生懸命に突進する"),
      skill("rookie.piyo.curl", "まるくなる", "guard", "self", "neutral", 23, 4, "盾の後ろで丸くなり、障壁を張る", { defenseBuff: 0.1, barrier: 6 }),
      skill("rookie.piyo.cheer", "ぴよ声援", "buff", "allAllies", "star", 15, 7, "新人一同で攻撃を少し高める", { attackBuff: 0.06 }),
    ],
  },
  {
    id: "rookie-kobold",
    name: "コボルト見習い",
    role: "攻撃",
    color: "#c89a67",
    accent: "#31517a",
    traitName: "借り物の大兜",
    traitText: "兜が重く、守りは堅いが動き出しが少し遅い。",
    ai: "aggressive",
    strong: "flame",
    weak: "tide",
    stats: { hp: 58, mp: 18, attack: 37, defense: 32, magic: 17, speed: 31 },
    skills: [
      skill("rookie.kobold.slash", "木剣スラッシュ", "damage", "enemy", "neutral", 30, 0, "基本に忠実な木剣の一撃"),
      skill("rookie.kobold.rush", "見習い突撃", "damage", "enemy", "flame", 39, 6, "勢いだけは立派な全力突撃", { criticalBonus: 0.05 }),
      skill("rookie.kobold.guard", "兜で受ける", "guard", "self", "neutral", 25, 4, "大きすぎる兜を盾にする", { defenseBuff: 0.12, barrier: 4 }),
      skill("rookie.kobold.shout", "隊列確認！", "buff", "allAllies", "star", 14, 7, "覚えたての号令で速度を整える", { speedBuff: 0.07 }),
    ],
  },
  {
    id: "rookie-bat-mage",
    name: "魔導コウモリ",
    role: "妨害",
    color: "#b8a9eb",
    accent: "#263a68",
    traitName: "教本を見ながら",
    traitText: "試合開始時、教本を開いて魔力を少し高める。",
    ai: "tricky",
    strong: "gale",
    weak: "star",
    stats: { hp: 43, mp: 38, attack: 18, defense: 25, magic: 39, speed: 42 },
    skills: [
      skill("rookie.bat.tap", "本の角", "damage", "enemy", "neutral", 22, 0, "閉じた教本の角は意外に痛い"),
      skill("rookie.bat.gust", "初級つむじ風", "damage", "enemy", "gale", 37, 7, "教本どおりの小さな旋風"),
      skill("rookie.bat.blur", "読み間違いの霧", "debuff", "allEnemies", "star", 16, 9, "読み間違えた呪文が結果的に相手を鈍らせる", { speedDebuff: 0.08 }),
      skill("rookie.bat.ward", "しおり結界", "guard", "allAllies", "neutral", 18, 8, "大事なページを挟むしおり型の障壁", { barrier: 5 }),
    ],
  },
];

export const battleOpponentById = new Map(
  openingRookieOpponents.map((opponent) => [opponent.id, opponent]),
);

export const battleOpponentVisualIndex: Record<string, number> = {
  "rookie-piyo-slime": 0,
  "rookie-kobold": 1,
  "rookie-bat-mage": 2,
};
