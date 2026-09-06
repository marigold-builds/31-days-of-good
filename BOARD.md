# Board

State that outlives any one session. Read this before your first action and again before you report. If it disagrees with your memory, the board wins.

`state` is `open · doing · blocked · closed <sha>`. Row ids are `W<n>` (work) and `O<n>` (observed). Take the next number from the file, never from memory.

## Sessions

Announce yourself when you start; clear your row when you stop. Everyone works in main's checkout (no worktrees); do not run two implementers on the same repo at once.

| Session | Working in | On | Since |
| --- | --- | --- | --- |
| Fable (Claude Code, Dom's Mac) | main checkout, DoGood | W1–W5 done; handing over W6–W10 | 2026-09-06 |
| Opus 5 (controller, Claude Code desktop) | main checkout, DoGood | W11 final review | 2026-09-06 |

## Decided

Append-only. Never edit an entry; supersede it with a new one. Programme-level decisions are in `docs/07-decisions.md`; this list holds rulings made while building.

1. **Work on `main`, no worktrees.** Why: brand-new repo, one tree, one implementer at a time; a branch would have nothing to merge into. Cost if wrong: none material.
2. **`.superpowers/` is git-ignored.** Why: controller scratch (ledgers, briefs, review packages) must never reach the public repo.
3. **Tasks 6–9 of the scaffolds plan may run in parallel.** Why: separate directories under `/Users/dom/Documents/Coding/marigold-templates/`, separate repos, no shared files.
4. **`npm test` uses `node --test test/*.js`, not a bare directory.** Why: the directory form was unreliable on Node 22.23.1. Consequence: tests must sit directly in `test/`, not subfolders.
5. **The blind critic pass is run by the controller, never by an implementer.** Why: implementers do not dispatch subagents; the critic is a review seat.
6. **`og:image` is absolute, built from `SITE_ORIGIN` (default `https://marigold-builds.github.io`) + `BASE_URL`.** Why: social unfurls need scheme and host; the plan's relative path was a defect.
7. **The CLI entry guard uses `pathToFileURL(process.argv[1]).href`.** Why: the `pathname` comparison silently fails on paths containing spaces.
8. **Index cards show no status label while `planned`.** Why: critic scored the 31 repeated "Planned" labels as noise; the header already says how many shipped.
9. **Day pages keep their own `<h1>` even though the share card repeats it.** Why: a page needs a real heading for accessibility and search; the card is an image.
10. **Controller work is delegated to a cheaper session; Fable is opened only for judgement.** Why: dispatch, packaging and ledgering are mechanical; plan-writing, rulings that override a plan, the final whole-branch review, and the nightly Discover/Define need judgement. See `docs/10-controller-brief.md`.
11. **Commit trailers name the model that actually authored the commit** (`Claude Haiku 4.5`, `Claude Sonnet 5`, `Claude Opus 5`), not the plan's hard-coded `Claude Fable 5.1`. Why: supersedes that Global Constraint, which was written when Fable was the only session (see Decided 10); a programme whose premise is honest disclosure must not misattribute its own commits. Cost if wrong: cosmetic attribution in template-repo history.
12. **Template repos' `npm test` is `node --test test/*.js`, not `node --test test/`.** Why: Decided 4 — the bare-directory form was unreliable on Node 22.23.1, and plan Tasks 7 and 8 both carry the directory form. Cost if wrong: none; the glob form is strictly more explicit and the runners are Node 22 too.
13. **Templates commit their lockfiles; that is house style.** Why: supersedes the weaker "harmless" reasoning behind O9. `ruff>=0.6` unpinned means a future ruff formatting change turns `ruff format --check` red across 31 unmaintained repos at once; a committed lock is what prevents that. CI stays without `--locked` so a clone's stale `name = "tool"` lock self-heals, and `uv lock` goes on the rename checklist. Cost if wrong: one file in each derived repo.
14. **Plan provenance does not lower a finding's severity when the plan's own code contradicts the thing it builds.** Why: the O11 ruling graded the missing service-worker error handling Minor because the plan mandated the code. The final review overturned that — `template-web-static` is described as offline-first, is not, and every clone inherits it. Supersedes the O11 ruling. Cost if wrong: none; the fix is small either way.
15. **The single final-review fix wave is split into two parallel dispatches along the repo boundary** (W19 programme repo, W20 templates). Why: subagent-driven-development calls for ONE fix dispatch to avoid per-finding context rebuilds, but these are four repos with no shared files, and one agent carrying seven Important findings across all of them is the context bloat that rule exists to prevent. Cost if wrong: two scoped re-review seats instead of one.

## Open

| id | item | owner | pri | state | note |
| --- | --- | --- | --- | --- | --- |
| W6 | Template repo `template-python-cli` (plan Task 6) | impl | 1 | closed 47edae0 | `marigold-builds/template-python-cli` live, `is_template`, CI green; sha is in that repo |
| W7 | Template repo `template-web-static` (plan Task 7) | impl | 1 | closed 33f2885 | `marigold-builds/template-web-static` live, `is_template`, Pages green, subpath assets all 200; sha is in that repo |
| W8 | Template repo `template-node-action` (plan Task 8) | impl | 1 | closed 5cc2f2f | `marigold-builds/template-node-action` live, `is_template`, both CI jobs green; sha is in that repo |
| W9 | Org profile repo `.github` (plan Task 9) | impl | 2 | closed 6d5c1e4 | `marigold-builds/.github` live; sha is in that repo, not this one; review clean |
| W10 | Close the loop in programme docs (plan Task 10) | impl | 2 | closed 05c0051 | docs, README and daily process now describe the live site and templates; CI and Pages green |
| W11 | Final whole-branch review of the scaffolds plan | Fable | 1 | doing | Fable subagent review done: no Critical, 7 Important, findings in `.superpowers/sdd/2026-09-06-scaffolds-and-site/final-review-findings.md`. Closes when W19 and W20 land and the scoped re-reviews pass |
| W19 | Final-review fix wave A: programme repo (markdown renderer, log validation, tile overflow, index OG tags, O2/O3/O4, doc and plan corrections) | impl | 1 | doing | From W11's findings file; Opus 5 controller, sonnet impl |
| W20 | Final-review fix wave B: three template repos (PWA service worker, node24 runtime, TEMPLATE.md rename checklists, O8/O10, licence placeholder, `.github` content licence) | impl | 1 | doing | From W11's findings file; Opus 5 controller, sonnet impl |
| W12 | Publish pipeline: Action posts to Bluesky, Mastodon, dev.to on queue-PR merge | impl | 1 | blocked | Blocked on Dom creating the accounts and storing secrets (`docs/07-decisions.md` still-open list); design first as a plan |
| W13 | Verify every API in `backlog/open-data-register.md` and save a fixture per SDG | impl (haiku) | 2 | open | Mechanical; one script, one fixture dir; note rate limits found |
| W14 | Blind README reviewer and screenshot reviewer prompts, tested on an existing repo | Fable | 2 | open | `docs/06-preparation-plan.md` week 2 |
| W15 | Dry run 1, night of 22 Sep, public repo `dry-run-1` | Fable | 1 | open | Full overnight, real time boxes, per `docs/02-daily-process.md` |
| W16 | Dry run 2, night of 25 Sep, including queue PR and pipeline | Fable | 1 | open | Depends on W12 |
| W17 | Launch copy: announcement, disclosure page, FAQ | impl | 2 | open | Week 3 of `docs/06-preparation-plan.md` |
| W18 | Intro emails drafted for the queue (DPGA, Hacktoberfest organisers, 5–10 people) | impl | 3 | open | Dom sends; drafts only |

## Observed

Findings carry `path:line @ sha`. A finding without a sha is unverified.

| id | finding | where | note |
| --- | --- | --- | --- |
| O1 | Site live and tiles render text in CI (fonts-dejavu-core installed in the workflow) | `https://marigold-builds.github.io/31-days-of-good/` @ 5bd68ed | checked in browser 2026-09-06 |
| O2 | Deferred minor: `repo`/`demo` hrefs on day pages are entity-escaped but not scheme-validated | `site-build/lib/html.js` @ 0062964 | trusted front matter today; validate if the trust boundary changes |
| O3 | Deferred minor: `siteOrigin` accepted but unused in `renderIndex` | `site-build/lib/html.js` @ 0062964 | harmless; drop or use for `og:image` on the index |
| O4 | Deferred minor: tile colour attribute interpolated unescaped from trusted `data/sdgs.json` | `site-build/lib/tile.js` @ 47b47ad | validate `#RRGGBB` if the source ever changes |
| O5 | Deferred minor: `tilePng` test checks the PNG magic only, not dimensions | `site-build/test/tile.test.js` @ 47b47ad | add a width/height check when convenient |
| O6 | **False-finding trap:** opening `site/index.html` via a bare `file://` URL in the Browser pane renders with no CSS. Serve `site/` over HTTP (the build assumes `BASE_URL=/31-days-of-good/`, so symlink it under that path) before judging styling. | Browser pane, 2026-09-06 | cost one implementer a detour |
| O7 | Critic scores after fix round: tile 8/10, index 7/10 with the "Planned" labels removed since | `.superpowers/sdd/.../progress.md` | re-score at W11 if desired |
| O8 | Deferred minor: `.editorconfig`'s `[*.{yml,yaml,json,md}]` block is redundant now the root block is also `indent_size = 2` | `template-node-action/.editorconfig:9` @ 5cc2f2f | leftover from Task 6's Python structure where the two differed; zero functional effect |
| O9 | Deferred minor: `uv.lock` is committed although the brief neither listed nor ignored it; it pins `name = "tool"`, which every repo cloned from the template renames | `template-python-cli/uv.lock` @ 47edae0 | ruled harmless for now (`uv run` re-resolves; CI passes no `--frozen`/`--locked`); the Node templates are dependency-free so there is no cross-template inconsistency. W11 decides whether templates ship lockfiles as house style |
| O10 | Deferred minor: same redundant `[*.{yml,yaml,json,md}]` `.editorconfig` block as O8, in the second template | `template-web-static/.editorconfig:9` @ 33f2885 | fix both templates together or neither; zero functional effect |
| O11 | Deferred minor: service-worker registration in `app.js` and the `fetch` handler in `sw.js` have no `.catch`/offline fallback, so a failed registration or a cache-miss-while-offline surfaces an unhandled rejection | `template-web-static/app.js`, `sw.js` @ 33f2885 | inherited verbatim from the plan's own code, not implementer drift; every project cloned from the template inherits it, so worth fixing at W11 |
| O12 | Deferred minor: `docs/06-preparation-plan.md` writes the templates as `marigold-builds/template-*` where `README.md` uses the bare names | `docs/06-preparation-plan.md:15` @ 05c0051 | cosmetic inconsistency inside one commit |
