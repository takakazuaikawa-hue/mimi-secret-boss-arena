# ノベルイベント・データ再設計指針

作成日: 2026-07-31

## 1. 目的

本書は、物語を追加するほど進行条件が分からなくなる現状を改め、
テキスト、画像、選択肢、フラグ、週進行を一貫した単位で管理するための
基準を定める。

本作の物語データの基本単位は、単なる台詞配列ではなく
**出現条件と結果を持つイベントブロック**とする。

イベントブロックは次の問いへ単独で答えられなければならない。

1. これは何のイベントか
2. いつ、どの行動で、どの状態なら候補になるか
3. 何度まで、どのくらいの優先度で出るか
4. 誰と、どの背景・立ち絵・一枚絵を使うか
5. どの順番で文章と演出を再生するか
6. 選択によって何が変わるか
7. 次に何が起こり得るようになるか
8. セーブ、回想、周回引き継ぎで何を記録するか

## 2. 調査した方式

### 2.1 Ren'Py

Ren'Pyは名前付きの`label`を物語の移動・呼び出し単位とし、
`scene`、`show`、`hide`で画像レイヤーを明示的に操作する。
変数はセーブとロールバックの対象になり、`default`によって
既存セーブへ追加した変数の初期値も扱える。

参考:

- [Labels & Control Flow](https://www.renpy.org/doc/html/label.html)
- [Displaying Images](https://www.renpy.org/doc/html/displaying_images.html)
- [Python Statements and default](https://www.renpy.org/doc/html/python.html)

得るべき点:

- 名前付きブロックを遷移先にする
- 画像を文章の付属物ではなくレイヤー命令として扱う
- 保存データのバージョン更新を最初から設計する

### 2.2 ink / inkjs

inkは`knot`を基本ブロック、`stitch`をその内部区画として扱う。
ブロックの訪問回数が自動的に状態となり、条件式から参照できる。
未接続の終端や意図不明な終了はコンパイラ警告になる。

JavaScript移植のinkjsはブラウザとNode.jsで動作し、TypeScript型、
コンパイラ、物語状態のJSON保存を提供する。

参考:

- [Writing with ink](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md)
- [Running Your Ink](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md)
- [inkjs](https://github.com/y-lohse/inkjs)

得るべき点:

- イベントIDと既読回数を別々の手作業フラグにしない
- 選択肢は一意なIDと遷移先を持つ
- 未到達、行き止まり、終端漏れを機械検査する
- 乱数シードを固定して物語経路を再現する

### 2.3 Yarn Spinner

Yarn Spinnerは台詞の`node`、型付き変数、ゲーム側から交換可能な
Variable Storageを分離する。StoryletsとSaliencyでは、条件を満たす
短い物語ブロック群から、その時点で適切なものを選択できる。

参考:

- [Variable Storage](https://docs.yarnspinner.dev/components/variable-storage/variable-storage)
- [Storylets and Saliency](https://docs.yarnspinner.dev/yarn-spinner-for-unity/samples/storylets-and-saliency/basics-storylets-and-saliency)
- [Saliency](https://docs.yarnspinner.dev/write-yarn-scripts/advanced-scripting/saliency)

得るべき点:

- 物語変数の正本を一か所にする
- イベント候補を条件、優先度、重みで選ぶ
- 「第3段階だからこの配列」という固定順だけに依存しない
- 候補にならなかった理由をデバッグ表示できるようにする

### 2.4 Naninovel

Naninovelはシナリオ内のラベル、条件付きコマンド、選択肢、遷移を
Story Graphで可視化する。条件付き遷移は通常の遷移と異なる線で表示され、
シナリオファイルやラベルの改名時には参照先も更新される。

参考:

- [Story Editor](https://naninovel.com/guide/editor)
- [Choices](https://naninovel.com/guide/choices)
- [Commands](https://pre.naninovel.com/api/)
- [Custom Variables](https://naninovel.com/guide/custom-variables.html)

得るべき点:

- テキスト編集と物語グラフ確認を両立する
- 条件付き遷移を目視できるようにする
- 画像・音・変数変更を同じシナリオ命令列として確認する

### 2.5 TyranoScript

TyranoScriptはラベルとジャンプで分岐を作り、背景、前景、メッセージを
別レイヤーで管理する。シナリオが長くなった場合はファイルを分割し、
共通ラベルへ合流させる方式を公式チュートリアルで示している。

参考:

- [選択肢・分岐](https://tyranoscript.com/usage/tutorial/link)
- [レイヤーの基本](https://tyranoscript.com/usage/tech/layer)
- [タグリファレンス](https://tyranoscript.com/tag/)

得るべき点:

- 背景、立ち絵、メッセージの責務を混ぜない
- 長い物語を一ファイルへ集約しない
- 分岐後にどこへ合流するかを明示する

## 3. 現状監査

### 3.1 現在できていること

現行実装には、再設計へ活かせる土台がある。

- `CharacterScene.id`による場面ID
- `DialogueLine`による台詞、心情、演出方向
- `SceneChoice`による選択結果と数値変化
- 周回シードによる再現可能な乱数
- `eventHistory`による既読判定
- Zodによる基本的なコンテンツ検証
- fast-checkとVitestによる多数周回の検査
- XStateによる画面遷移
- Zustand persistによる保存

したがって、ゲームエンジンを捨てる必要はない。

### 3.2 根本的な問題

#### 場面と出現規則が分離している

`CharacterScene`が持つのはID、題名、場所、対応行動、文章、画像、
選択肢だけである。週、前提イベント、必要フラグ、禁止条件、優先度、
重み、再出現規則、次イベントを持たない。

そのため、出現ロジックが`engine.ts`の長い`if`列へ分散している。
文章を追加するだけでは進行せず、特殊イベントごとにエンジン修正が必要になる。
これは`ARCHITECTURE.md`の「文章追加で進行ロジックを変更しない」という
既存方針にも反している。

#### ID文字列の形から意味を推測している

現在は`scene.id.split(".").at(-1)`で`meet`、`join`、`bond`などを推測し、
その文字列に応じて加入、進行段階、解放を処理する。

IDは識別子であり、ゲーム効果を暗黙に兼ねるべきではない。
改名がゲーム挙動の変更になり、独立したイベントを追加しにくい。

#### 選択肢を配列位置で記憶している

選択結果は`choice:event-id:0`のように配列インデックスで保存される。
後から選択肢を並べ替えると、既存セーブが別の選択をした扱いになる。

選択肢には永続的な`choiceId`が必要である。

#### フラグが無登録の文字列配列である

`flags: string[]`は、タイプミス、重複、廃止済みフラグ、
run限定かprofile永続かの混同を検知できない。
人物の加入状態や週など、既に構造化されている情報まで文字列フラグへ
複製すると、正本が二つになる。

#### 既読履歴の情報量が足りない

`eventHistory: string[]`では、回数、最後に見た週、選んだ選択肢、
どのルートで見たか、クールダウン終了週を表現できない。
同じIDが複数回入る可能性もある。

#### 保存中イベントへ本文全体を入れている

`RunState.currentEvent`は`WeeklyEvent`を通じて`CharacterScene`全体を保持する。
本文と画像指定を保存データへ複製するため、文章修正後も古い本文が
セーブ内に残り得る。保存すべきなのは`eventId`、`nodeId`、選択待ち状態など、
再開に必要な参照だけである。

#### テキストに安定した行IDがない

台詞は配列位置でしか識別できない。文章挿入で位置が変わり、
既読スキップ、翻訳、音声、校正コメント、途中再開との対応が不安定になる。

#### 作者向け情報とプレイヤー向け文章が混在している

`cue`は作者・演出確認向けの情報に近いが、表示側で本文のように見えると
「赤い説明文」のような問題になる。
作者注釈は本番表示データから分離し、表示するなら通常の地の文として
明示的に執筆する。

#### 画像が生のパスで散在している

背景や立ち絵が`"/assets/..."`という文字列で各行・各場面へ直接書かれている。
存在しない画像、用途違いの画像、縦横比、焦点位置、代替テキスト、
先読み方針を一括検査できない。

#### 文章を配列位置で後加工している

`characterStoryExpansions.ts`は既存の`lines`を先頭、末尾、
中央に分解して文章を差し込む。原文の行数や順番が変わると、
意図しない位置へ文章が入る。

共通導入、人物本編、選択後反応は、位置推測ではなく
明示されたブロックIDまたはアンカーで接続すべきである。

#### 検証対象が不完全である

現在のZod検証は選手場面とambientイベントを主に確認するが、
次は検査していない。

- opening、route、prologueを含む全イベントの同一スキーマ適合
- 未登録フラグ
- 未登録画像と用途不一致
- 未到達イベント
- 終端のない分岐
- 存在しない遷移先
- 全条件を満たしても一度も候補にならないイベント
- 各週・各行動で候補がゼロになる状態

## 4. 採用する基本モデル

本作には、固定ラベル型だけでなく
**storylet型イベントブロック + 明示的な連鎖**を採用する。

- 固定導入、大会、温泉、解放: 明示的な連鎖または予約イベント
- 人物イベント: 前段階と関係値を条件にしたstorylet
- ミミの共通物語: 週範囲と物語フラグを条件にしたstorylet
- 日常イベント: 行動、既読、クールダウンによるstorylet
- 奇抜ルート事件: ルート、直前選択、確率によるstorylet

毎週の選出順は次の通りとする。

1. その週に予約された必須イベント
2. 直前イベントが予約した追跡イベント
3. 大会・解放など期限付きイベント
4. ミミの共通物語
5. 注目人物の人物物語
6. 他人物の人物物語
7. ルート固有事件
8. 日常・仕事イベント

同じ階層内では、条件を満たす候補からpriorityとweightで選ぶ。
乱数は現行の周回シードを使い、同じ状態なら同じ候補を選ぶ。

## 5. イベントブロック仕様

以下は概念仕様である。実装時はZodを正本としてTypeScript型を生成する。

```ts
interface NarrativeEventBlock {
  schemaVersion: 1;
  id: EventId;
  kind:
    | "opening"
    | "common"
    | "character"
    | "ambient"
    | "route"
    | "match"
    | "liberation"
    | "ending";
  title: string;
  summary: string;
  ownership: {
    arcId: string;
    characterId?: CharacterId;
    stage?: string;
  };
  trigger: EventTrigger;
  presentation: EventPresentation;
  nodes: NarrativeNode[];
  exits: EventExit[];
  debug: {
    authorNote?: string;
    sourceDocument?: string;
    status: "draft" | "review" | "approved";
  };
}
```

### 5.1 出現条件

```ts
interface EventTrigger {
  actions?: WeeklyAction[];
  routes?: RouteId[];
  week?: {
    exact?: number[];
    min?: number;
    max?: number;
  };
  when: ConditionTree;
  repeat: {
    mode: "once-per-run" | "once-per-profile" | "repeatable" | "cooldown";
    maxCount?: number;
    cooldownWeeks?: number;
  };
  priority: number;
  weight: number;
}
```

条件をJavaScript文字列で書かない。次のような型付きの条件木を使う。

```ts
type ConditionTree =
  | { op: "all"; terms: ConditionTree[] }
  | { op: "any"; terms: ConditionTree[] }
  | { op: "not"; term: ConditionTree }
  | { op: "flag"; id: FlagId; equals: FlagValue }
  | { op: "visited"; eventId: EventId; comparison: Comparison; count: number }
  | { op: "fact"; path: FactPath; comparison: Comparison; value: unknown };
```

`FactPath`は自由文字列にせず、次のような登録済み項目に限定する。

- `run.week`
- `run.route`
- `run.wins`
- `run.losses`
- `run.money`
- `run.ownershipStage`
- `fighter.{id}.encountered`
- `fighter.{id}.recruited`
- `fighter.{id}.liberated`
- `fighter.{id}.trust`
- `fighter.{id}.storyStage`

人物加入など、既に構造化された状態はフラグへ複製しない。

### 5.2 本文と演出

```ts
type NarrativeNode =
  | DialogueNode
  | DirectionNode
  | ChoiceNode
  | BranchNode
  | JumpNode
  | EffectNode
  | EndNode;

interface DialogueNode {
  type: "line";
  id: LineId;
  speakerId: CharacterId | "mimi" | "narrator";
  mode: "dialogue" | "thought" | "narration";
  text: string;
  emotion?: string;
}

interface DirectionNode {
  type: "direction";
  id: NodeId;
  command:
    | { type: "background"; assetId: AssetId; transition?: TransitionId }
    | { type: "show"; actorId: CharacterId; poseId: PoseId; slot: SpriteSlot }
    | { type: "hide"; actorId: CharacterId }
    | { type: "still"; assetId: AssetId; unlockId?: GalleryId }
    | { type: "effect"; effectId: EffectId }
    | { type: "music"; assetId: AssetId }
    | { type: "sound"; assetId: AssetId };
}
```

作者向け`cue`は`debug.authorNote`または別の注釈ファイルへ移す。
プレイヤーへ伝える必要がある心情は`narration`として本文に書く。

### 5.3 選択肢と効果

```ts
interface ChoiceNode {
  type: "choice";
  id: NodeId;
  prompt?: string;
  choices: NarrativeChoice[];
}

interface NarrativeChoice {
  id: ChoiceId;
  label: string;
  intent?: string;
  when?: ConditionTree;
  effects: NarrativeEffect[];
  goto: NodeId | EventId;
  memory?: string;
}
```

効果は型付きunionにする。

```ts
type NarrativeEffect =
  | { type: "setFlag"; flagId: FlagId; value: FlagValue }
  | { type: "incrementFlag"; flagId: FlagId; amount: number }
  | { type: "relationship"; fighterId: CharacterId; trust?: number; ownership?: number }
  | { type: "money"; amount: number }
  | { type: "sharedPoints"; amount: number }
  | { type: "fighterPoints"; fighterId: CharacterId; amount: number }
  | { type: "encounter"; fighterId: CharacterId }
  | { type: "recruit"; fighterId: CharacterId }
  | { type: "liberate"; fighterId: CharacterId }
  | { type: "schedule"; eventId: EventId; weekOffset?: number }
  | { type: "unlockGallery"; galleryId: GalleryId };
```

加入や解放をイベントIDの末尾から推測してはならない。

### 5.4 終了と次イベント

すべての経路は明示的な終端を持つ。

```ts
interface EventExit {
  id: string;
  when?: ConditionTree;
  effects?: NarrativeEffect[];
  next?: {
    mode: "return-to-week" | "schedule" | "immediate";
    eventId?: EventId;
    weekOffset?: number;
  };
}
```

`immediate`の連鎖は導入や大会後イベントに限定し、
無限循環を検証で禁止する。

## 6. フラグ管理

### 6.1 フラグ登録簿

すべてのフラグを登録する。

```ts
interface FlagDefinition {
  id: FlagId;
  scope: "run" | "profile";
  type: "boolean" | "counter" | "enum" | "string";
  defaultValue: FlagValue;
  description: string;
  owner: "opening" | "common" | CharacterId | RouteId;
  allowedValues?: string[];
  deprecatedAliases?: string[];
}
```

命名規則:

```text
opening.owner_transfer.completed
common.hot_spring.completed
character.gidono.promise
route.chaos.ticket_opened
```

ただし、次はフラグにしない。

- 週
- 資金
- 勝敗数
- 人物の加入、遭遇、解放
- 信頼、所有、育成値
- 現在ルート

これらはRunStateまたはFighterRunStateを正本にする。

### 6.2 物語状態

```ts
interface StoryState {
  flags: Record<FlagId, FlagValue>;
  visits: Record<EventId, {
    count: number;
    firstWeek: number;
    lastWeek: number;
    lastChoiceId?: ChoiceId;
  }>;
  scheduled: Array<{
    eventId: EventId;
    earliestWeek: number;
    expiresWeek?: number;
    sourceEventId?: EventId;
  }>;
  current?: {
    eventId: EventId;
    nodeId: NodeId;
    waitingChoiceId?: NodeId;
  };
}
```

保存データには本文、画像パス、選択肢本文を入れない。
IDから現行コンテンツを引き直す。

## 7. 画像と音の管理

生のパスではなくAsset Registryを参照する。

```ts
interface NarrativeAsset {
  id: AssetId;
  kind: "background" | "sprite" | "still" | "ui" | "music" | "sound";
  path: string;
  alt: string;
  width?: number;
  height?: number;
  focusX?: number;
  focusY?: number;
  preloadGroup?: "boot" | "opening" | "weekly" | "battle" | "on-demand";
}
```

検査規則:

1. 登録パスが存在する
2. 背景、立ち絵、一枚絵の用途が一致する
3. 立ち絵はスロットと足元基準を持つ
4. 一枚絵は回想解放IDを別に持つ
5. altを空にできるのは純粋な装飾だけ
6. 同一画像の重複登録を警告する
7. boot先読み画像を少数に制限する

## 8. ファイル構成

```text
src/narrative/
  schema/
    eventSchema.ts
    conditionSchema.ts
    effectSchema.ts
    assetSchema.ts
  registry/
    flags.ts
    assets.ts
    characters.ts
  events/
    opening/
    common/
    characters/
      gidonozeaas/
      minato/
    ambient/
      work/
      play/
      rest/
      search/
    routes/
    matches/
    endings/
  runtime/
    conditionEvaluator.ts
    effectExecutor.ts
    eventSelector.ts
    eventPlayer.ts
  migration/
    legacySceneAdapter.ts
    saveV8ToV9.ts
  audit/
    validateNarrative.ts
    traceEligibility.ts
    buildStoryGraph.ts
```

ファイルは原則として一イベント一ファイル、または一連鎖一ファイルとする。
15人物すべてを一つの巨大なTypeScriptファイルへ戻さない。

## 9. 必須の自動検証

### スキーマ

- イベント、ノード、選択肢、行、フラグ、画像IDの一意性
- 未登録ID参照
- 型と値域
- draftイベントの本番混入

### グラフ

- 存在しない遷移先
- 終端のない経路
- 即時遷移の無限循環
- 入口のないイベント
- 永遠に真にならない条件
- 選択肢から到達できないノード

### セーブ互換

- 保存中のeventIdとnodeIdが現行データに存在する
- 改名IDには移行表がある
- 選択肢の並べ替えで既存セーブの意味が変わらない
- v8からv9へ文字列フラグを移行できる

### ゲーム進行

- 全ルート、全週、全行動で候補イベントが最低一つある
- 必須イベントが期限内に必ず出る
- 同一イベントがrepeat規則を破らない
- 予約イベントが消失しない
- 同じシードと状態で同じイベントが選ばれる

### コンテンツ品質

- 本文のないイベント
- 選択肢の結果説明がない
- speakerId不明
- authorNoteがプレイヤー表示へ混入
- 人物イベントなのに対象人物の表示・発話が一度もない
- 一枚絵指定後に回想解放がない

## 10. デバッグ画面

開発時だけ、週行動画面から「イベント候補監査」を開けるようにする。

表示項目:

- 候補になったイベント
- 除外されたイベント
- 除外理由
- priority
- weight
- 既読回数
- 最終発生週
- 必要フラグと現在値
- 選出に使った乱数値
- 選ばれたイベント

これにより「なぜこのイベントが出ないのか」をコード読解なしで確認できる。

## 11. 外部エンジン・ツール採用判断

### 採用する

#### Zod

既に導入済み。イベント、条件、効果、フラグ、画像へ検証範囲を拡張する。
TypeScript型とZodを別々に手書きせず、Zodから型を推論する。

#### fast-check + Vitest

既に導入済み。候補選出、到達可能性、保存移行、シード再現性へ拡張する。

#### 独自Story Graph

イベントJSONからMermaidまたはHTMLグラフを生成する。
最初は読み取り専用とし、編集機能を急いで作らない。

#### 現在のブラウザ編集ツール

安定したeventId、nodeId、lineIdを編集単位に追加し、
本文を直しても条件や画像参照を壊さない往復形式へ更新する。

### 小規模試験を行う

#### Inky

ink公式エディターのInkyは、執筆しながらの即時再生、常時コンパイル、
エラー・警告・TODO一覧、定義への移動、複数ファイル、JSON出力を備える。
inkjs試験を行う場合、単なるテキストエディターではなくInkyを執筆環境にする。

参考:

- [Inky](https://github.com/inkle/inky)

特に、作者向け演出命令へ専用prefixを設定し、本文と異なる色で表示する機能は、
現状の`cue`がプレイヤー向け本文へ混入する問題の防止に向いている。

#### inkjs

既存React/Viteへ導入でき、ブラウザ実行、コンパイル警告、
訪問回数、選択、状態保存が揃う。

ただし、ゲーム側RunStateとink側変数を二重管理してはならない。
試す場合はギドノの一連鎖だけを対象にし、次の範囲へ限定する。

- ブロック内の台詞進行
- 選択肢
- ブロック内の分岐と合流
- タグによる画像・効果命令

週イベントの候補選出、資金、加入、信頼、解放はゲーム側を正本とする。
試験後、作者の書きやすさと保存統合が独自JSON方式より明確に良い場合だけ採用する。

#### articy:draft X

articy:draftはFlow Fragment、入力条件、出力命令、画像などの参照、
階層化された物語グラフ、テンプレート、JSON出力を持つ。
本書のイベントブロックを視覚的に扱う候補として有力である。

参考:

- [Flow view](https://www.articy.com/help/adx/UI_View_Flow.html)
- [Conditions & Instructions](https://www.articy.com/help/Flow_Conditions_Instructions.html)
- [Templates](https://www.articy.com/help/Templates_Templates.html)
- [JSON export](https://www.articy.com/help/adx/Exports_JSON.html)

ただし、最初から正本にすると独自形式、ライセンス、エクスポート規則へ
制作工程が固定される。導入部6イベントだけを本書のスキーマでテンプレート化し、
次を検証してから採用を判断する。

1. 日本語長文と選択肢を無理なく編集できる
2. eventId、lineId、choiceIdを変更せずJSON出力できる
3. 条件木とtyped effectへ損失なく変換できる
4. 画像AssetIdをパスへ崩さず保持できる
5. Git差分レビューが実用になる
6. 現在のブラウザ編集ツールとの往復が必要か判断できる

JSONを毎回手修正しなければならない場合は採用せず、
読み取り専用の物語グラフを自動生成する方式へ戻す。

### 直接導入しない

#### Yarn Spinner

storylet/saliencyの設計は本作に最も参考になるが、
公式に支援される主なゲーム統合先はUnityである。
React版へ全面導入するより、候補選出モデルをTypeScriptで実装する。

#### Ren'Py、Naninovel、TyranoScript

いずれも優れたノベル制作環境だが、現行Reactゲームを置き換える
エンジン移行になる。戦闘、育成、既存UIを再実装する費用が大きい。
データモデルと編集UXを参考にし、ランタイムは移行しない。

## 12. 段階移行

### 段階0: ID凍結と棚卸し

- 現在の全scene.idを一覧化する
- 重複、ID末尾依存、配列インデックス依存を記録する
- 全フラグ文字列と書込み箇所を一覧化する
- 全画像パスと用途をAsset Registryへ登録する

この段階ではゲーム挙動を変えない。

### 段階1: 互換アダプター

`CharacterScene`を実行時に`NarrativeEventBlock`へ変換する
`legacySceneAdapter`を作る。

- 現在の文章をそのまま表示
- 現在の数値効果をtyped effectへ変換
- 現在のIDを維持
- 現在の選出順を維持

新形式と旧形式を同じプレイヤーで再生できるようにする。

### 段階2: 導入部の垂直移行

次だけを新形式へ移す。

1. 派遣初日
2. ギドノとの遭遇
3. オーナー権移譲
4. 最初の大会参加理由
5. 優勝
6. 温泉旅行

この連鎖で、固定イベント、選択、画像、予約、フラグ、保存再開を検証する。

### 段階3: 日常イベント選出

work、play、rest、searchの各3件だけをstorylet化する。
候補監査画面を先に完成させ、出現理由を確認できる状態で増やす。

### 段階4: 人物一人を完全移行

ギドノのmeet、join、bond、power、crisis、liberation、epilogueを
独立イベントブロックとして移す。

固定の`storyStage + 1`ではなく、各ブロックの条件と効果で連鎖させる。

### 段階5: 全人物と共通物語

一人分の監査が通ってから他人物へ横展開する。
ミミの共通物語は人物イベントへ毎回文章を前置きせず、
独立ブロックとして進行させる。

### 段階6: 保存形式v9

- `flags: string[]`を登録済みStoryStateへ移行
- `eventHistory`をvisitsへ移行
- `currentEvent`本文をeventId + nodeIdへ移行
- 旧IDの別名表を保持

移行テストが通るまでv8読込みを削除しない。

### 段階7: 旧ロジック削除

全イベント移行後に限り、次を削除する。

- `scene.id`末尾から効果を推測する処理
- 選択肢インデックスのフラグ
- `engine.ts`のイベント固有`if`列
- 行配列位置による文章差込み
- 生画像パス参照

## 13. 採用結論

本作の最適解は次である。

1. React、Vite、XState、Zustandは維持する
2. イベントをstorylet型の名前付きブロックへ統一する
3. 出現条件、再出現、優先度、本文、画像命令、選択効果、遷移を同じブロックに置く
4. 状態の正本をRunState + StoryStateに限定する
5. ID、フラグ、画像を登録制にする
6. 候補選出理由と物語グラフを可視化する
7. Inky + inkjsはギドノ一連鎖でのみ比較試験する
8. articy:draftは導入部6イベントのJSON往復だけを比較試験する
9. 全面移行ではなく互換アダプターから段階導入する

この順序なら、今ある文章を捨てずに、
「フラグを踏むと次のブロックが現れる」というノベルゲームの基本構造へ
安全に移行できる。
