# Overview

> Items marked `(assumption)` are inferred and still need confirmation.

## Purpose

- A simple, browser-based web game: **Lantern Crawl**. It combines minesweeper-style deduction with RPG leveling. See [game-design.md](game-design.md).
- The goal is an original game that combines ideas from different games without copying any single one.

## Domain Concepts

- **Board / Cell**: a 12×12 grid. Each cell is empty, holds an enemy (with a level), or holds a potion.
- **Number**: the sum of the levels of adjacent enemies.
- **Player**: level, XP, HP.
- **Combat**: resolves instantly when an enemy cell is revealed.
- **Run**: one game from the first reveal to a clear or a game over. It produces a score, shown at the end.

## Originality / IP Policy

- Borrowing general game mechanics or rules is generally low risk. Reusing another game's names, characters, artwork, music, text or distinctive UI is not. This is a guideline, not legal advice.
- All names and text are original. Visuals are CSS plus emoji/text glyphs.

## Tech Stack

- A static site: plain HTML, CSS and JavaScript, no runtime dependencies and no framework
- Hosted on GitHub Pages, deployed by GitHub Actions on every push to `main`
- Node.js (no dependencies) for the build script and for tests (`node --test`)

### Constraints

- There is no server, so everything runs in the browser and nothing is stored between visits.
- Anything shared between players (a common ranking, saved runs) would need an external service. Deliberately out of scope (ticket 006).

## Architecture / Directory Structure

```
src/index.html       page; `<!-- include: x -->` markers are expanded at build time
src/style.css
src/game.js          pure game logic (no DOM); also loadable from Node for tests
src/ui.js            DOM rendering and input
scripts/build.mjs    src/ -> build/site/index.html (one self-contained file)
test/                node --test
.github/workflows/pages.yml   test, build and publish to GitHub Pages
```

## Development & Testing

- `npm test`: unit tests for the game logic and the build
- `npm run build`: writes `build/site/index.html`
- Play locally: open `build/site/index.html` in a browser
- Deploy: push to `main` (the workflow tests, builds and publishes)

## History

- 001–005 built the game on Google Apps Script with a shared ranking in a Google Sheet. The deployment target then changed to GitHub Pages, which serves static files only, so 006 removed the ranking and the GAS setup. The GAS project and its spreadsheet may still exist in the owner's Google account, unused.

## Open Questions

- None.
