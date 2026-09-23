# Flow: 006

| Field   | Value                              |
|---------|------------------------------------|
| Status  | pr:in-progress                     |
| Ticket  | docs/tickets/006.md                |
| Branch  | 006-github-pages                   |
| Updated | 2026-09-24 02:00                   |

> The user authorized running the gates autonomously, including self-merging PRs (2026-09-22).

## Research
- The deployment target changed to GitHub Pages, which serves static files only.
- Current GAS-specific parts: `src/appsscript.json`, `src/server/Code.js`, `src/server/Ranking.js`, `.clasp.json`, the `push` / `deploy` npm scripts, the `<?!= include('x') ?>` template and the `.html` partial wrapping in the build, and `scripts/local-stub.js` (which stubs `google.script.run`).
- The game itself (`game.js`, `ui.js`, `style.css`) has no server dependency. Only the ranking does.
- The user chose to drop the ranking rather than add an external database.
- The repository is public, so GitHub Pages is available.

## Approach
- Remove the ranking end to end: server files, the submission form, the ranking panel, the local stub and their tests. The end-of-run overlay keeps score, level and time.
- With the ranking gone, GAS has no job left, so drop the GAS build path entirely instead of keeping two targets:
  - sources move from `src/client/` to `src/`
  - the template placeholder becomes a plain `<!-- include: name -->` comment, resolved at build time
  - the build produces one static site: `build/site/index.html`, plus a viewport meta tag (GAS used to add it via `addMetaTag`)
  - `.clasp.json`, `src/appsscript.json` and the clasp npm scripts are deleted
- Deploy with GitHub Actions on push to `main`: build, upload the artifact, deploy to Pages (`actions/deploy-pages`). Pages is set to "GitHub Actions" as its source.
- The GAS project and its deployment stay in the user's Drive, unused. Deleting them is the user's call.

## Plan
Branch: `006-github-pages`
1. `Remove the ranking feature`
2. `Build a static site instead of a GAS project`
3. `Deploy to GitHub Pages with Actions` (+ docs)

## Implementation Log
- `a3e65b0` Remove the ranking feature
- `ee233b7` Build a static site instead of a GAS project
- `4b80266` Deploy to GitHub Pages with Actions (includes the README and context updates)
- Deleted: `src/server/`, `src/appsscript.json`, `.clasp.json`, `scripts/local-stub.js`, `test/ranking.test.js`, `test/server.test.js`, and the `push` / `deploy` npm scripts.
- `src/client/*` moved to `src/`, since there is no server side any more.
- The workflow runs `npm test` before building, so a broken build is not published.
- Verification in headless Chrome (390×844, `build/site/index.html`): no horizontal scroll, the title is set, a run reaches game over with the score overlay, retry starts a new run, and no ranking UI is left.

## Review
- Ticket requirements: ranking removed, single static page, Actions deploy, docs updated. All done (27 tests passing).
- Divergence from the ticket, agreed in the Approach: the GAS build target was dropped entirely rather than kept alongside. With no ranking, GAS had no remaining role.
- Not verified yet: the Pages URL itself. Pages has to be switched to the "GitHub Actions" source and the first workflow run has to finish, which happens after this PR is merged.
- The GAS project and the "Lantern Crawl Ranking" spreadsheet stay in the owner's Google account, unused (out of scope).

## PR
