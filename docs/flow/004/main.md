# Flow: 004

| Field   | Value                              |
|---------|------------------------------------|
| Status  | done                               |
| Ticket  | docs/tickets/004.md                |
| Branch  | 004-ranking                        |
| Updated | 2026-09-22 19:26                   |

> The user authorized running the gates autonomously, including self-merging PRs (2026-09-22).

## Research
- The server is `src/server/Code.js` (`doGet`, `include`). The build copies every file in `src/server/` to `build/gas/`. On GAS, all server files share one global scope.
- The local preview stubs `google.script.run` and looks up functions on `window.LocalServer` (`scripts/local-stub.js`).
- The UI result overlay (003) shows the score. The ranking UI goes there and in a panel on the main screen.
- Risks:
  - Values starting with `=`, `+`, `-` or `@` become formulas when written to a Sheet (formula injection).
  - Concurrent `appendRow` calls must be serialized.
  - Creating the sheet lazily on a read could create duplicates, because reads are not locked.
- Scores are computed on the client, so they can be forged. The ticket puts this out of scope.

## Approach
- `src/server/Ranking.js`: pure functions with no GAS APIs. `normalizeEntry(input, now)` does validation and cleanup; `rankEntries(entries, entry, limit)` returns `{ rank, top }`. Order: score desc, then seconds asc, then earlier timestamp.
  - GAS: these are globals shared with `Code.js`.
  - Node tests: loaded with `vm`.
  - Local preview: the build inlines this file next to the stub, so validation is identical offline.
- `Code.js`:
  - `submitScore(input)`: validates, takes the script lock, creates the sheet if needed, appends the row, and returns `{ rank, top }`.
  - `getRanking()`: returns the top 10 and does **not** create the sheet (it returns `[]` when there is none).
  - Names are written with a leading `'` when they start with a formula character, so Sheets stores them as text.
- Sheet id is stored in the script property `RANKING_SHEET_ID`. The sheet is created in the deployer's Drive on the first submission.
- Manifest: declare the `spreadsheets` OAuth scope explicitly.
- Client: the result overlay gets a nickname form (the last name is remembered in `localStorage`, in a try/catch). After a submission it shows "N 位". A "ランキング" `<details>` panel on the main screen loads the top 10 when opened and refreshes after a submission.
- Limitation (noted in the Review): each read loads the whole sheet. That is fine for v1 volumes.

## Plan
Branch: `004-ranking`
1. `Add ranking validation and ordering` (Ranking.js + tests)
2. `Add ranking API backed by a Google Sheet` (Code.js, manifest, local stub, build)
3. `Add score submission and ranking panel to the UI`

## Implementation Log
- `cff6d29` Add ranking validation and ordering
- `27ece2f` Add ranking API backed by a Google Sheet
- `a130597` Add score submission and ranking panel to the UI
- Addition beyond the Plan: `test/server.test.js` runs `Code.js` against in-memory fakes of `PropertiesService` / `SpreadsheetApp` / `LockService`. It covers lazy sheet creation, rank, lock release, formula escaping, and validation before the sheet is touched. The real GAS behavior is verified at deploy time (005).
- Decision: names are cut to 12 **code points** (`Array.from`), so emoji are not split in half.
- Verification in headless Chrome (375×812, local build): a whitespace-only name shows the server error and re-enables the form; a valid submission shows "ランキング 1 位！"; the name is prefilled on the next run; the panel lists entries in score order.

## Review
- Ticket requirements: `submitScore` / `getRanking` (top 10), validation, `LockService`, sheet id in script properties with lazy creation, client form and ranking display, localStorage stub, Node-testable logic. All implemented (37 tests passing).
- Not verified yet: behavior on real GAS (scopes, `SpreadsheetApp.create` in the deployer's Drive, how `getValues` returns the `at` column). Deferred to 005, where the app is deployed.
- Known limitation (accepted for v1): every read loads the whole sheet. That is fine at hobby scale.
- Known limitation (ticket Out of Scope): scores are client-computed and can be forged.
- No divergences from the Approach. The Plan gained one test file (see the log).

## PR
- Title: 004: ランキング
- Target: `main`
- URL: https://github.com/kmjak/lantern-crawl/pull/4
- Merged by Claude (self-merge authorized by the user).
