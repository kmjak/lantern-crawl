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

## 遊ぶ

公開 URL：https://script.google.com/macros/s/AKfycbyjQKEGWYlFIfPWmG-Nu6MtJ4ErTowwbUwaiZsUgtgSIX2viaRScBm6Yi8UKGEbNIxc/exec

学校の Google Workspace 上で公開しているため、同じドメインのアカウントでログインしている人だけが遊べる（管理者設定で匿名公開が禁止されているため）。

## デプロイ

```sh
npm run push     # build して clasp push -f（開発用の @HEAD に反映）
npm run deploy   # push したうえで、公開中のデプロイを新しいバージョンに更新（URL は変わらない）
```

- `clasp login` 済みであること。GAS プロジェクトは `.clasp.json` の scriptId（rootDir は `build/gas`）。
- 初回だけ、プロジェクトのオーナーが公開 URL を開き、スプレッドシートへのアクセスを承認する必要がある。
- ランキング用スプレッドシート「Lantern Crawl Ranking」は、最初のスコア登録時にオーナーの Drive に作られる（ID はスクリプトプロパティ `RANKING_SHEET_ID`）。
- 注意：`clasp pull` / `clasp create-script` は `build/gas` を上書きする。編集は必ず `src/` で行い、push 前に build する（`npm run push` なら自動）。

## 構成

```
src/appsscript.json   GAS マニフェスト
src/server/           GAS サーバー側（doGet・ランキング API）
src/client/           ページ・スタイル・ゲームロジック・UI
scripts/build.mjs     src/ → build/gas, build/local
test/                 単体テスト（node --test）
docs/                 context・チケット・flow 状態
```
