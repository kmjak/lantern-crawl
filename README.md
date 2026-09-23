# Lantern Crawl

ランタンを手に暗い洞窟を探索する、マインスイーパー × RPG の web ゲーム。
開いたマスの数字は「周りにいる魔物のレベルの合計」。弱い魔物から倒してレベルを上げ、洞窟の主を倒せばクリア。

依存なしの静的サイト（HTML + CSS + JavaScript）。GitHub Pages で公開している。

## 開発

必要なもの：Node.js 22 以上

```sh
npm test        # 単体テスト
npm run build   # build/site/index.html を生成
```

ローカルで遊ぶ：`npm run build` 後に `build/site/index.html` をブラウザで開く。

## 遊ぶ

https://kmjak.github.io/lantern-crawl/

## デプロイ

`main` に push すると GitHub Actions（`.github/workflows/pages.yml`）がテストとビルドを実行し、`build/site` を GitHub Pages に公開する。手動で実行する場合は Actions タブの "Deploy to GitHub Pages" から。

## 構成

```
src/index.html        ページ本体（ビルド時に css/js をインライン展開）
src/style.css         スタイル
src/game.js           ゲームロジック（DOM 非依存。Node のテストからも読み込む）
src/ui.js             描画と入力
scripts/build.mjs     src/ → build/site/index.html
test/                 単体テスト（node --test）
docs/                 context・チケット・flow 状態
```
