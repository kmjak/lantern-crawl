# Flow: 005

| Field   | Value                              |
|---------|------------------------------------|
| Status  | pr:in-progress                     |
| Ticket  | docs/tickets/005.md                |
| Branch  | 005-deploy                         |
| Updated | 2026-09-22 20:00                   |

> The user authorized running the gates autonomously, including self-merging PRs (2026-09-22).
> This flow stops here anyway, because the ticket requires confirming public access before publishing.

## Research
- clasp 3.4.1 is installed and logged in (`~/.clasprc.json`). The app has no GAS project or `.clasp.json` yet.
- Deploying does these outward-facing things in the user's Google account:
  - creates a standalone Apps Script project (`clasp create-script`, rootDir `build/gas`)
  - on the first score submission, creates a spreadsheet "Lantern Crawl Ranking" in the deployer's Drive
  - publishes a web app with `access: ANYONE_ANONYMOUS`, so anyone with the URL can play and submit scores
- `executeAs: USER_DEPLOYING` needs the owner to grant the `spreadsheets` scope once. clasp cannot grant it. The owner has to open the web app URL (or run a function in the editor) and approve the OAuth prompt in the browser.
- `.clasp.json` contains only the script id, which is not a secret. It can be committed, so that `clasp push` works from a clone.
- Open question (from the ticket): is "anyone, anonymous" access OK?
  - Resolved 2026-09-22: the user approved public anonymous access and creating the GAS project and spreadsheet. The reply read "予想なのでお願い", interpreted as "了承なのでお願い".

## Approach
- Create a standalone script with `clasp create-script --rootDir build/gas`, and commit `.clasp.json`.
- Keep one fixed web-app deployment, so the public URL never changes. Later releases update it in place (`clasp create-deployment -i <id>`).
- npm scripts: `push` (build + `clasp push -f`), `deploy` (push + update the fixed deployment). The deployment id lives in `package.json` (not a secret).
- The README documents the one-time OAuth approval by the owner, and the public URL.

## Plan
Branch: `005-deploy`
1. `Add clasp project and deploy scripts` (.clasp.json, package.json scripts, first deployment)
2. `Document deployment and public URL in README`

## Implementation Log
- Blocked. `clasp create-script` created project `1qhH9NrebBrpAHbJscuHVbLavr8BkbXm47n2Lb2M1rJ_I7q_ZxRkz0uWP` and `clasp push -f` succeeded. But `clasp create-deployment` failed with "ANYONE access has been disabled by your domain administrator."
  - clasp is logged in with a school Workspace account (edu domain). That domain forbids anonymous web apps.
  - Only the `@HEAD` dev deployment exists.
- Gotcha: `clasp create-script` overwrote `build/gas/appsscript.json` with a default manifest. Always rebuild before pushing.
- Resolved: the user chose to publish within the school domain. `webapp.access` is now `DOMAIN`.
- `6576524` Add clasp project and deploy scripts. First deployment `AKfycbyjQKEG…NIxc` (@2). `npm run deploy` then updated the same deployment to @3, so the URL stays stable.
- `060fd8c` Document deployment and public URL in README
- Decision: the public repository does not name the school domain. The README uses the generic `script.google.com/macros/s/<id>/exec` URL instead of the `/a/macros/<domain>/` form.
- Check: an unauthenticated request to the web app URL returns 302 to the domain's Google sign-in, as expected for `DOMAIN` access.

## Review
- **Divergence from the ticket:** the ticket required access "全員（匿名）". The Workspace admin forbids that, so it is `DOMAIN` (signed-in members of the school domain only). Agreed with the user. Recorded in `docs/context/overview.md`.
- **Not yet verified (acceptance criteria):** playing via the public URL, and saving the ranking to the spreadsheet. The owner must first open the URL and approve the `spreadsheets` OAuth scope in the browser, which Claude cannot do. Handed to the user.
- Not covered by this ticket: `docs/tickets/005.md` still says anonymous. It was left as written, since this Review records the change.

## PR
