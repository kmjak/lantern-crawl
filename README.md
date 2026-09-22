# Lantern Crawl

ランタンを手に暗い洞窟を探索する、マインスイーパー × RPG の web ゲーム。
開いたマスの数字は「周りにいる魔物のレベルの合計」。弱い魔物から倒してレベルを上げ、洞窟の主を倒せばクリア。

Google Apps Script（web アプリ）＋ Google スプレッドシート（ランキング）で動く。

## 開発

必要なもの：Node.js 22 以上、[clasp](https://github.com/google/clasp)（デプロイ時のみ）

```sh
npm test        # 単体テスト
npm run build   # build/gas（clasp 用）と build/local（ローカルプレビュー）を生成
```

ローカルで遊ぶ：`npm run build` 後に `build/local/index.html` をブラウザで開く（ランキングは localStorage に保存される）。

## 構成

```
src/appsscript.json   GAS マニフェスト
src/server/           GAS サーバー側（doGet・ランキング API）
src/client/           ページ・スタイル・ゲームロジック・UI
scripts/build.mjs     src/ → build/gas, build/local
test/                 単体テスト（node --test）
docs/                 context・チケット・flow 状態
```
