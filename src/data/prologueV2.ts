import type {
  DialogueLine,
  SceneDirection,
  SceneSpriteCue,
} from "../game/types";

export interface ProloguePage extends DialogueLine {
  sceneLabel: string;
}

const thought = (text: string, direction?: SceneDirection): DialogueLine => ({
  kind: "thought",
  text,
  direction,
});

const line = (
  speaker: string,
  text: string,
  direction?: SceneDirection,
): DialogueLine => ({ speaker, text, direction });

const nonoWelcome: SceneSpriteCue = {
  asset: "/assets/story/nono-welcome.png",
  alt: "第三闘技場の受付係ノノ",
  position: "right",
  scale: "tall",
};

const scenePages = (
  sceneLabel: string,
  background: string,
  initialSprite: SceneSpriteCue | null,
  lines: DialogueLine[],
): ProloguePage[] =>
  lines.map((entry, index) => ({
    ...entry,
    sceneLabel,
    direction:
      index === 0
        ? {
            background,
            sprite: initialSprite,
            ...entry.direction,
          }
        : entry.direction,
  }));

export const fullProloguePages: ProloguePage[] = [
  ...scenePages(
    "プロローグ　いつものカジノ",
    "/assets/story/bg-casino-dressing-room.png",
    null,
    [
      thought(
        "世界を三度救ったお客様が、ポイントカードをなくして泣いている。",
      ),
      thought(
        "大理石の床へ膝をつき、金色のテーブルの下をのぞく。剣はあった。盾もあった。昨日まで王都の空を覆っていたらしい聖なる翼も、今日はきちんと畳まれている。肝心のカードだけがない。",
      ),
      line("勇者のお客様", "あれがないと、プリンが無料にならないんだ。"),
      line("ミミ", "世界を三つ救ったのに、プリンは有料なんですね。"),
      line("勇者のお客様", "世界には期限がない。ポイントにはある。"),
      thought(
        "深い言葉のようで、たぶん深くない。私は椅子の脚へ引っかかっていたカードを拾った。スタンプは八個。無料プリンまで、あと二個だった。",
      ),
      line(
        "ミミ",
        "ありました。次は首から提げられるケースをご用意しますね。",
      ),
      line("勇者のお客様", "君は命の恩人だ。"),
      thought(
        "本日、四つ目の世界を救った。プリン一個分より少し小さい世界である。",
      ),
      thought(
        "転生して半年。前世の細かいことは、まだところどころ霧の中にある。でも三番テーブルの勇者様が固めのプリンを好むことと、七番テーブルの魔王様がストローを噛む癖だけは覚えた。記憶というものは、ずいぶん生活寄りにできている。",
      ),
      line(
        "店内放送",
        "派遣スタッフ、ミミさん。従業員カウンターまでお願いします。",
      ),
      thought(
        "嫌な予感はしなかった。こういう時、本当に困るのは嫌な予感が仕事を休んでいる日だ。",
      ),
    ],
  ),
  ...scenePages(
    "臨時派遣　従業員カウンター",
    "/assets/story/bg-employee-entrance.png",
    null,
    [
      line(
        "派遣係",
        "第三コロシアム別館で欠員です。今日から短期で入れますか？",
      ),
      line("ミミ", "闘技場ですか。仕事内容は？"),
      line("派遣係", "給仕、受付補助、倉庫確認。制服は今のままで大丈夫です。"),
      line("ミミ", "戦う仕事は？"),
      line("派遣係", "ありません。"),
      line("ミミ", "戦う人を止める仕事は？"),
      line("派遣係", "ありません。"),
      line("ミミ", "戦う人に壊されたものを数える仕事は？"),
      line("派遣係", "場合によります。"),
      thought(
        "三問目で目をそらした。派遣票を裏返すと、小さな文字で「アットホームな職場です」と書かれている。家の定義が広い。",
        {
          still: "/assets/story/events/prologue-contract.png",
          effect: "pulse",
        },
      ),
      line(
        "派遣係",
        "危険手当と交通費、それから勤務先の食事券がつきます。",
      ),
      thought(
        "食事券の文字だけ、なぜか少し大きく見えた。私は派遣票へ勤務印を押した。今日の仕事は給仕、受付補助、倉庫確認。選手管理とも、大会運営とも書かれていない。",
      ),
    ],
  ),
  ...scenePages(
    "派遣初日　第三コロシアム別館",
    "/assets/story/bg-arena-reception.png",
    nonoWelcome,
    [
      thought(
        "第三コロシアム別館は、家というには天井が高すぎた。見上げると、雲の少し下にシャンデリアがある。たぶん掃除当番は、翼のある人だ。",
      ),
      line(
        "受付係ノノ",
        "派遣のミミさんですね。助かりました。今日は人手が三人と、壁が一枚足りません。",
      ),
      line("ミミ", "壁も欠勤するんですか？"),
      line("受付係ノノ", "昨日の準決勝で。"),
      thought("事情のある欠勤だった。"),
      line(
        "受付係ノノ",
        "今日お願いしたい仕事は三つです。全部ではありません。最初に一つ選んで、終わったら次を相談しましょう。",
      ),
      line(
        "受付係ノノ",
        "給仕なら観客ラウンジ。受付補助なら登録窓口。倉庫確認なら東倉庫です。どの仕事にも給料が出て、出会う人と事件が少しずつ変わります。",
      ),
      line(
        "ミミ",
        "この一日で、闘技場の全部を覚えなくても大丈夫ですか？",
      ),
      line(
        "受付係ノノ",
        "もちろんです。まずは今日、何をするか一つだけ決めてください。",
      ),
      thought(
        "給仕、受付補助、倉庫確認。派遣票と同じ三つが並んでいる。昨日までと違う場所でも、最初の仕事は自分で選べるらしい。",
      ),
      thought(
        "私は予定表を受け取った。オーナーでも、監督でもない。今日はまだ、臨時の派遣バニーだ。",
      ),
    ],
  ),
];

export const condensedProloguePages: ProloguePage[] = [
  ...scenePages(
    "これまでのあらすじ　第三コロシアム別館",
    "/assets/story/bg-arena-reception.png",
    nonoWelcome,
    [
      thought(
        "私は異世界のカジノで働く派遣バニー、ミミ。臨時の給仕、受付補助、倉庫確認を頼まれ、第三コロシアム別館へやって来た。",
      ),
      line(
        "受付係ノノ",
        "この時点では、ミミさんはまだオーナーでも監督でもありません。今日の仕事を一つ選びましょう。",
      ),
      thought(
        "何が起きるかは、選んだ場所へ行ってから。まずは一つ、今日の予定を決めよう。",
      ),
    ],
  ),
];
