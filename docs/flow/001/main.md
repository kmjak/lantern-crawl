# Flow: 001

| Field   | Value                              |
|---------|------------------------------------|
| Status  | pr:in-progress                     |
| Ticket  | docs/tickets/001.md                |
| Branch  | 001-project-setup                  |
| Updated | 2026-09-22 19:20                   |

> The user authorized running the gates autonomously, including self-merging PRs (2026-09-22).

## Research
- The repo contains only docs (context, tickets). No code yet.
- Tools available locally: node v22.15.0, clasp 3.4.1 (logged in), gh (logged in as kmjak).
- GAS constraints that matter here:
  - HtmlService serves only `.html` files as client assets. Client CSS/JS must be inlined, via `include()` in a template.
  - A `<meta name="viewport">` in the template is ignored inside the GAS iframe. It must be set with `HtmlOutput.addMetaTag`.
  - clasp pushes `.js` files as server-side scripts. Client JS must therefore not be pushed as `.js`.

## Approach
- Keep the source readable: real `.css` / `.js` files under `src/client/`. A dependency-free Node build script generates:
  - `build/gas/`: the clasp rootDir. Server `.js` files and the manifest are copied. Client `.css` / `.js` are wrapped in `<style>` / `<script>` and written as `.html` partials. The template is copied unchanged.
  - `build/local/index.html`: one self-contained file. `<?!= include('x') ?>` is resolved at build time, a viewport meta tag is added, and a `google.script.run` stub backed by `localStorage` is injected.
- Tests use the Node built-in runner (`node --test`), so there is no dependency to install.
- `build()` is exported so that a test can build into a temp dir and check the output.

## Plan
Branch: `001-project-setup`
1. `Add package.json, README and GAS manifest`
2. `Add minimal server and client sources`
3. `Add build script for GAS and local preview` (+ build test)

## Implementation Log
- `3f8acff` Add package.json, README and GAS manifest
- `0db583e` Add minimal server and client sources
- `522a43a` Add build script for GAS and local preview
- Decision: the local stub lives in `scripts/local-stub.js` (not `src/`). It is injected only into the local build and must never be pushed to GAS. Server functions are looked up on `window.LocalServer`, which later tickets fill in.
- Decision: `build.mjs` throws if a client file contains `</script>` / `</style>`, since that would break the inlining.

## Review
- `.gitignore` was added in the initial commit on `main`, not on this branch. It has the same content the ticket asked for, so no action.
- Acceptance "page displays in a browser" is covered only by the build test (self-contained HTML, stub before client code). It was not checked visually because the page has only a title. The browser check is done in 003, where there is real UI.
- Otherwise no divergences from the ticket, Approach or Plan.

## PR
