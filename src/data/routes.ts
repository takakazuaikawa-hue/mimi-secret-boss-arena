import type { RunState } from "../game/types";

export interface RouteDefinition {
  id: RunState["route"];
  name: string;
  kicker: string;
  description: string;
  rules: [string, string, string];
  startingMoney: number;
  startingSharedPoints: number;
  maxRoster: number;
  recruitmentScale: number;
  focusChance: number;
  battleScale: number;
  routeEventChance: number;
}

export const routeDefinitions: Record<RunState["route"], RouteDefinition> = {
  normal: {
    id: "normal",
    name: "通常営業",
    kicker: "探索・解放・試合を選び取る基本形",
    description:
      "探して控えを厚くするか、今いる選手の物語を進めるかを選ぶ標準ルート。契約を解いた選手も、本人の意思で育成と試合へ参加する。",
    rules: ["公式戦7回", "契約判断3回", "資金 6,000 G"],
    startingMoney: 6000,
    startingSharedPoints: 2,
    maxRoster: 7,
    recruitmentScale: 1,
    focusChance: 0.78,
    battleScale: 1,
    routeEventChance: 0,
  },
  domination: {
    id: "domination",
    name: "支配興行",
    kicker: "敗北も育成差になる高難度興行",
    description:
      "本社の査定試合が5回追加され、敵も強い。勝てば固有育成Pと賞金を早く稼げるが、負けが続けば通常営業より弱くなる。",
    rules: ["査定試合 +5", "敵戦力 +12%", "初期資金 4,200 G"],
    startingMoney: 4200,
    startingSharedPoints: 0,
    maxRoster: 7,
    recruitmentScale: 0.88,
    focusChance: 0.64,
    battleScale: 1.12,
    routeEventChance: 0.32,
  },
  chaos: {
    id: "chaos",
    name: "大混線祭",
    kicker: "育成論の外側から事件が来る",
    description:
      "試合日程と編成条件は通常営業と同じ。代わりに、専用の珍事件と8人目の候補が育成計画へ割り込む。",
    rules: ["専用珍事件", "候補枠 8人", "試合条件は通常と同じ"],
    startingMoney: 6000,
    startingSharedPoints: 4,
    maxRoster: 8,
    recruitmentScale: 1.08,
    focusChance: 0.72,
    battleScale: 1.03,
    routeEventChance: 0.48,
  },
};

export const getRouteDefinition = (route: RunState["route"]) =>
  routeDefinitions[route];
