# 03 · Selection Criteria

How a raw idea becomes the day's project. Used in the Define phase; takes about fifteen minutes for a dozen ideas.

## Step 0 · Exclusion list (any hit kills the idea)

- Collects, stores or infers personal data about vulnerable people (refugees, minors, patients, survivors, undocumented people) without a partner organisation owning the data.
- Gives individual medical, legal, financial or safety advice, or could plausibly be mistaken for doing so.
- Infers protected characteristics (gender, ethnicity, disability, religion) from names, faces, or writing.
- Depends on a paid API, a proprietary dataset, or a service that needs an account we cannot create.
- Duplicates an existing, maintained open-source tool without a clear, stated improvement.
- Requires ongoing hosting, moderation, or a database we would have to run past October (self-hostable is fine; "we host it for you" is not).
- Is a chatbot, a "wrapper around an LLM", or a generic dashboard. These are the AI defaults and the audience is tired of them.
- Cannot be honestly built, tested and documented within the Develop budget even at the bottom of the scope-cut ladder.

## Step 1 · Scoring (0–3 each, 18 max)

| Criterion | 0 | 1 | 2 | 3 |
|-----------|---|---|---|---|
| **Named user** — who uses it on Tuesday? | Nobody specific | A vague role | A specific role with a known workflow | A specific person or org we could contact today |
| **Impact link** — how direct is the SDG target? | Decorative | Thematic | Serves a named target | Serves a named indicator and could move it |
| **Gap** — does this exist already? | Yes, maintained | Yes, but abandoned or bad | Partial or scattered | Nothing found after real search |
| **Buildability** — can it be complete in 4h15? | No | With luck | Yes with scope-cut ladder | Comfortably, with polish time |
| **Data readiness** — is the input available now? | No / unclear licence | Behind a key we lack | Open API, verified live | Open API plus bundled fixture |
| **Story** — can it be shown in one image or one sentence? | Needs a paragraph | Needs a diagram | One sentence | One screenshot |

Rules of thumb:

- Below 11: drop.
- Any 0 in Named user, Buildability, or Data readiness: drop regardless of total.
- Between two close scores, choose the one with the higher **Named user** score. Adoption beats ambition.

## Step 2 · Archetype balance

Across the month, aim for variety so the calendar does not become 31 dashboards. Target mix, revisited each Sunday:

| Archetype | Target count | Why |
|-----------|--------------|-----|
| CLI or library/SDK for an open dataset or API | 8–10 | Highest reuse; developers fork these |
| Offline-first static web tool or PWA | 7–9 | Usable in low-connectivity contexts, no hosting burden |
| GitHub Action, linter, or dev-workflow tool | 3–4 | Reaches the developer audience directly; Hacktoberfest fit |
| Curated dataset or open data cleanup with a schema | 3–4 | Durable value, low code risk |
| Template or toolkit (self-hostable board, form, kit) | 3–4 | Practitioners deploy them without us |
| Visualisation or explainer | 2–3 | Marketing value; keep these few so the month is not "charts" |
| Educational game or interactive | 1–2 | Reach beyond developers |

## Step 3 · Sanity questions before writing the brief

1. Would a domain expert wince at anything in this? If unsure, add a "Limitations" section rather than a feature.
2. Can the README's quickstart be followed by someone who has never seen the repo, in under five minutes?
3. What breaks if the data source disappears? (Answer must be "the bundled fixture keeps the tests green".)
4. What is the smallest thing that would still be worth shipping? (This becomes rung 3 of the scope-cut ladder.)
5. Is there a community we could tell about this *before* building it, to get a reaction in the same day?
