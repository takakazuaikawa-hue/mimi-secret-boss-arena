import type {
  CharacterScene,
  DialogueLine,
  SceneChoice,
  WeeklyAction,
} from "../game/types";
import { withChoiceDesign } from "../game/choiceDesign";
import { extendedAmbientEvents } from "./extendedAmbientEvents";

const lines = (...entries: Array<[string, string]>): DialogueLine[] =>
  entries.map(([speaker, text]) => ({ speaker, text }));

const choices = (
  first: SceneChoice,
  second: SceneChoice,
): [SceneChoice, SceneChoice] => [first, second];

const ambient = (
  id: string,
  title: string,
  location: string,
  action: WeeklyAction,
  dialogue: DialogueLine[],
  options: [SceneChoice, SceneChoice],
): CharacterScene => ({
  id: `ambient.${id}`,
  title,
  location,
  actions: [action],
  lines: dialogue,
  choices: options,
});

const baseAmbientEvents: Record<WeeklyAction, CharacterScene[]> = {
  work: [
    ambient(
      "work.menu",
      "限定メニュー会議",
      "カジノカフェ",
      "work",
      lines(
        ["店長", "今週の限定パフェ、名前だけ先に決まりました。"],
        ["ミミ", "『絶対王政ベリー』。これを家族連れに出すんですか？"],
        ["店長", "いちご味なので大丈夫です。"],
      ),
      choices(
        {
          label: "盛り付けを手伝う",
          result: "大魔王の角を模したウエハースが、なぜかよく売れた。",
          trust: 2,
          ownership: 0,
          money: 1400,
          sharedPoints: 1,
        },
        {
          label: "名前だけ直す",
          result: "『ベリーパフェ』になった。店長は少し寂しそうだった。",
          trust: 0,
          ownership: 1,
          money: 1800,
        },
      ),
    ),
    ambient(
      "work.uniform",
      "制服点検",
      "従業員控室",
      "work",
      lines(
        ["総務", "耳の角度が規定より三度だけ自由です。"],
        ["ミミ", "自由なのに直すんですか？"],
        ["総務", "自由には申請書が必要です。"],
      ),
      choices(
        {
          label: "申請書を書く",
          result: "七枚書いた。耳は元の角度に戻った。",
          trust: 1,
          ownership: 2,
          money: 1600,
        },
        {
          label: "三度を守り抜く",
          result: "接客アンケートで『元気そう』が一票増えた。",
          trust: 3,
          ownership: -1,
          money: 900,
          fighterPoints: 1,
        },
      ),
    ),
  ],
  play: [
    ambient(
      "play.market",
      "夜市の大当たり",
      "南通りの夜市",
      "play",
      lines(
        ["露店主", "一回だけ無料。二回目から人生がかかるよ。"],
        ["ミミ", "その説明で二回目をやる人、いるんですか？"],
        ["露店主", "闘技場の客を見な。"],
      ),
      choices(
        {
          label: "一回で帰る",
          result: "景品は小さな王冠だった。選手たちには妙に好評だ。",
          trust: 4,
          ownership: -1,
          sharedPoints: 2,
        },
        {
          label: "二回目へ",
          result: "外れたが、露店主から勝負師として拍手された。",
          trust: 1,
          ownership: 1,
          money: -600,
          fighterPoints: 3,
        },
      ),
    ),
    ambient(
      "play.photo",
      "記念撮影",
      "中央噴水",
      "play",
      lines(
        ["写真屋", "もう少し皆さん、普通の観光客らしく。"],
        ["ミミ", "この人たちの普通がこれなんです。"],
        ["写真屋", "では背景の城を消します。負けますので。"],
      ),
      choices(
        {
          label: "そのまま撮る",
          result: "背景の城より存在感のある集合写真ができた。",
          trust: 5,
          ownership: -2,
        },
        {
          label: "ミミだけ前に出る",
          result: "全員がきれいに隠れた。写真屋の腕だけが証明された。",
          trust: 2,
          ownership: 2,
          money: -300,
        },
      ),
    ),
  ],
  rest: [
    ambient(
      "rest.laundry",
      "静かな洗濯日",
      "寮の屋上",
      "rest",
      lines(
        ["ミミ", "今日は何も起こらない。すばらしい。"],
        ["放送", "屋上に次元の裂け目が発生しました。洗濯物にご注意ください。"],
        ["ミミ", "取り込んでからにしてください。"],
      ),
      choices(
        {
          label: "先に洗濯物を守る",
          result: "全員の外套が無事だった。次元の裂け目は自分で閉じた。",
          trust: 4,
          ownership: 0,
          sharedPoints: 1,
        },
        {
          label: "放送を信じて避難",
          result: "外套が一枚、別世界で英雄になった。",
          trust: 1,
          ownership: 2,
          fighterPoints: 2,
        },
      ),
    ),
    ambient(
      "rest.tea",
      "休憩室の紅茶",
      "従業員休憩室",
      "rest",
      lines(
        ["ミミ", "この紅茶、今日は普通の味ですね。"],
        ["給湯器", "ありがとうございます。"],
        ["ミミ", "今の誰？"],
      ),
      choices(
        {
          label: "気にせず休む",
          result: "よく休めた。給湯器も満足そうに静かになった。",
          trust: 3,
          ownership: -1,
          sharedPoints: 2,
        },
        {
          label: "給湯器を調べる",
          result: "契約印があった。見なかったことにして布を掛けた。",
          trust: 1,
          ownership: 1,
          fighterPoints: 2,
        },
      ),
    ),
  ],
  search: [
    ambient(
      "search.basement",
      "地下十三階",
      "存在しない地下十三階",
      "search",
      lines(
        ["ミミ", "エレベーター、十二階までしかないはずなんだけど。"],
        ["案内板", "本日は十三階です。"],
        ["ミミ", "曜日みたいに言わないで。"],
      ),
      choices(
        {
          label: "十三階へ行く",
          result: "古い契約片を回収した。帰りは十四階から出た。",
          trust: 3,
          ownership: -3,
          money: -700,
          sharedPoints: 5,
        },
        {
          label: "階段で帰る",
          result: "慎重さは正しかった。階段は屋上につながっていた。",
          trust: 1,
          ownership: 1,
          money: -200,
          fighterPoints: 3,
        },
      ),
    ),
    ambient(
      "search.receipt",
      "百年前の領収書",
      "旧倉庫",
      "search",
      lines(
        ["ミミ", "『世界終焉費・一式』って経費で落ちるの？"],
        ["経理", "但し書きがあれば。"],
        ["ミミ", "そこが問題なんですか？"],
      ),
      choices(
        {
          label: "経理へ提出する",
          result: "監査資料として買い取られた。会社は妙に機嫌がいい。",
          trust: 0,
          ownership: 4,
          money: 2400,
        },
        {
          label: "契約の手掛かりにする",
          result: "紙の裏に、消された所有者名が並んでいた。",
          trust: 4,
          ownership: -2,
          money: -500,
          sharedPoints: 4,
        },
      ),
    ),
  ],
};

export const ambientEvents: Record<WeeklyAction, CharacterScene[]> = {
  work: [...baseAmbientEvents.work, ...extendedAmbientEvents.work].map(
    withChoiceDesign,
  ),
  play: [...baseAmbientEvents.play, ...extendedAmbientEvents.play].map(
    withChoiceDesign,
  ),
  rest: [...baseAmbientEvents.rest, ...extendedAmbientEvents.rest].map(
    withChoiceDesign,
  ),
  search: [...baseAmbientEvents.search, ...extendedAmbientEvents.search].map(
    withChoiceDesign,
  ),
};
