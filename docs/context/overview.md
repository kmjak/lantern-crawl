# Overview

> Items marked `(assumption)` are inferred and still need confirmation.

## Purpose

- A simple, browser-based web game: **Lantern Crawl** (working title). It combines minesweeper-style deduction with RPG leveling. See [game-design.md](game-design.md).
- The goal is an original game that combines ideas from different games without copying any single one.

## Domain Concepts

- **Board / Cell**: a 12×12 grid. Each cell is empty, holds an enemy (with a level), or holds a potion.
- **Number**: the sum of the levels of adjacent enemies.
- **Player**: level, XP, HP.
- **Combat**: resolves instantly when an enemy cell is revealed.
- **Run**: one game from the first reveal to a clear or a game over. It produces a score.
- **Ranking**: shared top-10 scores stored in a Google Sheet.

## Originality / IP Policy

- Borrowing general game mechanics or rules is generally low risk. Reusing another game's names, characters, artwork, music, text or distinctive UI is not. This is a guideline, not legal advice.
- All names and text are original. Visuals are CSS plus emoji/text glyphs.

## Tech Stack

- Google Apps Script (GAS) web app (`HtmlService`, `doGet`)
- Google Sheets: stores the ranking only
- `clasp` for local development and deployment; git + GitHub (public repository)
- Node.js (no runtime dependencies) for the build script and for tests (`node --test`)

### Constraints of this stack

- `google.script.run` calls have noticeable latency, so **all game logic runs in the browser**. The server only saves and reads the ranking.
- There is no realtime push, so the game is single-player only.
- The page runs in a sandboxed iframe served by GAS.
- Apps Script quotas apply. Sheet writes are guarded with `LockService`.

## Architecture / Directory Structure

```
src/
  appsscript.json      # GAS manifest
  server/Code.js       # doGet, include(), ranking API (runs on GAS)
  client/index.html    # page template; includes partials via <?!= include('name') ?>
  client/style.css
  client/game.js       # pure game logic (no DOM); also loadable from Node for tests
  client/ui.js         # DOM rendering and input
scripts/build.mjs      # src/ -> build/gas (clasp rootDir) and build/local (standalone preview)
test/                  # node --test
```

- GAS only serves `.html` files as client assets, so the build wraps `.css` / `.js` client files into `.html` partials for `build/gas`.
- `build/local/index.html` is one self-contained file. It inlines everything and stubs `google.script.run` with `localStorage`, so the game runs offline without GAS.

## Development & Testing

- `npm test`: unit tests for the game logic and the server ranking logic (Node built-in test runner)
- `npm run build`: builds `build/gas` and `build/local`
- Local preview: open `build/local/index.html` in a browser
- Deploy: `npm run deploy` (build, `clasp push -f`, then update the fixed web-app deployment; see the README)
- Hosting: the GAS project is owned by a school Google Workspace account. That domain forbids anonymous web apps, so access is `DOMAIN`: only signed-in members of the domain can play.

## Open Questions

- Web app access is `DOMAIN` because the Workspace admin forbids anonymous access. Moving to a personal Google account would allow public access (redeploy from that account).
- A public ranking with free-text nicknames can attract abusive names. v1 only limits length and strips control characters.
