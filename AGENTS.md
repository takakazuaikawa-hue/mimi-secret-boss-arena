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
