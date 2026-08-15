# イベントCG生成台帳

紙芝居型ノベル演出のための「キャラがいる場面絵」を ChatGPT(チャット)で生成する台帳。
Chrome 自動運転で1件ずつ送信し、生成画像を `public/assets/story/events/` へ保存する。

- 命名: 既存の流儀に従い `<キャラ>-<段階>.png`(例: `teirei-liberation.png`)。祭り前夜は `<キャラ>-eve.png`。
- 既存4枚(`shahar-power` `amara-crisis` `minato-power` `teirei-crisis`)は生成対象外。
- 各リクエストは「共通指示文 + 添付2枚(キャラ公式絵・絵柄見本) + 個別プロンプト」で構成する。
- 生成後の採否は人が目視で決める。キャラの同一性が崩れた絵は再生成する。

## 共通指示文(毎回冒頭に貼る)

> ノベルゲームのイベントCG。アニメ調イラスト、16:9横長。舞台は南国の海辺に建つ白亜の高級カジノ兼闘技場。白大理石と金装飾、ティールグリーンとコーラルピンクの配色を基調に、場面ごとの光を優先する。
> 添付1枚目が登場キャラクターの公式デザイン。顔立ち・髪・瞳の色・服装を厳密に維持する。添付2枚目はこの世界の絵柄見本で、塗りと色調を合わせる。
> 構図は一人称視点(主人公ミミの目線)。キャラクターがこちらを見る、またはすぐ近くにいる乙女ゲームの文法で描く。ミミ本人は映さないか、画面手前に手や白い兎耳の端だけを入れる。
> 画面内に文字・ロゴ・看板の文字を描かない。露出は増やさず、色気は距離・視線・仕草・光で表現する。

## 第1陣(20枚)

**進捗(2026-08-15)**: #1〜#10 生成済み。scratchpadに保存名どおり格納、採否確認待ち。
`public/assets/story/events/` への配置と物語JSONへの組み込みは採用確定後。
生成手順はスキル `chatgpt-image-gen`(~/.claude/skills)として登記済み。

| # | 保存名 | 出典 | 場所 | 添付(キャラ / 絵柄見本) | 個別プロンプト |
|---|---|---|---|---|---|
| 1 | gidonozeaas-eve | main.s1.eve.gidonozeaas | 前夜祭の夜店通り | gidono-sealed-neutral.png / bg-casino-cafe-night.png | 提灯の連なる祭りの夜店通りの帰り道、人気のない角。魔王が食べかけのミニパフェを片手に立ち止まり、真顔でまっすぐこちらを見る。「見ていてくれるか」と問う直前の目。提灯の暖色光が横顔に落ち、背景の祭りの光はぼかす。 |
| 2 | minato-eve | main.s1.eve.minato | 前夜祭の夜店通り | encounters/minato.png / bg-casino-cafe-night.png | 祭りの終わり、火の消えた提灯が並ぶ橋の上。元勇者が欄干に寄りかかり、遠くを見ていた目をこちらへ向けた瞬間。穏やかで少し寂しい微笑。消えかけの提灯と月光の二重の光。 |
| 3 | peony-eve | main.s1.eve.peony | 前夜祭の夜店通り | encounters/peony.png / bg-casino-cafe-night.png | 夜店の型抜き台。怪力の少女が息を止め、大きな手の指先だけで小さな針を動かす。人垣が固唾を呑んで見守る。屋台のランプが彼女の真剣な伏し目を照らし、成功の一瞬手前の緊張。 |
| 4 | teirei-eve | main.s1.eve.teirei | 前夜祭の夜店通り | encounters/teirei.png / bg-casino-cafe-night.png | 灯りの少ない祭りの帰り道。機械の少女が綿あめを両手で持ったまま立ち止まり、こちらを見上げて「見ていて、と言ってほしい」と告げる。胸の琥珀灯がわずかに明るく、遠くの祭りの光が背景でにじむ。 |
| 5 | ushiro-eve | main.s1.eve.ushiro | 前夜祭の夜店通り | encounters/ushiro.png / bg-casino-cafe-night.png | 花火の上がる夜店通り。彼は画面のすぐ真後ろ気配だけ、地面に二人分の影が並ぶ。画面手前にミミの白い兎耳の端。夜空に小さな花火、提灯の列。影が主役の構図。 |
| 6 | teirei-liberation | teirei.liberation | 廃棄物保管区 | encounters/teirei.png / bg-contract-archive-v2.png | 琥珀灯が明滅する薄暗い保管区。機械の少女が契約書を胸に抱え、まっすぐこちらを見て自己命令を読み上げる。「ミミの隣にいる」。凛とした表情に、かすかな微笑み。琥珀色の光と深い影。 |
| 7 | teirei-power | teirei.power | 廃棄物保管区 | encounters/teirei.png / bg-contract-archive-v2.png | 深夜の保管区、無数の赤いレーザー照準が空間を走る。その中で一本だけが、画面手前(ミミの足元)を丸くやわらかく囲う。彼女は照準の向こうでこちらを見つめる。赤い光と琥珀灯のコントラスト。 |
| 8 | rinne-power | rinne.power | 閉店後のルーレット | encounters/rinne.png / bg-casino-cafe-night.png | 閉店後の無人カジノ。投げたコインが細い縁で床に立っている。占い師の青年がルーレット台に頬杖をつき、コインとこちらを交互に見て、作り物でない笑顔で笑い出す瞬間。台上のランプだけの光。 |
| 9 | rinne-liberation | rinne.liberation | 閉店後のルーレット | encounters/rinne.png / bg-casino-cafe-night.png | 閉店後のルーレット台。彼が頬杖をついて、答えを見ないままこちらの言葉を待っている。未来視を使わない無防備な目、わずかに上気した頬。緑のフェルトとランプの暖色。距離が近い。 |
| 10 | wolf-nine-liberation | wolf-nine.liberation | 無人の決闘場 | encounters/wolf-nine.png / bg-observation-deck-night.png | 夜の無人決闘場、九本の白い旗の下。狼の剣士が封蝋つきの挑戦状をこちらへ差し出す。照れを隠す不敵な笑み、目は真剣。画面手前にそれを受け取るミミの手。月光と旗の白。 |
| 11 | wolf-nine-power | wolf-nine.power | 無人の決闘場 | encounters/wolf-nine.png / bg-observation-deck-night.png | 夜風に九本目の真っ白な旗が揺れる決闘場。八つの型を披露し終えた彼が肩で息をしながら、「困る」と言いながら少しも困っていない顔でこちらを見る。汗と月光、上気した表情。 |
| 12 | cassim-bell-power | cassim-bell.power | 存在しない地下階 | encounters/cassim-bell.png / bg-employee-corridor-seventeenth-door-v1.png | 台帳に載らない地下廊下、失われた七つの扉。黒手袋の受付青年が画面手前のミミの手をしっかり握り、振り向いてこちらを見る。「手を離すと昨日の廊下に出る」。一番古い扉の隙間から夕暮れの光。 |
| 13 | cassim-bell-liberation | cassim-bell.liberation | 存在しない地下階 | encounters/cassim-bell.png / bg-employee-corridor-seventeenth-door-v1.png | 夜の廊下、照明が二人分の歩幅に合わせて先へ先へ灯っていく。彼が鍵飾りの七本目に合鍵を収め、こちらへ半歩近づいて「これから、あなたと」と告げる。柔らかな廊下灯、近い距離。 |
| 14 | ushiro-liberation | ushiro.liberation | 鏡のない部屋 | encounters/ushiro.png / bg-contract-archive-v2.png | 鏡のない静かな部屋。いつも背後にいた彼が、三秒だけ正面に立ち、初めてまっすぐ目が合う。緊張で少し強張った、それでも逸らさない目。仄暗い部屋に一筋の柔らかい光が二人の間へ。 |
| 15 | sazanami-power | sazanami.power | 地下貯水槽 | encounters/sazanami.png / bg-observation-deck-night.png | 水でできた透明なドームの内側、水中の光の柱が揺れる小部屋。海の化身が至近距離でこちらの胸元へ耳を澄ませ、泡の声で「速い」と囁く瞬間。青い光が肌に揺らめく、密室の近さ。露出は増やさない。 |
| 16 | peony-liberation | peony.liberation | 旧城壁展示区 | encounters/peony.png / bg-fountain-plaza-day-v1.png(絵柄参考のみ・夜に変更) | 夜の旧城壁跡。怪力の少女が両腕を掲げ、夜空に二人だけのドームを作る。月明かりだけが隙間から差し込み、見上げる彼女の横顔が近い。守られている静かな五分間。 |
| 17 | marian-bond | marian.bond | 礼拝スペース | encounters/marian.png / bg-infirmary-day-v1.png | 雨音の礼拝スペース、ステンドグラス越しの鈍い光。聖女が擦り傷に触れそうな手を膝の上で握り込み、治す代わりにまっすぐこちらの顔を見つめる。至近距離の視線、頬の赤み。雨の午後の静けさ。 |
| 18 | night-eater-crisis | night-eater.crisis | 無人の客席 | encounters/night-eater.png / bg-observation-deck-night.png | 真っ暗な無人会場、本物の星空のような闇。外套の内側にそっと引き込まれた構図——画面の縁が外套の裏地、その向こうに満天の星。彼女の顔がすぐ近くで、震える声で囁く。「今夜いちばんの味だった」。 |
| 19 | shahar-liberation | shahar.liberation | 屋上庭園・夜 | encounters/shahar.png / bg-arena-rooftop-sunset-v1.png(夜に変更) | 夜の屋上庭園。竜の少女が、鱗を編んだ小さな髪飾りを画面手前のミミの髪(白い兎耳のそば)へ留める。指先が触れる距離、月光が鱗飾りに小さく反射。伏せた睫毛と真剣な口元。 |
| 20 | mumyo-liberation | mumyo.liberation | 所有者名簿室 | encounters/mumyo.png / bg-contract-archive-v2.png | 夜の書庫の最奥。誰も触れていないペンがひとりでに浮かび、名簿の最後のページに「私」の文字が刻まれていく。鏡面の刀身にだけ映る人影がこちらを見ている。燭光と埃の光、静かな奇跡。 |

## 第2陣候補(抜粋・プロンプトは第1陣消化後に起草)

- ushiro-power(127人の中から本体を当てる)/ room-seventeen-power(四百年の最下層)/ room-seventeen-liberation(ノックで開く扉)
- rinne-bond(夜市の兎のぬいぐるみ)/ rinne-crisis(本物の笑い)
- sazanami-crisis(指輪の返却会)/ sazanami-liberation(手を振る水面)
- cassim-bell-bond(雨の倉庫街のお茶会)/ cassim-bell-epilogue(非公開の一分)
- wolf-nine-bond(雨の朝食会)/ peony-crisis(解体式典)/ peony-power(受け止める瞬間)
- marian-join(脈を測る三本の指)/ teirei-bond(60.0度の紅茶)
- night-eater-power(闇の中の呼吸)/ shahar-crisis(雲が目線まで下りる)/ shahar-power は既存
- mumyo-crisis(一滴を拾う)/ mumyo-power(十四の幻影)
- amara-bond(停電の月明かり)/ 温泉回(main.s1.w05 ほか、旅館内背景の再検討が必要)
- gidonozeaas 各段階(公式絵は gidono-sealed / unsealed の表情差分を使い分け)

## 運用メモ

- ChatGPT の生成ペースはおよそ1〜2分/枚。制限を踏まえ1セッション10枚前後で区切る。
- 生成画像はいったん `scratchpad` に落とし、目視で採否 → 採用分のみ `public/assets/story/events/` へ。
- 物語JSONへの組み込み(assets登録と background/still ノード追加)は画像の採用確定後に別作業として行う。
