import type { MatchDefinition } from "../game/types";

export const officialMatches: MatchDefinition[] = [
  {
    id: "opening-cup",
    name: "新規チーム親睦トーナメント",
    week: 4,
    opponentName: "東門ひよこスライムズ",
    opponentColor: "#2f855a",
    difficulty: 0.62,
    prize: 1800,
    roundsOnWin: 2,
    story:
      "優勝賞品はアルデバラン湯けむり温泉の二泊三日旅行。ミミは訂正手続きの相談へ来ただけだったが、館内着と朝食ビュッフェの写真を見て参加申請書へ署名した。新人向けの三連戦で、相手はどこから見ても普通のモンスターである。こちらの選手だけが普通ではない。",
  },
  {
    id: "bronze-cup",
    name: "青銅看板争奪戦",
    week: 8,
    opponentName: "第三営業所・午後班",
    opponentColor: "#c05621",
    difficulty: 0.98,
    prize: 3800,
    roundsOnWin: 1,
    story:
      "勝者は青銅製の巨大看板を持ち帰れる。置き場所は自分で確保し、敗者は設置工事を手伝う決まりだ。控室の窓から、昨年の看板を背負ったまま戦う選手が見えた。",
  },
  {
    id: "contract-league",
    name: "契約者リーグ",
    week: 12,
    opponentName: "白磁の郵便騎士団",
    opponentColor: "#2b6cb0",
    difficulty: 1.08,
    prize: 5200,
    roundsOnWin: 0,
    story:
      "契約条項の読み上げだけで開会式が二時間ある、由緒正しいリーグ戦。観客は第五十六条から眠り始め、選手は第八十一条で静かに怒り始めた。ミミは自分の契約番号だけ、最後まで呼ばれないことに気づく。",
  },
  {
    id: "gold-jackpot",
    name: "黄金ジャックポット杯",
    week: 16,
    opponentName: "王都ホテル厨房部",
    opponentColor: "#b7791f",
    difficulty: 1.18,
    prize: 7200,
    roundsOnWin: 1,
    story:
      "賞金も敵も派手になり、入場演出では金貨の雨まで降る。拾った金貨はすべて広告用で使えない。実況だけはいつも通り軽く、世界を三度救った選手を『期待の新人』と紹介している。",
  },
  {
    id: "owner-grand-prix",
    name: "所有者グランプリ",
    week: 20,
    opponentName: "南塔・優良契約選抜",
    opponentColor: "#805ad5",
    difficulty: 1.3,
    prize: 9800,
    roundsOnWin: 1,
    story:
      "誰の命令が最も優れているかを競う大会。名前を読んだ時点で、もう少し帰りたい。所有者席には王冠型の命令装置が用意されているが、ミミのチームはそこへ弁当を置いた。",
  },
  {
    id: "aldebaran-championship",
    name: "アルデバラン中央選手権",
    week: 24,
    opponentName: "本社直属・一等星",
    opponentColor: "#d53f8c",
    difficulty: 1.43,
    prize: 14000,
    roundsOnWin: 0,
    story:
      "会社が最も誇る無敗チーム。選手名はすべて黒塗りで、戦績欄には『適切に勝利』とだけ印刷されている。勝てば、闘技場の最深部へ通じる扉が開く。負けても会社は通常営業を続ける。",
  },
  {
    id: "last-demon-king",
    name: "最終興行・終演未定",
    week: 26,
    opponentName: "制御不能の最強大魔王",
    opponentColor: "#c53030",
    difficulty: 1.58,
    prize: 20000,
    roundsOnWin: 0,
    story:
      "運営側さえ止められない最後の出場者。大魔王が呼吸するたび、観客席の契約印が一枚ずつ燃えていく。大会規約にはまだ対処法が印刷されておらず、係員は白紙の追補を配りながら避難している。",
    final: true,
  },
];

export const dominationAssessmentMatches: MatchDefinition[] = [
  {
    id: "assessment-1",
    name: "第一回本社査定",
    week: 6,
    opponentName: "北塔査定課",
    opponentColor: "#287271",
    difficulty: 0.98,
    prize: 2100,
    roundsOnWin: 0,
    story:
      "戦績表へ空欄を作らないための臨時試合。査定官は選手より先に減点札を構え、勝利条件を試合開始後に開封する。空欄の方が親切だった可能性がある。",
  },
  {
    id: "assessment-2",
    name: "第二回本社査定",
    week: 10,
    opponentName: "西塔査定課",
    opponentColor: "#b56576",
    difficulty: 1.08,
    prize: 2800,
    roundsOnWin: 0,
    story:
      "前回の改善点を確認する試合。改善点は試合開始後に配られ、受領印を押す間も時計は止まらない。対戦相手は全員、同じ研修笑顔を浮かべている。",
  },
  {
    id: "assessment-3",
    name: "第三回本社査定",
    week: 14,
    opponentName: "中央塔査定課",
    opponentColor: "#6d597a",
    difficulty: 1.2,
    prize: 3600,
    roundsOnWin: 0,
    story:
      "中間査定という名の本番。査定官だけが練習着で来ており、敗因記入欄は開幕前から三枚用意されている。ミミは勝因記入欄を余白へ書き足した。",
  },
  {
    id: "assessment-4",
    name: "第四回本社査定",
    week: 18,
    opponentName: "南塔査定課",
    opponentColor: "#457b9d",
    difficulty: 1.32,
    prize: 4500,
    roundsOnWin: 0,
    story:
      "勝率が低いほど説明会が長くなる。壇上には十二時間分の資料と、五分で終わった場合の小さなケーキが並ぶ。試合で短縮できるなら、勝つ理由としては十分だ。",
  },
  {
    id: "assessment-5",
    name: "最終本社査定",
    week: 22,
    opponentName: "本社人材最適化室",
    opponentColor: "#9b2226",
    difficulty: 1.44,
    prize: 5800,
    roundsOnWin: 0,
    story:
      "最適化される側が、最適化する側を倒せば話が早い。相手の名簿には名前ではなく、交換予定日だけが並んでいる。そんな予定を消す方法は、社内規定には書いていない。",
  },
];

export const matchesForRoute = (route: "normal" | "domination" | "chaos") =>
  route === "domination"
    ? [...officialMatches, ...dominationAssessmentMatches].sort(
        (a, b) => a.week - b.week,
      )
    : officialMatches;

export const matchForWeek = (
  week: number,
  route: "normal" | "domination" | "chaos" = "normal",
) => matchesForRoute(route).find((match) => match.week === week);

export const parseBonusMatchId = (id: string) => {
  if (!id.startsWith("bonus:")) return undefined;
  const payload = id.slice("bonus:".length);
  const roundMatch = payload.match(/^(\d+):(.+)$/);
  return roundMatch
    ? { round: Number(roundMatch[1]), baseId: roundMatch[2] }
    : { round: 1, baseId: payload };
};

export const getMatchDefinition = (id: string): MatchDefinition | undefined => {
  const bonus = parseBonusMatchId(id);
  if (bonus) {
    const parent = [...officialMatches, ...dominationAssessmentMatches].find(
      (match) => match.id === bonus.baseId,
    );
    if (!parent) return undefined;
    const openingOpponents = [
      "東門ひよこスライムズ",
      "南棟おそうじゴーレム班",
      "西口まかないオーク同盟",
    ];
    return {
      ...parent,
      id,
      name: `${parent.name}・第${bonus.round + 1}試合`,
      opponentName:
        parent.id === "opening-cup"
          ? openingOpponents[bonus.round] ?? `${parent.opponentName} 別働隊`
          : `${parent.opponentName} 別働隊 ${bonus.round}`,
      difficulty:
        parent.difficulty +
        (parent.id === "opening-cup" ? 0.07 : 0.1) * bonus.round,
      prize: Math.round(parent.prize * 0.6),
      roundsOnWin: Math.max(0, parent.roundsOnWin - bonus.round),
      story:
        parent.id === "opening-cup"
          ? `新人向け三連戦の第${bonus.round + 1}試合。相手は真面目に鍛えた普通のモンスターたち。ミミの側では、封印を解くまでもない裏ボスが「どこまで手加減すれば接戦に見えるか」で困っている。`
          : "勝った者だけに追加された一戦。帰り支度をした選手が、もう一度呼び戻された。",
    };
  }

  return [...officialMatches, ...dominationAssessmentMatches].find(
    (match) => match.id === id,
  );
};
