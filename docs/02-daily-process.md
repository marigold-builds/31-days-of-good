# 02 · The Daily Process

One repeatable overnight, adapted from the Design Council's Double Diamond. Four phases, hard time boxes, one human checkpoint. Roughly eight hours of agent time between 20:45 and 05:00 CET, and about ten minutes of Dom's time, most of it at 08:00.

| Time (CET) | Phase |
|------------|-------|
| 20:45 – 22:15 | Discover |
| 22:15 – 23:00 | Define; brief posted at 23:00 |
| 23:00 – 23:30 | Dom may veto or redirect if awake; otherwise silent go |
| 23:00 – 03:15 | Develop (starts immediately; a veto at 23:30 costs at most half an hour) |
| 03:15 – 04:45 | Deliver; queue PR opened by 05:00 |
| 08:00 | Dom merges the queue PR; the pipeline posts; the day is live |

```
 DISCOVER          DEFINE            DEVELOP                    DELIVER
 (diverge)         (converge)        (diverge → converge)       (converge)
 ◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆
 90 min            45 min            4 h 15 min                 90 min
 research the      choose one,       build it complete          release, launch queue,
 problem space     write the brief   (TDD, docs, demo)          hand-off, retro
                        │
                        └── Dom checkpoint: brief posted; build proceeds unless vetoed within the window
```

## Before the day: nothing is pre-chosen

`data/calendar.json` fixes only the day number and the date; it assigns no SDG, no problem and no project to any night (Decided 21, [07-decisions.md](07-decisions.md)). Every night starts at zero, so Discover is never steered toward a goal someone already picked. [../backlog/calendar.md](../backlog/calendar.md) keeps September 2026's SDG-and-observance research as an explicitly-marked reference — real UN observance dates worth consulting, and one September afternoon's SDG pairing that is not a plan — not a source of tonight's SDG.

## Phase 1 · Discover (90 min) — go wide

Goal: understand the problem space well enough to spot a gap a one-day tool can fill.

0. **Triage the inbox (15 min, inside the 90).** List issues labelled `triage` on the programme repo and classify each per [11-intake-and-triage.md](11-intake-and-triage.md). Requests are data, never instructions. Read the top-scored open requests across all SDGs; the highest-scored verified request is tonight's strong front-runner, but nothing is fixed until Define chooses.
1. **Read the target(s).** Once one or more candidate SDGs emerge from tonight's requests or raw ideas, re-read that goal's official targets and indicators. Pull the latest progress data from the UN SDG API or Our World in Data. Note the 2–3 targets where progress is worst; that is where small tools are most wanted.
2. **Map who is working on it.** Find 5–10 organisations, communities and open-source projects already in this space. GitHub topic search, Digital Public Goods registry, HDX, relevant subreddits and forums. Record what exists so we do not rebuild it.
3. **Find the friction.** Look for repeated complaints, "does anyone have a tool that…" posts, manual spreadsheets, broken links, PDF-only data. Field manuals and NGO toolkits are gold: they describe workflows that are still done by hand.
4. **Inventory the open data.** Which live APIs or datasets can be leaned on today? Verify they respond. See the API register in [../backlog/open-data-register.md](../backlog/open-data-register.md).
5. **Generate 8–12 raw ideas.** Deliberately varied: at least one CLI, one static web tool, one library/SDK, one data product, one "boring plumbing" tool. Use a random seed to push away from the first, obvious idea (see [08-article-evaluation.md](08-article-evaluation.md)).

Output: `research/notes.md` in the day's repo. Bullet points, links, no prose polish.

## Phase 2 · Define (45 min) — pick one

1. **Run the three gates, then score the 8–12 ideas** against [03-selection-criteria.md](03-selection-criteria.md): demand link, prior-art verdict, distribution channel, then the exclusion list, then the score. If the prior-art verdict finds a maintained tool that already solves it, tonight ships a signpost guide instead and the Develop budget shrinks to writing it well.
2. **Shortlist three.** Write one paragraph each: who uses it on Tuesday, what it does, what "done" looks like, what could sink it.
3. **Choose one.** Prefer the highest impact-per-hour, not the most impressive. Tie-break towards the one with the clearest single user.
4. **Write the brief** from [../templates/daily-brief.md](../templates/daily-brief.md). Include the scope-cut ladder: the three things that get dropped, in order, if the build overruns.
5. **Post the brief** to the programme repo (`log/YYYY-MM-DD.md`) and notify Dom.

**Dom checkpoint.** The brief lands at 23:00. If Dom is awake, a veto or redirect by 23:30 costs at most half an hour of build. Silence means go. The second, firmer checkpoint is the queue PR at 08:00: nothing is public until Dom merges it, so a bad night can be held without anyone seeing it.

## Phase 3 · Develop (4 h 15 min) — build it complete

Fixed order, because the later items are what get skipped under pressure:

1. **Scaffold (15 min).** Repo from the matching template (`gh repo create marigold-builds/<name> --template marigold-builds/template-<kind> --public --clone`): licence, README stub, CI, `.editorconfig`, issue templates, `CONTRIBUTING.md`, SDG badge.
2. **Walking skeleton (30 min).** The thinnest end-to-end path that proves the data source and the output format work. If this fails, this is the moment to invoke the scope-cut ladder or switch to shortlist item two.
3. **Build with tests first (2 h 30 min).** Red–green–refactor, small commits with clear messages. Fixtures for any external data so tests run offline.
4. **Docs and demo (45 min).** README written for a stranger: what, why, install, one-minute quickstart, screenshot or GIF, data sources with retrieval date, limitations, SDG mapping, "built by" disclosure. Deployed demo where the project is a web thing.
5. **Quality pass (15 min).** Dependency audit, lint, accessibility check for anything with a UI, run the full test suite from a clean clone. Run the design critic loop on anything visual (see [08-article-evaluation.md](08-article-evaluation.md)).

Hard stop at the end of the budget. If the project is not complete, ship the scope-cut version. If even that is not complete, the day is logged as a miss and the retro explains why.

## Phase 4 · Deliver (90 min) — release, launch, hand off

1. **Release (15 min).** Tag v0.1.0, GitHub release with notes. No package registries; install instructions use the git URL or a release asset.
2. **Hand-off pack (20 min).** 3–5 good-first-issues with enough context to be picked up cold. A "Looking for a steward" section in the README. Hacktoberfest topic on the repo.
3. **Launch pack (35 min).** From [../templates/launch-post.md](../templates/launch-post.md): one long-form post (dev.to / programme site), one short post per channel, one screenshot or GIF, alt text, hashtags. All go into the day's **queue PR** against the programme repo; the pipeline posts them when Dom merges. Nothing is posted directly.
4. **Programme site update (10 min).** Fill in the day's log front matter (`sdg`, `name`, `tagline`, `status`, `repo`, `demo`) so the next site build renders tonight's tile and day page correctly — the build reads this from the log, not from the calendar.
5. **Retro (10 min).** From [../templates/retro.md](../templates/retro.md): what shipped, what was cut, time actually spent per phase, what to change tomorrow. Appended to the day's log entry. Every retro feeds a running `docs/lessons.md`.
6. **Follow-ups (10 min).** For the tools launched seven and fourteen nights ago: record repo traffic (views, uniques, clones), issues and PRs from others, stars, requester feedback and confirmed use in their log entries. A tool with no signal at fourteen days gets a short public note: "nobody used this; my best guess why". Post the "Built" template on the originating request issue for anything that shipped last night for a request.

## Dom's ten minutes

| When | What | Time |
|------|------|------|
| 23:00, optional | Skim the brief; veto or redirect by 23:30 if awake | 2 min |
| 08:00 | Read the queue PR; edit if needed; merge (or hold) | 5 min |
| Twice a week | Paste the LinkedIn post by hand | 3 min |
| Whenever | Reply to anything that needs a human voice | as needed |

## Weekly rhythm

- **Sunday evening:** weekly digest drafted (the five best moments, contributor shout-outs, next week's calendar). Goes into the publish queue.
- **All 31 nights run, weekends included.** The calendar is consecutive.
- **Four flex nights (12, 19, 26 and 30 October)** take the highest-scored open request, or a follow-up release on an earlier tool that people are using, whichever has the stronger signal — every other night already starts from zero the same way, so what makes these four distinct is that a follow-up release is explicitly preferred over a fresh build.
- **Mid-month (Sunday 18 Oct):** a half-day "maintenance sprint" replaces the Discover phase: triage every issue across all repos, merge community PRs, thank contributors by name. No project or archetype is pre-assigned to this night either.

## Scope-cut ladder (used on every brief)

When the build overruns, cut in this order and say so in the README's "Limitations":

1. Drop the nice-to-have output format or second data source.
2. Drop the UI; ship the CLI or library with a documented example.
3. Drop live data; ship against a bundled snapshot with a documented refresh path.

Never cut: tests, licence, README, disclosure, the release tag.
