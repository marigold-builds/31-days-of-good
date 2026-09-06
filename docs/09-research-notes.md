# 09 · Research notes (September 2026)

Condensed findings from web research done during the strategy phase. Two sweeps: comparable programmes and channel norms; UN observances and open data (see [../backlog/open-data-register.md](../backlog/open-data-register.md) and [../backlog/calendar.md](../backlog/calendar.md) for the second sweep's output).

## Comparable programmes and what they teach

| Programme | Cadence | What worked | Failure mode | Lesson for us |
|-----------|---------|-------------|--------------|---------------|
| Pieter Levels, 12 startups in 12 months (2014) | Monthly | Public commitment, reused patterns, each month a market test | 10 of 12 abandoned | Abandonment is tolerated when framed honestly up front; reuse a scaffold |
| Jennifer Dewalt, 180 websites in 180 days (2013) | Daily | Explicit learning goal, so abandonment was expected | ~30-day creativity trough | Plan for a mid-month dip; the maintenance sprint on 15–16 Oct is the relief valve |
| #100DaysOfCode | Daily | Social accountability loop, hashtag, replies | Most drop off mid-streak; no artefact sustainability | The streak and the story carry engagement; artefact longevity must be engineered separately (stewards) |
| Advent of Code (2025) | Daily, December | Fixed window, community | Explicitly banned AI solving, cut to 12 days, removed leaderboard | Some daily-challenge communities see AI participation as corrosive; do not borrow their framing |
| 24 Pull Requests | Daily, December | Contribution drive | Maintainers drowned in PR volume | Never generate PRs into other people's repos |

No confirmed precedent was found for an AI agent shipping one complete open-source project per day for a month. Treat novelty as an unverified claim; do not market on it.

## Hacktoberfest 2026

- 1–31 October, run by Major League Hacking and DEV, DigitalOcean as presenting partner.
- Retired the PR-count and T-shirt mechanic. Now "300+ Fests": up to 12-hour local or online events around open-source AI, under the tagline "AI belongs to everyone".
- Organisers name AI-generated low-effort PRs as the reason for the change.
- Implication: no legacy funnel to piggyback on; a possible Fest listing or mention is the realistic tie-in.

## Channel norms (2026)

- **Show HN:** real, triable things only; neutral titles; daily posts from one family of projects get flagged as promotion. One flagship post.
- **Product Hunt:** engagement-ranked, upvote solicitation shadowbanned, daily launches read as spam, general sentiment that discovery value has declined.
- **Reddit:** 90/10 self-promotion rule, no identical cross-posts, AI content allowed sitewide but subreddit rules on AI have roughly doubled; disclose.
- **dev.to:** asks for disclosure of AI use to any degree.
- **LinkedIn:** August 2026 "Keeping conversations real" policy, AI-slop report button, ranking penalties for undisclosed AI content.
- **Fosstodon:** forbids repetitive self-promotion, link-only posts, and unattended automated posting.

## Sentiment on AI-generated open source

- Dominant narrative is "AI slop" fatigue. Reported: AI PRs take far longer to review; curl ended its bug bounty as valid-report rates collapsed; tldraw closed external PRs; GitHub has discussed PR throttling.
- Bans: Gentoo (2024) and NetBSD prohibit AI-assisted contributions. A survey of 120 project policies found about 78% permit AI assistance and about half of those require disclosure.
- What earns trust: specific, proactive disclosure (which model, what role, what the human did), human review and accountability on every change, and never adding to other maintainers' load.
- Digital Public Goods Alliance is the most active "open source for SDGs" body; Wikimedia Foundation and UNESCO Open Solutions joined in 2026.

## Naming collisions (6 Sep 2026)

- Plain "Marigold": martech company (formerly CM Group, rebranded 2023, markets "Marigold AI"; sold its enterprise software line to Zeta Global); prs-eth/Marigold depth-estimation model (CVPR 2024, ~3.2k stars); `marigold` Rust crate (active, March 2026); `@marigold/*` npm design system; `marigold-dev` (Tezos) and `marigoldlabs` (DeFi) GitHub orgs; `marigold` GitHub user, Bluesky and mastodon.social handles taken; `marigold.dev`/`.ai` resolve. US marks: "Cheetah, A Marigold Company", "Emma by Marigold" (2022), Marigold Systems (2015). EUIPO/UKIPO not queried directly; unverified.
- Clean: "Marigold Builds", "Marigold OSS", "Marigold Forge", "Marigold Foundry" on GitHub, npm, Bluesky, mastodon.social; `marigoldbuilds.com`/`.dev` no DNS record.
- "#OctoberOptimism" overlaps "Optimistic October" (Action for Happiness) and "I Declare Optimism October" wellness content.

- "31 Days of Good": no exact-match brand, campaign or mark found; domains `.org/.dev/.com` NXDOMAIN; GitHub `31daysofgood`/`31-days-of-good` 404; Bluesky and mastodon.social handles unresolved. Adjacent: GOOD magazine "The GOOD 30-Day Challenge" (#30DaysofGOOD, 2011, dormant), 31daysofservice.org (content stops 2016), Action for Happiness "Do Good December" (active). Trademark registries returned 403 to direct fetch; unverified.

## Sources

Comparable programmes: levels.io/12-startups-12-months; jenniferdewalt.com; freecodecamp.org/news/join-the-100daysofcode-556ddb4579e4; adventofcode.com/2025/about; thenewstack.io/2025s-advent-of-code-event-chooses-tradition-over-ai; nesbitt.io/2026/02/13/respectful-open-source.html.
Hacktoberfest: hacktoberfest.com; hacktoberfest.com/questions.
Channels: news.ycombinator.com/item?id=41967875; news.ycombinator.com/item?id=45362569; hub.causo.ai/guides/product-hunt-launch-2026-realistic-playbook; redship.io/blog/reddit-self-promotion-rules; arxiv.org/html/2410.11698v2; forbes.com/sites/jodiecook/2026/08/10/what-linkedins-ai-slop-crackdown-means-for-your-posts; hub.fosstodon.org/coc.
Naming: good.is/the-good-30-day-challenge-connect-with-people; 31daysofservice.org; actionforhappiness.org/december; meetmarigold.com; martech.org/zeta-global-acquires-enterprise-software-business-from-marigold; github.com/prs-eth/Marigold; crates.io/crates/marigold; npmjs.com/package/@marigold/components; github.com/marigold-dev; github.com/marigoldlabs; trademarks.justia.com/976/67/cheetah-a-marigold-97667679.html; actionforhappiness.org/optimistic-october.
Sentiment: opensourceforu.com/2026/02/github-weighs-pull-request-kill-switch-as-ai-slop-floods-open-source; thenewstack.io/ai-generated-code-crisis; theregister.com/2026/01/21/curl_ends_bug_bounty; tomshardware.com/software/linux/linux-distros-ban-tainted-ai-generated-code; arxiv.org/html/2605.16706; digitalpublicgoods.net; wikimediafoundation.org/news/2026/05/13/wikimedia-foundation-joins-the-digital-public-goods-alliance.
