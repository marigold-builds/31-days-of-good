# 08 · Article evaluation: "How to turn your AI into a world-class designer"

Source: Anshu Chimala, guest post in Lenny's Newsletter, https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world. The article is paywalled from Technique 7 onward; this evaluation covers the visible part.

## What it says

Thesis: models default to safe, average design because next-token prediction rewards the predictable. To get excellent output you must push the model off its defaults on purpose. It borrows the Double Diamond (Discover, Define, Deliver) and gives seven techniques:

1. **Seed strings.** Feed a random alphanumeric string as an inspiration source so runs vary instead of converging.
2. **Ambitious directives.** Inject bold constraints ("isometric city", "radically asymmetric"), get a list of high-level concepts, visualise favourites, iterate, then convert to build prompts.
3. **Critic subagents.** A separate critic scores screenshots 0–10 without seeing code, hunts for "obviously AI" patterns, and the loop stops at a threshold such as 9/10. Bigger model as critic, smaller as implementer.
4. **Image generation.** Use generated imagery instead of CSS gradients to escape the AI look.
5. **Video generation.** Looping clips and keyframe interpolation for motion.
6. **Element elimination.** Actively remove; restraint reads as premium.
7. **Remove AI tells.** Paywalled.

## Verdict: apply four of seven, adapted, and not only to design

The article is about visual design for product prototypes. 31 Days of Good ships small tools where the visible surface is often a README, a CLI, or a plain web page. But the underlying insight, **the model's first idea is its most average idea**, applies to every phase of our day, not just the visual one. That is the thing worth taking.

### Adopt

**Seed strings, generalised into "forced divergence" (Discover).** The risk in the daily process is not bad design; it is thirty-one variations of the same dashboard. In the Discover phase, ideation gets an explicit divergence step: generate the obvious idea first and mark it as such, then generate the rest under randomised constraints (a random archetype from the selection-criteria table, a random user persona from the day's research, a random seed string). This is cheap and directly attacks our biggest quality risk. **Added to [02-daily-process.md](02-daily-process.md), Discover step 5.**

**Critic subagent, generalised into a blind reviewer (Develop, quality pass).** The idea that the reviewer must not see the code is the good part. We will run two blind reviews near the end of Develop:
- A **README reviewer** that sees only the rendered README and has to write down, in one paragraph, what the tool does and how to run it. If it cannot, the README fails.
- A **screenshot reviewer** for anything with a UI, scoring 0–10 with the article's rubric (structure, detail, AI tells, restraint), stopping at 8/10 because we have a day, not a week.
Model sizing follows the article: the reviewer is the larger model. **Added to the Develop quality pass.**

**Element elimination (Develop, docs and demo).** Applied to code and words as much as pixels. Before release: delete one feature, one dependency, one README section, one config option. If nothing can go, that is fine, but the question is asked every day. This is already Principle 6 in the strategy; the article gives it a mechanical step.

**Ambitious directives, applied to the calendar tile only.** The 31 calendar tiles and social cards are the single most-seen visual surface of the programme. They get designed once, in the preparation phase, using the article's full loop: concept list, visualise three, critic loop, pick. Every day then reuses the template. This spends design effort where it compounds.

### Do not adopt

**Image and video generation.** They cost money, add a dependency on external services Dom has not approved, and pull the projects toward "looks impressive" when the criterion is "gets used". A field tool with a looping hero video is a tell of its own. If a specific day's project genuinely needs an illustration, that is a one-off open question, not a default.

**The 9/10 stopping threshold.** Too high for a one-day budget. Our loop runs at most two iterations and stops at 8.

### One caution

The article optimises for outputs that look non-AI. Our identity is built on disclosure. We want the work to be *good*, not to *pass*. So "remove AI tells" is reframed as "remove filler": the boilerplate, the hedging, the fourth adjective. The goal is clarity, not disguise.

## Where this landed in the docs

| Article technique | Programme location |
|-------------------|--------------------|
| Seed strings | Discover step 5 (forced divergence) |
| Ambitious directives | Preparation plan, calendar-tile design |
| Critic subagents | Develop quality pass (blind README + screenshot reviewers) |
| Element elimination | Develop docs-and-demo step and Principle 6 |
| Image / video generation | Not adopted; noted in open questions as opt-in |
| Remove AI tells | Reframed as "remove filler" in the identity voice rules |
