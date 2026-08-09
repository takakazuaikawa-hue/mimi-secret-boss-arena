import type { BattlePresentationKind } from "./types";

export interface BattleBroadcastInput {
  actorName: string;
  targetNames: string;
  skillName: string;
  kind: BattlePresentationKind;
  impacted: boolean;
  critical: boolean;
  detail: string;
  amount: number;
  defeated: boolean;
}

export interface BattleBroadcastLine {
  headline: string;
  body: string;
}

const withPeriod = (text: string) =>
  /[。！!?]$/.test(text) ? text : `${text}。`;

const beforeAction = ({
  actorName,
  targetNames,
  skillName,
  kind,
}: BattleBroadcastInput): BattleBroadcastLine => {
  switch (kind) {
    case "trait":
      return {
        headline: `「${actorName}の特性『${skillName}』が発動！」`,
        body: "選手の状態が変化します。",
      };
    case "manager":
      return {
        headline: "「監督・ミミの指示！」",
        body: `${targetNames}へ声が届きます。`,
      };
    case "heal":
      return {
        headline: `「${actorName}は回復技を使った！」`,
        body: `対象は${targetNames}。技名は『${skillName}』！`,
      };
    case "guard":
      return {
        headline: `「${actorName}は防御技を使った！」`,
        body: `『${skillName}』で${targetNames}を守ります。`,
      };
    case "buff":
      return {
        headline: `「${actorName}は強化技を使った！」`,
        body: `『${skillName}』で${targetNames}を強化します。`,
      };
    case "debuff":
      return {
        headline: `「${actorName}は妨害技を使った！」`,
        body: `狙いは${targetNames}。技名は『${skillName}』！`,
      };
    default:
      return {
        headline: `「${actorName}の攻撃！」`,
        body: `狙いは${targetNames}。技名は『${skillName}』！`,
      };
  }
};

const afterAction = (input: BattleBroadcastInput): BattleBroadcastLine => {
  const {
    actorName,
    targetNames,
    skillName,
    kind,
    critical,
    detail,
    amount,
    defeated,
  } = input;

  if (kind === "miss") {
    return {
      headline: `「しかし、${targetNames}は攻撃をかわした！」`,
      body: `${actorName}の攻撃は当たりませんでした。`,
    };
  }
  if (kind === "damage") {
    return {
      headline: `「${targetNames}に${amount}ダメージ！」`,
      body: defeated
        ? `${targetNames}は戦闘不能！`
        : critical
          ? "会心の一撃です！"
          : withPeriod(detail),
    };
  }
  if (kind === "trait") {
    return {
      headline: `「${actorName}の特性が発動しました！」`,
      body: withPeriod(detail),
    };
  }
  if (kind === "manager") {
    return {
      headline: "「ミミの指示が届きました！」",
      body: withPeriod(detail),
    };
  }
  if (kind === "heal") {
    return {
      headline: `「${detail}！」`,
      body: `${actorName}の『${skillName}』が${targetNames}を立て直します。`,
    };
  }
  if (kind === "guard") {
    return {
      headline: `「${detail}！」`,
      body: "次に受ける攻撃へ備えます。",
    };
  }
  if (kind === "buff") {
    return {
      headline: `「${detail}！」`,
      body: `${targetNames}の能力が上がりました。`,
    };
  }
  if (kind === "debuff") {
    return {
      headline: `「${detail}！」`,
      body: "相手の能力が下がりました。",
    };
  }
  return {
    headline: `「${withPeriod(detail)}」`,
    body: `${actorName}の行動が完了しました。`,
  };
};

export const buildBattleBroadcast = (
  input: BattleBroadcastInput,
): BattleBroadcastLine =>
  input.impacted ? afterAction(input) : beforeAction(input);

export const battleBroadcastForbiddenTerms = [
  "AIは",
  "行動予告",
  "結果待ち",
  "注目",
  "対象:",
  "属性なら",
  "戦況更新",
  "判定中",
  "踏みとどまった",
  "目つきが変わった",
] as const;
