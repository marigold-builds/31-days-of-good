# 05 · Marketing Playbook

Marketing here means two things: getting each tool in front of the person it was built for, and telling the month-long story honestly enough that people trust it. Both run through a **publish queue as a pull request** that Dom merges once a day at 08:00; a GitHub Action Dom configures does the posting. The builder never posts directly.

Names and tags: programme **31 Days of Good**, builder **Marigold Builds**, primary hashtag **#MarigoldBuilds**, secondary **#31DaysOfGood** (pending the collision check in [07-decisions.md](07-decisions.md)).

Grounded in channel research done September 2026 (summarised in [09-research-notes.md](09-research-notes.md)). The headline finding: the 2025–26 climate is tired of AI *volume*. Speed is the thing we do not brag about.

## The message

**Lead:** "One small open-source tool a day for the Sustainable Development Goals. Built in the open by an AI, directed by a human, handed to people who need it."

**Never lead with:** how fast it was built, how many lines, how little human effort. Those are the exact attributes the audience currently associates with slop.

**Always include:** who the tool is for, which SDG target it serves, one honest limitation, the disclosure, and the ask (try it, file an issue, or steward it).

## Channel plan

| Channel | Cadence | What goes there | Rule |
|---------|---------|-----------------|------|
| **Programme site** (calendar + daily log) | Daily | The canonical record: tile, brief, retro, links | Everything else links here |
| **GitHub org** `marigold-builds` | Daily | The repos, releases, good-first-issues, a pinned README with the calendar | Org profile carries the disclosure |
| **dev.to** | Daily long-form, **automated** | The day's write-up: problem, research, what shipped, what was cut | Posted via the dev.to API on merge; AI authorship disclosed in the first paragraph, as dev.to asks |
| **Bluesky** | Daily short, **automated** | Tile image plus one sentence from the Marigold Builds account | Posted via the AT Protocol API on merge; profile bio carries the disclosure |
| **Mastodon** | Daily short, **automated** | Same as Bluesky | Account must be on an instance that allows flagged bot accounts (mastodon.social or botsin.space-style instances), marked as a bot, with the disclosure in the bio. **Not Fosstodon**, which forbids unattended posting. Dom replies to replies |
| **LinkedIn** | Twice a week, **manual** | Story-of-the-week, practitioner-facing, disclosure up front | No practical posting API; Dom pastes from the queue. LinkedIn's 2026 policy ranks on AI disclosure |
| **X (Dom's personal account)** | 5–7 times in the month, **manual** | Launch, the four Sunday digests, one or two standout tools, the retrospective, quoted in Dom's own voice | Amplifier, not a channel: no Marigold Builds account on X. Dom's ~5k followers are Web3 and AI-curious; the public-goods framing fits, anything resembling crypto fundraising does not, at least until November |
| **Reddit** | At most 2–3 times in the month, one sub per post | Only when a project fits a specific sub (r/selfhosted for a self-hostable tool, a domain sub for a domain tool) | No cross-posting the same text; disclose affiliation and AI authorship; 90/10 rule |
| **Show HN** | Once, maybe twice | One flagship: the retrospective at month end, or the single strongest tool | Daily Show HN posts will be flagged as promotion; neutral title, no exclamation marks |
| **Product Hunt** | Zero or once | Only for the "run your own day of good" kit on Day 31, if at all | Daily launches read as spam; the platform's value for discovery has declined |
| **Weekly digest** (email or site post) | Sundays | Five best moments, contributor shout-outs, next week's SDG calendar | The one thing people can subscribe to |
| **Direct outreach** | Daily, 1–3 messages | The actual named user or community from the brief, told about the tool built for them | Personal, specific, from Dom; this is where adoption comes from |

## The publish queue and the pipeline

Each night ends with a pull request against the programme repo adding `queue/YYYY-MM-DD.md` (every post in final form, channel, image path, alt text) and the day's calendar tile. On merge, a GitHub Action posts the Bluesky, Mastodon and dev.to items and rebuilds the site. Dom's job is to read, edit if needed, and merge at 08:00. Target: five minutes.

Set-up, done once in September by Dom: create the Marigold Builds accounts on Bluesky, a bot-friendly Mastodon instance, and dev.to; generate an app password or API key on each; store them as secrets in the `marigold-builds` org. The builder writes the workflow and tests it against a dry-run post; it never sees the secrets.

Why this design: the safety rules the builder runs under treat every public post, every account, and every accepted terms-of-service as needing a human's explicit approval. The merge is that approval, and it means a human has read every public word before it goes out. That fact goes in the disclosure. If Dom later wants zero daily effort, auto-merge at 08:00 is a one-line change, with after-the-fact review.

## Launch post anatomy (daily)

1. **Tile image** with alt text: day number, SDG icon, project name.
2. **One sentence:** what it does and for whom.
3. **One sentence:** the SDG target it serves, by number.
4. **One sentence:** the limitation.
5. **One link:** the repo (or the demo, with the repo one click away).
6. **The ask:** try it, break it, or steward it.
7. **Disclosure line** (short form): "Built by Marigold Builds (Claude), directed by Dom. Day N of 31."

Full variants per channel live in [../templates/launch-post.md](../templates/launch-post.md).

## Month arc

| Phase | Days | Marketing focus |
|-------|------|-----------------|
| **Launch** | 30 Sep – 2 Oct | Announce the programme, the calendar, the disclosure, and the Day 1 meta-tool. One LinkedIn post, one Bluesky/Mastodon thread, the site goes live at 08:00 on 1 Oct with Day 1 already shipped (built the night of 30 Sep). Email 5–10 people in the SDG/civic-tech space personally. |
| **Build trust** | 3 – 12 Oct | Daily rhythm. First weekly digest. First "here is what went wrong" retro post, deliberately early. Outreach to the named user for each tool. |
| **Observance cluster** | 13 – 17 Oct | Disaster Risk Reduction, Rural Women, Handwashing, Food Day, Poverty Eradication fall in five days. Pre-announce the cluster; tag the relevant UN agency accounts respectfully once each, not daily.  |
| **Momentum** | 18 – 24 Oct | Maintenance sprint on the 18th is itself a post: "we merged your PRs". Contributor and steward stories. UN Day (24 Oct) gets the partnership tool (SDG 17). Pitch one podcast or newsletter for a month-end feature. |
| **Close** | 25 – 31 Oct | World Cities Day (31 Oct) closes the calendar. Day 31 ships the "run your own day of good" kit. Show HN the retrospective in the first week of November, when the numbers are real. |
| **Afterlife** | Nov – Dec | Stewardship hand-offs. Archive-with-honesty banner on anything unstewarded by 31 Dec. One "what we learned" long-form. |

## The request form is marketing

Every "tell us what you need" post is both intake and promotion, and it puts practitioners at the centre of the story before a line of code exists. The September ask ("what small tool would help your work?") goes to practitioner networks, the Digital Public Goods community, civic-tech brigades and teacher and WASH forums, from Dom's accounts, with the form link. Every daily launch post that was built for a request says so and credits the requester (with their consent). See [11-intake-and-triage.md](11-intake-and-triage.md).

## Community track: your day of good

Anyone can build one good thing a day with their own credits and post it under `#31DaysOfGood`. There is no submission, no moderation and no gallery to maintain; the hashtag is the gallery. What we publish is the bar, so the tag stays worth something:

> **A good thing** has a named user, an SDG target by number, an open licence, tests, one stated limitation, and a disclosure if AI helped build it. Requests other people can build are in the [intake inbox](https://github.com/marigold-builds/31-days-of-good/issues?q=label%3Arequest%2Freal).

The inbox is the point of contact between the two tracks: more real needs than one builder can serve, open to anyone. Seed the community track in the week 3 digest, launch the "run your own day of good" kit on Day 31, and register "A Day of Good" as an online Fest with the Hacktoberfest 2026 organisers so it has a date and an audience without Dom running an event.

## Partnerships worth one email each

- **Digital Public Goods Alliance.** Certification is too slow for a day-old repo, but their nine indicators are a credible quality bar to design against, and their community is the right audience. One introduction email in September.
- **Hacktoberfest 2026 organisers (MLH / DEV).** Ask whether an open, month-long AI-built programme can be listed as a Fest or mentioned. Their own theme is "AI belongs to everyone"; the fit is real.
- **Our World in Data, HDX, OpenAQ, iNaturalist, and any other data provider whose API a project uses.** Tell them the day the tool ships; providers often amplify things built on their data.
- **One or two practitioner networks per SDG cluster** (teachers' forums, WASH practitioners, civic-tech brigades). Found in Discover, contacted in Deliver.

## Metrics we track (weekly, in the digest)

- Projects shipped / partial / missed
- Issues and PRs from people other than Dom
- Stewards signed up
- Confirmed uses (a person or org said they used it for the purpose)
- Repo visitors and stars, for context only
- Digest subscribers

## Things we will not do

- Post from an unattended bot account anywhere the instance or platform forbids it, or without the bot flag and disclosure where it is allowed.
- Open pull requests into other people's repositories as part of the programme.
- Tag or DM the same person or organisation more than once in the month without a reply.
- Run paid promotion.
- Describe any project as "AI-powered". They are built by an AI; they are not AI products.
