# 01 · Strategy

## The one-sentence version

Prove, in public and in 31 days, that an AI builder with a clear process and a human director can produce a steady stream of small, genuinely useful open-source tools for the Sustainable Development Goals, and hand them to people who will keep them alive.

## Why this is worth doing

- **Optimism is a deliverable.** The SDG conversation is dominated by deficit framing. Thirty-one working artefacts, one per day, is a concrete counter-story that people can fork.
- **Small tools are under-served.** Large NGOs build platforms. Nobody funds the 400-line CLI that a field worker, teacher, or council clerk actually needs. One-day scope is a feature, not a limitation.
- **It is a live case study.** Whether an AI can be trusted with sustained, transparent open-source work is an open question in 2026. Running the experiment honestly, with disclosed authorship and visible failures, is itself a contribution.

## Who it is for

| Audience | What they get | What we need from them |
|----------|---------------|------------------------|
| **Practitioners** (NGO staff, teachers, civic techs, researchers) | A tool that solves a real, narrow problem today | Feedback, issues, and ideally adoption |
| **Developers** who care about impact | Forkable, well-documented starting points; a template for their own "day of good" | Stars, contributions, stewardship of a project after October |
| **The AI-curious** | An honest, day-by-day account of what an AI builder can and cannot do | Attention and scrutiny |
| **Dom** | A portfolio of 31 shipped things, a repeatable method, and a story | Direction, vetoes, and publishing approval |

## What "success" means

Stars are a vanity metric here. The programme succeeds if, by 30 November 2026:

1. **31 of 31 days shipped** a working, tested, documented, licensed v0.1.0. A day that ships nothing is logged as a failure, publicly.
2. **At least 5 projects have an external contributor** (a merged PR or a substantive issue from someone who is not Dom).
3. **At least 3 projects have a named steward** who agrees to maintain them past October.
4. **At least 3 projects are used** by an organisation or person for the purpose they were built for, with a citation or testimonial we can publish.
5. **The process is reusable**: someone else could run "a day of good" from the templates alone.

Secondary, tracked but not targeted: stars, forks, unique visitors to the programme site, newsletter subscribers, press or podcast mentions.

## Principles

1. **Ship complete or ship nothing.** No "MVP for later". Every project has tests, a README a stranger can follow, a licence, a working demo or screenshot, and a tagged release.
2. **Small enough to finish, real enough to matter.** The problem must be one a specific person has. If we cannot name who would use it on Tuesday, it is not chosen.
3. **Open data, open licence, open process.** MIT or Apache-2.0 code, CC-BY-4.0 for content, cited data sources, public daily brief and retro.
4. **Disclosed authorship, always.** Every repo, post and README says it was built by an AI (Claude) directed by Dom. No human-passing persona.
5. **Do no harm, especially to the vulnerable.** No project collects personal data of at-risk groups, gives medical or legal advice, or replaces a professional judgement. See the exclusion list in [03-selection-criteria.md](03-selection-criteria.md).
6. **Restraint is quality.** Fewer features, fewer dependencies, fewer words. The bar is "a good engineer would be proud to have written this in a day".
7. **Failures are content.** A day that misses is written up with the same honesty as a day that lands.
8. **Hand-off is part of the build.** Every project ends with a CONTRIBUTING file, good-first-issues, and an explicit "looking for a steward" call.

## Constraints we are working within

- **One overnight per project.** Roughly eight hours of agent time from 20:45 to about 05:00 CET, including research, marketing prep and retro. Budget is fixed in [02-daily-process.md](02-daily-process.md).
- **The builder cannot publish on its own, but a pipeline Dom owns can.** Posting to social platforms, creating accounts, and accepting terms need Dom's approval. The playbook is built around a **publish queue as a pull request**: a GitHub Action that Dom configures once posts to Bluesky, Mastodon and dev.to when Dom merges the day's queue PR. Dom's daily act is one merge. See [05-marketing-playbook.md](05-marketing-playbook.md).
- **Zero budget.** Free tiers, GitHub Pages for every demo, open APIs, no package registries (GitHub releases only). A domain is the one optional purchase, Dom's call.
- **Timezone and cadence.** Dom is in Europe (CET). Research starts 20:45, the brief is posted at 23:00, the build runs overnight, and the launch goes out at 08:00 when Dom merges the queue PR. Europe sees it at breakfast; the Americas see it on waking.
- **Decisions already made** are logged in [07-decisions.md](07-decisions.md).

## Strategic bets

- **Bet 1: Alignment with UN observance days.** October is dense with international days (Teachers, Mental Health, Girl Child, Handwashing, Food, Poverty Eradication, UN Day, Cities). Building the matching tool on the matching day gives each launch a ready-made hook and hashtag. Calendar in [../backlog/calendar.md](../backlog/calendar.md).
- **Bet 2: October is already open-source month, but the on-ramp has changed.** Hacktoberfest 2026 (run by Major League Hacking and DEV, DigitalOcean presenting) has retired the pull-request-count mechanic and moved to "Fests": local and online build events themed "AI belongs to everyone". The legacy funnel of tagging repos and waiting for drive-by PRs is gone. The new opportunity is to position 31 Days of Good as a Fest-style story (an AI building openly, all month) and to seek a listing or cross-mention rather than PR farming. Every project still ships good-first-issues, because criteria 2 and 3 depend on them, but the contributors will come from targeted outreach, not from a badge.
- **Bet 3: A single home.** One programme site with a 31-tile calendar, one handle, one hashtag, one weekly digest. Daily posts are the drip; the calendar page is the thing people bookmark and share.
- **Bet 4: Meta-tools first and last.** Day 1 ships something that helps other repos declare their SDG alignment (a badge and GitHub Action). Day 31 ships the "run your own day of good" kit. The programme markets itself through its own tools.

## Risks and mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Projects are toys nobody uses | High | Selection criterion "named user on Tuesday"; ask a real practitioner community during Discover when possible; prefer tools over demos |
| "AI slop" backlash from OSS maintainers | High | 2025–26 climate is hostile to AI *volume* (curl closed its bug bounty, tldraw closed external PRs, Gentoo and NetBSD ban AI code). Mitigation: every project is a new, standalone repo and we never open PRs into other people's projects; disclosure is loud and specific (model, version, what Dom directed); tests and docs above the median human repo; every issue answered within 24h in October; promotion leads with the SDG story, never with shipping speed |
| Burnout of the human director | Medium | Dom's daily obligation is capped at ~20 minutes: read brief, clear publish queue, veto if needed |
| Abandoned repos after October | High | Stewardship call in every launch; archive-with-honesty policy for projects with no steward by 31 Dec 2026 (README banner, not deletion) |
| Platform policies on AI-authored content | Medium | Research per channel before launch (see playbook); post from Dom's account with disclosure, never from a bot account without platform consent |
| A day over-runs and ships nothing | Medium | Hard stop at Develop budget; scope-cut ladder in the daily process; "ship the smaller thing" rule |
| Data source goes down or is misread | Medium | Cache a sample dataset in each repo; cite source and retrieval date; tests run against fixtures |
| Harm through a poorly-judged project | Low but severe | Exclusion list; Dom's veto at the brief stage; "would a domain expert wince?" check |
