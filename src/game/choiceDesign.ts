import type {
  CharacterScene,
  ChoiceTone,
  SceneChoice,
} from "./types";

export const choiceToneMeta: Record<
  ChoiceTone,
  { label: string; shortLabel: string }
> = {
  comic: {
    label: "笑って突破する",
    shortLabel: "笑",
  },
  heroic: {
    label: "怖さごと引き受ける",
    shortLabel: "熱",
  },
  tender: {
    label: "相手の気持ちを先に置く",
    shortLabel: "心",
  },
  defiant: {
    label: "決められた筋書きを断る",
    shortLabel: "抗",
  },
  wild: {
    label: "未知の方へ賭ける",
    shortLabel: "飛",
  },
  pragmatic: {
    label: "勝てる形を先に作る",
    shortLabel: "策",
  },
};

const keywordGroups: Array<[ChoiceTone, string[]]> = [
  [
    "defiant",
    [
      "破棄",
      "異議",
      "止める",
      "断る",
      "拒否",
      "切る",
      "自由",
      "命令なし",
      "本人へ返す",
      "本人に任せる",
      "変える",
    ],
  ],
  [
    "heroic",
    [
      "挑む",
      "守る",
      "正面",
      "危険",
      "最後まで",
      "追う",
      "上がる",
      "乗る",
      "開ける",
      "踏み込む",
      "外す",
    ],
  ],
  [
    "tender",
    [
      "一緒",
      "聞く",
      "待つ",
      "休む",
      "返す",
      "譲る",
      "隣",
      "同じ",
      "朝食",
      "話す",
      "見送る",
      "持ち主",
    ],
  ],
  [
    "comic",
    [
      "申請",
      "登録",
      "会議",
      "経理",
      "備品",
      "正式",
      "査定",
      "予約",
      "規定",
      "宣材",
      "手順",
      "掲示",
      "番号",
      "勤務",
    ],
  ],
  [
    "wild",
    [
      "世界",
      "未来",
      "夢",
      "鏡",
      "猫",
      "空",
      "影",
      "十三階",
      "非常停止",
      "一切れ",
      "水槽",
      "過去",
      "望遠鏡",
      "電話",
      "賭ける",
    ],
  ],
];

const inferTone = (choice: SceneChoice): ChoiceTone => {
  if (choice.tone) return choice.tone;
  if (choice.liberationDecision === "release") return "defiant";
  if (choice.liberationDecision === "retain") return "heroic";

  const text = `${choice.label} ${choice.result}`;
  const keywordTone = keywordGroups.find(([, words]) =>
    words.some((word) => text.includes(word)),
  )?.[0];
  if (keywordTone) return keywordTone;

  if ((choice.money ?? 0) < 0 && (choice.fighterPoints ?? 0) > 0) {
    return "wild";
  }
  return "comic";
};

const intentFor = (choice: SceneChoice, tone: ChoiceTone) => {
  if (choice.intent) return choice.intent;
  if ((choice.money ?? 0) > 0) return "今後のために資金を確保する";
  if ((choice.money ?? 0) < 0) return "資金を使って可能性へ賭ける";
  if ((choice.fighterPoints ?? 0) > 0) return "この人物の可能性を伸ばす";
  if ((choice.sharedPoints ?? 0) > 0) return "チーム全体の準備を進める";
  if (choice.condition === "good") return "次の週へ向けて体調を整える";
  const intents: Record<ChoiceTone, string> = {
    comic: "この場を笑える方向へ転がす",
    heroic: "危険ごと正面から引き受ける",
    tender: "相手の本音を聞ける行動を選ぶ",
    defiant: "決められた手順とは別の道を作る",
    wild: "誰も試していない方法へ賭ける",
    pragmatic: "いま必要な成果を確実に取る",
  };
  return intents[tone];
};

const promiseFor = (choice: SceneChoice, tone: ChoiceTone) => {
  if (choice.promise) return choice.promise;
  if (choice.liberationDecision === "release") {
    return "契約を終わらせたうえで、本人の意思による次の約束を交わす。";
  }
  if (choice.liberationDecision === "retain") {
    return "契約を終わらせ、残るか離れるかを本人自身の判断へ返す。";
  }

  const promises: string[] = [];
  if ((choice.money ?? 0) >= 900) {
    promises.push("先の勝負に使える資金を持ち帰る");
  }
  if ((choice.money ?? 0) < 0) {
    promises.push("資金を使って、別の可能性へ手を伸ばす");
  }
  if ((choice.fighterPoints ?? 0) > 0) {
    promises.push("その人だけが持つ固有の成長を引き出す");
  }
  if ((choice.sharedPoints ?? 0) > 0) {
    promises.push("誰にでも使える力をチームへ持ち帰る");
  }
  if (choice.condition === "good") {
    promises.push("全員の調子を立て直し、次の週へ備える");
  }

  if (promises.length === 0) {
    return "選んだ行動への相手の返事と、後に思い出す内容が変わる。";
  }
  return `${promises.slice(0, 2).join("。")}。`;
};

const memoryFor = (choice: SceneChoice, tone: ChoiceTone) => {
  if (choice.memory) return choice.memory;
  const memories: Record<ChoiceTone, string> = {
    comic:
      "この一件は、あとで誰も正しい勤務報告書を書けない思い出になった。",
    heroic:
      "怖かったことまで含めて、あの場にいた全員がこの決断を覚えている。",
    tender:
      "この決断は「一緒に決めたこと」として、相手の側にも静かに残った。",
    defiant:
      "規則の余白に、ミミが選んだ新しい前例が一つ残った。",
    wild:
      "この判断は、忘れた頃に思いもよらない形をして戻ってきそうだ。",
    pragmatic:
      "結果はすぐに出た。その代わり、誰が決めたかも記録へ残った。",
  };
  return memories[tone];
};

export const resolveChoiceDesign = (
  choice: SceneChoice,
): SceneChoice & Required<Pick<SceneChoice, "tone" | "intent" | "promise" | "memory">> => {
  const tone = inferTone(choice);
  return {
    ...choice,
    tone,
    intent: intentFor(choice, tone),
    promise: promiseFor(choice, tone),
    memory: memoryFor(choice, tone),
  };
};

export const withChoiceDesign = (scene: CharacterScene): CharacterScene => {
  if (!scene.choices) return scene;
  return {
    ...scene,
    choices: scene.choices.map(resolveChoiceDesign) as CharacterScene["choices"],
  };
};
