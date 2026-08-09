# 物語ビジュアル全場面監査

最終更新: 2026-08-10

## 結論

現状は不合格。画像ファイルの欠損はないが、本文と異なる場所の背景が正常表示されるため、表示上の矛盾が残る。

## 全件集計（初回監査時点）

> 2026-08-10追加バッチ接続後の再監査: 物語108場面、参照欠損0、未使用一枚絵0、一枚絵なし53場面、立ち絵も一枚絵もない場面49。新規の思い出CG9枚を本文中の決定的瞬間へ接続した。

- 物語ブロック: 107
- 参照先ファイル欠損: 0
- 立ち絵素材を一度も指定しないブロック: 99
- 一枚絵素材を持たないブロック: 61
- 立ち絵も一枚絵も持たないブロック: 57
- 一枚絵指定: 55点、46ブロック
- `bg-arena-reception.png` の流用: 15か所
- `bg-contract-archive-v2.png` の流用: 16か所
- `bg-casino-cafe-night.png` の流用: 16か所
- `bg-observation-deck-night.png` の流用: 15か所
- `bg-employee-entrance.png` の流用: 14か所
- `bg-casino-cafe-rain.png` の流用: 14か所
- `bg-casino-cafe-morning.png` の流用: 13か所

同じ背景を時間差分として使う場合を除き、場所名が違う流用はバグとする。`alt` だけ場所名へ合わせて画像を流用することも禁止する。

## 初回監査で確定した背景表示バグ

> 2026-08-10追記: 下表の専用背景はすべて物語JSONへ接続されたことを再監査で確認した。参照ファイル欠損は0件。実画面確認が終わるまでは「接続済み・表示未検証」とする。

| 場面 | 本文の場所 | 現在の画像 | 採用候補 |
| --- | --- | --- | --- |
| `amara.meet` | 従業員相談室 | 闘技場受付 | `bg-employee-consultation-room-v1.png` |
| `marian.meet` | 救護室 | 闘技場受付 | `bg-infirmary-day-v1.png` |
| `minato.meet` | 遺失物窓口 | 闘技場受付 | `bg-lost-property-counter-v1.png` |
| `night-eater.meet` | 照明管理室 | 闘技場受付 | `bg-lighting-control-room-v1.png` |
| `room-seventeen.meet` | 従業員通路 | 闘技場受付 | `bg-employee-corridor-no-seventeenth-door-v1.png` → `bg-employee-corridor-seventeenth-door-v1.png` |
| `amara.join` / `sazanami.join` | 噴水広場 | 従業員入口 | `bg-fountain-plaza-day-v1.png` |
| `minato.bond` / `peony.bond` | 従業員食堂 | 雨のカジノカフェ | `bg-employee-cafeteria-day-v1.png` |
| `teirei.meet` / `minato.power` | 搬入口 | 闘技場受付／夜の展望台 | `bg-loading-dock-day-v1.png` |
| `marian.power` / `marian.liberation` | 使われない霊安室 | 夜の展望台／夜のカフェ | `bg-unused-mortuary-day-v1.png` |
| `ushiro.epilogue` | 中央アトリウム撮影所 | 朝のカジノカフェ | `bg-central-atrium-photo-studio-day-v1.png` |

## 一枚絵の本文一致バグ

> 2026-08-10追記: `peony.meet` は本文準拠の修正版 `public/assets/story/events/peony-meet-paper-crown-v2.png` を接続済み。ピオニーの正本どおりの大胆な衣装は維持し、未成年だけを画面外へ外した。残る4件も修正版を制作済みで、物語JSONへの接続と実画面確認待ち。

一枚絵は存在するだけでは合格にしない。表示命令の直前3行と画像内容を比較する。

- `peony.meet`: 修正版を制作・接続済み。実画面確認待ち。
- `teirei.meet`: 修正版 `teirei-meet-standing-v2.png` を制作済み。接続待ち。
- `marian.meet`: 修正版 `marian-meet-fingertip-v2.png` を制作済み。接続待ち。
- `sazanami.meet`: 修正版 `sazanami-meet-single-eye-v2.png` を制作済み。接続待ち。
- `shahar.meet`: 修正版 `shahar-meet-sky-dragon-v2.png` を制作済み。接続待ち。

## 1場面の合格条件

1. `presentation.location` と背景画像の実内容が一致する。
2. 時間、天候、営業状態が本文と一致する。
3. 発話中の主要人物は、立ち絵または直前の一枚絵で誰か判別できる。
4. 表情は本文の感情と一致し、通常顔の固定表示で済ませない。
5. 一枚絵は表示直前の事件を3秒で説明でき、未登場人物や未発生の結果を描かない。
6. ミミ、攻略対象、脇役の顔・衣装・形態は各ビジュアル正本と一致する。
7. 画像の `alt` を書き換えて不一致を隠さない。
8. 画像ファイルを作っただけで完了にせず、JSONの表示命令と実画面まで確認する。

## 「そこまで絵があるのか」を作る配分

各攻略対象7段階に対して、最低でも次を用意する。

- `meet`: 初対面事件の一枚絵
- `join`: その人物固有の職場・生活場所背景
- `bond`: 距離が縮む小さな行動の一枚絵
- `power`: 裏ボス級の規模を見せる一枚絵
- `crisis`: 誤った信念が壊れる一枚絵
- `liberation`: 選択直後ではなく、選び直した瞬間の一枚絵
- `epilogue`: 日常の騒動1点と、人物報酬1点

主要イベントだけでなく、食堂、搬入口、相談室、救護室、照明室、霊安室、撮影所、従業員通路、遺失物窓口など、本文で名前が付く生活場所も専用背景を持たせる。

## 実装順

1. 既に完成している専用背景を対応JSONへ接続する。
2. 立ち絵が存在する人物から `show` / `hide` と表情差分を接続する。
3. 上記5件の本文不一致一枚絵を再制作する。
4. 57件の「立ち絵も一枚絵もない」場面を、本文の見せ場順に解消する。
5. 全107場面について、表示命令直前の本文、背景、人物、表情、一枚絵を自動監査表へ出す。
6. 実画面でPC・スマートフォン双方を確認する。
