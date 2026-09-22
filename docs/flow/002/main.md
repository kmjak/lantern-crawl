# Flow: 002

| Field   | Value                              |
|---------|------------------------------------|
| Status  | done                               |
| Ticket  | docs/tickets/002.md                |
| Branch  | 002-game-logic                     |
| Updated | 2026-09-22 19:17                   |

> The user authorized running the gates autonomously, including self-merging PRs (2026-09-22).

## Research
- Rules: `docs/context/game-design.md`. `src/client/game.js` is currently an empty UMD shell (browser global `Game`, `module.exports` in Node).
- UI (003) needs from the logic: per-cell display state, player stats, and a list of what happened on each action (for messages).
- The score needs elapsed time, so the logic needs a clock. Pass it in explicitly so that tests stay deterministic.

## Approach
- A plain mutable state object plus functions (`Game.create`, `Game.reveal`, `Game.cycleMemo`, `Game.score`, ...). No classes. This keeps it trivial to render and to test.
- `reveal(state, index, now)` returns an **event list** (`reveal`, `potion`, `combat`, `levelup`, `clear`, `gameover`). The UI turns events into messages, so the logic has no text or DOM.
- Randomness: `create(config, rng)` takes an `rng()` returning `[0, 1)` (default `Math.random`). Tests use a seeded PRNG. Tests can also inject a fixed layout via `Game.place(state, layout)`.
- Placement happens on the first reveal. The 3×3 area around the first cell is excluded, and the rest is shuffled with Fisher-Yates.
- Defeating an enemy whose number is 0 flood-fills too (consistent with empty cells).
- All tunable numbers live in `Game.CONFIG`.

## Plan
Branch: `002-game-logic`
1. `Add board generation, numbers and reveal with flood fill` (+ tests)
2. `Add combat, potions, leveling, win/lose and score` (+ tests)
3. `Add memo cycling` (+ tests)

## Implementation Log
- `5fce141` Add board generation, numbers and reveal with flood fill
- `713c0cf` Add combat, potions, leveling, win/lose and score
- `43bc8ab` Add memo cycling
- Decision: each cell has a `done` flag (enemy defeated / potion consumed). `kind` is kept, so the UI can still draw a defeated enemy differently from an empty cell.
- Decision: on game over the fatal enemy cell is revealed, so the UI can show what killed the player.
- Balance note: with perfect information, fighting enemies in ascending level order costs no HP before the boss (every tier is reached at the level that makes it free). Real difficulty therefore comes from deduction mistakes. Tuning is left to playtesting in 003.

## Review
- Ticket requirements: generation with a safe first 3×3, numbers, flood fill, potions, combat, level-up, clear/game over, memo, score, injectable RNG, single config object, loadable from Node. All implemented, with tests (27 passing).
- Acceptance "clearable by design" is covered by the test `the default config is clearable`.
- No divergences from the Approach or Plan.

## PR
- Title: 002: ゲームロジック
- Target: `main`
- URL: https://github.com/kmjak/lantern-crawl/pull/2
- Merged by Claude (self-merge authorized by the user).
