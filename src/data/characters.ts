import type {
  CharacterScene,
  DialogueLine,
  FighterDefinition,
  SceneDirection,
  SceneChoice,
  SceneSpriteCue,
  SkillDefinition,
  Stats,
  WeeklyAction,
} from "../game/types";
import {
  withCharacterStoryExpansion,
  type StoryStage,
} from "./characterStoryExpansions";
import { withChoiceDesign } from "../game/choiceDesign";
import {
  characterCrisisChoiceResults,
  characterLiberationChoiceCopies,
  characterStageChoiceCopies,
} from "./characterChoiceCopies";

const line = (
  speaker: string,
  text: string,
  direction?: SceneDirection,
  meta?: Pick<DialogueLine, "beat" | "cue">,
): DialogueLine => ({ speaker, text, direction, ...meta });
const thought = (
  text: string,
  direction?: SceneDirection,
  meta?: Pick<DialogueLine, "beat" | "cue">,
): DialogueLine => ({
  text,
  kind: "thought" as const,
  direction,
  ...meta,
});

const storySprite = (
  filename: string,
  alt: string,
  scale: SceneSpriteCue["scale"] = "standard",
): SceneSpriteCue => ({
  asset: `/assets/story/${filename}`,
  alt,
  position: "right",
  scale,
});

const gidonoSealedNeutral = storySprite(
  "gidono-sealed-neutral.png",
  "黒い星を抱いた封印形態のギドノゼアース",
  "compact",
);
const gidonoSealedSoft = storySprite(
  "gidono-sealed-soft.png",
  "わずかに表情を和らげた封印形態のギドノゼアース",
  "compact",
);
const gidonoSealedAlert = storySprite(
  "gidono-sealed-alert.png",
  "黒い星を回転させた封印形態のギドノゼアース",
  "compact",
);
const gidonoUnsealedNeutral = storySprite(
  "gidono-unsealed-neutral.png",
  "液状の人型をとったギドノゼアース",
  "tall",
);
const gidonoUnsealedSoft = storySprite(
  "gidono-unsealed-soft.png",
  "表情を和らげた人型のギドノゼアース",
  "tall",
);

const choice = (
  label: string,
  result: string,
  trust: number,
  ownership: number,
  extra: Partial<
    Omit<SceneChoice, "label" | "result" | "trust" | "ownership">
  > = {},
) => ({ label, result, trust, ownership, ...extra });

const scene = (
  id: string,
  title: string,
  location: string,
  actions: WeeklyAction[],
  lines: CharacterScene["lines"],
  choices?: CharacterScene["choices"],
  presentation: Partial<
    Pick<CharacterScene, "background" | "sprite">
  > = {},
): CharacterScene => ({
  id,
  title,
  location,
  actions,
  lines,
  choices,
  ...presentation,
});

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

interface FighterSeed {
  id: string;
  name: string;
  reading?: string;
  kind: string;
  role: FighterDefinition["role"];
  color: string;
  accent: string;
  summary: string;
  currentLimit: string;
  traitName: string;
  traitText: string;
  ai: FighterDefinition["ai"];
  strong: FighterDefinition["strong"];
  weak: FighterDefinition["weak"];
  stats: Stats;
  skills: FighterDefinition["skills"];
  signatureChoices?: {
    meet: [
      { label: string; result: string },
      { label: string; result: string },
    ];
    crisis: [string, string];
  };
  locations: [string, string, string];
  actions: [WeeklyAction[], WeeklyAction[], WeeklyAction[]];
  meet: string[];
  join: string[];
  bond: string[];
  power: string[];
  crisis: string[];
  liberation: string[];
  epilogue: string[];
  linePatterns?: Partial<
    Record<
      keyof FighterDefinition["scenes"],
      ["fighter" | "mimi" | "thought", "fighter" | "mimi" | "thought", "fighter" | "mimi" | "thought"]
    >
  >;
  sceneOverrides?: Partial<FighterDefinition["scenes"]>;
}

const signatureChoicesById: Record<
  string,
  NonNullable<FighterSeed["signatureChoices"]>
> = {
  gidonozeaas: {
    meet: [
      {
        label: "限定パフェが来るまで同席する",
        result: "黒い星と一緒に、再販分のパフェを静かに待った。",
      },
      {
        label: "選手登録で予約席を確保する",
        result: "予約席は取れた。用途欄だけが『最終災害対策』になった。",
      },
    ],
    crisis: [
      "黒い星を回し、封印の継ぎ目を本人と探る",
      "パフェの再販ベルを封印解除の合図にする",
    ],
  },
  minato: {
    meet: [
      {
        label: "返した四十七本の由来を聞く",
        result: "世界を救った話より、返却票の書き方を長く教わった。",
      },
      {
        label: "闘技場の求人票を渡す",
        result: "再就職先は決まった。職歴欄だけが一枚に収まらなかった。",
      },
    ],
    crisis: [
      "返却済みの四十七本から一振りだけ借り直す",
      "剣を抜かず、鞘と足運びだけで勝つ",
    ],
  },
  amara: {
    meet: [
      {
        label: "休憩規定への異議を聞く",
        result: "相談は始まった。途中から闘技場そのものが被告になった。",
      },
      {
        label: "監査権限つきで選手登録する",
        result: "登録は通った。自分の机には、出頭通知まで置かれていた。",
      },
    ],
    crisis: [
      "選手契約そのものを公開法廷へ持ち込む",
      "大会規定の矛盾だけを先に監査する",
    ],
  },
  shahar: {
    meet: [
      {
        label: "鱗を屋上の一席として扱う",
        result: "一枚の鱗へ椅子を出した。雲の上から礼だけが返った。",
      },
      {
        label: "本体寸法を空欄で登録する",
        result: "身長欄は空欄、翼幅欄は『天気予報参照』で通った。",
      },
    ],
    crisis: [
      "鱗一枚のまま、会場へ雨雲を呼ぶ",
      "屋上を本体の臨時着陸地点へ改装する",
    ],
  },
  teirei: {
    meet: [
      {
        label: "充電器の規格から一緒に調べる",
        result: "必要だったのは電力ではなく、新しい命令を拒む時間だった。",
      },
      {
        label: "闘技場設備へ直結する",
        result: "充電は始まった。施設案内の敵味方表示も一度だけ反転した。",
      },
    ],
    crisis: [
      "敵味方識別を外し、守る対象だけ登録する",
      "廃棄命令を偽の訓練指示で上書きする",
    ],
  },
  "night-eater": {
    meet: [
      {
        label: "照明を一列だけ消して話す",
        result: "暗がりは広がらず、初めて苦情ではない返事が届いた。",
      },
      {
        label: "閉店作業の担当として登録する",
        result: "勤務表へ影が一つ増え、閉店時刻が三分だけ早まった。",
      },
    ],
    crisis: [
      "照明を一列ずつ食べ、影の進路を作る",
      "正午の試合で、相手の影だけを奪う",
    ],
  },
  peony: {
    meet: [
      {
        label: "迷子が泣き止むまで隣に座る",
        result: "城壁を割る手が、紙の冠を壊さないよう慎重に折った。",
      },
      {
        label: "託児補助つきで選手登録する",
        result: "契約書より先に、控室へ小さな椅子が十二脚届いた。",
      },
    ],
    crisis: [
      "観客席を守る城壁役として前へ出る",
      "角の封印を外し、最短で決着をつける",
    ],
  },
  "cassim-bell": {
    meet: [
      {
        label: "失くした世界の受付票を書く",
        result: "受付番号は発行された。待ち人数は億を少し超えていた。",
      },
      {
        label: "遺失物係のまま選手登録する",
        result: "窓口は闘技場へ移った。背後の扉だけは全世界へ残った。",
      },
    ],
    crisis: [
      "倉庫から失われた世界の出口を一つ開ける",
      "敵の大技だけを遺失物として預かる",
    ],
  },
  sazanami: {
    meet: [
      {
        label: "水槽越しに寝返りの話を聞く",
        result: "海岸線が一度だけ揺れたが、会話は穏やかに終わった。",
      },
      {
        label: "影の面積だけで登録する",
        result: "体重欄は『沿岸三県』となり、なぜか受理された。",
      },
    ],
    crisis: [
      "水槽のまま、会場へ潮流を呼び込む",
      "影を会場一面へ広げ、本体の一部を浮上させる",
    ],
  },
  marian: {
    meet: [
      {
        label: "包帯を畳みながら効きすぎる話を聞く",
        result: "治療の危険さより、包帯の角が揃わない方を注意された。",
      },
      {
        label: "救護担当として選手登録する",
        result: "規約上は選手、救護室では先生。死亡欄だけが使用禁止になった。",
      },
    ],
    crisis: [
      "味方の傷だけを正しく生へ戻す",
      "敵の大技を一度『死んだこと』にする",
    ],
  },
  ushiro: {
    meet: [
      {
        label: "最後列に空席を一つ残す",
        result: "誰も座っていない席だけ、写真の中で深く会釈した。",
      },
      {
        label: "欠席者として選手登録する",
        result: "出席簿は欠席、選手名簿は在籍。どちらにも長い影が写った。",
      },
    ],
    crisis: [
      "誰にも観測されない位置から味方を守る",
      "照明に影を固定し、敵を引きつける囮になる",
    ],
  },
  "wolf-nine": {
    meet: [
      {
        label: "八通分の挑戦状へ返事を書く",
        result: "返事は一通で済んだ。翌朝、九通目だけが先に届いた。",
      },
      {
        label: "公式戦を決闘として登録する",
        result: "大会事務局は受理した。封蝋の歯形だけは審査対象になった。",
      },
    ],
    crisis: [
      "九戦目を一撃だけの決闘にする",
      "過去八敗の型を順番に敵へ返す",
    ],
  },
  "room-seventeen": {
    meet: [
      {
        label: "会議室として一時間予約する",
        result: "一時間で三十二階まで見学し、延長料金は世界一つ分だった。",
      },
      {
        label: "扉そのものを選手登録する",
        result: "背番号は十七。控室の壁に、新しい廊下が増えた。",
      },
    ],
    crisis: [
      "観客席へ避難用の出口を増やす",
      "敵陣だけを迷宮の十七階へつなぐ",
    ],
  },
  rinne: {
    meet: [
      {
        label: "賭けずに未来の見え方を聞く",
        result: "勝ち筋は教えてくれなかったが、負け方を三つ避けてくれた。",
      },
      {
        label: "契約金を元手として渡す",
        result: "資金は一度消え、増えて戻った。領収書だけが未来の日付だった。",
      },
    ],
    crisis: [
      "勝率ゼロと表示された未来へ少額だけ賭ける",
      "最も平凡な勝ち筋を全員で選ぶ",
    ],
  },
  mumyo: {
    meet: [
      {
        label: "鏡の中の本人へ先に名乗る",
        result: "剣は動かなかった。でも、鏡の人物には私の名を覚えられた。",
      },
      {
        label: "景品番号のまま選手登録する",
        result: "登録端末は剣を選手と認めた。所有者欄だけが点滅し続けた。",
      },
    ],
    crisis: [
      "鏡の本人に、剣を抜く瞬間を決めてもらう",
      "鞘のまま一度だけ公式戦へ出る",
    ],
  },
};

const makeFighter = (seed: FighterSeed): FighterDefinition => {
  const signatureChoices = seed.signatureChoices ?? signatureChoicesById[seed.id];
  const stageChoiceCopies = characterStageChoiceCopies[seed.id];
  const liberationChoiceCopies = characterLiberationChoiceCopies[seed.id];
  const crisisChoiceResults = characterCrisisChoiceResults[seed.id];
  type StoryStage = keyof FighterDefinition["scenes"];
  const defaultLinePatterns: Record<
    StoryStage,
    ["fighter" | "mimi" | "thought", "fighter" | "mimi" | "thought", "fighter" | "mimi" | "thought"]
  > = {
    meet: ["fighter", "mimi", "fighter"],
    join: ["fighter", "mimi", "fighter"],
    bond: ["fighter", "mimi", "fighter"],
    power: ["fighter", "mimi", "fighter"],
    crisis: ["fighter", "mimi", "fighter"],
    liberation: ["fighter", "mimi", "fighter"],
    epilogue: ["thought", "mimi", "fighter"],
  };
  const sceneOpeners: Record<StoryStage, string> = {
    meet: `今週の用事で${seed.locations[0]}へ立ち寄った。予定どおりなら、目の前の用事を済ませて帰るだけのはずだった。`,
    join: `${seed.name}と初めて会ったあと、${seed.locations[1]}でもう一度顔を合わせた。今日は、選手登録の条件を確かめることになっている。`,
    bond: `${seed.name}がチームに加わってから、${seed.locations[1]}で顔を合わせることが増えた。今日は試合の話ではなく、少しだけ時間が空いている。`,
    power: `練習のあと、${seed.name}に呼ばれて${seed.locations[2]}まで来た。いつもの力では足りない理由を、見せたいらしい。`,
    crisis: `アルデバラン社から届いた契約確認書には、${seed.name}の扱いを決める欄が残っていた。本人の意思を聞くため、${seed.locations[2]}へ向かった。`,
    liberation: `最終大会が近づくなか、${seed.name}の契約を終わらせられる条件がそろった。今日は勝敗より先に、本人の意思を確かめに来た。`,
    epilogue: `最終大会が終わってから、${seed.name}と${seed.locations[1]}で顔を合わせるのは今日が初めてだった。`,
  };
  const sceneClosers: Record<StoryStage, string> = {
    meet: "事情はまだ分からない。でも、ここで立ち去れば、たぶん後悔する。",
    join: "登録を急ぐとしても、本人を置き去りにしたまま話を進めたくはなかった。",
    bond: "試合の外で交わした言葉のほうが、次の指示より長く残ることがある。",
    power: "怖さが消えたわけではない。だからこそ、使うかどうかを本人と決める必要がある。",
    crisis: "勝つための答えと、あとで自分を嫌いにならない答えは、同じとは限らない。",
    liberation: "契約をなくしても関係はなくならない。次に同じ場所へ立つなら、互いに選び直した結果でありたい。",
    epilogue: "契約の話をしなくていいだけで、同じ場所が少し違って見えた。",
  };
  const toLines = (stage: StoryStage, texts: string[]) => {
    const pattern = seed.linePatterns?.[stage] ?? defaultLinePatterns[stage];
    return texts.map((text, index) => {
      const speaker = pattern[index] ?? (index % 2 === 0 ? "fighter" : "mimi");
      if (speaker === "thought") return thought(text);
      return line(speaker === "fighter" ? seed.name : "ミミ", text);
    });
  };
  const contextualLines = (stage: StoryStage, texts: string[]) => [
    thought(sceneOpeners[stage]),
    ...toLines(stage, texts),
    thought(sceneClosers[stage]),
  ];

  const defaultScenes: FighterDefinition["scenes"] = {
      meet: scene(
        `${seed.id}.meet`,
        "最初の遭遇",
        seed.locations[0],
        seed.actions[0],
        contextualLines("meet", seed.meet),
        [
          choice(
            signatureChoices?.meet[0].label ?? "本人の話を聞く",
            signatureChoices?.meet[0].result ??
              "急がせず、相手が話せるところまで待った。",
            7,
            -2,
            {
              tone: "tender",
              intent: "登録の前に、目の前の相手を知る",
              promise: "目先の報酬は得ない代わりに、相手が何を望んでいるかを確かめる。",
              memory: "手続きより先に話を聞いたことを、相手は最初の印象として覚えている。",
            },
          ),
          choice(
            signatureChoices?.meet[1].label ?? "契約窓口へ連れていく",
            signatureChoices?.meet[1].result ??
              "手続きは進んだ。でも相手の視線は、ずっと私の名札に残っていた。",
            1,
            7,
            {
              money: 400,
              tone: "pragmatic",
              intent: "出場枠と当座の資金を確保する",
              promise: "事情を聞くのは後回しにして、今後へ使える400Gと登録を先に得る。",
              memory: "先に登録を通した速さと、その時に聞けなかった話が後へ残る。",
            },
          ),
        ],
      ),
      join: scene(
        `${seed.id}.join`,
        "スカウト",
        seed.locations[1],
        seed.actions[0],
        contextualLines("join", seed.join),
        [
          choice(
            stageChoiceCopies?.join[0].label ??
              "「条件はあなたが決めて。私は席を取る」",
            stageChoiceCopies?.join[0].result ??
              "契約書の空欄を本人の言葉で埋めた。書き終えたあと、署名より先に互いの顔を見て、これで始めようと確かめ合った。",
            8,
            -3,
            {
              fighterPoints: 2,
              tone: "tender",
              intent: "本人の得意な戦い方を知る",
              promise: "登録は少し遅れるが、この人専用の成長ポイントを得る。",
              memory: "自分で書いた最初の条件を、相手は次の大事な場面でも覚えている。",
            },
          ),
          choice(
            stageChoiceCopies?.join[1].label ??
              "「まず出場枠を取る。続きは中で話そう」",
            stageChoiceCopies?.join[1].result ??
              "出場枠は確保できた。会社の処理だけは驚くほど速く、本人が二度目の質問をする前に背番号まで発行されていた。",
            0,
            8,
            {
              sharedPoints: 2,
              tone: "pragmatic",
              intent: "次の公式戦へ間に合わせる",
              promise: "本人の詳細は後回しになるが、誰にでも使える成長ポイントを得る。",
              memory: "先に席を確保した判断は、チームの始まり方として記録に残る。",
            },
          ),
        ],
      ),
      bond: scene(
        `${seed.id}.bond`,
        "チームの日常",
        seed.locations[1],
        seed.actions[1],
        contextualLines("bond", seed.bond),
        [
          choice(
            stageChoiceCopies?.bond[0].label ??
              "「次は、あなたのやり方で勝ってみたい」",
            stageChoiceCopies?.bond[0].result ??
              "遠回りに見えた時間の全部に理由があった。次の試合で同じ動きが勝ち筋へ変わった時、こちらを見た顔だけが少し得意そうだった。",
            9,
            -2,
            {
              fighterPoints: 3,
              tone: "wild",
              intent: "相手の秘密の勝ち方を試す",
              promise: "読みにくい作戦になる代わりに、この人だけの成長を大きく進める。",
              memory: "任せた一戦の手応えが、次に力を見せる理由になる。",
            },
          ),
          choice(
            stageChoiceCopies?.bond[1].label ??
              "「一度だけ、私の作戦を信じて」",
            stageChoiceCopies?.bond[1].result ??
              "効率は確かに上がった。勝てる形は早く整ったが、終わったあとの会話は前より短く、作戦表の余白だけが広く残った。",
            1,
            7,
            {
              sharedPoints: 3,
              tone: "pragmatic",
              intent: "チームの新しい連携を試す",
              promise: "本人の流儀は崩すが、全員へ配れる成長ポイントを得る。",
              memory: "成功した作戦と短くなった会話の両方が、次の判断まで残る。",
            },
          ),
        ],
      ),
      power: scene(
        `${seed.id}.power`,
        "取り戻す力",
        seed.locations[2],
        seed.actions[2],
        contextualLines("power", seed.power),
        [
          choice(
            stageChoiceCopies?.power[0].label ??
              "「怖い。でも、その力をあなたに預ける」",
            stageChoiceCopies?.power[0].result ??
              "制御ではなく信頼を前提に、失われた力が戻った。恐怖が消えたわけではないからこそ、互いに目を逸らさず終わりまで見届けた。",
            10,
            -4,
            {
              fighterPoints: 5,
              tone: "heroic",
              intent: "本来の力を一気に取り戻す",
              promise: "失敗時の危険を引き受け、この人専用の成長を最大まで進める。",
              memory: "力を恐れたまま任せたことを、相手は危機の場面で思い出す。",
            },
          ),
          choice(
            stageChoiceCopies?.power[1].label ??
              "「封印は一枚ずつ。今日は全員で帰る」",
            stageChoiceCopies?.power[1].result ??
              "安全な範囲で力の一部を取り戻した。全員で帰れた安堵の裏側で、契約印だけが前より濃く光り、次の判断を待っていた。",
            0,
            9,
            {
              sharedPoints: 5,
              tone: "pragmatic",
              intent: "安全な段階解除で確実に進む",
              promise: "本来の力は一部に留め、チーム全体の成長へ成果を持ち帰る。",
              memory: "全員で帰ると決めた手順が、危機で使える安全策として残る。",
            },
          ),
        ],
      ),
      crisis: scene(
        `${seed.id}.crisis`,
        "最後の準備",
        seed.locations[2],
        ["work", "play", "rest", "search"],
        contextualLines("crisis", seed.crisis),
        [
          choice(
            signatureChoices?.crisis[0] ??
              "本人の得意な突破法を、そのまま試す",
            crisisChoiceResults?.[0] ??
              "相手が考えた方法を、途中でこちらの都合へ曲げずに試した。成功も失敗もこの人にしか扱えない経験になり、次の戦い方が一段深くなった。",
            12,
            -10,
            {
              fighterPoints: 6,
              tone: "wild",
              intent: "この人だけの突破法へ賭ける",
              promise: "予測しにくい方法を試し、この人専用の成長を大きく進める。",
              memory: "危機で選んだ方法は、契約を解く場面でも二人の共通の記憶として戻る。",
            },
          ),
          choice(
            signatureChoices?.crisis[1] ??
              "チーム全員で扱える現実的な方法へ組み直す",
            crisisChoiceResults?.[1] ??
              "本人の案をチームで扱える手順へ変えた。尖った強みは少し薄れたが、誰が倒れても続けられる作戦として全員の手元へ残った。",
            -2,
            10,
            {
              sharedPoints: 6,
              tone: "pragmatic",
              intent: "全員が使える安全な突破法を作る",
              promise: "本人だけの切り札は抑え、チーム全体へ使える成長を持ち帰る。",
              memory: "全員で組み直した手順は、契約を解く場面でも選んだ責任として戻る。",
            },
          ),
        ],
      ),
      liberation: scene(
        `${seed.id}.liberation`,
        "契約の外側",
        seed.locations[2],
        ["work", "play", "rest", "search"],
        contextualLines("liberation", seed.liberation),
        [
          choice(
            liberationChoiceCopies?.[0].label ??
              "「契約書は返す。次は好きで来て」",
            liberationChoiceCopies?.[0].result ??
              "所有者欄から名前が消えた。出場登録は本人名義へ変わる。呼び止める権利はもうないのに、次の集合時刻を決めたのは向こうだった。",
            10,
            0,
            {
              liberationDecision: "release",
              tone: "defiant",
              intent: "契約と出場登録を完全に分ける",
              promise: "所有者名を消し、本人が自分の名で次の試合を選べるようにする。",
              memory: "自由になったあと、最初に自分で選んだ集合時刻が残る。",
            },
          ),
          choice(
            liberationChoiceCopies?.[1].label ??
              "「自由になったあなたに、改めて頼みたい」",
            liberationChoiceCopies?.[1].result ??
              "解除届を出してから、決勝まで一緒に戦ってほしいと頼んだ。相手は断れることを確かめたうえで、今度は自分の名前だけを出場欄へ書いた。",
            6,
            0,
            {
              sharedPoints: 4,
              liberationDecision: "release",
              tone: "tender",
              intent: "自由な相手へ改めて協力を頼む",
              promise: "断る権利を返したうえで、決勝を一緒に戦う新しい約束を結ぶ。",
              memory: "頼まれたからではなく、頼みを聞いたから残った。その違いを二人が覚えている。",
            },
          ),
        ],
      ),
      epilogue: scene(
        `${seed.id}.epilogue`,
        "その後",
        seed.locations[1],
        ["rest"],
        contextualLines("epilogue", seed.epilogue),
      ),
  };

  const mergedScenes: FighterDefinition["scenes"] = {
    ...defaultScenes,
    ...seed.sceneOverrides,
  };
  const recruitmentScenes: FighterDefinition["scenes"] = {
    ...mergedScenes,
    meet: {
      ...mergedScenes.meet,
      choices: [
        {
          ...(mergedScenes.meet.choices?.[0] ??
            choice(
              "もう少し話を聞く",
              "勧誘はせず、まず相手がここへ来た理由を聞いた。",
              5,
              0,
            )),
          recruitmentDecision: "defer",
        },
        choice(
          `今日は${seed.name}を誘わず、用事へ戻る`,
          `${seed.name}の名前と出会った場所だけを覚え、今日は普段の仕事へ戻った。急いで所属を決めなかったことが、次に会う時の距離として残った。`,
          0,
          0,
          {
            recruitmentDecision: "decline",
            tone: "pragmatic",
            intent: "今は勧誘せず、相手との距離を保つ",
            promise: "所属選手にはならないが、後の出来事で再会できる。",
            memory: "最初の出会いで急いで仲間にしなかったことが、次の再会へ残る。",
          },
        ),
      ],
    },
    join: {
      ...mergedScenes.join,
      choices: [
        ...(mergedScenes.join.choices ?? []).map((entry) => ({
          ...entry,
          recruitmentDecision: "join" as const,
        })),
        choice(
          `今回は${seed.name}を誘わず、別の機会を待つ`,
          `${seed.name}の出場登録は行わなかった。相手は所属せず、それぞれの用事へ戻った。断る選択を残したことだけが、次に会う時まで静かに残った。`,
          0,
          0,
          {
            recruitmentDecision: "decline",
            tone: "pragmatic",
            intent: "今回はチームへ誘わない",
            promise: "今回の所属は見送るが、人物の物語と再会の可能性は失わない。",
            memory: "勧誘しない選択も尊重されたことを、相手は覚えている。",
          },
        ),
      ],
    },
  };
  const expandedScenes = Object.fromEntries(
    (Object.keys(recruitmentScenes) as StoryStage[]).map((stage) => [
      stage,
      withChoiceDesign(
        withCharacterStoryExpansion(seed.id, stage, recruitmentScenes[stage]),
      ),
    ]),
  ) as unknown as FighterDefinition["scenes"];

  return {
    ...seed,
    scenes: expandedScenes,
  };
};

export const fighterDefinitions: FighterDefinition[] = [
  makeFighter({
    id: "gidonozeaas",
    name: "ギドノゼアース",
    kind: "封印された液状異形",
    role: "万能",
    color: "#b8f1ea",
    accent: "#12131a",
    summary:
      "大魔王が倒れた後にだけ現れる存在。今は黒い星を抱いた一滴の身体で、限定メニューの再販を待っている。",
    currentLimit: "本体の大半が、まだ世界の外側にある。",
    traitName: "黒星の核",
    traitText: "HPが半分を切ると、魔力と速度が上がる。",
    ai: "steady",
    strong: "star",
    weak: "gale",
    stats: { hp: 54, mp: 48, attack: 36, defense: 40, magic: 47, speed: 38 },
    skills: [
      skill("gido.drop", "一滴", "damage", "enemy", "neutral", 34, 0, "安定した単体攻撃"),
      skill("gido.blackstar", "黒星", "damage", "enemy", "star", 58, 9, "防御を35%無視", { defensePierce: 0.35 }),
      skill("gido.pearl", "真珠膜", "guard", "allAllies", "tide", 28, 12, "味方全体を守り、障壁を張る", { barrier: 14 }),
      skill("gido.beyond", "世界の外側", "buff", "self", "star", 40, 18, "攻撃・魔力・防御・速度を強化", { attackBuff: 0.12, magicBuff: 0.14, defenseBuff: 0.12, speedBuff: 0.1 }),
    ],
    locations: ["カジノカフェ", "従業員控室", "閉鎖された展望台"],
    actions: [["work", "play"], ["play", "rest"], ["search", "play"]],
    meet: [
      "限定メニューを、ひとつ。",
      "……スライムが、予約席に座ってる。",
      "ギドノゼアース。再販日は今日だと聞いた。",
    ],
    join: [
      "この紙へ名を書けば、食べられるのか。",
      "それ、同伴客の申請書じゃなくて選手登録です。",
      "構わない。待つことには慣れている。",
    ],
    bond: [
      "次の再販日は十九日後だ。",
      "試合予定より正確に覚えてません？",
      "どちらも、待っていれば来る。",
    ],
    power: [
      "窓を見ろ。一滴でも、影は本体を忘れない。",
      "空の向こうに、翼が六枚……。",
      "恐れる必要はない。まだ、こちらへ来るつもりはない。",
    ],
    crisis: [
      "命じれば、封印を一つ外せる。お前の身体は壊れるかもしれない。",
      "契約とはそういうものだ。危険を片方へ寄せる。",
      "だから、ミミが決めろ。",
    ],
    liberation: [
      "紙がなくなった。これで私は、ここにいる理由を失った。",
      "……帰りますか？",
      "いや。次の限定メニューまで、あと三日だ。",
    ],
    epilogue: [
      "カフェの予約席には、今日も黒い星が浮かんでいる。",
      "予約名、また私になってるんですけど。",
      "同伴客の欄だけは、お前の名がよく通る。",
    ],
    sceneOverrides: {
      meet: scene(
        "gidonozeaas.meet",
        "窓際、ひとつ空けて",
        "カジノカフェ・閉店前",
        ["work", "play"],
        [
          thought(
            "派遣先での最初の仕事は、驚くほどいつもの接客と変わらなかった。違うのは、試合帰りのお客様が注文より先に勝敗を口にすることくらいだ。",
          ),
          thought(
            "午後四時五十七分。閉店前の最後の注文は、季節限定の「星降りベリーパフェ」だった。",
          ),
          thought(
            "窓際の予約席へ運ぶと、椅子には誰もいない。代わりに、白い皿の上で大きなスライムがゆっくり揺れていた。",
            { sprite: gidonoSealedNeutral },
          ),
          line(
            "ミミ",
            "お待たせしました。星降りベリーパフェです。……あの、ご予約のお客様は、まだいらしていませんか？",
          ),
          line("ギドノゼアース", "ここにいる。", undefined, {
            beat: "revelation",
            cue: "声は目の前の器からではなく、窓ガラスと食器の底から同時に響いた。",
          }),
          line(
            "ミミ",
            "失礼しました。では、ご予約のお名前を確認してもよろしいでしょうか。",
          ),
          line("ギドノゼアース", "ギドノゼアース。一名。"),
          thought(
            "透明な身体の中心で黒い星が回った。次の瞬間、窓の向こうの海まで持ち上がり、水平線が一度だけ消えた。",
            {
              sprite: gidonoSealedAlert,
              still: "/assets/event-casino-cafe.png",
              effect: "pulse",
            },
            {
              beat: "tension",
              cue: "逃げなければ、と身体は言う。けれど両手は接客用のトレーを水平に保ったままだった。",
            },
          ),
          line(
            "ミミ",
            "……ギドノゼアース様ですね。確認できました。海については、あとで設備担当へ連絡します。",
          ),
          line(
            "ギドノゼアース",
            "先にパフェを置け。再販まで三百年待った。",
            { sprite: gidonoSealedNeutral },
            {
              beat: "comic",
              cue: "世界を揺らした声が、「パフェ」のところだけ妙に真剣だった。",
            },
          ),
          line(
            "ミミ",
            "大変お待たせしました。三百年というのは、前回の販売からですか？",
          ),
          line(
            "ギドノゼアース",
            "前の店は、私が目覚めた日に大陸ごとなくなった。",
            { sprite: gidonoSealedSoft },
          ),
          line(
            "ミミ",
            "それでは、再販のお知らせも届きませんね。今日まで予約を覚えていてくださって、ありがとうございます。",
          ),
          thought(
            "接客用の返事を口にしてから、内容がおかしいことに気づいた。けれど本人は、パフェしか見ていない。",
          ),
          thought(
            "伝票には「二名様限定」、同伴者欄には私の社員番号。受付でもらったばかりの契約端末が、勝手に青く点滅していた。",
          ),
          line(
            "ミミ",
            "申し訳ありません。このメニューは二名様限定で、同伴者のお名前が必要なんです。なぜか私の番号が入っていますが……。",
          ),
          line(
            "ギドノゼアース",
            "なら、お前が座れば注文は成立する。閉店まで三分ある。",
          ),
          thought(
            "受付のノノさんは「空欄にしても何か起きる」と言っていた。まさか、初日にパフェの同伴者へ登録されるとは聞いていない。",
          ),
        ],
        [
          choice(
            "休憩扱いにして、向かいへ座る",
            "椅子に腰を下ろした瞬間、足の痛みがどっと戻った。彼はパフェの苺を一つよけて、「三百年のうち三分なら待てる」と、私が息をつくまでスプーンを持たなかった。",
            8,
            -2,
            {
              tone: "tender",
              intent: "三分だけ同席し、相手の目的を確かめる",
              promise: "勤務報酬は増えないが、三百年待った注文と彼の事情を聞ける。",
              memory: "登録より先に一緒にパフェを待った三分間を、彼はあとまで覚えている。",
            },
          ),
          choice(
            "同伴者欄ごと、選手登録へ回す",
            "端末は彼を選手、私を担当者として受理した。用途欄に「最終災害対策」と出たけれど、本人が気にしたのは次回予約の確保だけだった。",
            2,
            7,
            {
              money: 400,
              tone: "pragmatic",
              intent: "出場登録と次回予約を同時に取る",
              promise: "事情を聞く前に手続きを進め、400Gと出場枠を確保する。",
              memory: "最初に交わしたのが会話ではなく登録票だったことを、二人とも忘れない。",
            },
          ),
        ],
        {
          background: "/assets/story/bg-casino-cafe-closing.png",
          sprite: null,
        },
      ),
      join: scene(
        "gidonozeaas.join",
        "三日間だけの同伴客",
        "従業員控室",
        ["work", "play"],
        [
          thought(
            "濡れた制服と、煮詰まったコーヒーの匂い。雨の朝は控室まで重い。",
          ),
          thought(
            "私のロッカーに契約書。署名は私の字なのに、書いた日の記憶がない。",
          ),
          thought(
            "紙を外すと、裏から昨日のスライムが落ちて、コーヒーの受け皿に収まった。",
          ),
          line("ギドノゼアース", "遅い。選手登録は受理された。"),
          line(
            "ミミ",
            "私は同伴者として三分座っただけです。どうして契約まで？",
          ),
          line(
            "ギドノゼアース",
            "同じ卓につき、同じ注文へ名を連ねた。ここの端末は、それを指揮関係と判断した。",
          ),
          thought(
            "書類の隅に「所有者代理」。乾いた赤い字をこすると、胸の奥だけが冷たくなる。",
          ),
          line(
            "ミミ",
            "あなたは、それでいいんですか。知らない人の持ち物みたいに書かれて。",
          ),
          line(
            "ギドノゼアース",
            "よくはない。だが登録選手には、限定メニューの優先予約権がある。",
            { sprite: gidonoSealedSoft },
          ),
          line("ミミ", "そこを先に言います？"),
          line(
            "ギドノゼアース",
            "三日だけ出る。三日で足りなければ、そのとき考える。",
            { sprite: gidonoSealedNeutral },
          ),
          thought(
            "始業ベルが鳴る。赤い文字より、その素っ気ない三日間のほうを信じてみたい。",
          ),
        ],
        [
          choice(
            "三日間の条件を、本人に書いてもらう",
            "彼に「命令は三度まで」「休憩を削らない」「終了日は延ばさない」と書いてもらった。最後の一行だけは、私の昨日の休憩記録を見てから足された。",
            9,
            -3,
            { fighterPoints: 2 },
          ),
          choice(
            "会社の短期登録で、すぐ枠を取る",
            "出場枠は一分で取れた。赤い文字が一段濃くなるのを、彼は黙って見ていた。それから、再販日の欄だけを指先で確かめた。",
            0,
            8,
            { sharedPoints: 2 },
          ),
        ],
        {
          background: "/assets/story/bg-staff-room-rain.png",
          sprite: gidonoSealedNeutral,
        },
      ),
      bond: scene(
        "gidonozeaas.bond",
        "冷めなかったコーヒー",
        "カジノカフェ・開店前",
        ["play", "rest"],
        [
          thought(
            "開店十五分前。窓は雨で白く、エスプレッソマシンだけが低く唸っている。",
          ),
          thought(
            "いつもの窓際に黒い星。その隣に、欠けたスタッフ用マグカップがあった。",
          ),
          line("ミミ", "それ、私のコーヒーですよね。"),
          line(
            "ギドノゼアース",
            "九時四十分に休憩へ入ると聞いた。二十三分過ぎた。",
            undefined,
            {
              beat: "tender",
              cue: "責める響きはない。ただ、待っていた時間だけが正確だった。",
            },
          ),
          thought(
            "誰も覚えていないと思っていた。私自身も、さっきまで忘れていた。",
          ),
          line(
            "ミミ",
            "忙しい日は、休憩なんてそんなものです。もう冷めてるでしょうし。",
          ),
          thought(
            "取っ手が熱い。淹れたてのままだ。彼は窓を向いたまま、ほんの少し平たくなった。",
            { sprite: gidonoSealedSoft },
          ),
          line(
            "ギドノゼアース",
            "待つものが増えるのは、嫌いではない。",
            undefined,
            {
              beat: "tender",
              cue: "窓を向いたままの声は平らで、そのくせ黒い星だけがゆっくり一周した。",
            },
          ),
          line("ミミ", "パフェと同じ数え方をされるの、複雑なんですけど。"),
          line(
            "ギドノゼアース",
            "パフェは再販日を守る。お前は休憩時間を守らない。",
          ),
          thought(
            "反論の代わりに、ひと口飲む。苦さのあとから、いつもより多い砂糖の甘さが来た。",
          ),
        ],
        [
          choice(
            "今だけは座って、温かいうちに飲む",
            "向かいへ座ると、黒い星の回転が止まった。話題はすぐ尽きたのに、雨の音が気まずくなくなるまで、私たちは席を立たなかった。",
            10,
            -2,
            { fighterPoints: 3 },
          ),
          choice(
            "ナプキンに次の試合手順を書く",
            "休憩は作戦会議になった。勝つ手順はまとまり、コーヒーも最後まで冷めなかった。ただ、砂糖を増やした理由だけは聞きそびれた。",
            2,
            7,
            { sharedPoints: 3 },
          ),
        ],
        {
          background: "/assets/story/bg-casino-cafe-rain.png",
          sprite: gidonoSealedSoft,
        },
      ),
      power: scene(
        "gidonozeaas.power",
        "窓に映る六枚の翼",
        "閉鎖された展望台",
        ["search", "play"],
        [
          thought(
            "立入禁止の鎖が、風のたびに鳴る。試合後の展望台には、私たちしかいない。",
          ),
          line("ギドノゼアース", "空ではなく、窓を見ろ。"),
          thought(
            "ガラスの中で夜が立ち上がる。街を覆う六枚の翼と、星のない穴のような顔。",
            { sprite: gidonoUnsealedNeutral, effect: "flash" },
          ),
          thought(
            "息を吸ったはずなのに、胸が動かない。指先だけが、勝手に震えている。",
          ),
          line(
            "ギドノゼアース",
            "一滴でも、影は本体を忘れない。契約を使えば、あれをこちらへ近づけられる。",
          ),
          line("ミミ", "近づけたら、どうなりますか。"),
          line(
            "ギドノゼアース",
            "試合には勝つ。展望台と、その下の街が残るかは分からない。",
          ),
          thought(
            "冗談の声ではない。翼が閉じたあと、街の明かりが急に頼りなく見えた。",
          ),
          line(
            "ギドノゼアース",
            "お前は、私が来ることより、私が来たせいで誰かが壊れることを恐れている。",
            undefined,
            {
              beat: "revelation",
              cue: "見透かされたのに、不思議と逃げ道を塞がれた感じはしなかった。",
            },
          ),
          line("ミミ", "どっちも怖いです。普通に。"),
          thought(
            "口元がほんの少し上がる。笑われたのだと気づくまで、数秒かかった。",
            { sprite: gidonoUnsealedSoft },
          ),
          line(
            "ギドノゼアース",
            "それでいい。恐れ方がまともな者なら、鍵を預けられる。",
          ),
        ],
        [
          choice(
            "呼び出す方法より、戻す方法を聞く",
            "翼を閉じる言葉は、命令ではなく彼の名を呼ぶだけだった。忘れないよう、帰りのエレベーターで何度も小さく繰り返した。",
            11,
            -4,
            { fighterPoints: 5 },
          ),
          choice(
            "街を傷つけない出力まで測る",
            "窓の中の翼を一枚ずつ開き、安全に戻せる境目を記録した。数字は得られた。でも「測ったものは使いたくなる」という声が、帰っても残った。",
            0,
            9,
            { sharedPoints: 5 },
          ),
        ],
        {
          background: "/assets/story/bg-observation-deck-night.png",
          sprite: gidonoSealedNeutral,
        },
      ),
      crisis: scene(
        "gidonozeaas.crisis",
        "名前を書く手",
        "アルデバラン社・契約記録室",
        ["work", "play", "rest", "search"],
        [
          thought(
            "紙と熱い機械油の匂い。無人のプリンターが、三十枚目の追加条項を吐き出す。",
          ),
          thought(
            "どの紙にも「容器および内容物」。その所有者代理には、私の名前がある。",
          ),
          line("ミミ", "内容物って、黒い星のことですか。"),
          line("ギドノゼアース", "世界の外にいる本体まで含む。"),
          thought(
            "紙を握った親指が白い。手を放しても、一枚だけ汗で指に貼りついた。",
          ),
          line(
            "ミミ",
            "もし本体を呼んだら、会社はあなたを全部、私を通して所有できる？",
          ),
          line(
            "ギドノゼアース",
            "できない。先に、お前の身体が入口として壊れる。",
          ),
          thought(
            "怖いより先に腹が立った。勝手に名前を使われたことにも、それを見落とした自分にも。",
          ),
          thought(
            "黒い星から、爪ほどの欠片が浮く。掌へ落ちた鍵は、氷みたいに冷たくて、火傷しそうに重い。",
            { effect: "pulse" },
          ),
          line(
            "ギドノゼアース",
            "持つ者が決めろ。私へ返せば、この契約では二度と開かない。",
            undefined,
            {
              beat: "tension",
              cue: "彼は鍵へ触れない。私が選ぶまで、選ばせるために、ほんの少し離れている。",
            },
          ),
          line("ミミ", "大会は、まだ終わってません。"),
          line(
            "ギドノゼアース",
            "だから今決める。終わってからなら、誰でも正しいことを言える。",
            undefined,
            {
              beat: "resolve",
              cue: "静かな声だった。怖がる私を急かすのではなく、自分が命じられる前に止めようとしている。",
            },
          ),
        ],
        [
          choice(
            "黒い星を回し、二人で封印の継ぎ目を探す",
            "鍵を置くと、彼は黒い星をゆっくり回した。私が印を読み、彼が内側から力を止める。危うい作業の末、誰にも命じられず開けられる継ぎ目を一つ見つけた。",
            13,
            -10,
            {
              fighterPoints: 6,
              tone: "heroic",
              intent: "本来の力を二人で安全に引き出す",
              promise: "失敗の危険を引き受け、ギドノ専用の成長を大きく進める。",
              memory: "二人で見つけた継ぎ目は、契約を解いたあとも本人だけが使える切り札になる。",
            },
          ),
          choice(
            "再販ベルの音を、封印を閉じる合図にする",
            "試しにカフェのベルを鳴らすと、黒い星がぴたりと止まった。世界滅亡級の封印が限定メニューの呼び鈴で閉じる事実に二人で黙ったが、全員が使える安全手順にはなった。",
            5,
            0,
            {
              sharedPoints: 6,
              tone: "comic",
              intent: "誰でも止められる安全装置を作る",
              promise: "最大出力は抑え、チーム全体で扱える成長と安全策を得る。",
              memory: "あのベルの音は、危険を止めた合図として最後までチームに残る。",
            },
          ),
        ],
        {
          background: "/assets/story/bg-contract-archive-v2.png",
          sprite: gidonoUnsealedNeutral,
        },
      ),
      liberation: scene(
        "gidonozeaas.liberation",
        "予約のない席",
        "カジノカフェ・閉店後",
        ["work", "play", "rest", "search"],
        [
          thought(
            "閉店後。窓際の席だけが、海の月明かりを拾っている。",
          ),
          thought(
            "契約解除届を四つ折りにして、また開く。署名欄だけが、何度見ても白い。",
          ),
          line("ギドノゼアース", "朝から四度、同じ紙を折り直している。"),
          line(
            "ミミ",
            "これを出したら、私にはあなたを出場させる権利がなくなります。",
          ),
          line(
            "ギドノゼアース",
            "出る権利は私に戻る。次の試合へ行くかは、そのあと私が決める。",
          ),
          thought(
            "勝ちたい。最後まで行きたい。その中へ、彼を「戦力」と数える癖が混じっていた。",
          ),
          line("ミミ", "自由になったあと、残ってほしいと言うのはずるいですか。"),
          line(
            "ギドノゼアース",
            "命令ではなく願いになる。願いは断れる。だから、命令より重いときもある。",
            undefined,
            {
              beat: "tender",
              cue: "断れる、と言った瞬間だけ、黒い星の回転が止まった。",
            },
          ),
          thought(
            "解除届の端が、空調の風で揺れる。黒い星は動かず、私の手を待っている。",
          ),
          line(
            "ギドノゼアース",
            "今度は、お前の名前ではなく、お前の言葉で決めろ。",
            undefined,
            {
              beat: "resolve",
              cue: "待たれている。契約の署名ではなく、私自身の返事を。",
            },
          ),
        ],
        [
          choice(
            "契約解除届と、次の試合予定を別々に渡す",
            "彼は解除届へ小さな星を書き、試合予定へは自分の名だけを書いた。「前者は自由。後者は僕の予定」。登録灯は所有者名を消し、出場者名を残した。",
            12,
            0,
            { liberationDecision: "release" },
          ),
          choice(
            "解除したあと、限定パフェの席だけ予約する",
            "契約はそこで終わった。彼は予約票へ二名と書き、その下へ「試合のあと」と足した。戦う理由が会社の命令から限定メニューへ変わっても、本人が選んだなら十分だった。",
            7,
            0,
            {
              sharedPoints: 4,
              liberationDecision: "release",
            },
          ),
        ],
        {
          background: "/assets/story/bg-casino-cafe-night.png",
          sprite: gidonoUnsealedSoft,
        },
      ),
      epilogue: scene(
        "gidonozeaas.epilogue",
        "再販日の朝",
        "カジノカフェ・窓際",
        ["rest"],
        [
          thought(
            "最終大会から三日。カフェは、焼いたワッフルと床用ワックスの匂いがする。",
          ),
          thought(
            "窓際の予約札には、社員番号ではなく彼の名前だけ。黒い星も穏やかに回っている。",
          ),
          line("ミミ", "今日は同伴者欄、空白なんですね。"),
          line(
            "ギドノゼアース",
            "規則が変わった。ひとりでも限定メニューを注文できる。",
          ),
          thought(
            "望んでいた答えのはずなのに。空いた椅子を見ると、胸の奥まで少し広くなる。",
          ),
          line("ミミ", "じゃあ、私は仕事に戻ります。ごゆっくり。"),
          line(
            "ギドノゼアース",
            "待て。ひとりで来た者が、誰かを席へ呼んではならない規則もない。",
            { sprite: gidonoUnsealedSoft },
          ),
          thought(
            "パフェの向かいに、欠けたスタッフ用マグカップ。湯気が朝日にほどけている。",
          ),
          line("ミミ", "これ、注文してませんけど。"),
          line(
            "ギドノゼアース",
            "知っている。今度は、冷める前に座れ。",
          ),
          thought(
            "タイムカードを裏返し、向かいの椅子を引く。今日の水平線は、一度も揺れなかった。",
          ),
        ],
        undefined,
        {
          background: "/assets/story/bg-casino-cafe-morning.png",
          sprite: gidonoUnsealedNeutral,
        },
      ),
    },
  }),
  makeFighter({
    id: "minato",
    name: "ミナト",
    kind: "役目を終えた旅人",
    role: "攻撃",
    color: "#8ecae6",
    accent: "#214761",
    summary:
      "数え切れない武器を遺失物窓口へ返しに来た青年。どれも世界を救った証拠らしいが、本人は次の仕事を決めていない。",
    currentLimit: "自分のために剣を抜く理由がない。",
    traitName: "旅の残響",
    traitText: "異なる種類の技を続けて使うほど攻撃が上がる。",
    ai: "steady",
    strong: "gale",
    weak: "star",
    stats: { hp: 63, mp: 34, attack: 48, defense: 37, magic: 33, speed: 43 },
    skills: [
      skill("minato.edge", "名もない剣", "damage", "enemy", "neutral", 42, 0, "単体斬撃"),
      skill("minato.gale", "渡り風", "damage", "allEnemies", "gale", 38, 8, "敵全体を攻撃"),
      skill("minato.camp", "野営の勘", "heal", "ally", "neutral", 36, 9, "味方一人を回復"),
      skill("minato.last", "最後ではない一歩", "buff", "allAllies", "gale", 28, 16, "味方全体を加速", { speedBuff: 0.18 }),
    ],
    locations: ["遺失物窓口", "商店街", "搬入口"],
    actions: [["work"], ["play", "work"], ["search"]],
    linePatterns: {
      epilogue: ["thought", "fighter", "mimi"],
    },
    meet: [
      "これで返却は全部です。剣が四十七本、鍵が十二本。",
      "全部あなたの落とし物なんですか？",
      "預かっていただけるなら、もう僕のものではありません。",
    ],
    join: [
      "闘技場なら、しばらく仕事があると聞きました。",
      "世界を救った人の再就職先として大丈夫かな。",
      "今度は、終わった後のことを考えてみます。",
    ],
    bond: [
      "今日は地図を見ずに歩きたいんです。",
      "迷子になりますよ。",
      "目的地がなければ、迷子にもなれません。",
    ],
    power: [
      "返した剣が、僕を選んで戻ってきた。",
      "遺失物窓口の人が泣いてました。",
      "一本だけにします。今度は自分で選びたい。",
    ],
    crisis: [
      "命令があれば戦えます。命令がなくても戦えるかは、まだ分からない。",
      "それを試すための試合じゃない。",
      "では、試合の外で答えを探します。",
    ],
    liberation: [
      "契約がなくても、次の試合へ出たいと思いました。",
      "理由は？",
      "勝った後に、みんなで帰る場所を作りたいからです。",
    ],
    epilogue: [
      "ミナトは新しい地図を広げ、最初に闘技場へ丸を付けた。",
      "出発地点です。",
      "目的地じゃないんですね。",
    ],
  }),
  makeFighter({
    id: "amara",
    name: "アマラ",
    kind: "規則を量る者",
    role: "支援",
    color: "#f4c2d7",
    accent: "#6f3650",
    summary:
      "白い手袋で施設の規則を確認して回る女性。彼女の世界では、違反者だけでなく規則そのものも裁判の対象になる。",
    currentLimit: "この世界の規則を、まだ正義として認めていない。",
    traitName: "反証",
    traitText: "味方が弱体化されると、全員を少し回復する。",
    ai: "careful",
    strong: "star",
    weak: "flame",
    stats: { hp: 49, mp: 62, attack: 27, defense: 41, magic: 52, speed: 35 },
    skills: [
      skill("amara.light", "白線", "damage", "enemy", "star", 38, 0, "MPを使わない単体攻撃"),
      skill("amara.relief", "異議あり", "heal", "allAllies", "star", 32, 12, "味方全体を回復"),
      skill("amara.stay", "執行停止", "debuff", "enemy", "neutral", 30, 9, "敵の攻撃を下げる", { attackDebuff: 0.18, magicDebuff: 0.12 }),
      skill("amara.rewrite", "第一条を書き直す", "buff", "allAllies", "star", 38, 18, "味方全体を強化"),
    ],
    locations: ["従業員相談室", "噴水広場", "契約保管庫"],
    actions: [["work", "rest"], ["play"], ["search", "work"]],
    linePatterns: {
      epilogue: ["thought", "thought", "fighter"],
    },
    meet: [
      "この休憩規定は、休ませないために書かれています。",
      "いきなり監査の人が来た。",
      "監査ではありません。判決前の確認です。",
    ],
    join: [
      "内部から規則を見る必要があります。",
      "選手登録すると見られる範囲は増えます。",
      "では登録します。あなたも被告席へ来てください。",
    ],
    bond: [
      "噴水の縁へ座る行為は禁止されていません。",
      "座りたいなら座ればいいのに。",
      "……そうします。規則がないので。",
    ],
    power: [
      "神罰は規則違反へ下すものではない。規則が人を害した時に下す。",
      "それ、会社に聞かれたら困るやつです。",
      "記録してください。聞かせるために言いました。",
    ],
    crisis: [
      "あなたが所有者である限り、私の訴えは利益相反になる。",
      "じゃあ、所有者をやめたら？",
      "その発言を証拠として採用します。",
    ],
    liberation: [
      "契約書を無効とします。署名者は私と、あなたです。",
      "私、被告じゃなかったんですか。",
      "共同原告へ変更しました。",
    ],
    epilogue: [
      "再建された闘技場の第一条は、短い。",
      "『出場しない自由を妨げない』。",
      "二条は休憩時間です。こちらの方が長い。",
    ],
  }),
  makeFighter({
    id: "shahar",
    name: "シャハル",
    kind: "空を覆う古竜",
    role: "守備",
    color: "#92d7d0",
    accent: "#285c58",
    summary:
      "屋上に落ちていた一枚の鱗を通して話す竜。本人が翼を広げると、街の天気予報が一週間ずれる。",
    currentLimit: "本体が闘技場へ収まらない。",
    traitName: "天蓋",
    traitText: "最初に受ける全体攻撃の威力を半減する。",
    ai: "careful",
    strong: "gale",
    weak: "tide",
    stats: { hp: 78, mp: 31, attack: 44, defense: 55, magic: 30, speed: 24 },
    skills: [
      skill("shahar.claw", "鱗の爪", "damage", "enemy", "neutral", 43, 0, "重い単体攻撃"),
      skill("shahar.canopy", "天蓋", "guard", "allAllies", "gale", 40, 10, "味方全体を守り、障壁を張る", { barrier: 10 }),
      skill("shahar.roar", "低い咆哮", "debuff", "allEnemies", "gale", 28, 9, "敵全体の速度を下げる", { speedDebuff: 0.16 }),
      skill("shahar.sky", "空を狭くする", "damage", "allEnemies", "gale", 54, 18, "敵全体へ大攻撃"),
    ],
    locations: ["屋上庭園", "配送ヤード", "闘技場上空"],
    actions: [["rest", "search"], ["work"], ["search"]],
    meet: [
      "その鱗を踏むな。私はそこから話している。",
      "屋上の落とし物じゃなかった。",
      "落としたのは事実だ。返却期限は知らない。",
    ],
    join: [
      "この鱗だけなら出場枠へ収まる。",
      "選手一名で申請して大丈夫なのかな。",
      "不足なら、爪も一つ置いていく。",
    ],
    bond: [
      "人の街は、空が小さい。",
      "屋上から見ると広いですよ。",
      "ならば今日は、ここを空と呼ぼう。",
    ],
    power: [
      "競技場の屋根を開けろ。壊したくはない。",
      "そこ、会社に確認してからで。",
      "確認は済んだ。返事だけがまだだ。",
    ],
    crisis: [
      "命令があれば街へ降りる。被害は契約上、お前の責任になる。",
      "降りなくていい。鱗のまま勝ちましょう。",
      "小さく戦うことを、弱さと呼ばないのだな。",
    ],
    liberation: [
      "鱗を返せ。契約はそこに刻まれている。",
      "返したら、もう話せない？",
      "空を見上げろ。声を届けるのに紙はいらない。",
    ],
    epilogue: [
      "新しい闘技場には、開閉式の屋根が付いた。",
      "予算、全部ここに使ってません？",
      "空を設備扱いしたのは、お前たちだ。",
    ],
  }),
  makeFighter({
    id: "teirei",
    name: "丁零",
    reading: "ていれい",
    kind: "廃棄予定の戦闘機構",
    role: "妨害",
    color: "#a8b6c7",
    accent: "#273442",
    summary:
      "搬入口で充電器を探していた人型機構。敵対対象を消し尽くした結果、現在の命令表が空白になっている。",
    currentLimit: "敵を定義する権限が契約側にある。",
    traitName: "未定義",
    traitText: "同じ敵を連続で狙うと、防御を少しずつ無視する。",
    ai: "tricky",
    strong: "flame",
    weak: "star",
    stats: { hp: 61, mp: 40, attack: 45, defense: 46, magic: 37, speed: 32 },
    skills: [
      skill("teirei.beam", "点検光", "damage", "enemy", "flame", 40, 0, "対象を走査して攻撃"),
      skill("teirei.break", "定義解除", "debuff", "enemy", "neutral", 36, 8, "敵の防御と判断を鈍らせる", { defenseDebuff: 0.2 }),
      skill("teirei.wall", "隔壁", "guard", "ally", "neutral", 45, 9, "味方一人を強く守る", { barrier: 20 }),
      skill("teirei.blank", "空欄命令", "damage", "allEnemies", "flame", 50, 18, "敵全体を攻撃"),
    ],
    locations: ["搬入口", "整備室", "廃棄物保管区"],
    actions: [["work", "search"], ["work", "rest"], ["search"]],
    meet: [
      "充電規格が一致しません。あなたは電源ですか。",
      "派遣バニーです。",
      "近似カテゴリとして登録します。",
    ],
    join: [
      "敵対対象の入力を要求します。",
      "試合の相手だけ。街の人は対象外。",
      "範囲を保存。所有者の変更時に再確認します。",
    ],
    bond: [
      "待機命令がありません。",
      "休んでいいです。",
      "休止を、自発行動として実行します。",
    ],
    power: [
      "旧命令表を発見。対象はすでに存在しません。",
      "じゃあ捨てましょう。",
      "削除には所有者権限が必要です。要求しますか。",
    ],
    crisis: [
      "あなたを所有者として固定すれば、判断遅延は消えます。",
      "固定しない。自分で決められるようにしたい。",
      "未登録の機能です。実装を開始します。",
    ],
    liberation: [
      "所有者欄を空白にしました。動作は継続しています。",
      "最初に自分で決めることは？",
      "充電器を買います。規格は私が選びます。",
    ],
    epilogue: [
      "丁零は整備室の責任者になった。",
      "また人を電源扱いしてません？",
      "現在は全員を同僚として誤認しています。",
    ],
  }),
  makeFighter({
    id: "night-eater",
    name: "夜を食べるもの",
    kind: "夕暮れに混じる現象",
    role: "妨害",
    color: "#52647a",
    accent: "#f6cf70",
    summary:
      "閉店時間を早める黒い影。照明故障として処理され続け、苦情票だけが大量に残っている。",
    currentLimit: "屋内では完全な夜になれない。",
    traitName: "薄暮",
    traitText: "三ターン目以降、敵全体の速度を下げる。",
    ai: "tricky",
    strong: "star",
    weak: "flame",
    stats: { hp: 52, mp: 57, attack: 29, defense: 35, magic: 51, speed: 46 },
    skills: [
      skill("night.dim", "日暮れ", "damage", "enemy", "star", 39, 0, "影で単体攻撃"),
      skill("night.eat", "灯りを食べる", "debuff", "allEnemies", "star", 32, 9, "敵全体の攻撃と速度を下げる", { attackDebuff: 0.12, speedDebuff: 0.12 }),
      skill("night.quiet", "閉店後", "buff", "allAllies", "neutral", 26, 10, "味方全体の回避を上げる", { evasionBuff: 0.14 }),
      skill("night.full", "夜そのもの", "damage", "allEnemies", "star", 56, 19, "敵全体へ大攻撃"),
    ],
    locations: ["照明管理室", "夜の遊歩道", "無人の客席"],
    actions: [["work", "rest"], ["play", "rest"], ["search", "rest"]],
    linePatterns: {
      join: ["mimi", "fighter", "mimi"],
    },
    meet: [
      "灯りが多すぎる。",
      "また照明故障の苦情……誰？",
      "夜だ。名前が必要なら、そう呼べ。",
    ],
    join: [
      "夜勤枠なら空いてます。",
      "勤務ではない。だが夜が始まる場所には興味がある。",
      "選手欄に勤務時間を書いておきますね。",
    ],
    bond: [
      "閉店後の店は静かでいい。",
      "暗いと片付けられません。",
      "では、お前の足元だけ残そう。",
    ],
    power: [
      "客席の最後の灯りを消せば、本来の夜になれる。",
      "避難灯は消さないで。",
      "条件を修正する。命を守る灯りは食べない。",
    ],
    crisis: [
      "契約は私を照明設備として所有している。",
      "そんな分類、直します。",
      "分類ではない。所有の欄を消せ。",
    ],
    liberation: [
      "暗くなった。それでもお前はいる。",
      "避難灯、点いてますから。",
      "ああ。残してよかった。",
    ],
    epilogue: [
      "閉店後の闘技場には、足元だけを照らす穏やかな夜が来る。",
      "今日は食べすぎないでくださいね。",
      "週末なので、少しだけ長くする。",
    ],
  }),
  makeFighter({
    id: "peony",
    name: "ピオニー",
    kind: "角を隠さない大女",
    role: "攻撃",
    color: "#f18f7d",
    accent: "#65362f",
    summary:
      "迷子案内所で子どもをあやしている巨大な女性。裏手には、彼女が素手で割った城壁が置物として飾られている。",
    currentLimit: "小さな相手を傷つけることを極端に恐れている。",
    traitName: "手加減上手",
    traitText: "HPの低い敵へ攻撃する時、味方も少し回復する。",
    ai: "careful",
    strong: "flame",
    weak: "gale",
    stats: { hp: 72, mp: 24, attack: 57, defense: 44, magic: 22, speed: 34 },
    skills: [
      skill("peony.tap", "指一本", "damage", "enemy", "neutral", 48, 0, "丁寧な単体攻撃"),
      skill("peony.wall", "壁返し", "damage", "allEnemies", "flame", 41, 8, "敵全体を攻撃"),
      skill("peony.catch", "受け止める", "guard", "ally", "neutral", 50, 8, "味方一人を守る"),
      skill("peony.full", "両手を使う", "damage", "enemy", "flame", 82, 18, "強烈な単体攻撃"),
    ],
    locations: ["迷子案内所", "従業員食堂", "旧城壁展示区"],
    actions: [["work", "play"], ["rest", "play"], ["search"]],
    meet: [
      "この子の保護者、見つかった？",
      "もうすぐ来るそうです。その壁、何ですか。",
      "昔ちょっと。力加減を間違えてね。",
    ],
    join: [
      "闘技場なら、壊していい物が決まってるんだろ。",
      "相手は壊さないでください。",
      "そこが一番難しいんだよ。",
    ],
    bond: [
      "食堂の椅子、また壊した。",
      "立って食べなくていいです。丈夫なのを頼みます。",
      "頼んでいいのか。そういうの。",
    ],
    power: [
      "本気を出すと、相手より先に床が負ける。",
      "床の修理費は会社持ちです。",
      "いい職場じゃないか。",
    ],
    crisis: [
      "命令してくれれば殴れる。自分で決めると止まっちまう。",
      "止まってもいい。勝ち方を一緒に考えます。",
      "それなら、考える方から本気を出すよ。",
    ],
    liberation: [
      "契約が切れた。もう命令は来ない。",
      "次の試合、出ますか？",
      "出るよ。壊さない約束は、あたしが決める。",
    ],
    epilogue: [
      "ピオニー専用の椅子は、闘技場で一番高価な備品になった。",
      "座り心地、どうです？",
      "壊すのが惜しいくらいだ。",
    ],
  }),
  makeFighter({
    id: "cassim-bell",
    name: "カシム・ベル",
    kind: "無限倉庫の番人",
    role: "支援",
    color: "#e5bd62",
    accent: "#5c471f",
    summary:
      "遺失物窓口の物腰柔らかな係員。背後の扉は、どの世界で失くした物にもつながっている。",
    currentLimit: "保管物を自分の意思で持ち出せない。",
    traitName: "備品調達",
    traitText: "戦闘開始時、味方全員のMPを少し増やす。",
    ai: "careful",
    strong: "tide",
    weak: "flame",
    stats: { hp: 48, mp: 60, attack: 31, defense: 38, magic: 48, speed: 39 },
    skills: [
      skill("cassim.key", "合鍵", "damage", "enemy", "neutral", 37, 0, "扉を開いて攻撃"),
      skill("cassim.stock", "在庫照会", "heal", "allAllies", "tide", 29, 10, "味方全体を回復"),
      skill("cassim.loan", "一時貸与", "buff", "ally", "neutral", 44, 9, "味方一人の攻撃と魔力を強化", { attackBuff: 0.18, magicBuff: 0.18 }),
      skill("cassim.vault", "全保管庫開放", "damage", "allEnemies", "tide", 50, 18, "敵全体を攻撃"),
    ],
    locations: ["遺失物窓口", "倉庫街", "存在しない地下階"],
    actions: [["work"], ["work", "play"], ["search"]],
    meet: [
      "こちら、あなたが前世で失くされた鍵です。",
      "失くした記憶もないんですけど。",
      "記憶は当窓口の保管対象外です。",
    ],
    join: [
      "選手登録には、保管庫の一部を持ち出す許可が要ります。",
      "誰の許可ですか？",
      "現在のところ、あなたの印鑑で通ります。",
    ],
    bond: [
      "今日は何も失くしていませんね。",
      "褒められてます？",
      "私にとっては、少し寂しい報告です。",
    ],
    power: [
      "扉の向こうに、未返却の最終兵器が三つあります。",
      "返却先は？",
      "すべて滅びています。ですから、用途を決め直せます。",
    ],
    crisis: [
      "契約上、私は倉庫の備品です。番人ではありません。",
      "備品が備品を管理してたんですか。",
      "おかしな話でしょう。やっと笑っていただけた。",
    ],
    liberation: [
      "所有者欄を閉じました。扉はまだ開きます。",
      "これから何を保管します？",
      "返したくない思い出だけは、預からないことにします。",
    ],
    epilogue: [
      "遺失物窓口は、今では返却だけでなく相談も受け付ける。",
      "記憶も預かるようになったんですか。",
      "いいえ。一緒に探すだけです。",
    ],
  }),
  makeFighter({
    id: "sazanami",
    name: "さざなみ",
    kind: "深海より大きなもの",
    role: "守備",
    color: "#6ec6d8",
    accent: "#153c52",
    summary:
      "館内水槽に収まりきらない影。名前だけは小さいが、寝返り一つで沿岸の地図が変わる。",
    currentLimit: "水槽へ映った影しか地上に出せない。",
    traitName: "満ち引き",
    traitText: "偶数ターンは防御、奇数ターンは魔力が上がる。",
    ai: "steady",
    strong: "tide",
    weak: "gale",
    stats: { hp: 76, mp: 42, attack: 38, defense: 52, magic: 43, speed: 21 },
    skills: [
      skill("saza.wave", "小波", "damage", "allEnemies", "tide", 35, 0, "敵全体を攻撃"),
      skill("saza.deep", "深度", "debuff", "allEnemies", "tide", 29, 9, "敵全体を遅くする", { speedDebuff: 0.17 }),
      skill("saza.shell", "水圧壁", "guard", "allAllies", "tide", 42, 11, "味方全体を守る"),
      skill("saza.turn", "寝返り", "damage", "allEnemies", "tide", 58, 19, "敵全体へ大攻撃"),
    ],
    locations: ["館内水槽", "噴水広場", "地下貯水槽"],
    actions: [["play", "rest"], ["rest"], ["search"]],
    linePatterns: {
      meet: ["mimi", "fighter", "mimi"],
      join: ["mimi", "fighter", "mimi"],
      bond: ["mimi", "fighter", "mimi"],
    },
    meet: [
      "その水槽、さっきから奥行きがおかしい。",
      "さざなみ。",
      "名前？　波の音？",
    ],
    join: [
      "出場枠、水槽一つ分で足りますか。",
      "影だけでよい。",
      "本体を呼ばないなら、たぶん。",
    ],
    bond: [
      "今日は波が静かですね。",
      "眠い。",
      "返事が短いの、ちょっと安心します。",
    ],
    power: [
      "水槽の底を開けば、目だけは出せる。",
      "館内が水没しません？",
      "目は乾く。水は出さない。",
    ],
    crisis: [
      "契約は水槽を所有し、水槽が影を所有する。",
      "本体のあなたは？",
      "どこにも属さない。だから影だけが苦しい。",
    ],
    liberation: [
      "水槽を割った。水はこぼれない。",
      "影が、自由になった？",
      "帰れるし、残れる。今日は残る。",
    ],
    epilogue: [
      "噴水広場の水面には、ときどき広すぎる海が映る。",
      "今日は眠くないんですか。",
      "話しているから。",
    ],
  }),
  makeFighter({
    id: "marian",
    name: "マリアン",
    kind: "生と死を取り違えた聖職者",
    role: "支援",
    color: "#f1d4e5",
    accent: "#5d4053",
    summary:
      "救護室で包帯を畳む女性。彼女の治療は死者へ効きすぎ、生者へ使うには細かな調整が必要になる。",
    currentLimit: "闘技場規約が本来の治療術を禁じている。",
    traitName: "逆さの祈り",
    traitText: "倒れた味方が出ると、残った味方を大きく回復する。",
    ai: "careful",
    strong: "star",
    weak: "tide",
    stats: { hp: 47, mp: 65, attack: 25, defense: 36, magic: 55, speed: 33 },
    skills: [
      skill("marian.touch", "脈を戻す", "heal", "ally", "star", 42, 0, "味方一人を回復"),
      skill("marian.reverse", "反命", "damage", "enemy", "star", 49, 9, "敵単体へ強力な魔力攻撃"),
      skill("marian.chorus", "静かな聖歌", "heal", "allAllies", "neutral", 30, 12, "味方全体を回復"),
      skill("marian.dawn", "夜明けを誤る", "buff", "allAllies", "star", 40, 19, "味方全体を強化"),
    ],
    locations: ["救護室", "礼拝スペース", "使われない霊安室"],
    actions: [["rest", "work"], ["rest"], ["search", "rest"]],
    meet: [
      "その擦り傷、治しますか。",
      "普通に治ります？",
      "今日は普通の方です。",
    ],
    join: [
      "試合中なら、治療の結果が記録されます。",
      "実験台みたいな言い方。",
      "失礼。共同研究者と呼びます。",
    ],
    bond: [
      "包帯を畳むの、手伝います。",
      "死者は包帯を急ぎません。ゆっくりで大丈夫。",
      "生者の勤務時間は急ぐんです。",
    ],
    power: [
      "本来の祈りは、死を終わらせるものです。",
      "生き返らせる？",
      "いいえ。死んだまま、困らなくします。",
    ],
    crisis: [
      "命令があれば禁じられた術を使えます。責任は所有者へ移る。",
      "責任だけじゃなく、判断もあなたに返します。",
      "それは治療より難しい。",
    ],
    liberation: [
      "契約が消えても、手は震えませんでした。",
      "次の治療、お願いします。",
      "はい。今日は私が選んで治します。",
    ],
    epilogue: [
      "新しい救護室には、生者用と死者用の受付票がある。",
      "死者用、必要ですか。",
      "たまに。裏口から来ます。",
    ],
  }),
  makeFighter({
    id: "ushiro",
    name: "うしろ",
    kind: "振り返ると位置を変える影",
    role: "速攻",
    color: "#8c8fa3",
    accent: "#242634",
    summary:
      "記念写真の最後列へ必ず写る細長い影。存在を認めると消え、空席として扱うと座っている。",
    currentLimit: "正面から観測されると力を失う。",
    traitName: "視界の外",
    traitText: "最初の攻撃を高確率で回避する。",
    ai: "tricky",
    strong: "gale",
    weak: "star",
    stats: { hp: 44, mp: 45, attack: 42, defense: 29, magic: 46, speed: 59 },
    skills: [
      skill("ushiro.tap", "肩越し", "damage", "enemy", "neutral", 40, 0, "素早い単体攻撃"),
      skill("ushiro.gone", "見失う", "buff", "self", "gale", 38, 7, "回避と速度を上げる", { evasionBuff: 0.22, speedBuff: 0.16 }),
      skill("ushiro.turn", "振り返らせる", "debuff", "enemy", "gale", 32, 8, "敵の防御を下げる", { defenseDebuff: 0.2 }),
      skill("ushiro.lastrow", "最後列", "damage", "allEnemies", "gale", 52, 17, "敵全体を攻撃"),
    ],
    locations: ["記念撮影所", "従業員通路", "鏡のない部屋"],
    actions: [["play", "work"], ["rest", "play"], ["search"]],
    linePatterns: {
      meet: ["mimi", "fighter", "mimi"],
      join: ["mimi", "fighter", "mimi"],
      bond: ["mimi", "fighter", "mimi"],
    },
    meet: [
      "写真、人数が一人多い。",
      "数えないで。",
      "今、後ろから聞こえた？",
    ],
    join: [
      "選手枠、一つ空いてます。",
      "空いているなら、いる。",
      "振り返らずに登録しますね。",
    ],
    bond: [
      "今日は右後ろにいます？",
      "左。",
      "答えてくれるようになった。",
    ],
    power: [
      "鏡を全部外せば、部屋いっぱいに広がれる。",
      "怖い提案を普通にしないで。",
      "普通に言えば、怖くないと思った。",
    ],
    crisis: [
      "契約は振り返る命令を禁じている。",
      "じゃあ、今ここで振り返ります。",
      "待って。まだ、消えたくない。",
    ],
    liberation: [
      "振り返って。",
      "……いた。",
      "見られても、残れた。",
    ],
    epilogue: [
      "集合写真の最後列には、今も一人多く写っている。",
      "今度は数えてもいい？",
      "名前で呼ぶなら。",
    ],
  }),
  makeFighter({
    id: "wolf-nine",
    name: "ヴォルフ・ナイン",
    kind: "九度目の決闘者",
    role: "攻撃",
    color: "#d1a66e",
    accent: "#4b3420",
    summary:
      "封蝋付きの挑戦状を毎週送る獣人。敗れるたび新しい戦い方を覚え、九度目だけは誰も記録できていない。",
    currentLimit: "この世界では、まだ一度も正式に敗れていない。",
    traitName: "再戦",
    traitText: "ダメージを受けるたび、攻撃が少し上がる。",
    ai: "aggressive",
    strong: "flame",
    weak: "tide",
    stats: { hp: 65, mp: 28, attack: 54, defense: 39, magic: 25, speed: 48 },
    skills: [
      skill("wolf.claw", "第一決闘", "damage", "enemy", "neutral", 47, 0, "単体攻撃"),
      skill("wolf.rush", "第四決闘", "damage", "enemy", "flame", 61, 9, "強い単体攻撃"),
      skill("wolf.mark", "再戦印", "debuff", "enemy", "neutral", 34, 8, "敵の攻撃と防御を下げる", { attackDebuff: 0.12, defenseDebuff: 0.16 }),
      skill("wolf.ninth", "第九決闘", "damage", "enemy", "flame", 86, 19, "最大級の単体攻撃"),
    ],
    locations: ["郵便受取所", "練習場", "無人の決闘場"],
    actions: [["work", "play"], ["play"], ["search", "play"]],
    linePatterns: {
      meet: ["mimi", "fighter", "mimi"],
    },
    meet: [
      "封蝋の手紙、私宛て？",
      "三日後、噴水前で待つ。",
      "待ち合わせじゃなくて決闘って書いてある。",
    ],
    join: [
      "お前の選手と戦うため、まず同じチームへ入る。",
      "順序がおかしくないですか。",
      "近くで見た方が、次の決闘が良くなる。",
    ],
    bond: [
      "今日は決闘しない。",
      "珍しい。",
      "手紙を書く。便箋を選ぶのに時間がかかる。",
    ],
    power: [
      "一度、私を負かせ。次の私はもっと強い。",
      "わざと負けるのは嫌なんですよね。",
      "当然だ。本気で来い。",
    ],
    crisis: [
      "所有者命令なら、私を敗北させられる。",
      "そんな敗北で強くなっても意味がない。",
      "同意する。だから命令するな。",
    ],
    liberation: [
      "契約なしで、お前のチームへ挑む。",
      "今は同じチームです。",
      "ならば隣で戦う。決着はその後だ。",
    ],
    epilogue: [
      "挑戦状は、試合の招待状へ書き換えられた。",
      "封蝋、毎回必要です？",
      "必要だ。受け取った顔が面白い。",
    ],
  }),
  makeFighter({
    id: "room-seventeen",
    name: "十七号室",
    kind: "人の姿を借りる迷宮",
    role: "妨害",
    color: "#b7a6d8",
    accent: "#46345f",
    summary:
      "従業員通路へ突然増えた扉。中は百階以上あるが、受付上は会議室として予約できる。",
    currentLimit: "出口を一つしか開けない契約になっている。",
    traitName: "迷い道",
    traitText: "敵が狙う対象を時々入れ替える。",
    ai: "tricky",
    strong: "star",
    weak: "gale",
    stats: { hp: 58, mp: 54, attack: 31, defense: 43, magic: 49, speed: 30 },
    skills: [
      skill("room.door", "扉を開く", "damage", "enemy", "neutral", 39, 0, "単体攻撃"),
      skill("room.stairs", "戻る階段", "debuff", "allEnemies", "star", 30, 10, "敵全体の攻撃と速度を下げる", { attackDebuff: 0.1, speedDebuff: 0.12 }),
      skill("room.rest", "安全地帯", "heal", "allAllies", "neutral", 28, 11, "味方全体を回復"),
      skill("room.floor", "百一階", "damage", "allEnemies", "star", 55, 19, "敵全体へ大攻撃"),
    ],
    locations: ["従業員通路", "十七号室", "最下層らしき場所"],
    actions: [["work", "search"], ["rest", "search"], ["search"]],
    linePatterns: {
      meet: ["mimi", "fighter", "mimi"],
      join: ["mimi", "fighter", "mimi"],
      bond: ["mimi", "fighter", "mimi"],
    },
    meet: [
      "この通路、十六号室までしかなかったはず。",
      "予約は空いている。",
      "部屋がしゃべった。",
    ],
    join: [
      "選手一名として登録すれば、会議室料金は不要？",
      "迷宮が経費を気にしてる。",
      "百階分は高い。",
    ],
    bond: [
      "今日は二階までで帰れた。",
      "近道を覚えてくれたんですね。",
      "違う。三階から先を寝かせた。",
    ],
    power: [
      "最下層を開ける。入る？",
      "戻れます？",
      "出口を残す。契約より先に約束する。",
    ],
    crisis: [
      "所有者は出口を閉じられる。",
      "閉じません。",
      "知っている。だから扉を開けた。",
    ],
    liberation: [
      "所有者用の鍵穴を埋めた。",
      "もう誰も閉じ込められない？",
      "招待した者しか入れない。お前はいつでも入れる。",
    ],
    epilogue: [
      "十七号室は、新しい闘技場の休憩室になった。",
      "百階ある休憩室は広すぎます。",
      "混雑対策。",
    ],
  }),
  makeFighter({
    id: "rinne",
    name: "リンネ",
    kind: "確率に嫌われない転生者",
    role: "速攻",
    color: "#f7b267",
    accent: "#63391d",
    summary:
      "無一文なのに賭場から追い出された女性。勝ちすぎたのではなく、胴元が勝つ未来だけを避け続けた。",
    currentLimit: "賭ける元手がないと、確率へ触れられない。",
    traitName: "見える外れ",
    traitText: "会心が出なかった次の攻撃ほど、会心率が上がる。",
    ai: "aggressive",
    strong: "gale",
    weak: "flame",
    stats: { hp: 50, mp: 38, attack: 47, defense: 31, magic: 36, speed: 56 },
    skills: [
      skill("rinne.coin", "空のコイン", "damage", "enemy", "neutral", 43, 0, "単体攻撃"),
      skill("rinne.odd", "奇数を選ぶ", "damage", "enemy", "gale", 62, 8, "威力が揺れる攻撃"),
      skill("rinne.fold", "降りる", "guard", "self", "neutral", 45, 6, "自分を守る"),
      skill("rinne.allin", "持っていない全額", "damage", "allEnemies", "gale", 53, 17, "敵全体へ攻撃"),
    ],
    locations: ["裏口のベンチ", "賭場", "閉店後のルーレット"],
    actions: [["play", "work"], ["play"], ["search", "play"]],
    meet: [
      "追い出された。今日はまだ一度も賭けてないのに。",
      "何をしたんですか。",
      "店が勝つ台だけ避けて歩いた。",
    ],
    join: [
      "賞金が出るなら戦う。賭け金にできる。",
      "先に生活費へ回してください。",
      "それも期待値は高いね。",
    ],
    bond: [
      "今日は当たりが見えない。",
      "休めってことでは？",
      "なるほど。それは一番見落としやすい当たりだ。",
    ],
    power: [
      "確率は変えない。外れの方を選ばないだけ。",
      "同じことじゃない？",
      "責任の所在が違う。",
    ],
    crisis: [
      "命令なら、絶対に当たる未来を選べる。外れはお前へ行く。",
      "そんな賭けはしない。",
      "うん。だからこのチームに残ってる。",
    ],
    liberation: [
      "契約が外れた。未来が少し増えた。",
      "どれを選びます？",
      "まだ選ばない。見えない方が面白い。",
    ],
    epilogue: [
      "リンネは新しい賭場で、負け方を教えている。",
      "本当に必要な講座ですか。",
      "負けても帰れる人だけが、賭けを楽しめる。",
    ],
  }),
  makeFighter({
    id: "mumyo",
    name: "無銘",
    reading: "むめい",
    kind: "持ち主を失った剣",
    role: "万能",
    color: "#d9dde4",
    accent: "#333846",
    summary:
      "景品展示室の一本の剣。鏡にだけ人の姿で映り、過去の所有者全員より強い。",
    currentLimit: "所有者がいなければ、鞘から抜けない。",
    traitName: "持たれない刃",
    traitText: "所有が低いほど速度、信頼が高いほど攻撃が上がる。",
    ai: "steady",
    strong: "neutral",
    weak: "star",
    stats: { hp: 55, mp: 36, attack: 50, defense: 42, magic: 35, speed: 45 },
    skills: [
      skill("mumyo.draw", "抜かない斬撃", "damage", "enemy", "neutral", 45, 0, "単体攻撃"),
      skill("mumyo.echo", "持ち主の残響", "buff", "self", "neutral", 36, 7, "自分の攻撃・魔力・速度を強化", { attackBuff: 0.15, magicBuff: 0.15, speedBuff: 0.12 }),
      skill("mumyo.sheath", "鞘", "guard", "ally", "neutral", 44, 8, "味方一人を守る"),
      skill("mumyo.none", "誰のものでもない", "damage", "allEnemies", "neutral", 58, 18, "敵全体へ大攻撃"),
    ],
    locations: ["景品展示室", "鏡張りの廊下", "所有者名簿室"],
    actions: [["work", "play"], ["play", "rest"], ["search"]],
    linePatterns: {
      meet: ["mimi", "fighter", "mimi"],
      bond: ["mimi", "fighter", "mimi"],
    },
    meet: [
      "この剣、鏡だと人が立って見える。",
      "名はない。",
      "今、鏡の中の人が答えた。",
    ],
    join: [
      "所有者欄へ名を書けば抜ける。",
      "私が持ち主になるってこと？",
      "書かずに持ち出す方法を探してもいい。",
    ],
    bond: [
      "磨くと痛いですか。",
      "痛くはない。覚えている。",
      "じゃあ、嫌なら言ってください。",
    ],
    power: [
      "歴代の持ち主は、私を最強の剣と呼んだ。",
      "あなた自身の呼び方は？",
      "まだ決めていない。",
    ],
    crisis: [
      "命じれば、誰より深く斬れる。",
      "命じない。抜くかどうかも任せます。",
      "それでは剣ではなくなる。",
    ],
    liberation: [
      "所有者名簿を消した。鞘は開いている。",
      "剣じゃなくなりました？",
      "いいや。初めて、自分で抜く剣になった。",
    ],
    epilogue: [
      "無銘は景品展示室を出て、入口の案内係をしている。",
      "名前、まだ決めないんですか。",
      "呼ばれれば分かる。今はそれでいい。",
    ],
  }),
];

export const fighterById = new Map(
  fighterDefinitions.map((fighter) => [fighter.id, fighter]),
);
