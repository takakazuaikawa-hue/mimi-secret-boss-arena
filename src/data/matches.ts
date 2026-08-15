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
    opponentIds: ["rookie-piyo-slime", "rookie-kobold", "rookie-bat-mage"],
    battleRule: "rookie-rally",
    battleFeature: {
      name: "新人三人の教本どおり",
      summary: "素直な仕草が多い。台詞と構えを見れば次の狙いを読みやすい。",
    },
    enemyCues: {
      attack: [
        { gesture: "木剣と小盾が同時に前へ出る", line: "せ、せーので行きます！" },
        { gesture: "三人とも靴のつま先をこちらへ向ける", line: "教本の一番目……突撃！" },
      ],
      guard: [
        { gesture: "ピヨゼリーが盾の陰へ丸くなる", line: "まず受けて、それからです！" },
        { gesture: "大兜と魔導書が身体の前へ揃う", line: "防御の頁、開きました！" },
      ],
      skill: [
        { gesture: "魔導書のしおりだけが青く光る", line: "呪文、読み間違えないように……" },
        { gesture: "三人が小声で頁番号を確かめる", line: "応用問題へ進みます！" },
      ],
    },
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
    opponentIds: ["bronze-mikage", "bronze-karin", "bronze-soroban"],
    battleRule: "closing-shift",
    battleFeature: {
      name: "閉店前の追い込み",
      summary: "第4ターンから攻撃と速度が上がる。長引かせるほど午後班が勢いづく。",
    },
    enemyCues: {
      attack: [
        { gesture: "カリンが退勤札をポケットへしまう", line: "帰る前に、一本決めます！" },
        { gesture: "巨大看板の角がこちらへ傾く", line: "設置場所まで押し切るぞ！" },
      ],
      guard: [
        { gesture: "ミカゲが看板の脚を床へ固定する", line: "営業時間内は、ここを通しません" },
        { gesture: "ソロバンが看板の裏へ伝票を積む", line: "いったん帳尻を合わせます" },
      ],
      skill: [
        { gesture: "算盤玉が一列だけ逆向きに走る", line: "未精算分を、まとめて計上！" },
        { gesture: "午後番三人の名札が橙色に点る", line: "午後班、残業前の連携です！" },
      ],
    },
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
    opponentIds: ["postal-weiss", "postal-rakka", "postal-tod"],
    battleRule: "postal-order",
    battleFeature: {
      name: "必着の配達順",
      summary: "偶数ターンに隊列を整え、守りと魔力を積み上げる。連携前が崩しどころ。",
    },
    enemyCues: {
      attack: [
        { gesture: "消印槍が封筒の中央をまっすぐ指す", line: "宛先確認。正面へ届ける！" },
        { gesture: "ヴァイスが速達帯を肩へ掛け直す", line: "最短経路で参ります" },
      ],
      guard: [
        { gesture: "三通の白封筒が盾のように重なる", line: "この便は受領まで開きません" },
        { gesture: "ラッカが消印槍を横へ寝かせる", line: "配達順を守れ。先走るな" },
      ],
      skill: [
        { gesture: "宛名札の文字が別の名前へ書き変わる", line: "転送先を変更します" },
        { gesture: "未使用の切手が星形に浮かぶ", line: "特別料金分、働いてもらいます" },
      ],
    },
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
    opponentIds: ["kitchen-poele", "kitchen-souffle", "kitchen-consomme"],
    battleRule: "full-course",
    battleFeature: {
      name: "三皿ごとの立て直し",
      summary: "第3・第6ターンに全員を回復する。次の皿が出る前に一人を崩したい。",
    },
    enemyCues: {
      attack: [
        { gesture: "ポワレが鉄鍋の蓋を勢いよく外す", line: "熱いうちにお出しします！" },
        { gesture: "銀盆が腰の高さで水平に構えられる", line: "お待たせしました、主菜です" },
      ],
      guard: [
        { gesture: "鉄鍋と銀盆がぴたりと重なる", line: "ただいま次の皿を準備中です" },
        { gesture: "スフレが焼き上がりを見守っている", line: "扉を開けると、しぼみますから" },
      ],
      skill: [
        { gesture: "粉糖が空中で星座の形を作る", line: "デザートは別腹ですよね？" },
        { gesture: "三人が同時に銀のクロッシュへ手を掛ける", line: "フルコース、仕上げます！" },
      ],
    },
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
    opponentIds: ["owner-regalia", "owner-ordo", "owner-seal"],
    battleRule: "ownership-audit",
    battleFeature: {
      name: "命令を待つ王冠",
      summary: "強制指示を使うと敵が強化される。高い信頼で『任せる』と逆に動揺させられる。",
    },
    enemyCues: {
      attack: [
        { gesture: "オルドが誰の命令も待たず剣を抜く", line: "許可は出た。執行する" },
        { gesture: "王冠型の命令装置が赤く点滅する", line: "命令番号一、前進せよ" },
      ],
      guard: [
        { gesture: "シールの盾へ承認印が三つ並ぶ", line: "現状維持を承認します" },
        { gesture: "レガリアが指揮杖を胸元へ戻す", line: "次の命令まで待機なさい" },
      ],
      skill: [
        { gesture: "紫の命令文が空中へ何段も開く", line: "従う理由を、上書きしましょう" },
        { gesture: "三人の首輪型端末が同時に鳴る", line: "例外処理を開始します" },
      ],
    },
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
    opponentIds: ["star-alpha", "star-beta", "star-gamma"],
    battleRule: "first-star",
    battleFeature: {
      name: "無敗手順A・B・C",
      summary: "開幕は全員が障壁を持ち、第4ターンに攻撃・魔力・速度を再点火する。",
    },
    enemyCues: {
      attack: [
        { gesture: "アルファだけが手順書を閉じる", line: "手順A。ここで終わらせます" },
        { gesture: "三つの星章が一直線にこちらを向く", line: "一等星、前進" },
      ],
      guard: [
        { gesture: "ベータの青環が三人を囲む", line: "手順B。損耗を許可しません" },
        { gesture: "全員が無言で半歩だけ後退する", line: "予定どおり、受けます" },
      ],
      skill: [
        { gesture: "ガンマの指先に白い夜空が凝縮する", line: "手順C。照度を上げます" },
        { gesture: "黒塗りの戦績表から光が漏れる", line: "記録は『適切に勝利』です" },
      ],
    },
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
    opponentIds: ["finale-virgo", "finale-belze", "finale-nox"],
    battleRule: "uncontrolled-finale",
    battleFeature: {
      name: "終演を拒む三王",
      summary: "第3・第6ターンに規定外の力を解放する。任せきりでは押し切られやすい。",
    },
    enemyCues: {
      attack: [
        { gesture: "ベルゼの灰冠から火の粉が前へ流れる", line: "王都ごと、舞台にしてやる" },
        { gesture: "ヴァルゴが客席ではなくミミを見る", line: "幕を引く者から消そう" },
      ],
      guard: [
        { gesture: "三つの王冠が低く沈み、床の契約印を吸う", line: "まだ終演には早い" },
        { gesture: "ノクスが白紙の追補を盾の形に折る", line: "その攻撃は規約外だ" },
      ],
      skill: [
        { gesture: "空白の規約へ黒い第零条が浮かぶ", line: "書いてないなら、何でもありだ" },
        { gesture: "観客席の契約印が順番に消えていく", line: "アンコールを始めよう" },
      ],
    },
    story:
      "運営側さえ止められない最後の出場者。大魔王が呼吸するたび、観客席の契約印が一枚ずつ燃えていく。大会規約にはまだ対処法が印刷されておらず、係員は白紙の追補を配りながら避難している。",
    final: true,
  },
  {
    id: "finale-legends",
    name: "決勝・新作対再演",
    week: 26,
    opponentName: "歴代王者選抜(台帳再現)",
    opponentColor: "#8a6d1f",
    difficulty: 1.58,
    prize: 20000,
    roundsOnWin: 0,
    opponentIds: ["legend-hundred-arm", "legend-mirror-saint", "legend-unfallen"],
    battleRule: "uncontrolled-finale",
    battleFeature: {
      name: "全盛期の再現",
      summary: "第3・第6ターンに全盛期の型を解放する。記録どおりの完璧な連携で来る。",
    },
    enemyCues: {
      attack: [
        { gesture: "百腕王の拳が、四百年前の型のまま振り上がる", line: "記録のとおりに、参る" },
        { gesture: "鏡聖の刃が客席の歓声を映して走る", line: "この歓声も、覚えがある" },
      ],
      guard: [
        { gesture: "不倒王が一歩も引かず、砂に根を張る", line: "この構え、破った者は記録に無い" },
        { gesture: "三人の型が寸分の狂いなく重なる", line: "完璧とは、こういうものだ" },
      ],
      skill: [
        { gesture: "三人の全盛期が、同時に燃え上がる", line: "全盛期とは、いつでも今のことだ" },
        { gesture: "四百年ぶんの優勝の口上が、砂の上に響く", line: "諸君、これが頂点の型である" },
      ],
    },
    story:
      "台帳が選び抜いた、四百年の優勝者たちの全盛期の再現。型も口上も栄光も、記録のままに完璧である。ただし、今夜の夜風に何を思うかだけは、どこにも記録されていない。",
    final: true,
  },
  {
    id: "finale-first-troupe",
    name: "決勝・柿落とし興行",
    week: 26,
    opponentName: "初演の一座(台帳最終頁)",
    opponentColor: "#5a4a7a",
    difficulty: 1.58,
    prize: 20000,
    roundsOnWin: 0,
    opponentIds: ["first-troupe-lead", "first-troupe-blade", "first-troupe-chorus"],
    battleRule: "uncontrolled-finale",
    battleFeature: {
      name: "最初の舞台の型",
      summary: "第3・第6ターンに四百年前の初演の型を解放する。すべての型の、いちばん古い形で来る。",
    },
    enemyCues: {
      attack: [
        { gesture: "座長の構えが、すべての型の始まりの形を取る", line: "これが、最初の一手です" },
        { gesture: "立役の足が、誰も踏んだことのない歩法で砂を踏む", line: "この砂は、私たちが最初に踏んだ" },
      ],
      guard: [
        { gesture: "囃子の拍子が、攻め手の呼吸とずれて響く", line: "間は、こちらのものです" },
        { gesture: "一座が舞台の立ち位置のまま守りにつく", line: "幕は、まだ下ろさせません" },
      ],
      skill: [
        { gesture: "四百年前の開幕口上が、新しい会場に朗々と響く", line: "東西、東西——" },
        { gesture: "三人の影が、最初の舞台の絵姿と重なる", line: "ご覧あれ、これが初演" },
      ],
    },
    story:
      "台帳の最終頁が立てた、最後の演目。四百年前、この闘技場の最初の舞台に立った一座の再現である。すべての型のいちばん古い形を使う。倒し合いではなく、受け渡しの一戦。",
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
    opponentIds: ["audit-north-pen", "audit-north-file", "audit-north-clock"],
    battleRule: "scorecard-wall",
    battleFeature: {
      name: "先行採点の減点札",
      summary: "開幕に障壁を張る。札を割るまでは焦って大技を重ねない方がよい。",
    },
    enemyCues: {
      attack: [
        { gesture: "赤ペンが答案ではなくこちらを指す", line: "実技項目、採点します" },
        { gesture: "時刻係が秒針を前へ弾く", line: "開始時刻はもう過ぎています" },
      ],
      guard: [
        { gesture: "分厚い添付資料が三人の前へ積まれる", line: "まず別紙をご確認ください" },
        { gesture: "減点札が盾の形に並び直す", line: "評価は保留します" },
      ],
      skill: [
        { gesture: "赤字の『要改善』が空中で増殖する", line: "改善点を追加します" },
        { gesture: "三本の赤ペンが同じ欄を囲む", line: "重点項目へ移ります" },
      ],
    },
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
    opponentIds: ["audit-west-smile", "audit-west-arrow", "audit-west-note"],
    battleRule: "moving-standard",
    battleFeature: {
      name: "毎巡変わる改善基準",
      summary: "奇数ターンは攻撃、偶数ターンは防御を強める。現在の巡を見て指示を変える。",
    },
    enemyCues: {
      attack: [
        { gesture: "三人の研修笑顔が同時に深くなる", line: "積極性を評価します" },
        { gesture: "指示棒の矢印がこちら向きへ貼り替わる", line: "改善案どおり前進します" },
      ],
      guard: [
        { gesture: "議事録が盾のように閉じられる", line: "いったん持ち帰って検討します" },
        { gesture: "矢印が全員の足元で円を描く", line: "現状維持も改善です" },
      ],
      skill: [
        { gesture: "議事録の文字が勝手に書き足される", line: "その発言、記録しました" },
        { gesture: "研修用の笑顔だけが残像になる", line: "模範例を共有しますね" },
      ],
    },
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
    opponentIds: ["audit-center-chief", "audit-center-form", "audit-center-stamp"],
    battleRule: "midterm-pressure",
    battleFeature: {
      name: "勝負どころの評価保留",
      summary: "監督指示の瞬間に守りを固める。崩す指示か、次の巡へ備える判断が必要。",
    },
    enemyCues: {
      attack: [
        { gesture: "印章銃士が未記入の勝因欄へ狙いを定める", line: "空欄はこちらで埋めます" },
        { gesture: "中間主任が評価札を裏返す", line: "ここから本番扱いです" },
      ],
      guard: [
        { gesture: "指定様式の枠線が三人を囲む", line: "書式外は受理できません" },
        { gesture: "評価札が『保留』で止まる", line: "判断材料が足りませんね" },
      ],
      skill: [
        { gesture: "三枚の敗因記入欄が宙へ開く", line: "先に候補を用意しました" },
        { gesture: "決裁印が紫の火花を散らす", line: "中間決裁を実行します" },
      ],
    },
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
    opponentIds: ["audit-south-slide", "audit-south-cake", "audit-south-pointer"],
    battleRule: "overtime-rush",
    battleFeature: {
      name: "第六ターンから倍速説明",
      summary: "終盤に攻撃と速度が急上昇する。任せきりで時間を渡すと押し込まれる。",
    },
    enemyCues: {
      attack: [
        { gesture: "案内役が資料を十頁まとめてめくる", line: "時間がないので結論から百項目！" },
        { gesture: "十二時間時計の針が一気に進む", line: "巻きでお願いします！" },
      ],
      guard: [
        { gesture: "ケーキ番が銀皿を両手で覆う", line: "五分で終わるまで守ります" },
        { gesture: "投影資料が『休憩』の頁で止まる", line: "ここで質疑応答です" },
      ],
      skill: [
        { gesture: "十二時間分の資料が扇状に開く", line: "全頁、一括で投影します" },
        { gesture: "小さなケーキの蝋燭が青く燃える", line: "短縮特典を守り切ります" },
      ],
    },
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
    opponentIds: ["audit-optimal-zero", "audit-optimal-one", "audit-optimal-two"],
    battleRule: "optimization-chain",
    battleFeature: {
      name: "欠員を力へ変える最適化",
      summary: "一人倒れるたび残った二人が強化される。均等に削るより倒す順番が重要。",
    },
    enemyCues: {
      attack: [
        { gesture: "零号が仲間の交換予定日を線で消す", line: "残存人員で処理します" },
        { gesture: "三つの番号札が一つの照準へ重なる", line: "重複作業を削減します" },
      ],
      guard: [
        { gesture: "壱号が定員表を盾へ差し込む", line: "これ以上の欠員は許容外です" },
        { gesture: "交換予定日だけが赤く残る", line: "次の配置まで保留します" },
      ],
      skill: [
        { gesture: "弐号の名札から名前の欄が消える", line: "個体名は処理に不要です" },
        { gesture: "名簿の空欄が黒い術式へ変わる", line: "空いた分だけ最適化します" },
      ],
    },
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

/** 週26決勝の区分別ID。区分未指定・区分1は従来の最終興行を使う。 */
const finaleMatchIdForStage = (campaignStage?: 1 | 2 | 3) =>
  campaignStage === 2
    ? "finale-legends"
    : campaignStage === 3
      ? "finale-first-troupe"
      : "last-demon-king";

export const matchForWeek = (
  week: number,
  route: "normal" | "domination" | "chaos" = "normal",
  campaignStage?: 1 | 2 | 3,
) => {
  const matches = matchesForRoute(route);
  if (week === 26) {
    const finaleId = finaleMatchIdForStage(campaignStage);
    const finale = matches.find((match) => match.id === finaleId);
    if (finale) return finale;
  }
  return matches.find((match) => match.week === week);
};

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
