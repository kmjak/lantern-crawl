# Flow: 004

| Field   | Value                              |
|---------|------------------------------------|
| Status  | implement:in-progress              |
| Ticket  | docs/tickets/004.md                |
| Branch  | 004-ranking                        |
| Updated | 2026-09-22 19:25                   |

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

## Review

## PR
