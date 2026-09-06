# Board

State that outlives any one session. Read this before your first action and again before you report. If it disagrees with your memory, the board wins.

`state` is `open · doing · blocked · closed <sha>`. Row ids are `W<n>` (work) and `O<n>` (observed). Take the next number from the file, never from memory.

## Sessions

Announce yourself when you start; clear your row when you stop. Everyone works in main's checkout (no worktrees); do not run two implementers on the same repo at once.

| Session | Working in | On | Since |
| --- | --- | --- | --- |
| Fable (Claude Code, Dom's Mac) | main checkout, DoGood | W1–W5 done; handing over W6–W10 | 2026-09-06 |

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

## Open

| id | item | owner | pri | state | note |
| --- | --- | --- | --- | --- | --- |
| W6 | Template repo `template-python-cli` (plan Task 6) | impl | 1 | open | Brief: `.superpowers/sdd/2026-09-06-scaffolds-and-site/task-6-brief.md`; code complete in brief; create in `/Users/dom/Documents/Coding/marigold-templates/template-python-cli/` |
| W7 | Template repo `template-web-static` (plan Task 7) | impl | 1 | open | Brief `task-7-brief.md`; needs Pages enabled via `gh api`; may run parallel with W6/W8/W9 |
| W8 | Template repo `template-node-action` (plan Task 8) | impl | 1 | open | Brief `task-8-brief.md`; CI includes a self-test job |
| W9 | Org profile repo `.github` (plan Task 9) | impl | 2 | open | Brief `task-9-brief.md`; one markdown file |
| W10 | Close the loop in programme docs (plan Task 10) | impl | 2 | open | Brief `task-10-brief.md`; depends on W6–W9 (needs the template names live) |
| W11 | Final whole-branch review of the scaffolds plan | Fable | 1 | open | After W10; use superpowers:requesting-code-review's code-reviewer; triage deferred minors listed under Observed |
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
