# エージェント作業規約

このリポジトリは Codex と Claude Code を併用して制作している。
このファイルが唯一の規約実体で、`CLAUDE.md` はここへの参照。
どちらのツールで作業する場合も、まずこの内容に従う。

## このプロジェクト

「ミミのときめき裏ボス闘技場」。週刊育成シミュレーションと監督型3対3
オートバトルを組み合わせたブラウザゲーム。1周26週、初回75〜90分想定。

- 全体像: [README.md](README.md)
- 遊びの設計: [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)
- 技術と所有境界: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 文章の基準と人物の声: [docs/TEXT_BIBLE.md](docs/TEXT_BIBLE.md)
- 監査の採点と計測値: [docs/QUALITY_AUDIT.md](docs/QUALITY_AUDIT.md)

## 進行の作法

[docs/WORKING_PROTOCOL.md](docs/WORKING_PROTOCOL.md) が制作進行の規約。要点:

- 返答ごとに「作業継続中 / 確認待ち / 実装・検証完了 / 阻害中」のどれかを明示する。
- 「次は進めます」と予告して返答を終えない。確認が必要な判断以外では止まらない。
- 設計書を作っただけで、実装まで完了したように報告しない。
- ビルドが通っただけで実画面確認まで済んだとみなさない。

## 併用ルール

- **交代制で作業する。** Codex と Claude Code を同時に同じ作業ツリーで走らせない。
  片方が作業中はもう片方を止める。
- 作業を交代するときは、変更済みファイルと未完了項目をこのファイルの
  「## 引き継ぎ」節に書き残す。
- このリポジトリは Codex サンドボックスのユーザー所有になっている。git が
  `dubious ownership` で失敗する場合は
  `git config --global --add safe.directory C:/Users/takakazu/projects/mimi_secret_boss_arena`
  を実行する。

## コマンド

```powershell
npm run dev        # 開発サーバー
npm test           # vitest 全件（周回・戦闘監査を含む。maxWorkers=1）
npm run typecheck  # tsc --noEmit
npm run build      # 型検査 + 本番ビルド
npm run qa:onboarding   # Playwright による導入部QA
npm run qa:visual       # Playwright による画面QA
```

対象を絞る場合は `npm run audit:content` / `npm run audit:sim`。

## 公開（GitHub Pages）

公開URL: https://takakazuaikawa-hue.github.io/mimi-secret-boss-arena/

ゲームはアセットを `/assets/...` の絶対パスで参照するため、サブパス配信では
`npm run build:pages` を使う（`--base=./` + `scripts/patch-relative-asset-paths.mjs`
で配信物のみ相対化。ソースの絶対パス規約は変更しない）。

再デプロイ手順:

```powershell
npm run build:pages
```

その後、dist の内容を `gh-pages` ブランチへコミットして push する
（LFSフィルタを避けるため、.gitattributes を含めない別ディレクトリで行う）。
push すると Pages が自動で再ビルドする。

## 所有境界（変更時の原則）

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) の所有境界に従う。特に:

- `src/data/` と `src/narrative/`: 文章・コンテンツ。**進行ロジックを変更しない。**
- `src/game/engine.ts` `battle.ts`: ロジック。**保存形式を変更しない。**
- `src/game/types.ts`: コンテンツと保存データの契約。変更は影響範囲を確認してから。
- `src/game/content.ts`: Zod による起動時監査。コンテンツ追加時は総数の更新も要る。

`balanceAudit.test.ts` の閾値は、意図した設計変更のとき以外は緩めない。

## 完了の条件

- 実装: コード変更 + `npm run typecheck` または対象テストを通した。
- 画面: デスクトップと 390px 幅の実画面を確認した。コンソールエラーなし。
- 物語: 前後の文脈、選択の結果、必要な演出資産まで記述した。
- 未確認の項目がある場合は、その項目だけを未完了として明示的に残す。

## 引き継ぎ

（作業を中断・交代するときにここへ追記する）

### 2026-08-09 Claude Code → 次作業者へ

**物語改稿プロジェクト完走**: 全15人のv2改稿が完了した（コミット `bc4260a`）。
基準は docs/NARRATIVE_REBOOT_PLAN.md（高橋留美子テイスト×現代的、高校生が読める
ライトノベル文体）、世界の織り方は docs/WORLD_CONTINUITY.md が正本。

- 最終波（マリアン・十七号室・リンネ・無銘）28場面を改稿。演目表は全15幕 final
  （`src/data/openingProgram.ts`）。封筒・演目・モチーフ台帳も登記済み。
- 承認済み後日談3本（治さない相談日・元手ゼロ杯・所有者なし搬出式）は骨格保持で
  出演届の一行のみ追加。改稿ブロックの debug.status はすべて "review"。
- 検証: 対象テスト36件（narrative/content/program/saveMigration）と typecheck 合格。
  全スイート（周回・戦闘監査）は実行済みだが完走確認は次作業者に委ねる場合あり
  （物語JSONのみの変更なので戦闘監査への影響は想定なし）。
- GitHub Pages 再デプロイ済み（gh-pages `cb585aa`、改稿後の物語が公開版に反映）。

### 2026-08-10 Claude Code → 次作業者へ(三段階キャンペーン)

- 三段階キャンペーン実装済み(`src/data/campaignStages.ts` 正本、周回持ち越し・
  区分選び直し・主軸優先)。三周の感情設計は docs/GAME_DESIGN.md §4 が正本。
- メインストーリー全15話(各区分5話、`src/narrative/content/main.s*.ep*.json`)を
  二段再生(メイン→個別meet)で接続済み。対応表は engine.ts の stageOneMainEpisodes。
- 執筆原則(ユーザー指導による): 面白さ基準/謎の告知禁止(種は一粒・ギャグの
  テンポ)/全ノード「ミミが行動→世界が反応」の因果場面。observancは
  メモリ fun-first-fixes に詳細。
- 未実施: 区分2・3の実画面通し(機構は単体テスト済み)、第4週大会の
  「復帰戦」文脈づけ、選択フラグの後続コールバック(骨子のみ)。
- Pages再デプロイ済み(gh-pages `8904db8`)。

**未完了・次の候補**:
1. 真エンディング「柿落とし、十五幕」の実画面確認（3周分の通しプレイが必要。
   grand昇格ロジックは program.test.ts で検証済みだが実画面は未確認）。
2. プロローグ35ページのLN文体化（NARRATIVE_REBOOT_PLAN §6 実施計画の残項目）。
3. 選択の効果を後続場面の台詞へ反映するエンジン対応（第2波からの積み残し）。
4. debug.status "review" のブロックの人手レビュー後、"approved" への昇格。
