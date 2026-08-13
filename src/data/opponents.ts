import type {
  FighterDefinition,
  FighterRole,
  SkillDefinition,
  Stats,
} from "../game/types";

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

const roleStats: Record<FighterRole, Stats> = {
  万能: { hp: 64, mp: 34, attack: 34, defense: 34, magic: 34, speed: 34 },
  攻撃: { hp: 62, mp: 28, attack: 42, defense: 28, magic: 24, speed: 35 },
  守備: { hp: 76, mp: 24, attack: 29, defense: 45, magic: 22, speed: 24 },
  支援: { hp: 56, mp: 44, attack: 23, defense: 30, magic: 40, speed: 33 },
  妨害: { hp: 55, mp: 42, attack: 24, defense: 27, magic: 39, speed: 39 },
  速攻: { hp: 53, mp: 30, attack: 35, defense: 26, magic: 28, speed: 45 },
};

interface DedicatedOpponentInput {
  id: string;
  name: string;
  role: FighterRole;
  color: string;
  accent: string;
  traitName: string;
  traitText: string;
  ai: FighterDefinition["ai"];
  element: SkillDefinition["element"];
  weak: SkillDefinition["element"];
  basic: string;
  signature: string;
  utility: string;
}

const dedicatedOpponent = ({
  id,
  name,
  role,
  color,
  accent,
  traitName,
  traitText,
  ai,
  element,
  weak,
  basic,
  signature,
  utility,
}: DedicatedOpponentInput): BattleFighterDefinition => {
  const utilityKind =
    role === "守備" ? "guard" : role === "支援" ? "heal" : role === "妨害" ? "debuff" : "buff";
  const utilityTarget =
    utilityKind === "guard"
      ? "allAllies"
      : utilityKind === "heal"
        ? "allAllies"
        : utilityKind === "debuff"
          ? "allEnemies"
          : "allAllies";
  const utilityMechanics =
    utilityKind === "guard"
      ? { defenseBuff: 0.1, barrier: 5 }
      : utilityKind === "heal"
        ? undefined
        : utilityKind === "debuff"
          ? { speedDebuff: 0.08 }
          : { attackBuff: 0.07 };

  return {
    id,
    name,
    role,
    color,
    accent,
    traitName,
    traitText,
    ai,
    strong: element,
    weak,
    stats: roleStats[role],
    skills: [
      skill(`${id}.basic`, basic, "damage", "enemy", "neutral", 30, 0, "堅実な基本攻撃"),
      skill(`${id}.signature`, signature, "damage", "enemy", element, 42, 8, "この選手の主力技"),
      skill(`${id}.utility`, utility, utilityKind, utilityTarget, element, utilityKind === "heal" ? 27 : 18, 9, "チームの戦い方を支える技", utilityMechanics),
      skill(`${id}.sweep`, `${signature}・連式`, "damage", "allEnemies", element, 31, 12, "敵全体を巻き込む大技"),
    ],
  };
};

const dedicatedMatchOpponents: Record<string, BattleFighterDefinition[]> = {
  "bronze-cup": [
    dedicatedOpponent({ id: "bronze-mikage", name: "看板守ミカゲ", role: "守備", color: "#8f5e3b", accent: "#efc77d", traitName: "閉店まで立つ", traitText: "終盤ほど看板を深く構え、守りを固める。", ai: "careful", element: "tide", weak: "gale", basic: "看板の角", signature: "閉店間際の大看板", utility: "店じまいの構え" }),
    dedicatedOpponent({ id: "bronze-karin", name: "午後番カリン", role: "速攻", color: "#c6653d", accent: "#ffe1a1", traitName: "残業前の一走", traitText: "四ターン目から動きが鋭くなる。", ai: "aggressive", element: "flame", weak: "tide", basic: "伝票投げ", signature: "退勤ベル・ダッシュ", utility: "午後班の号令" }),
    dedicatedOpponent({ id: "bronze-soroban", name: "伝票士ソロバン", role: "支援", color: "#77533f", accent: "#8de4c5", traitName: "帳尻合わせ", traitText: "崩れた仲間へ素早く手当てを回す。", ai: "tricky", element: "star", weak: "flame", basic: "算盤はじき", signature: "未精算の星勘定", utility: "午後の差し入れ" }),
  ],
  "contract-league": [
    dedicatedOpponent({ id: "postal-weiss", name: "白封筒ヴァイス", role: "速攻", color: "#d9e7ef", accent: "#3675a9", traitName: "速達指定", traitText: "決まった順番を崩さず、連携を加速する。", ai: "steady", element: "gale", weak: "star", basic: "封蝋ナイフ", signature: "速達・白翼便", utility: "配達順確認" }),
    dedicatedOpponent({ id: "postal-rakka", name: "消印騎士ラッカ", role: "攻撃", color: "#587c9d", accent: "#f2d078", traitName: "必着", traitText: "隊列の合図に合わせて重い一撃を届ける。", ai: "aggressive", element: "tide", weak: "gale", basic: "消印打ち", signature: "必着の青槍", utility: "配達隊列" }),
    dedicatedOpponent({ id: "postal-tod", name: "宛名術師トード", role: "妨害", color: "#8da5b5", accent: "#f6f0dc", traitName: "宛先変更", traitText: "偶数ターンに術式の宛先を組み替える。", ai: "tricky", element: "star", weak: "flame", basic: "宛名札", signature: "転送不可の封印", utility: "誤配の霧" }),
  ],
  "gold-jackpot": [
    dedicatedOpponent({ id: "kitchen-poele", name: "鉄鍋騎士ポワレ", role: "守備", color: "#563e32", accent: "#f0b84d", traitName: "鉄鍋の蓋", traitText: "コースの切り替わりに全員を立て直す。", ai: "careful", element: "flame", weak: "tide", basic: "おたま打ち", signature: "灼熱フランベ", utility: "鉄鍋の蓋" }),
    dedicatedOpponent({ id: "kitchen-souffle", name: "菓子魔導士スフレ", role: "支援", color: "#e5b879", accent: "#fff1cb", traitName: "焼き上がり", traitText: "三ターンごとに味方の体勢を整える。", ai: "tricky", element: "gale", weak: "star", basic: "粉糖弾", signature: "王冠スフレの上昇", utility: "甘い休憩" }),
    dedicatedOpponent({ id: "kitchen-consomme", name: "給仕長コンソメ", role: "万能", color: "#a86a35", accent: "#7ce0ca", traitName: "次の一皿", traitText: "味方の消耗を見て攻守を切り替える。", ai: "steady", element: "tide", weak: "flame", basic: "銀盆返し", signature: "フルコース行進", utility: "配膳完了" }),
  ],
  "owner-grand-prix": [
    dedicatedOpponent({ id: "owner-regalia", name: "命令官レガリア", role: "妨害", color: "#6e4a98", accent: "#f1c85b", traitName: "命令待ち", traitText: "強制命令には強く、本人へ任せる相手には調子を崩す。", ai: "tricky", element: "star", weak: "gale", basic: "指揮杖", signature: "王冠命令・跪け", utility: "服従の鐘" }),
    dedicatedOpponent({ id: "owner-ordo", name: "執行剣オルド", role: "攻撃", color: "#4b3970", accent: "#e85e79", traitName: "即時執行", traitText: "監督の強制指示を見て攻撃態勢へ入る。", ai: "aggressive", element: "flame", weak: "tide", basic: "規則斬り", signature: "執行期限ゼロ", utility: "号令復唱" }),
    dedicatedOpponent({ id: "owner-seal", name: "監査盾シール", role: "守備", color: "#8061a6", accent: "#a7ead9", traitName: "承認印", traitText: "命令が多いほど盾の印が濃くなる。", ai: "careful", element: "tide", weak: "star", basic: "承認印打ち", signature: "却下の紫壁", utility: "監査防壁" }),
  ],
  "aldebaran-championship": [
    dedicatedOpponent({ id: "star-alpha", name: "一等星アルファ", role: "攻撃", color: "#c94f82", accent: "#f8d76b", traitName: "無敗手順A", traitText: "開幕から障壁をまとい、崩れるまで手順を変えない。", ai: "aggressive", element: "flame", weak: "tide", basic: "星印一閃", signature: "第一等級・紅光", utility: "手順A展開" }),
    dedicatedOpponent({ id: "star-beta", name: "一等星ベータ", role: "守備", color: "#b43d70", accent: "#9ee6d8", traitName: "無敗手順B", traitText: "中央で攻撃を受け、両翼の時間を作る。", ai: "careful", element: "tide", weak: "gale", basic: "星盾打ち", signature: "第一等級・青環", utility: "手順B防壁" }),
    dedicatedOpponent({ id: "star-gamma", name: "一等星ガンマ", role: "支援", color: "#d76b9a", accent: "#eef4ff", traitName: "無敗手順C", traitText: "終盤に全員の速度と魔力を引き上げる。", ai: "tricky", element: "star", weak: "flame", basic: "光点射", signature: "第一等級・白夜", utility: "手順C再点火" }),
  ],
  "last-demon-king": [
    dedicatedOpponent({ id: "finale-virgo", name: "終演王ヴァルゴ", role: "万能", color: "#481b2a", accent: "#efc65a", traitName: "終演拒否", traitText: "三ターンごとに規定外の力を解放する。", ai: "steady", element: "star", weak: "gale", basic: "幕引きの爪", signature: "終演未定・黒い拍手", utility: "アンコール拒絶" }),
    dedicatedOpponent({ id: "finale-belze", name: "灰冠ベルゼ", role: "攻撃", color: "#702438", accent: "#f26961", traitName: "灰の戴冠", traitText: "長引くほど攻撃と魔力が増していく。", ai: "aggressive", element: "flame", weak: "tide", basic: "灰冠打ち", signature: "王都焼却宣言", utility: "灰の鼓舞" }),
    dedicatedOpponent({ id: "finale-nox", name: "規約喰らいノクス", role: "妨害", color: "#251b35", accent: "#8fe0d1", traitName: "白紙追補", traitText: "書かれた対策を食べ、味方の動きを鈍らせる。", ai: "tricky", element: "gale", weak: "star", basic: "条文噛み", signature: "第零条・全部無効", utility: "追補の黒霧" }),
  ],
  "assessment-1": [
    dedicatedOpponent({ id: "audit-north-pen", name: "北塔・赤ペン主任", role: "妨害", color: "#276d69", accent: "#f26d6d", traitName: "先行採点", traitText: "開幕から減点札の障壁を展開する。", ai: "tricky", element: "star", weak: "flame", basic: "赤線引き", signature: "要改善・三連印", utility: "減点札" }),
    dedicatedOpponent({ id: "audit-north-file", name: "北塔・書類騎士", role: "守備", color: "#327f78", accent: "#f1d47b", traitName: "添付資料", traitText: "厚い資料を盾にして前列を守る。", ai: "careful", element: "tide", weak: "gale", basic: "書類束打ち", signature: "別紙百枚の壁", utility: "添付防壁" }),
    dedicatedOpponent({ id: "audit-north-clock", name: "北塔・時刻係", role: "速攻", color: "#3f948b", accent: "#ffffff", traitName: "締切厳守", traitText: "序盤に素早く減点機会を作る。", ai: "aggressive", element: "gale", weak: "star", basic: "秒針突き", signature: "提出期限・今", utility: "時計合わせ" }),
  ],
  "assessment-2": [
    dedicatedOpponent({ id: "audit-west-smile", name: "西塔・研修笑顔", role: "支援", color: "#a95f70", accent: "#ffe2b8", traitName: "改善済みです", traitText: "攻めと守りを一巡ごとに入れ替える。", ai: "steady", element: "star", weak: "flame", basic: "笑顔圧", signature: "改善済み連呼", utility: "模範的声援" }),
    dedicatedOpponent({ id: "audit-west-arrow", name: "西塔・指示棒兵", role: "攻撃", color: "#8f4e61", accent: "#f4ca63", traitName: "矢印追加", traitText: "進行方向を変えながら攻め込む。", ai: "aggressive", element: "flame", weak: "tide", basic: "指示棒打ち", signature: "こちらをご覧ください", utility: "進路変更" }),
    dedicatedOpponent({ id: "audit-west-note", name: "西塔・議事録魔女", role: "妨害", color: "#c57888", accent: "#8ce1cf", traitName: "記録済み", traitText: "前の行動を記録し、次の動きを鈍らせる。", ai: "tricky", element: "gale", weak: "star", basic: "速記針", signature: "発言は記録しました", utility: "議事録の霧" }),
  ],
  "assessment-3": [
    dedicatedOpponent({ id: "audit-center-chief", name: "中央塔・中間主任", role: "万能", color: "#65527f", accent: "#f2d36f", traitName: "中間は本番", traitText: "勝負どころで全員の守りを固める。", ai: "steady", element: "star", weak: "gale", basic: "中間報告", signature: "本番扱いの一撃", utility: "評価保留" }),
    dedicatedOpponent({ id: "audit-center-form", name: "中央塔・様式盾", role: "守備", color: "#776391", accent: "#aadfd1", traitName: "指定様式", traitText: "決められた形を崩さず攻撃を受ける。", ai: "careful", element: "tide", weak: "flame", basic: "様式角", signature: "記入欄の迷宮", utility: "様式防壁" }),
    dedicatedOpponent({ id: "audit-center-stamp", name: "中央塔・印章銃士", role: "攻撃", color: "#58456f", accent: "#e96978", traitName: "要押印", traitText: "守りが整った相手へ決裁印を撃ち込む。", ai: "aggressive", element: "flame", weak: "tide", basic: "小印弾", signature: "最終決裁砲", utility: "押印準備" }),
  ],
  "assessment-4": [
    dedicatedOpponent({ id: "audit-south-slide", name: "南塔・資料投影士", role: "支援", color: "#3f7595", accent: "#f4d46c", traitName: "残り八時間", traitText: "第六ターンから説明速度を上げる。", ai: "tricky", element: "star", weak: "flame", basic: "頁送り", signature: "全資料一括投影", utility: "要点整理" }),
    dedicatedOpponent({ id: "audit-south-cake", name: "南塔・ケーキ番", role: "守備", color: "#5687a2", accent: "#ffd5df", traitName: "五分で終われば", traitText: "終盤までケーキを守り、仲間の時間を稼ぐ。", ai: "careful", element: "tide", weak: "gale", basic: "銀皿打ち", signature: "十二時間耐久皿", utility: "ケーキ防衛" }),
    dedicatedOpponent({ id: "audit-south-pointer", name: "南塔・早口案内", role: "速攻", color: "#315e7b", accent: "#94e1d2", traitName: "巻きでお願いします", traitText: "終盤に攻撃と速度を一気に上げる。", ai: "aggressive", element: "gale", weak: "star", basic: "早口弾", signature: "結論から百項目", utility: "倍速進行" }),
  ],
  "assessment-5": [
    dedicatedOpponent({ id: "audit-optimal-zero", name: "最適化室・零号", role: "攻撃", color: "#7d1f2b", accent: "#f0c85a", traitName: "欠員補正", traitText: "仲間が倒れるほど残存戦力を最適化する。", ai: "aggressive", element: "flame", weak: "tide", basic: "交換予定打ち", signature: "人員最適化・零", utility: "再配置命令" }),
    dedicatedOpponent({ id: "audit-optimal-one", name: "最適化室・壱号", role: "守備", color: "#972b39", accent: "#8fe0d0", traitName: "余剰なし", traitText: "倒れた仲間の守りを引き継ぐ。", ai: "careful", element: "tide", weak: "gale", basic: "定員盾", signature: "余剰削減の壁", utility: "最小構成" }),
    dedicatedOpponent({ id: "audit-optimal-two", name: "最適化室・弐号", role: "妨害", color: "#641721", accent: "#f2eef4", traitName: "名前は不要", traitText: "欠員が出るたび術式を強める。", ai: "tricky", element: "star", weak: "flame", basic: "無記名札", signature: "交換日だけの名簿", utility: "匿名化の霧" }),
  ],
};

export const matchOpponentLineups: Record<string, BattleFighterDefinition[]> = {
  "opening-cup": openingRookieOpponents,
  ...dedicatedMatchOpponents,
};

export const dedicatedOpponentDefinitions = Object.values(matchOpponentLineups).flat();

export const battleOpponentById = new Map(
  dedicatedOpponentDefinitions.map((opponent) => [opponent.id, opponent]),
);

export const battleOpponentVisualIndex: Record<string, number> = {
  "rookie-piyo-slime": 0,
  "rookie-kobold": 1,
  "rookie-bat-mage": 2,
};
