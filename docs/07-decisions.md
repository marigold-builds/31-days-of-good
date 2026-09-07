# 07 · Decisions Log

Decisions Dom made on 6 September 2026, in conversation, plus defaults applied where Dom did not object. The further instruction Dom mentioned at the start was the Lenny's Newsletter article, evaluated in [08-article-evaluation.md](08-article-evaluation.md). Anything still open is at the bottom.

| # | Question | Decision | Consequence |
|---|----------|----------|-------------|
| 1 | Identity name | **Marigold Builds** (short form Marigold), after a collision check showed plain "Marigold" is taken by a martech company, a popular depth-estimation model, and the main handles | Org `marigold-builds`, tag `#MarigoldBuilds`; see [04-identity.md](04-identity.md) |
| 2 | Programme name | **31 Days of Good**, replacing "October Optimism", which collides with an existing "Optimistic October" wellness meme | Collision check 6 Sep: no exact match as a brand, campaign or mark; `31daysofgood` free on GitHub, Bluesky, mastodon.social and as `.org`/`.dev`/`.com`. The format is crowded (GOOD magazine's dormant #30DaysofGOOD, Action for Happiness's active "Do Good December", a stale "31 Days of Service"), so always pair it with the builder name: "Marigold Builds: 31 Days of Good". Hashtag feeds and live trademark databases could not be checked without login; treat as unverified |
| 3 | GitHub home | New org created by Dom | `marigold-builds` |
| 4 | Channels | Bluesky, Mastodon and dev.to daily, automated; LinkedIn twice weekly, manual | Pipeline built in September; Mastodon account on a bot-friendly instance, not Fosstodon |
| 5 | Automation level | Full pipeline; Dom merges one queue PR a day at 08:00 | Auto-merge is a later one-line option |
| 6 | Package registries | Never; GitHub releases only | Install via git URL or release asset |
| 7 | Licence | MIT code, CC-BY-4.0 content | Fixed in the scaffold |
| 8 | Veto | Brief at 23:00; Dom may veto by 23:30 if awake; otherwise silent go | Second checkpoint is the 08:00 merge |
| 9 | Schedule | Research from 20:45, build overnight, launch 08:00 CET | Timeline in [02-daily-process.md](02-daily-process.md) |
| 10 | Budget | Zero; a domain is the only optional spend | No image or video generation, no paid APIs |
| 11 | Weekends | Full nights, 31 consecutive | Calendar unchanged |
| 12 | Hosting | GitHub Pages only | Static tools and PWAs; no server-side demos |
| 13 | Steward policy | *Default applied:* unstewarded repos get an honest archive banner on 31 Dec 2026 | Stated in every README |
| 14 | Hacktoberfest contact | *Default applied:* one email to MLH/DEV in week 3 asking about a Fest listing | Draft goes in the queue |
| 16 | X | Dom's personal account amplifies 5–7 times in the month; no programme account; nothing that reads as crypto fundraising in October | Row added to the playbook channel table |
| 17 | Demand first | Public intake form (GitHub issue form) on the programme repo; three gates before scoring; four flex nights (12, 19, 26, 30 Oct); day 7 and 14 use measured and reported | [11-intake-and-triage.md](11-intake-and-triage.md); calendar and selection criteria updated |
| 18 | Community track | A hashtag movement (`#31DaysOfGood`), not a programme: no submissions or moderation; we publish the bar and share the inbox; register as a Hacktoberfest Fest | Playbook "Community track" section |
| 15 | Reserved days | *Default applied:* none | Calendar reorderable until 13 Sep |
| 19 | SDG icon vs. colour on tiles | **No UN icon graphics.** Tiles carry the SDG number, title and colour only; the plan's Global Constraint already said this and the build follows it | `docs/04-identity.md`, `docs/02-daily-process.md` and `docs/05-marketing-playbook.md` amended to match (final review, 6 Sep; scoped re-review, 6 Sep) |
| 20 | Publish credential names | `BLUESKY_APP_PASSWORD` as an organisation **secret**, `BLUESKY_HANDLE` as an organisation **variable** (the handle is public; keeping it out of the secret store keeps Action logs readable). Both scoped to `31-days-of-good` | Stored by Dom 7 Sep. The W12 pipeline is written against these exact names; Mastodon and dev.to follow the same pattern when their accounts exist. The builder never sees the values |

## Still open

- **Claim the remaining handles.** Availability is not a reservation. `marigold-builds` on GitHub and the Bluesky account are done (7 Sep), with the Bluesky app password and handle stored as org credentials per decision 20. Still to register: the Mastodon account on a bot-friendly instance, and dev.to. `31daysofgood` as a secondary handle is optional.
- **Domain**, if Dom wants one: `marigoldbuilds.dev`, `marigoldbuilds.com` and `31daysofgood.org` all showed no DNS record on 6 Sep.
- **Hashtag spot-check** of #31DaysOfGood and #MarigoldBuilds from a logged-in account before launch; web search could not see live feeds.
- **Mastodon instance** for the bot-flagged account: Dom's choice; mastodon.social permits bots when flagged.
