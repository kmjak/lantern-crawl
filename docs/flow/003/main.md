# Flow: 003

| Field   | Value                              |
|---------|------------------------------------|
| Status  | implement:in-progress              |
| Ticket  | docs/tickets/003.md                |
| Branch  | 003-game-ui                        |
| Updated | 2026-09-22 19:19                   |

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

## Review

## PR
