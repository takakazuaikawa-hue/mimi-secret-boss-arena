import type { CharacterScene } from "../game/types";

export const ownershipTransferScene: CharacterScene = {
  id: "opening.owner-transfer",
  title: "返却手続きは、返却だけでは終わらない",
  location: "第三コロシアム別館・登録窓口",
  actions: ["work", "play", "rest", "search"],
  background: "/assets/story/bg-arena-reception.png",
  sprite: {
    asset: "/assets/story/nono-apologetic.png",
    alt: "登録盤を確認する受付係ノノ",
    position: "right",
    scale: "tall",
  },
  lines: [
    {
      kind: "thought",
      text: "閉館前、私はマダムを登録窓口へ案内した。今日の仕事はよく働いたと思う。飲み物を運び、道を案内し、海を設備担当へ渡した。あとは勤務確認へ印をもらえば終わる。",
    },
    {
      speaker: "受付係ノノ",
      text: "権利返却ですね。では、返却審査中の現場代理人をお願いします。",
    },
    {
      speaker: "マダム",
      text: "今日、現場にいる責任者の方でよろしいの？",
    },
    {
      speaker: "受付係ノノ",
      text: "はい。現場を確認できる方です。",
    },
    {
      speaker: "マダム",
      text: "ではミミさん、お願いできる？",
    },
    {
      speaker: "ミミ",
      text: "勤務確認ですね。",
    },
    {
      kind: "thought",
      text: "三人とも、同じ話をしている顔だった。魔法盤の欄には「現場代理人」。派遣票には「本日の現場責任者」。双子なら、せめて別々の服を着てほしいくらい似ている。",
    },
    {
      speaker: "ミミ",
      text: "今日ここで働いたことを確認すればいいんですね？",
    },
    {
      speaker: "受付係ノノ",
      text: "はい。こちらへ社員証を。",
    },
    {
      kind: "thought",
      text: "社員証を置く。盤面が青く光り、「返却手続き」の文字が消えた。代わりに、私の名前が出た。",
      beat: "revelation",
      direction: {
        effect: "flash",
        still: "/assets/story/events/prologue-contract.png",
      },
    },
    {
      kind: "thought",
      text: "暫定オーナー　ミミ。",
    },
    {
      speaker: "ミミ",
      text: "私の勤務確認、ずいぶん偉くなっていませんか？",
    },
    {
      speaker: "マダム",
      text: "まあ。",
    },
    {
      speaker: "受付係ノノ",
      text: "少々お待ちください。返却審査中の代理人が、暫定オーナーとして登録されています。",
    },
    {
      kind: "thought",
      text: "ノノさんは魔法盤を見た。マダムは私を見た。私は社員証を見た。社員証は何も悪くない顔をしていた。",
    },
    {
      speaker: "マダム",
      text: "すぐ戻してちょうだい。この方は今日、働きに来ただけなのよ。",
    },
    {
      speaker: "受付係ノノ",
      text: "訂正申請を出します。ただ、今夜の締め処理が終わるまで権利盤へ触れません。",
    },
    {
      speaker: "マダム",
      text: "本当にごめんなさい。せめてお詫びに、お茶とコロシアム銘菓を届けさせて。",
    },
    {
      kind: "thought",
      text: "手渡された箱には『八つ裂き大福』と書いてあった。割れ目から真っ赤ないちご蜜が垂れている。謝罪の品としては事件性が高い。",
      beat: "comic",
    },
    {
      speaker: "ミミ",
      text: "ありがとうございます。味は平和なんですね？",
    },
    {
      speaker: "マダム",
      text: "評判はとてもいいのよ。見た目以外は。",
    },
    {
      kind: "thought",
      text: "派遣初日の帰り際に、三日分ほどの闘技場を持たされた。私とマダムとノノさんの勘違いが、きれいな三角形になっている。真ん中には、私の名前と、血のようないちご蜜があった。",
      beat: "comic",
    },
  ],
  choices: [
    {
      label: "今すぐ訂正できる方法をノノへ聞く",
      result:
        "訂正申請はすぐ作ってもらえた。ただし処理には数日かかる。その間に使える権利は、問題が起きるたび一つずつ確認することになった。",
      trust: 0,
      ownership: 0,
      tone: "pragmatic",
      intent: "まず正規の訂正手続きを確認する",
      promise: "名義訂正を進めながら、必要な権利だけを一つずつ知る。",
      memory: "最初に制度へ確認を求めたことが、後の問い合わせ方へ残る。",
    },
    {
      label: "マダムが何を返そうとしたのか聞く",
      result:
        "マダムは饗会の宝くじで当てた権利を、会社へ返すだけのつもりだった。押しつける意図がなかったことを、本人の言葉で確かめた。",
      trust: 0,
      ownership: 0,
      tone: "tender",
      intent: "前オーナーの意図を確かめる",
      promise: "誰かを責める前に、三人の理解がどこでずれたかを知る。",
      memory: "マダムの善意を先に確かめたことが、翌日のお詫びへつながる。",
    },
    {
      label: "三人で「現場代理人」の欄を読み直す",
      result:
        "三人がそれぞれ別の意味だと思っていたことだけは、完全に一致した。分かりやすい説明へ直すよう、訂正申請と一緒に要望を出した。",
      trust: 0,
      ownership: 0,
      tone: "comic",
      intent: "誤登録の原因を三人で確かめる",
      promise: "誰か一人の不注意にせず、紛らわしい手続きそのものを記録する。",
      memory: "三人で同じ欄を読み直した時間が、最初の共同作業として残る。",
    },
  ],
};

export const hotSpringTripScene: CharacterScene = {
  id: "opening.hot-spring-trip",
  title: "最上級チーム、湯けむりでは新人",
  location: "アルデバラン湯けむり温泉・玄関",
  actions: ["work", "play", "rest", "search"],
  background: "/assets/story/bg-hot-spring-ryokan.png",
  sprite: null,
  lines: [
    {
      kind: "thought",
      text: "新人向け大会で三連勝した翌週、私たちは温泉宿の玄関に立っていた。賞品の旅行券は本物だった。チームランクが最上級になったことより、朝食ビュッフェが本当に付いていることの方が、まだ信じやすい。",
    },
    {
      speaker: "ミミ",
      text: "今日は戦いません。封印も解きません。お風呂に入って、ごはんを食べて、普通に寝ます。",
    },
    {
      kind: "thought",
      text: "仲間たちは静かにうなずいた。宿の屋根から、なぜか警報用の鳥が三羽飛び立った。",
      beat: "comic",
    },
    {
      speaker: "宿の女将",
      text: "最上級チームの皆さまですね。大浴場の結界は三重にしてございます。",
    },
    {
      speaker: "ミミ",
      text: "普通のお客様向けの案内からお願いします。",
    },
    {
      kind: "thought",
      text: "女将は少し考え、それから浴衣の棚を示した。ようやく旅行らしい説明が始まる。私は胸をなで下ろした。棚のいちばん奥には『翼六枚用』と『霧状生命用』が並んでいた。",
    },
  ],
  choices: [
    {
      label: "まず全員の浴衣を選ぶ",
      result:
        "角、翼、触手、霧。それぞれの事情に合う浴衣を選ぶだけで一時間かかった。写真に収まった姿は妙に晴れやかで、旅行へ来た実感がやっと追いついた。",
      trust: 3,
      ownership: 0,
      tone: "tender",
      intent: "全員がくつろげる準備から始める",
      promise: "強さではなく、その人に合うものを一緒に選ぶ。",
      memory: "最上級チームが浴衣の寸法で悩んだ午後。",
    },
    {
      label: "朝食ビュッフェの下見へ走る",
      result:
        "夕食前なのに会場まで確認し、焼き魚と温泉卵の配置を把握した。世界を滅ぼせる仲間たちが、翌朝の席順だけは真剣に相談している。",
      trust: 2,
      ownership: 0,
      tone: "comic",
      intent: "参加理由だった朝食を最優先する",
      promise: "楽しみにしていたものを、遠慮せず楽しむ。",
      memory: "戦術会議より白熱した、朝食ビュッフェ攻略会議。",
    },
    {
      label: "誰も壊さない温泉の入り方を相談する",
      result:
        "入浴前の確認会は慎重だったが、最後には全員で笑った。壊さないための相談を本人たちとできることが、命令よりずっと頼もしく思えた。",
      trust: 4,
      ownership: 0,
      tone: "pragmatic",
      intent: "宿と仲間の安全を一緒に考える",
      promise: "禁止する前に、どうすれば楽しめるかを話し合う。",
      memory: "湯けむりの前で交わした、最初の生活上の作戦会議。",
    },
  ],
};
