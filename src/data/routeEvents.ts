import type { CharacterScene, RunState, WeeklyAction } from "../game/types";
import { withChoiceDesign } from "../game/choiceDesign";

const routeScene = (
  id: string,
  title: string,
  location: string,
  actions: WeeklyAction[],
  lines: CharacterScene["lines"],
  choices: NonNullable<CharacterScene["choices"]>,
): CharacterScene =>
  withChoiceDesign({ id, title, location, actions, lines, choices });

export const routeEvents: Partial<
  Record<RunState["route"], CharacterScene[]>
> = {
  domination: [
    routeScene(
      "route.domination.timesheet",
      "一等星式タイムカード",
      "本社臨時窓口",
      ["work", "rest"],
      [
        {
          kind: "thought",
          text: "本社臨時窓口の時計は、針が十二本あった。どれが休憩時間を示すのか尋ねたら、受付の人は申し訳なさそうに目を伏せた。",
        },
        { speaker: "査定官", text: "休憩は勤務の中断です。中断時間も査定します。" },
        { speaker: "ミミ", text: "休んだ記録を作るために働かされている。" },
        {
          speaker: "査定官",
          text: "正確には、休んだ事実を勤務実績へ換算するための事前勤務です。",
        },
        {
          kind: "thought",
          text: "説明されるほど分からなくなる仕組みは、たいてい誰かだけが得をする。選手たちは申請書より先に、私の顔を見ていた。",
        },
      ],
      [
        {
          label: "全員分の休憩を申請する",
          result: "申請書は厚くなったが、選手はきちんと休めた。",
          trust: 4,
          ownership: -2,
          sharedPoints: 1,
          condition: "good",
        },
        {
          label: "査定用の訓練へ切り替える",
          result: "本社評価は上がった。控室の空気は少し固くなった。",
          trust: 0,
          ownership: 4,
          sharedPoints: 4,
        },
      ],
    ),
    routeScene(
      "route.domination.sponsor",
      "勝者だけの試供品",
      "スポンサーラウンジ",
      ["play", "search"],
      [
        {
          kind: "thought",
          text: "スポンサーラウンジには、味見用の小瓶が勝利数の順に並んでいた。いちばん端の空き瓶には『未勝利味』と書いてある。",
        },
        { speaker: "営業担当", text: "勝った選手だけ、お好きな味を選べます。" },
        { speaker: "ミミ", text: "負けた人にも水くらい出してください。" },
        {
          speaker: "営業担当",
          text: "水は公平性に影響しますので、現在は抽選制となっております。",
        },
        {
          kind: "thought",
          text: "振り返ると、選手たちは妙に静かだった。景品の味ではなく、私がどちら側の人間かを見ているらしい。",
        },
      ],
      [
        {
          label: "全員へ同じものを配る",
          result: "スポンサーは困ったが、チーム内の話は早かった。",
          trust: 5,
          ownership: -2,
          money: -500,
        },
        {
          label: "勝者特典として受け取る",
          result: "景品は育成費へ換わった。次の査定基準も一緒に届いた。",
          trust: -1,
          ownership: 4,
          money: 1200,
        },
      ],
    ),
  ],
  chaos: [
    routeScene(
      "route.chaos.wedding",
      "優勝記念式典の前撮り",
      "貸衣装フロア",
      ["work", "play"],
      [
        {
          kind: "thought",
          text: "衣装室へ入った瞬間、十五人の係員が私たちへ花びらを投げた。事情を知らない花びらだけが、たいへん景気よく舞っている。",
        },
        { speaker: "式典係", text: "優勝前ですが、優勝記念写真を撮ります。" },
        { speaker: "ミミ", text: "誰と誰の式典なんですか。" },
        { speaker: "式典係", text: "種別欄が『その他』なので、こちらも分かりません。" },
        {
          kind: "thought",
          text: "用意されていた衣装は鎧、礼服、巨大な貝殻、概念用の白い布。最後の一着だけ説明を避けられた気がする。",
        },
        {
          speaker: "ミミ",
          text: "分からない式典なら、せめて本人たちに着たいものを聞きましょう。",
        },
      ],
      [
        {
          label: "全員を好きな衣装で並べる",
          result: "裏ボス一同の前撮りは、地域情報誌の表紙になった。",
          trust: 6,
          ownership: -3,
          money: 600,
        },
        {
          label: "大会用の宣材写真にする",
          result: "用途はまともになったが、背景だけは巨大な婚姻届だった。",
          trust: 1,
          ownership: 3,
          money: 1500,
        },
      ],
    ),
    routeScene(
      "route.chaos.inventory",
      "世界終末棚卸し",
      "カジノ倉庫",
      ["rest", "search"],
      [
        {
          kind: "thought",
          text: "倉庫の最下段に、夕焼けほど大きな木箱が押し込まれていた。伝票の品名は『世界・使用済み』。返品期限だけが明日になっている。",
        },
        { speaker: "倉庫番", text: "滅んだ世界の在庫が、一箱だけ合いません。" },
        { speaker: "ミミ", text: "世界を個数で数えないでください。" },
        { speaker: "倉庫番", text: "では返品理由は『サイズ違い』で。" },
        {
          kind: "thought",
          text: "箱へ耳を当てると、遠くの波音と、誰かが夕飯を呼ぶ声がした。棚卸し表の一行にするには、少し生活が多すぎる。",
        },
        {
          speaker: "ミミ",
          text: "登録する前に、これを待っている人がいないか調べます。",
        },
      ],
      [
        {
          label: "箱を開けず持ち主を探す",
          result: "持ち主は見つからなかったが、箱の中から拍手だけ聞こえた。",
          trust: 4,
          ownership: -2,
          fighterPoints: 3,
        },
        {
          label: "備品として登録する",
          result: "共有備品『世界ひとつ』が育成台帳へ追加された。",
          trust: 0,
          ownership: 4,
          sharedPoints: 6,
        },
      ],
    ),
    routeScene(
      "route.chaos.audit",
      "存在しない支店の歓迎会",
      "第零営業所",
      ["work", "play", "rest", "search"],
      [
        {
          kind: "thought",
          text: "案内板にない階で扉が開いた。紙飾りは新品なのに、床の埃には何年分もの靴跡が重なっている。",
        },
        { speaker: "幹事", text: "本日は着任おめでとうございます。" },
        { speaker: "ミミ", text: "この支店、案内図にありませんよね？" },
        { speaker: "幹事", text: "閉店したので、今日から新規開店です。" },
        {
          kind: "thought",
          text: "長机には人数ぴったりの弁当と、私の名前入りの辞令が置かれていた。日付は転生する三日前だった。",
        },
        {
          speaker: "幹事",
          text: "退職届もご用意しています。提出先は、こちらが再び存在した際にご案内します。",
        },
      ],
      [
        {
          label: "歓迎されてから帰る",
          result: "乾杯の直後に店は消えた。手元には全員分の弁当券が残った。",
          trust: 5,
          ownership: -1,
          money: 900,
        },
        {
          label: "店長印だけ借りる",
          result: "存在しない支店の印鑑は、なぜか本社ですべて通った。",
          trust: -1,
          ownership: 5,
          sharedPoints: 5,
        },
      ],
    ),
  ],
};
