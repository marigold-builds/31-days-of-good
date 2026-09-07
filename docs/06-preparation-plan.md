# 06 · Preparation Plan (September 2026)

October only works if September removes every decision and every setup task from the daily loop. Today is 6 September; there are 24 days.

## Week 1 · 7–13 Sep · Decide

- [x] Dom resolved the open questions on 6 Sep; see [07-decisions.md](07-decisions.md).
- [ ] Collision check on "31 Days of Good" comes back clean, or a new name is picked.
- [ ] Dom creates the `marigold-builds` GitHub org and the Marigold Builds accounts on Bluesky, a bot-friendly Mastodon instance, and dev.to; stores app passwords and API keys as org secrets. (Only Dom can create accounts.)
- [ ] Dom decides on a domain (optional, the only spend).
- [x] Struck the pre-assigned SDG calendar (Decided 21): `data/calendar.json` now carries only day and date; [../backlog/calendar.md](../backlog/calendar.md) keeps September's SDG-and-observance research as a marked, non-binding reference instead.

## Week 2 · 14–20 Sep · Build the machine

- [x] **Project scaffold template repo:** licence, README template, CI (tests on push), issue templates, CONTRIBUTING, SDG badge slot, `fixtures/` convention, release workflow. One for a Python CLI/library, one for a static web tool, one for a Node library or GitHub Action. Live as `marigold-builds/template-python-cli`, `marigold-builds/template-web-static`, `marigold-builds/template-node-action`.
- [ ] **Programme site:** static, one page, 31 tiles, daily log, digest archive, disclosure footer. Deployed to GitHub Pages or equivalent. Live at https://marigold-builds.github.io/31-days-of-good/. Digest archive not yet built; everything else on this line is live.
- [x] **Tile and social card generator:** designed once using the critic loop from [08-article-evaluation.md](08-article-evaluation.md); rendered automatically from the day's brief.
- [ ] **Publish pipeline:** GitHub Action that, on merge of a queue PR, posts to Bluesky (AT Protocol), Mastodon (bot-flagged account), and dev.to (API), and rebuilds the site. Tested end to end with a dry-run post Dom approves. Secrets are Dom's; the builder never handles them.
- [ ] **Queue PR convention** so Dom's 08:00 merge takes under five minutes.
- [ ] **Blind reviewer prompts** (README reviewer, screenshot reviewer) written and tested on an existing repo.
- [ ] **Open data register** verified: every API in [../backlog/open-data-register.md](../backlog/open-data-register.md) hit once, response saved as a sample fixture.
- [ ] **Lessons file** started: `docs/lessons.md`.

## Week 3 · 21–27 Sep · Dry runs

- [ ] **Dry run 1 (night of 22 Sep):** a full overnight on a low-stakes SDG slot, public repo named dry-run-1 (deleted afterwards; Free plan has no Pages for private repos), real time boxes, 20:45 start. Retro; fix the process.
- [ ] **Dry run 2 (night of 25 Sep):** a second full overnight, including the queue PR and the pipeline posting to a test account. Measure Dom's actual time at 08:00.
- [ ] Pre-seed Discover for days 1–5: research notes started, data sources verified, communities identified.
- [ ] Write the launch announcement, the disclosure page, and the FAQ ("Why an AI?", "Who is accountable?", "What happens after October?").
- [ ] Introduction emails drafted for the queue: Digital Public Goods Alliance, Hacktoberfest organisers, 5–10 people in civic tech / SDG data.

## Week 4 · 28–30 Sep · Launch

- [ ] Site live with the calendar and the disclosure.
- [ ] Announcement posts in the queue for 30 Sep evening and 1 Oct morning.
- [ ] Day 1 research pre-seeded (whatever it turns out to be — no project is pre-assigned, Decided 21); it is built the night of 30 Sep and goes live 08:00 on 1 Oct.
- [ ] Go / no-go with Dom on 29 Sep.

## Definition of ready (30 Sep)

1. A dry run has shipped a complete project inside the time boxes.
2. Dom's daily obligation measured at or under ten minutes, and the pipeline has posted a real test post on merge.
3. Every day's SDG slot has a verified data source.
4. Disclosure text approved and live.
5. Templates render from a brief without hand editing.
