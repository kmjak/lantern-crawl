# Flow: 003

| Field   | Value                              |
|---------|------------------------------------|
| Status  | done                               |
| Ticket  | docs/tickets/003.md                |
| Branch  | 003-game-ui                        |
| Updated | 2026-09-22 19:22                   |

> The user authorized running the gates autonomously, including self-merging PRs (2026-09-22).

## Research
- The logic API (002): `Game.create`, `Game.reveal(state, i, now)` returns events, `Game.cycleMemo`, `Game.elapsedSeconds`, `Game.score`, `Game.enemyName`. Cells have `kind/level/number/revealed/done/memo`.
- The page is served in the GAS iframe; `index.html` is a template with `include()` partials. Local preview is `build/local/index.html`.
- Target: PC (click / right-click) and phones (tap, memo-mode toggle), 360px wide without horizontal scroll.

## Approach
- A single `render()` redraws the HUD and all 144 cells from the state after every action. The board is small, so there is no need for diffing.
- Cells are `<button>` elements in a CSS grid (12 columns, square cells sized from the container width). This gives keyboard focus and a tap target for free.
- Visuals: CSS plus emoji glyphs (original, no third-party art). Hidden cells look like dark stone, revealed cells are lit warm (the lantern theme). Number colors scale with the value.
- Messages: the event list from `reveal()` is turned into a short Japanese log line (`aria-live`).
- End of a run: an overlay with the result, the score and a retry button. 004 adds the ranking to it.
- On game over, all enemies are shown, and the fatal one is highlighted.
- The rules summary is a collapsible `<details>` under the board.

## Plan
Branch: `003-game-ui`
1. `Add board rendering, HUD and reveal input`
2. `Add memo input, messages and result overlay`
3. `Add how-to-play section and mobile layout polish`

## Implementation Log
- `b27ac92` Add board rendering, HUD and reveal input
- `44278d1` Add memo input, messages and result overlay
- `3e74ba2` Add how-to-play section and mobile layout polish
- Decision: defeated enemies show their number (like other lit cells) on a slightly different background. The boss stays visible after the clear.
- Decision: the result overlay opens 700 ms after the game ends, so the final board is visible first. "盤面を見る" closes it.
- Decision: the bestiary in the how-to-play section is generated from `Game.CONFIG`, so it cannot drift from the rules.
- Verification: the Chrome extension did not respond. A headless Chrome was driven over the DevTools protocol instead (a scratchpad script, not committed), at 375×812:
  - no horizontal scroll (scrollWidth 375)
  - the first reveal opens an area
  - right-click memo cycles (shows "2" after two clicks)
  - random play reaches game over: all enemies shown, the fatal one highlighted, overlay with the score
  - the how-to-play section and bestiary render

## Review
- Ticket requirements: board, HUD, click reveal, memo (right-click + mode toggle), messages, result overlay with retry, how-to-play, 360px layout. All implemented.
- Partially verified: the **clear** path of the overlay was not reached in the browser (random play cannot beat the boss). It shares its code with the game-over path, and the logic is covered by unit tests. Accepted as is.
- Partially verified: the memo-mode toggle (phone input) was not exercised in the browser, only right-click. It uses the same `cycleMemo` handler. Accepted as is.
- No divergences from the Approach or Plan.

## PR
- Title: 003: ゲーム UI
- Target: `main`
- URL: https://github.com/kmjak/lantern-crawl/pull/3
- Merged by Claude (self-merge authorized by the user).
