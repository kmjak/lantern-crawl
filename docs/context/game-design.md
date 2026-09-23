# Game Design: Lantern Crawl (working title)

A single-player, browser-based puzzle RPG. It combines **minesweeper-style number deduction** with **RPG combat and leveling**.
The player explores a dark cave with a lantern, reveals cells, fights monsters, levels up, and finally defeats the cave's master.

All names, text and visuals are original. Visuals use plain CSS and emoji/text glyphs (no third-party art).
All numbers below live in one config object and are expected to be tuned.

## Board

- Grid: 12 columns × 12 rows (144 cells). Sized for tapping on a phone.
- Each cell contains exactly one of: `empty`, `enemy(level)`, `potion`.
- Placement is generated **after the first reveal**. The first revealed cell and its 8 neighbors never contain an enemy or potion, so the first reveal always opens an area.

## Contents

| Kind | Level | Count | Name (JA) | XP |
|------|-------|-------|-----------|----|
| enemy | 1 | 8 | コケムシ | 1 |
| enemy | 2 | 6 | ヤミネズミ | 2 |
| enemy | 3 | 5 | ドクグモ | 3 |
| enemy | 4 | 4 | イワオニ | 4 |
| enemy | 5 | 3 | カゲキシ | 5 |
| enemy (boss) | 9 | 1 | 深淵の主 | — |
| potion | — | 4 | 回復薬 (+4 HP) | — |

## Numbers

- A revealed non-enemy cell shows the **sum of the levels of enemies in its 8 neighbors** (the boss counts as 9).
- Numbers are fixed. They do not change when enemies are defeated.
- Revealing a cell whose number is 0 automatically reveals its neighbors, recursively (flood fill). Potions revealed this way are consumed automatically.

## Player

- Starts at level 1 with 0 XP.
- Max HP = `6 + 2 × level` (level 1: 8, level 5: 16). Starts at full HP.
- XP needed to reach a level (cumulative): Lv2 = 4, Lv3 = 12, Lv4 = 24, Lv5 = 40. Max level is 5.
- On level-up, max HP increases, and current HP increases by the same amount (not a full heal).

## Combat

Combat happens when the player reveals an enemy cell. It resolves instantly:

- Player attack = player level. Enemy HP = enemy level. Enemy attack = enemy level.
- The player strikes first. Rounds needed = `ceil(enemyLevel / playerLevel)`.
- Damage taken = `enemyLevel × (rounds − 1)`.
  - Enemies at or below the player's level cost no HP.
  - Stronger enemies hurt more (e.g. Lv1 vs a level-3 enemy: 6 damage; Lv5 vs the boss: 9 damage).
- If HP stays above 0: the enemy is defeated, the player gains XP, and the cell shows its number.
- If HP drops to 0 or below: game over.

## Win / Lose

- **Clear**: defeat the boss (深淵の主).
- **Game over**: HP ≤ 0.

## Memo (player notes)

- A player can put a memo on any hidden cell: a guessed enemy level (1–5, 9) or `?`. Memos are cosmetic and do not block reveals.
- PC: right-click cycles the memo. Phone: toggle "memo mode" with a button, then tap to cycle.

## Score

- `score = xpTotal × 10 + (cleared ? 1000 + hp × 20 + max(0, 600 − seconds) : 0)`
- The score is shown on the result overlay at the end of a run. It is not stored anywhere (see ticket 006).
