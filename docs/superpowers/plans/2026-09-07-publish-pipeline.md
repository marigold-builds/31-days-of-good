# Publish Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A GitHub Actions workflow that, when Dom merges a day's queue PR into `main`, posts the day's short post to Bluesky and Mastodon with the tile attached and the day's article to dev.to, exactly once per channel, with a dry-run path that exercises everything up to the write call, and that runs usefully today on Bluesky alone.

**Architecture:** A dependency-free Node 22 package `publish/` beside `site-build/` reads queue items from `queue/` (one `YYYY-MM-DD-<slug>.md` per item, holding a small front matter and one section per channel, plus an optional `.article.md` for dev.to), lints them, and posts through three small channel modules that share one HTTP layer that can never print a token or a body. What has been published is recorded in `queue/<id>.posted.json` receipts that the workflow commits back to `main` after each run, so a re-run, a double trigger or a partial failure cannot post twice. The `publish` workflow triggers on pushes to `main` that touch `queue/*.md`, scans for items with outstanding channels, and is a dry run unless the `PUBLISH_MODE` variable is `live`.

**Tech Stack:** Node 22 (`node:test`, global `fetch`, `FormData`, `Intl.Segmenter`), no npm dependencies in `publish/`; the existing `site-build/` build for tiles; GitHub Actions with `actions/checkout@v4` and `actions/setup-node@v4` only; the Bluesky (AT Protocol XRPC), Mastodon and dev.to (Forem) HTTP APIs directly.

**Spec:** `docs/02-daily-process.md`, `docs/05-marketing-playbook.md`, `docs/04-identity.md`, `docs/07-decisions.md` (rows 4, 5, 6, 8, 10, 12, 16, 20), `docs/01-strategy.md`, `docs/11-intake-and-triage.md`, `templates/launch-post.md`, `BOARD.md` (W12, W15, W16, W21 and `## Decided`). Existing code extended: `.github/workflows/check-credentials.yml`, `.github/workflows/ci.yml`, `site-build/`.

## Global Constraints

- **Zero spend. GitHub only.** No paid services, no package registries, no third-party Actions beyond `actions/checkout@v4` and `actions/setup-node@v4`, which are already in use. Free-plan Actions on a public repo.
- **Dependency-light.** `publish/` has no npm dependencies and no lockfile; Node 22 with `node:test`. Bluesky, Mastodon and dev.to are called over plain HTTP; no SDKs.
- **Tests sit directly in `publish/test/`** and run with `node --test test/*.js` (BOARD Decided 4). Helpers live in `publish/test/fixtures/`, which the glob does not match.
- **Credential names are exact** (`docs/07-decisions.md` row 20 and this plan's Task 11): `BLUESKY_HANDLE` (org variable), `BLUESKY_APP_PASSWORD` (org secret), `MASTODON_INSTANCE` (org variable), `MASTODON_ACCESS_TOKEN` (org secret), `DEVTO_API_KEY` (org secret), `PUBLISH_MODE` (org or repo variable; `live` enables posting). **The builder never sees the values**; nothing in this plan reads them anywhere but inside the workflow.
- **This repository is public, so Actions logs are public and permanent.** No request header, request body, response body, session token, or API key may reach stdout, an error message, a job summary or a receipt. `publish/lib/http.js` is the only module that performs HTTP and enforces this; session tokens are additionally masked with `::add-mask::` the moment they arrive.
- **Nothing posts without a merge to `main` or an explicit `workflow_dispatch` by Dom with `mode=live`, and nothing posts that is not in a merged queue file.** There is no scheduled trigger, no fallback text, no generated copy.
- **Idempotency:** a channel with a key in an item's receipt is never touched again for that item. Only a successful post or a "not configured" skip writes a key; a failure writes nothing, so a re-run retries exactly the failed channels.
- **Disclosure** (`docs/04-identity.md`, `docs/05-marketing-playbook.md`): every short post carries "Built by Marigold Builds, an AI, directed by Dom."; every article discloses AI authorship in its first paragraph. Lint enforces both.
- **Voice:** no emoji, no "AI-powered", no build-speed claims, British English in every document, template, comment and error message. Lint enforces the first two on posts and articles.
- **Bluesky:** 300 graphemes counted with `Intl.Segmenter`; links and hashtags carry facets with UTF-8 byte offsets; links are not shortened. **Mastodon:** 500 characters with every URL counted as 23; the account must carry the bot flag or the pipeline refuses to post; never Fosstodon. **dev.to:** an article, published, up to four lowercase tags, in the series "31 Days of Good".
- **LinkedIn and X are never automated** (`docs/07-decisions.md` rows 4 and 16). Their sections in a queue file are for Dom to paste; the pipeline reads past them.
- Commits end with `Co-Authored-By: Claude <model that authored the commit> <noreply@anthropic.com>` (BOARD Decided 11). Never stage `BOARD.md`; never commit `.superpowers/`.

---

## Design decisions

These are the answers to the seven hard parts of the brief, so nobody re-derives them mid-task.

1. **Only Bluesky exists.** A channel is *configured* when every one of its environment variables is non-empty; `configure(env)` returns the names that are missing, never the values. An unconfigured channel is *skipped* and, in a live run, recorded in the receipt as `{"status": "skipped", "reason": "not configured: ..."}`. That record is terminal: when Dom creates the Mastodon account on, say, 5 October, days 1 to 4 do not post retroactively. The summary and a `::notice::` say "skipped (not configured)" and name the missing variable; a channel that was tried and failed says "FAILED" with the HTTP status and error code. Adding a channel is one module with five exports and one line in `CHANNELS`.
2. **Idempotency lives in the repo.** After each successful post the pipeline writes `queue/<id>.posted.json`; a final step that runs `if: always()` commits and pushes it. The workflow checks out the branch tip (`ref: ${{ github.ref }}`), not the triggering SHA, so a re-run of a failed run sees the receipts the first attempt pushed. `concurrency: { group: publish, cancel-in-progress: false }` serialises runs so two pushes cannot race on one receipt. If the receipt push itself fails after a post went out, the step prints the receipt and fails with an instruction not to re-run; that is the one hole, and it is loud.
3. **Partial failure.** Channels are independent; each failure is caught, counted and reported, and the job exits 1 at the end. Visible means: a red check on the merge commit, GitHub's failed-workflow email to the merger (Dom), a job summary table with one row per item and channel, and `::error::` annotations. Re-running the failed job retries only the unrecorded channels.
4. **Trigger.** `on: push: branches: [main], paths: ['queue/*.md']`, plus `workflow_dispatch`. The pipeline does not inspect the push diff; it scans `queue/` for items with a channel that has content, is configured, and has no receipt. Docs and site pushes never match the path filter; a receipt commit is made with `GITHUB_TOKEN`, which by GitHub's rules triggers no workflow at all.
5. **Dry run.** `PUBLISH_MODE` unset or anything but `live` is a dry run: authentication happens, the tile is built and measured, facets are computed, the exact record, status parameters and article payload are rendered into the job summary, and no upload or write call is made and no receipt (not even a skip) is written. The `workflow_dispatch` input `mode` overrides the variable for one run. W15 dispatches a dry run from a rehearsal branch; W16 sets repository-level `BLUESKY_HANDLE`/`BLUESKY_APP_PASSWORD` (which override the organisation values) to a test account and dispatches `mode=live` from the rehearsal branch. Task 12 is the recipe.
6. **Per-channel constraints** are in `publish/lib/richtext.js` (graphemes, facets, Mastodon length) and `publish/lib/lint.js`, and lint runs in CI on every queue PR, so an over-long or undisclosed post is red before Dom reads it.
7. **LinkedIn and X**: `## linkedin`, `## outreach`, `## provider` and `## notes` are recognised, kept, and never posted.

Two conventions that differ from the spec's wording, argued in "Spec corrections" at the end: queue items are `queue/YYYY-MM-DD-<slug>.md` rather than `queue/YYYY-MM-DD.md`, because the Sunday digest and a day launch share a date; and the tile is attached from the site build in the same workflow rather than fetched from Pages, because Pages deploys concurrently and would race.

## File structure

```
publish/
  package.json                 no dependencies; "test": "node --test test/*.js"
  cli.js                       `lint` and `publish` subcommands; writes the job summary
  lib/queue.js                 queue file and article parsing; loadQueue()
  lib/richtext.js              graphemeCount, facets (byte offsets), mastodonLength
  lib/lint.js                  every rule a queue item must satisfy
  lib/http.js                  request(), HttpError, mask(), pngSize(): the only HTTP
  lib/assets.js                loadAssets(): the tile or a named image, with dimensions
  lib/receipts.js              read/write queue/<id>.posted.json
  lib/channels/bluesky.js      configure, hasContent, authenticate, preview, publish
  lib/channels/mastodon.js     same interface
  lib/channels/devto.js        same interface
  lib/run.js                   the orchestrator: outstanding work -> outcomes
  lib/summary.js               markdown for the job summary
  test/*.test.js               one file per module
  test/fixtures/fake-fetch.js  fakeFetch(), fakePng(), fixtureItem()
  test/fixtures/queue/         a complete, lint-clean day item and article
queue/README.md                the format, for the nightly builder and for Dom
templates/launch-post.md       rewritten as the exact queue file shape
templates/launch-article.md    new: the exact article file shape
.github/workflows/publish.yml  new
.github/workflows/ci.yml       runs publish tests and lints queue/
.github/workflows/check-credentials.yml   Mastodon and dev.to probe steps added
docs/02, 05, 06, 07, README.md            wording brought in line
```

## Task order

Tasks 1, 2 and 4 have no dependencies; 3 needs 1 and 2; 5, 6 and 7 need 4 (7 also needs 3); 8 needs 1 to 7; 9 needs 8; 10 and 11 are independent of the code; 12 needs 9, 10 and 11. The board says one implementer at a time in this checkout, so run them in numeric order; the dependency note is for the reviewer's benefit.

---

### Task 1: The `publish/` package and the queue parser

**Files:**
- Create: `publish/package.json`, `publish/lib/queue.js`, `publish/test/queue.test.js`, `publish/test/fixtures/queue/2026-10-01-day-01.md`, `publish/test/fixtures/queue/2026-10-01-day-01.article.md`, `queue/README.md`

**Interfaces:**
- Produces: `parseFrontMatter(text) -> { meta, body }`; `splitSections(body, filename) -> { [name]: text }`; `parseQueueFile(text, filename) -> item`; `parseArticle(text, filename) -> article`; `loadQueue(queueDir) -> item[]`; constants `POST_CHANNELS`, `MANUAL_SECTIONS`, `KNOWN_SECTIONS`, `QUEUE_FILENAME`, `DEFAULT_SERIES`.
- The **item** shape every later task relies on: `{ id: '2026-10-01-day-01', date: '2026-10-01', slug: 'day-01', day: number|null, alt: string|null, image: string|null, meta: {}, sections: { [name]: string }, posts: { bluesky?: string, mastodon?: string }, article: article|null, path: string, receiptPath: string }`.
- The **article** shape: `{ title: string|null, tags: string[], description: string|null, series: string|null, body: string, path: string }`.

- [ ] **Step 1: Create the package**

`publish/package.json`:

```json
{
  "name": "publish",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test test/*.js"
  }
}
```

- [ ] **Step 2: Write the fixture queue item and article**

`publish/test/fixtures/queue/2026-10-01-day-01.md` (the Bluesky text is 296 graphemes; keep it exactly, a later test depends on it being under 300):

```markdown
---
day: 1
alt: Day 1 of 31 Days of Good. SDG 17, Partnerships for the Goals. sdg-badge: declare a repository's SDG alignment with a badge and a validated SDG.yml.
---

## bluesky

Day 1/31 · SDG 17
sdg-badge: a badge and a checked SDG.yml so a repo can say which goal it serves.
Target 17.6. Does not verify the claim.
Try it, break it, or steward it: https://github.com/marigold-builds/sdg-badge
Built by Marigold Builds, an AI, directed by Dom. #MarigoldBuilds #31DaysOfGood

## mastodon

Day 1/31 · SDG 17
sdg-badge: a badge and a checked SDG.yml so a repo can say which goal it serves.
Target 17.6. Does not verify the claim.
Try it, break it, or steward it: https://github.com/marigold-builds/sdg-badge
Built by Marigold Builds, an AI, directed by Dom. #MarigoldBuilds #31DaysOfGood

## linkedin

Not a story day; nothing to paste.

## outreach

- **To:** the Digital Public Goods Alliance community forum
- **Why them:** they maintain the indicator list the badge validates against
- **Draft:** "Hi, today I published sdg-badge ..."

## notes

### Checklist
- [x] Every post contains the disclosure
- [x] Every image has alt text
```

`publish/test/fixtures/queue/2026-10-01-day-01.article.md`:

```markdown
---
title: sdg-badge: declare a repository's SDG alignment (31 Days of Good, day 1)
tags: opensource, sdg, github, showdev
description: A badge and a validated SDG.yml for repositories that serve a Sustainable Development Goal.
---

This is day 1 of 31 Days of Good, a month in which an AI (Claude, published as Marigold Builds) builds one small open-source tool a night for the Sustainable Development Goals, with Dom setting the direction and merging every post before it goes out. Today: SDG 17, Partnerships for the Goals.

## The problem

Repositories that serve a goal have no shared way to say so.

## What I built

A badge.
```

- [ ] **Step 3: Write the failing tests**

`publish/test/queue.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseQueueFile, parseArticle, splitSections, loadQueue } from '../lib/queue.js';

const FIXTURES = join(import.meta.dirname, 'fixtures', 'queue');

test('parseQueueFile reads id, date, slug, front matter and channel sections', () => {
  const item = parseQueueFile(readFileSync(join(FIXTURES, '2026-10-01-day-01.md'), 'utf8'), 'queue/2026-10-01-day-01.md');
  assert.equal(item.id, '2026-10-01-day-01');
  assert.equal(item.date, '2026-10-01');
  assert.equal(item.slug, 'day-01');
  assert.equal(item.day, 1);
  assert.match(item.alt, /^Day 1 of 31 Days of Good/);
  assert.equal(item.image, null);
  assert.match(item.posts.bluesky, /^Day 1\/31 · SDG 17\n/);
  assert.match(item.posts.bluesky, /#31DaysOfGood$/);
  assert.equal(item.posts.bluesky, item.posts.mastodon);
  assert.deepEqual(Object.keys(item.sections), ['bluesky', 'mastodon', 'linkedin', 'outreach', 'notes']);
});

test('splitSections keeps title-case and level-3 headings inside the current section', () => {
  const s = splitSections('## notes\n\n### Checklist\n- [x] done\n\n## The problem\nstill notes\n\n## outreach\nhello');
  assert.equal(s.notes, '### Checklist\n- [x] done\n\n## The problem\nstill notes');
  assert.equal(s.outreach, 'hello');
});

test('splitSections rejects a duplicated section', () => {
  assert.throws(() => splitSections('## bluesky\na\n## bluesky\nb', 'f.md'), /"## bluesky" appears twice/);
});

test('parseQueueFile rejects a filename without a slug', () => {
  assert.throws(() => parseQueueFile('---\nday: 1\n---\n', 'queue/2026-10-01.md'), /YYYY-MM-DD-<slug>\.md/);
});

test('parseQueueFile treats a blank day as no day', () => {
  const item = parseQueueFile('---\nday:\nimage: queue/launch.png\nalt: The launch card\n---\n## bluesky\nhello', 'queue/2026-09-30-launch.md');
  assert.equal(item.day, null);
  assert.equal(item.image, 'queue/launch.png');
});

test('parseArticle reads title, tags, description and the default series', () => {
  const a = parseArticle(readFileSync(join(FIXTURES, '2026-10-01-day-01.article.md'), 'utf8'), 'x.article.md');
  assert.match(a.title, /^sdg-badge/);
  assert.deepEqual(a.tags, ['opensource', 'sdg', 'github', 'showdev']);
  assert.match(a.description, /^A badge/);
  assert.equal(a.series, '31 Days of Good');
  assert.match(a.body, /^This is day 1/);
  assert.match(a.body, /## The problem/);
});

test('parseArticle lets series be cleared explicitly', () => {
  assert.equal(parseArticle('---\ntitle: T\nseries:\n---\nbody', 'a').series, null);
});

test('loadQueue pairs items with their article and receipt paths and ignores README.md', () => {
  const items = loadQueue(FIXTURES);
  assert.equal(items.length, 1);
  assert.equal(items[0].article.tags.length, 4);
  assert.equal(items[0].receiptPath, join(FIXTURES, '2026-10-01-day-01.posted.json'));
});

test('loadQueue returns no items for a missing directory', () => {
  assert.deepEqual(loadQueue(join(tmpdir(), 'does-not-exist-31dog')), []);
});

test('loadQueue rejects an article with no item beside it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'queue-'));
  writeFileSync(join(dir, 'README.md'), '# queue\n');
  writeFileSync(join(dir, '2026-10-02-day-02.article.md'), '---\ntitle: T\n---\nbody');
  assert.throws(() => loadQueue(dir), /no queue item "2026-10-02-day-02.md"/);
});

test('loadQueue rejects a stray markdown file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'queue-'));
  writeFileSync(join(dir, 'notes.md'), 'x');
  assert.throws(() => loadQueue(dir), /not named YYYY-MM-DD-<slug>\.md/);
});
```

- [ ] **Step 4: Run them to see them fail**

Run: `cd publish && npm test`
Expected: the run fails with `Cannot find module '.../lib/queue.js'`.

- [ ] **Step 5: Write the parser**

`publish/lib/queue.js`:

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

// Short-post channels: each has a `## <name>` section holding the post text verbatim.
export const POST_CHANNELS = ['bluesky', 'mastodon'];
// Sections the pipeline never posts; they are for Dom to paste or send by hand.
export const MANUAL_SECTIONS = ['linkedin', 'outreach', 'provider', 'notes'];
export const KNOWN_SECTIONS = [...POST_CHANNELS, ...MANUAL_SECTIONS];

// queue/2026-10-01-day-01.md -> date 2026-10-01, slug day-01, id 2026-10-01-day-01
export const QUEUE_FILENAME = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const ARTICLE_SUFFIX = '.article.md';
const SECTION_HEADING = /^## ([a-z]+)\s*$/;
export const DEFAULT_SERIES = '31 Days of Good';

function unquote(v) {
  if (v.length >= 2) {
    const first = v[0], last = v[v.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) return v.slice(1, -1);
  }
  return v;
}

// The same key: value front matter as site-build/lib/days.js. Copied rather
// than imported so publish/ does not load site-build's modules (which read
// data/sdgs.json at import time) just to split a header.
export function parseFrontMatter(text) {
  text = text.replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { meta: {}, body: text };
  const end = text.indexOf('\n---', 4);
  if (end === -1) return { meta: {}, body: text };
  const meta = {};
  for (const line of text.slice(4, end).split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = unquote(line.slice(i + 1).trim());
  }
  return { meta, body: text.slice(end + 4).replace(/^\n/, '') };
}

// Splits the body at `## name` headings where name is one lowercase word.
// Any other heading (`## The problem`, `### Notes`) is content of the
// current section, so the manual sections can carry headings of their own.
export function splitSections(body, filename = 'queue file') {
  const buffers = {};
  let current = null;
  for (const line of body.split('\n')) {
    const m = SECTION_HEADING.exec(line);
    if (m) {
      if (buffers[m[1]] !== undefined) throw new Error(`${filename}: section "## ${m[1]}" appears twice`);
      current = m[1];
      buffers[current] = [];
      continue;
    }
    if (current !== null) buffers[current].push(line);
  }
  const sections = {};
  for (const [name, lines] of Object.entries(buffers)) sections[name] = lines.join('\n').trim();
  return sections;
}

function blankToNull(v) { return v === undefined || v === '' ? null : v; }

export function parseQueueFile(text, filename) {
  const match = QUEUE_FILENAME.exec(basename(filename));
  if (!match) throw new Error(`Queue file "${filename}" is not named YYYY-MM-DD-<slug>.md`);
  const { meta, body } = parseFrontMatter(text);
  const sections = splitSections(body, filename);
  const posts = {};
  for (const ch of POST_CHANNELS) if (sections[ch] !== undefined) posts[ch] = sections[ch];
  const rawDay = blankToNull(meta.day);
  return {
    id: `${match[1]}-${match[2]}`,
    date: match[1],
    slug: match[2],
    day: rawDay === null ? null : Number(rawDay),
    alt: blankToNull(meta.alt),
    image: blankToNull(meta.image),
    meta,
    sections,
    posts,
    article: null,
    path: filename,
    receiptPath: null,
  };
}

export function parseArticle(text, filename) {
  const { meta, body } = parseFrontMatter(text);
  const tags = (meta.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  return {
    title: blankToNull(meta.title),
    tags,
    description: blankToNull(meta.description),
    series: meta.series === undefined ? DEFAULT_SERIES : blankToNull(meta.series),
    body: body.trim(),
    path: filename,
  };
}

// Reads every queue item in a directory. Companion files sit beside the item:
//   <id>.md            the item (required)
//   <id>.article.md    the dev.to article (optional)
//   <id>.posted.json   the receipt the pipeline writes (never written by hand)
export function loadQueue(queueDir) {
  if (!existsSync(queueDir)) return [];
  const files = readdirSync(queueDir).sort();
  const items = [];
  const ids = new Set();
  for (const f of files) {
    if (f === 'README.md' || !f.endsWith('.md') || f.endsWith(ARTICLE_SUFFIX)) continue;
    const path = join(queueDir, f);
    const item = parseQueueFile(readFileSync(path, 'utf8'), path);
    const articlePath = join(queueDir, `${item.id}${ARTICLE_SUFFIX}`);
    item.receiptPath = join(queueDir, `${item.id}.posted.json`);
    item.article = existsSync(articlePath) ? parseArticle(readFileSync(articlePath, 'utf8'), articlePath) : null;
    ids.add(item.id);
    items.push(item);
  }
  for (const f of files) {
    if (!f.endsWith(ARTICLE_SUFFIX)) continue;
    const id = f.slice(0, -ARTICLE_SUFFIX.length);
    if (!ids.has(id)) throw new Error(`Article "${f}" has no queue item "${id}.md" beside it`);
  }
  return items;
}
```

- [ ] **Step 6: Run the tests**

Run: `cd publish && npm test`
Expected: 11 passing, 0 failing.

- [ ] **Step 7: Document the format for the nightly builder**

`queue/README.md`:

```markdown
# Publish queue

Every public post goes through here. The nightly builder adds files to this directory in the queue PR; Dom reads, edits and merges at 08:00; the `publish` workflow posts what was merged. Nothing is posted directly, and nothing in this directory is a post until it is on `main`.

## Files

One item is up to three files sharing an id of the form `YYYY-MM-DD-<slug>`:

| File | Who writes it | What it is |
|------|---------------|------------|
| `YYYY-MM-DD-<slug>.md` | the builder (Dom edits) | the item: front matter, then one section per channel |
| `YYYY-MM-DD-<slug>.article.md` | the builder (Dom edits) | the dev.to write-up; optional |
| `YYYY-MM-DD-<slug>.posted.json` | the workflow only | the receipt: what was posted where, or skipped |

The slug is lowercase letters, digits and hyphens. A day's launch uses `day-NN`; a Sunday digest uses `digest`; an announcement uses `launch` or similar. Two items may share a date because they have different slugs.

## The item file

```
---
day: 1
alt: Day 1 of 31 Days of Good. SDG 17, Partnerships for the Goals. sdg-badge: a badge and a checked SDG.yml so a repo can say which goal it serves.
---

## bluesky

<the post, verbatim, up to 300 graphemes; links and #hashtags become clickable>

## mastodon

<the post, verbatim, up to 500 characters; each link counts 23>

## linkedin

<only on a story day; Dom pastes it by hand>

## outreach

<1 to 3 drafts for Dom to send>

## provider

<the data-provider note, if a public API was used>

## notes

<anything else: the screenshot path and its alt text, the checklist>
```

Front matter keys:

- `day` (1 to 31): attach the day's tile, `site/tiles/day-NN.png`, which the workflow builds from `log/YYYY-MM-DD.md` in the same commit. The log entry must be in the same PR.
- `image` (a path in the repository, `.png` or `.jpg`, under 1,000,000 bytes): attach that file instead. Set `day` or `image`, not both; set neither for a text-only post.
- `alt`: the image's alt text. Required whenever an image is attached.

Sections are `## name` headings where the name is one lowercase word. Only `bluesky` and `mastodon` are posted; `linkedin`, `outreach`, `provider` and `notes` are kept for Dom and never posted; any other name is a lint error, so a typo cannot silently drop a post. Headings with capitals or spaces (`## The problem`) inside a section are content. A channel with no section is simply not posted for this item: deleting a section is how Dom holds one channel while merging the rest.

## The article file

```
---
title: sdg-badge: a badge and a checked SDG.yml (31 Days of Good, day 1)
tags: opensource, sdg, github, showdev
description: One sentence for the listing.
---

<markdown; the first paragraph must disclose AI authorship and name Claude>
```

`title` up to 128 characters; `tags` one to four, lowercase letters and digits; `description` optional; `series` defaults to `31 Days of Good` (set it empty to omit). The body is posted as-is as the article's markdown.

## What lint checks

CI runs `node publish/cli.js lint` on every pull request, so a queue PR is red before Dom reads it if: a section name is unknown; `day` is out of range; both `day` and `image` are set; an image is attached without `alt`; `image` is missing, not a `.png`/`.jpg`, or over the size limit; the Bluesky post is over 300 graphemes; the Mastodon post is over 500 characters; a post is empty, lacks "Built by Marigold Builds, an AI, directed by Dom.", contains an emoji, or says "AI-powered"; the article has no title, a title over 128 characters, no tags or more than four, a tag that is not lowercase letters and digits, an empty body, or a first paragraph that does not mention Claude.

## What the workflow does

On a push to `main` that touches `queue/*.md` (a merged queue PR), or on a manual dispatch:

1. Builds the site, so the tiles exist and a malformed log entry fails before anything posts.
2. For every item, for every channel that has content and no key in the receipt: if the channel's credentials are absent, records `skipped` and moves on; otherwise authenticates once, posts, and records `posted` with the post's URL. A failure records nothing, is reported, and makes the run red.
3. Commits the receipts to the branch.

A channel key in the receipt is final: the workflow never posts that channel for that item again, whether the run is re-run, the merge is pushed twice, or the file is edited later. To post a channel again on purpose, delete its key from the receipt and dispatch the workflow.

Until the `PUBLISH_MODE` variable is `live`, every run is a dry run: it authenticates, builds and measures everything, shows the exact payloads in the job summary, and posts nothing. The dispatch input `mode` overrides the variable for one run.

## Receipt

```json
{
  "bluesky": { "status": "posted", "uri": "at://did:plc:.../app.bsky.feed.post/3k...", "cid": "bafy...", "url": "https://bsky.app/profile/marigoldbuilds.bsky.social/post/3k...", "at": "2026-10-01T06:00:12.000Z" },
  "mastodon": { "status": "skipped", "reason": "not configured: MASTODON_INSTANCE, MASTODON_ACCESS_TOKEN not set", "at": "2026-10-01T06:00:12.000Z" }
}
```

Receipts are written by the workflow and committed by `github-actions[bot]`. Do not write them by hand except to recover from the one case the workflow tells you to (a post went out but the receipt could not be pushed).
```

- [ ] **Step 8: Commit**

```bash
git add publish/package.json publish/lib/queue.js publish/test/queue.test.js publish/test/fixtures/queue queue/README.md
git commit -m "feat(publish): queue item and article parser with the queue/ format" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
```

---

### Task 2: Rich text: graphemes, facets and Mastodon length

**Files:**
- Create: `publish/lib/richtext.js`, `publish/test/richtext.test.js`

**Interfaces:**
- Produces: `graphemeCount(text) -> number`; `findLinks(text) -> { start, end, uri }[]`; `findHashtags(text) -> { start, end, tag }[]`; `facets(text) -> Bluesky facet[]` (`{ index: { byteStart, byteEnd }, features: [{ $type, uri|tag }] }`, sorted by position); `mastodonLength(text) -> number`; `URL_RE`, `MASTODON_URL_CHARS`.
- Consumed by Task 3 (lint) and Tasks 5 and 6 (channels).

- [ ] **Step 1: Write the failing tests**

`publish/test/richtext.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { graphemeCount, findLinks, findHashtags, facets, mastodonLength } from '../lib/richtext.js';

test('graphemeCount counts user-perceived characters', () => {
  assert.equal(graphemeCount('abc'), 3);
  assert.equal(graphemeCount('é'), 1);
  assert.equal(graphemeCount('Day 1/31 · SDG 17'), 17);
});

test('findLinks strips trailing punctuation and closing brackets', () => {
  assert.deepEqual(findLinks('see https://x.y/z. and (https://q.r/s) end'), [
    { start: 4, end: 17, uri: 'https://x.y/z' },
    { start: 24, end: 37, uri: 'https://q.r/s' },
  ]);
});

test('findHashtags ignores fragments inside URLs and all-digit tags', () => {
  assert.deepEqual(findHashtags('#31DaysOfGood #MarigoldBuilds. https://x.y/#frag #123'), [
    { start: 0, end: 13, tag: '31DaysOfGood' },
    { start: 14, end: 29, tag: 'MarigoldBuilds' },
  ]);
});

test('facets use UTF-8 byte offsets, so a two-byte character before a link shifts it', () => {
  assert.deepEqual(facets('é https://a.b/c #tag'), [
    { index: { byteStart: 3, byteEnd: 16 }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://a.b/c' }] },
    { index: { byteStart: 17, byteEnd: 21 }, features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'tag' }] },
  ]);
});

test('facets for the launch template shape are in text order', () => {
  const f = facets('Day 1/31 · SDG 17\nTry it: https://github.com/marigold-builds/sdg-badge\nBuilt by Marigold Builds, an AI, directed by Dom. #MarigoldBuilds #31DaysOfGood');
  assert.deepEqual(f.map((x) => x.features[0].$type), ['app.bsky.richtext.facet#link', 'app.bsky.richtext.facet#tag', 'app.bsky.richtext.facet#tag']);
  assert.equal(f[0].index.byteStart, Buffer.byteLength('Day 1/31 · SDG 17\nTry it: '));
});

test('mastodonLength counts every URL as 23 characters', () => {
  assert.equal(mastodonLength('a https://github.com/marigold-builds/sdg-badge-with-a-long-name b'), 27);
  assert.equal(mastodonLength('é'), 1);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd publish && node --test test/richtext.test.js`
Expected: fails with `Cannot find module '.../lib/richtext.js'`.

- [ ] **Step 3: Write the module**

`publish/lib/richtext.js`:

```js
// Text measurement and Bluesky facets, dependency-free.

const SEGMENTER = new Intl.Segmenter('en', { granularity: 'grapheme' });

// Bluesky's 300 limit counts graphemes (user-perceived characters), not
// UTF-16 code units: "e" + combining acute is one grapheme, as is a flag.
export function graphemeCount(text) {
  let n = 0;
  for (const _ of SEGMENTER.segment(text)) n++;
  return n;
}

export const URL_RE = /https?:\/\/[^\s<>()[\]]+/g;
const TRAILING_PUNCT = /[.,;:!?'"]+$/;

export function findLinks(text) {
  const out = [];
  for (const m of text.matchAll(URL_RE)) {
    const uri = m[0].replace(TRAILING_PUNCT, '');
    out.push({ start: m.index, end: m.index + uri.length, uri });
  }
  return out;
}

// A hashtag starts the text or follows whitespace or "(", so "/#anchor"
// inside a URL is not a tag. All-digit tags are not tags on Bluesky.
const TAG_RE = /(^|[\s(])#([\p{L}\p{N}_]+)/gu;

export function findHashtags(text) {
  const out = [];
  for (const m of text.matchAll(TAG_RE)) {
    const tag = m[2];
    if (/^\d+$/.test(tag)) continue;
    const start = m.index + m[1].length;
    out.push({ start, end: start + 1 + tag.length, tag });
  }
  return out;
}

// Facet indices are byte offsets into the UTF-8 encoding, not string
// indices. "·" (U+00B7) in the post template is one character and two
// bytes, so any link after it would be off by one if we used indices.
function byteOffset(text, index) {
  return Buffer.byteLength(text.slice(0, index), 'utf8');
}

export function facets(text) {
  const spans = [
    ...findLinks(text).map((l) => ({ start: l.start, end: l.end, features: [{ $type: 'app.bsky.richtext.facet#link', uri: l.uri }] })),
    ...findHashtags(text).map((h) => ({ start: h.start, end: h.end, features: [{ $type: 'app.bsky.richtext.facet#tag', tag: h.tag }] })),
  ].sort((a, b) => a.start - b.start);
  return spans.map((s) => ({
    index: { byteStart: byteOffset(text, s.start), byteEnd: byteOffset(text, s.end) },
    features: s.features,
  }));
}

// Mastodon counts every URL as 23 characters regardless of its length.
export const MASTODON_URL_CHARS = 23;

export function mastodonLength(text) {
  return [...text.replace(URL_RE, 'x'.repeat(MASTODON_URL_CHARS))].length;
}
```

- [ ] **Step 4: Run the tests**

Run: `cd publish && npm test`
Expected: 17 passing (11 from Task 1, 6 here).

- [ ] **Step 5: Commit**

```bash
git add publish/lib/richtext.js publish/test/richtext.test.js
git commit -m "feat(publish): grapheme count, Bluesky facets with byte offsets, Mastodon length" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
```

---

### Task 3: Lint, the `lint` command, and CI on every queue PR

**Files:**
- Create: `publish/lib/lint.js`, `publish/test/lint.test.js`, `publish/test/fixtures/fake-fetch.js`, `publish/cli.js` (lint-only version; Task 9 replaces it)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: item shape (Task 1), `graphemeCount`/`mastodonLength` (Task 2).
- Produces: `lintItem(item, { root }) -> string[]` (empty means clean); `firstParagraph(markdown) -> string`; constants `BLUESKY_MAX_GRAPHEMES = 300`, `MASTODON_MAX_CHARS = 500`, `IMAGE_MAX_BYTES = 1_000_000`, `DEVTO_MAX_TAGS = 4`, `DEVTO_MAX_TITLE = 128`, `DISCLOSURE_SHORT`. Test helpers `fakeFetch(routes) -> { fetch, calls }`, `fakePng(width, height) -> Buffer`, `fixtureItem(overrides) -> item`, used by every later test file.
- `node publish/cli.js lint` exits 0 when every item in `<root>/queue` is clean, 1 otherwise, printing `::error file=<path>::<id>: <problem>` lines. `PUBLISH_ROOT` overrides the repository root (tests and rehearsals use it).

- [ ] **Step 1: Write the shared test helpers**

`publish/test/fixtures/fake-fetch.js`:

```js
// A fetch double keyed by "METHOD /path". A route is a response
// ({ status, body }) or a function of the call returning one. Every call is
// recorded so tests can assert on headers and bodies.
export function fakeFetch(routes) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    const key = `${init.method || 'GET'} ${new URL(url).pathname}`;
    calls.push({ key, url, init });
    const route = routes[key];
    if (!route) throw new Error(`fakeFetch: no route for ${key}`);
    const { status = 200, body = {} } = typeof route === 'function' ? route({ url, init }) : route;
    return { status, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) };
  };
  return { fetch, calls };
}

// The smallest buffer pngSize() accepts: signature, then an IHDR chunk
// declaring 1200 x 630. Not a renderable PNG; the pipeline never decodes it.
export function fakePng(width = 1200, height = 630) {
  const buf = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
  buf.writeUInt32BE(13, 8);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

export function fixtureItem(overrides = {}) {
  const text = 'Day 1/31 · SDG 17\nTry it: https://github.com/marigold-builds/sdg-badge\nBuilt by Marigold Builds, an AI, directed by Dom. #MarigoldBuilds';
  return {
    id: '2026-10-01-day-01', date: '2026-10-01', slug: 'day-01', day: 1, alt: 'Day 1 tile', image: null,
    meta: { day: '1', alt: 'Day 1 tile' }, sections: { bluesky: text, mastodon: text }, posts: { bluesky: text, mastodon: text },
    article: { title: 'sdg-badge (31 Days of Good, day 1)', tags: ['opensource', 'sdg'], description: null, series: '31 Days of Good', body: 'This is day 1. Built by Claude.\n\n## The problem\n\nText.', path: 'x.article.md' },
    path: '/tmp/queue/2026-10-01-day-01.md', receiptPath: '/tmp/queue/2026-10-01-day-01.posted.json',
    ...overrides,
  };
}
```

- [ ] **Step 2: Write the failing tests**

`publish/test/lint.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lintItem, firstParagraph } from '../lib/lint.js';
import { loadQueue } from '../lib/queue.js';
import { fixtureItem } from './fixtures/fake-fetch.js';

const ROOT = join(import.meta.dirname, '..', '..');
const FIXTURES = join(import.meta.dirname, 'fixtures', 'queue');

test('the fixture queue item is clean', () => {
  const [item] = loadQueue(FIXTURES);
  assert.deepEqual(lintItem(item, { root: ROOT }), []);
});

test('lint rejects an unknown section', () => {
  const item = fixtureItem({ sections: { bluesky: 'x', blusky: 'typo' } });
  assert.ok(lintItem(item, { root: ROOT }).some((e) => e.includes('unknown section "## blusky"')));
});

test('lint rejects a post over 300 graphemes', () => {
  const long = `${'x'.repeat(290)} Built by Marigold Builds, an AI`;
  const item = fixtureItem({ posts: { bluesky: long } });
  assert.ok(lintItem(item, { root: ROOT }).some((e) => /bluesky: 3\d\d graphemes, limit 300/.test(e)));
});

test('lint counts Mastodon links as 23 characters against a 500 limit', () => {
  const ok = `${'x'.repeat(440)} https://example.org/${'y'.repeat(200)} Marigold Builds, an AI`;
  const item = fixtureItem({ posts: { mastodon: ok } });
  assert.ok(!lintItem(item, { root: ROOT }).some((e) => e.startsWith('mastodon:')), 'a long URL counts as 23');
});

test('lint rejects a post without the disclosure, with an emoji, or saying AI-powered', () => {
  const errors = lintItem(fixtureItem({ posts: { bluesky: 'An AI-powered thing 🚀' } }), { root: ROOT });
  assert.ok(errors.some((e) => e.includes('missing the disclosure')));
  assert.ok(errors.some((e) => e.includes('contains an emoji')));
  assert.ok(errors.some((e) => e.includes('"AI-powered"')));
});

test('lint requires alt when an image will be attached', () => {
  assert.ok(lintItem(fixtureItem({ alt: null }), { root: ROOT }).some((e) => e.includes('alt is missing')));
});

test('lint rejects day out of range and day plus image together', () => {
  assert.ok(lintItem(fixtureItem({ day: 32, meta: { day: '32' } }), { root: ROOT }).some((e) => e.includes('1 to 31')));
  assert.ok(lintItem(fixtureItem({ image: 'queue/x.png' }), { root: ROOT }).some((e) => e.includes('not both')));
});

test('lint checks an image path exists and is a png or jpg', () => {
  const root = mkdtempSync(join(tmpdir(), 'root-'));
  writeFileSync(join(root, 'card.png'), 'png');
  assert.deepEqual(lintItem(fixtureItem({ day: null, image: 'card.png', article: null }), { root }), []);
  assert.ok(lintItem(fixtureItem({ day: null, image: 'missing.png', article: null }), { root }).some((e) => e.includes('does not exist')));
  assert.ok(lintItem(fixtureItem({ day: null, image: 'card.gif', article: null }), { root }).some((e) => e.includes('.png or .jpg')));
});

test('lint requires the article to disclose in its first paragraph and to have 1 to 4 lowercase tags', () => {
  const item = fixtureItem();
  item.article = { ...item.article, body: '## Heading\n\nNo disclosure here.\n\nClaude appears later.', tags: ['Open-Source', 'a', 'b', 'c', 'd'] };
  const errors = lintItem(item, { root: ROOT });
  assert.ok(errors.some((e) => e.includes('first paragraph must disclose')));
  assert.ok(errors.some((e) => e.includes('1 to 4 tags')));
  assert.ok(errors.some((e) => e.includes('tag "Open-Source"')));
});

test('firstParagraph skips headings and images', () => {
  assert.equal(firstParagraph('# Title\n\n![alt](https://x/y.png)\n\nFirst real paragraph.\n\nSecond.'), 'First real paragraph.');
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `cd publish && node --test test/lint.test.js`
Expected: fails with `Cannot find module '.../lib/lint.js'`.

- [ ] **Step 4: Write the linter**

`publish/lib/lint.js`:

```js
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { graphemeCount, mastodonLength } from './richtext.js';
import { KNOWN_SECTIONS } from './queue.js';

export const BLUESKY_MAX_GRAPHEMES = 300;
// mastodon.social's limit. If Dom picks an instance with a different limit,
// change this one constant (docs/07-decisions.md, still-open list).
export const MASTODON_MAX_CHARS = 500;
// Bluesky's image limit; Mastodon allows more, so the stricter one applies.
export const IMAGE_MAX_BYTES = 1_000_000;
export const DEVTO_MAX_TAGS = 4;
export const DEVTO_MAX_TITLE = 128;

// The short-form disclosure from docs/05-marketing-playbook.md:
// "Built by Marigold Builds, an AI, directed by Dom."
export const DISCLOSURE_SHORT = /Marigold Builds, an AI, directed by Dom\./;
const EMOJI_RE = /\p{Extended_Pictographic}/u;
const AI_POWERED_RE = /AI[- ]powered/i;
const DEVTO_TAG_RE = /^[a-z0-9]+$/;

function checkVoice(label, text, errors) {
  if (EMOJI_RE.test(text)) errors.push(`${label}: contains an emoji`);
  if (AI_POWERED_RE.test(text)) errors.push(`${label}: says "AI-powered"`);
}

function checkPost(label, text, errors) {
  if (text.length === 0) errors.push(`${label}: section is empty`);
  if (!DISCLOSURE_SHORT.test(text)) errors.push(`${label}: missing the disclosure "Built by Marigold Builds, an AI, directed by Dom."`);
  checkVoice(label, text, errors);
}

// First paragraph of a markdown body, skipping headings and images.
export function firstParagraph(markdown) {
  const paragraphs = markdown.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !p.startsWith('#') && !p.startsWith('!['));
  return paragraphs[0] || '';
}

// Returns a list of problems; an empty list means the item may be posted.
export function lintItem(item, { root }) {
  const errors = [];
  for (const name of Object.keys(item.sections)) {
    if (!KNOWN_SECTIONS.includes(name)) errors.push(`unknown section "## ${name}" (known: ${KNOWN_SECTIONS.join(', ')})`);
  }
  if (item.day !== null && (!Number.isInteger(item.day) || item.day < 1 || item.day > 31)) {
    errors.push(`day must be a whole number from 1 to 31, got ${JSON.stringify(item.meta.day)}`);
  }
  if (item.day !== null && item.image !== null) errors.push('set day (tile image) or image (a file in the repo), not both');
  const attachesImage = item.day !== null || item.image !== null;
  if (attachesImage && !item.alt) errors.push('an image will be attached (day or image is set) but alt is missing');
  if (item.image !== null) {
    if (!/\.(png|jpe?g)$/i.test(item.image)) errors.push(`image "${item.image}" must be a .png or .jpg file`);
    else if (!existsSync(join(root, item.image))) errors.push(`image "${item.image}" does not exist in the repository`);
    else if (statSync(join(root, item.image)).size > IMAGE_MAX_BYTES) errors.push(`image "${item.image}" is over ${IMAGE_MAX_BYTES} bytes`);
  }
  if (item.posts.bluesky !== undefined) {
    const n = graphemeCount(item.posts.bluesky);
    if (n > BLUESKY_MAX_GRAPHEMES) errors.push(`bluesky: ${n} graphemes, limit ${BLUESKY_MAX_GRAPHEMES}`);
    checkPost('bluesky', item.posts.bluesky, errors);
  }
  if (item.posts.mastodon !== undefined) {
    const n = mastodonLength(item.posts.mastodon);
    if (n > MASTODON_MAX_CHARS) errors.push(`mastodon: ${n} characters (links count ${23}), limit ${MASTODON_MAX_CHARS}`);
    checkPost('mastodon', item.posts.mastodon, errors);
  }
  if (item.article !== null) {
    const a = item.article;
    if (!a.title) errors.push('article: title is missing');
    else if (a.title.length > DEVTO_MAX_TITLE) errors.push(`article: title is ${a.title.length} characters, limit ${DEVTO_MAX_TITLE}`);
    if (a.tags.length === 0 || a.tags.length > DEVTO_MAX_TAGS) errors.push(`article: 1 to ${DEVTO_MAX_TAGS} tags required, got ${a.tags.length}`);
    for (const t of a.tags) if (!DEVTO_TAG_RE.test(t)) errors.push(`article: tag "${t}" must be lowercase letters and digits only`);
    if (!a.body) errors.push('article: body is empty');
    else if (!/Claude/.test(firstParagraph(a.body))) errors.push('article: the first paragraph must disclose AI authorship (dev.to asks for it; name Claude)');
    checkVoice('article', `${a.title || ''}\n${a.body}`, errors);
  }
  return errors;
}
```

- [ ] **Step 5: Run the tests**

Run: `cd publish && npm test`
Expected: 27 passing.

- [ ] **Step 6: Write the lint-only CLI**

`publish/cli.js` (Task 9 replaces this file with the version that also publishes; the `lint` half is identical there):

```js
import { join } from 'node:path';
import { loadQueue } from './lib/queue.js';
import { lintItem } from './lib/lint.js';

const ROOT = process.env.PUBLISH_ROOT || join(import.meta.dirname, '..');
const QUEUE = join(ROOT, 'queue');

function lint() {
  const items = loadQueue(QUEUE);
  let problems = 0;
  for (const item of items) {
    for (const e of lintItem(item, { root: ROOT })) {
      console.log(`::error file=${item.path}::${item.id}: ${e}`);
      problems++;
    }
  }
  console.log(problems ? `${problems} problem(s) in ${items.length} queue item(s).` : `${items.length} queue item(s), no problems.`);
  return problems ? 1 : 0;
}

const command = process.argv[2];
try {
  if (command === 'lint') process.exit(lint());
  console.error('usage: node publish/cli.js lint');
  process.exit(2);
} catch (err) {
  // The message only: a stack could carry a path or a value that must not reach a public log.
  console.log(`::error::${err.message}`);
  process.exit(1);
}
```

- [ ] **Step 7: Check the CLI by hand against the fixtures and the real (empty) queue**

Run: `PUBLISH_ROOT=publish/test/fixtures node publish/cli.js lint`
Expected: `1 queue item(s), no problems.` and exit code 0.

Run: `node publish/cli.js lint`
Expected: `0 queue item(s), no problems.` (only `queue/README.md` exists).

- [ ] **Step 8: Run the publish tests and the lint on every push and pull request**

Modify `.github/workflows/ci.yml` so the `test` job ends with two more steps; the whole file becomes:

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: site-build/package-lock.json }
      - run: sudo apt-get update && sudo apt-get install -y fonts-dejavu-core
      - run: npm ci
        working-directory: site-build
      - run: npm test
        working-directory: site-build
      - run: npm test
        working-directory: publish
      - name: Lint the publish queue
        run: node publish/cli.js lint
```

- [ ] **Step 9: Commit and confirm CI is green**

```bash
git add publish/lib/lint.js publish/test/lint.test.js publish/test/fixtures/fake-fetch.js publish/cli.js .github/workflows/ci.yml
git commit -m "feat(publish): lint queue items and run it in CI on every queue PR" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
git push
gh run watch --exit-status "$(gh run list --workflow ci --limit 1 --json databaseId --jq '.[0].databaseId')"
```

Expected: the `ci` run passes with the two new steps.

---

### Task 4: The HTTP layer that cannot leak

**Files:**
- Create: `publish/lib/http.js`, `publish/test/http.test.js`

**Interfaces:**
- Produces: `request(fetchImpl, channel, url, { method, headers, body, expect }) -> { status, json }` (throws `HttpError` on any status not in `expect`, default `[200]`); `class HttpError { channel, status, code, detail }` whose message is `"<channel>: HTTP <status> <code> - <detail>"` and never more; `errorFields(json) -> { code, detail }`; `mask(value, out = process.stdout, env = process.env)`; `pngSize(bytes) -> { width, height } | null`.
- Consumed by Tasks 5, 6, 7 (channels) and 8 (assets).

- [ ] **Step 1: Write the failing tests**

`publish/test/http.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request, HttpError, errorFields, mask, pngSize } from '../lib/http.js';
import { fakeFetch, fakePng } from './fixtures/fake-fetch.js';

test('request returns parsed JSON on an expected status', async () => {
  const { fetch } = fakeFetch({ 'GET /ok': { body: { a: 1 } } });
  assert.deepEqual(await request(fetch, 'test', 'https://h.example/ok'), { status: 200, json: { a: 1 } });
});

test('an unexpected status becomes an HttpError carrying only status, error and message', async () => {
  const { fetch } = fakeFetch({ 'POST /xrpc/x': { status: 401, body: { error: 'AuthenticationRequired', message: 'Invalid identifier or password', accessJwt: 'SECRET-TOKEN' } } });
  await assert.rejects(request(fetch, 'bluesky', 'https://h.example/xrpc/x', { method: 'POST' }), (err) => {
    assert.ok(err instanceof HttpError);
    assert.equal(err.status, 401);
    assert.equal(err.message, 'bluesky: HTTP 401 AuthenticationRequired - Invalid identifier or password');
    assert.ok(!String(err).includes('SECRET-TOKEN'));
    assert.ok(!JSON.stringify(err).includes('SECRET-TOKEN'));
    return true;
  });
});

test('a non-JSON error body is never printed', async () => {
  const { fetch } = fakeFetch({ 'GET /html': { status: 502, body: '<html>token=abc</html>' } });
  await assert.rejects(request(fetch, 'mastodon', 'https://h.example/html'), (err) => {
    assert.equal(err.message, 'mastodon: HTTP 502 - response body was not JSON; not printed');
    return true;
  });
});

test('a network failure is reported by host only', async () => {
  const fetch = async () => { throw new TypeError('fetch failed'); };
  await assert.rejects(request(fetch, 'devto', 'https://dev.to/api/users/me'), /devto: HTTP 0 network - request to dev.to failed: fetch failed/);
});

test('errorFields truncates long fields', () => {
  assert.equal(errorFields({ error: 'x'.repeat(500) }).code.length, 200);
});

test('mask writes an add-mask command only on Actions and only for single-line values', () => {
  let out = '';
  const writer = { write: (s) => { out += s; } };
  mask('tok', writer, { GITHUB_ACTIONS: 'true' });
  mask('', writer, { GITHUB_ACTIONS: 'true' });
  mask('a\nb', writer, { GITHUB_ACTIONS: 'true' });
  mask('local', writer, {});
  assert.equal(out, '::add-mask::tok\n');
});

test('pngSize reads IHDR and rejects non-PNG bytes', () => {
  assert.deepEqual(pngSize(fakePng(1200, 630)), { width: 1200, height: 630 });
  assert.equal(pngSize(Buffer.from('not a png at all, long enough')), null);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd publish && node --test test/http.test.js`
Expected: fails with `Cannot find module '.../lib/http.js'`.

- [ ] **Step 3: Write the module**

`publish/lib/http.js`:

```js
// The one place HTTP happens. This repository is public, so every Actions
// log is public and permanent: nothing in this module ever puts a request
// header, a request body, or a response body into an error message or the
// log. An error carries the HTTP status and, when the body was JSON, its
// short `error` / `message` fields, truncated.

const FIELD_MAX = 200;

export class HttpError extends Error {
  constructor(channel, status, code, detail) {
    super(`${channel}: HTTP ${status}${code ? ` ${code}` : ''}${detail ? ` - ${detail}` : ''}`);
    this.name = 'HttpError';
    this.channel = channel;
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export function errorFields(json) {
  if (!json || typeof json !== 'object') return { code: '', detail: 'response body was not JSON; not printed' };
  const code = typeof json.error === 'string' ? json.error.slice(0, FIELD_MAX) : '';
  const detail = typeof json.message === 'string' ? json.message.slice(0, FIELD_MAX) : '';
  return { code, detail };
}

// fetchImpl is injected so tests never touch the network.
export async function request(fetchImpl, channel, url, { method = 'GET', headers = {}, body, expect = [200] } = {}) {
  let res;
  try {
    res = await fetchImpl(url, { method, headers, body });
  } catch (e) {
    throw new HttpError(channel, 0, 'network', `request to ${new URL(url).host} failed: ${e.message}`);
  }
  const text = await res.text();
  let json = null;
  if (text) {
    try { json = JSON.parse(text); } catch { json = null; }
  }
  if (!expect.includes(res.status)) {
    const { code, detail } = errorFields(json);
    throw new HttpError(channel, res.status, code, detail);
  }
  return { status: res.status, json };
}

// Tells the Actions runner to replace every later occurrence of `value` in
// the log with ***. Session tokens come back from an API, so GitHub does not
// know to mask them the way it masks `secrets.*`; this closes that gap.
export function mask(value, out = process.stdout, env = process.env) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\n')) return;
  if (env.GITHUB_ACTIONS !== 'true') return;
  out.write(`::add-mask::${value}\n`);
}

// Width and height from a PNG's IHDR chunk; null for anything else.
export function pngSize(bytes) {
  if (bytes.length < 24 || bytes.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
```

- [ ] **Step 4: Run the tests**

Run: `cd publish && npm test`
Expected: 34 passing.

- [ ] **Step 5: Commit**

```bash
git add publish/lib/http.js publish/test/http.test.js
git commit -m "feat(publish): HTTP layer that never prints headers, bodies or tokens" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
```

---

### Task 5: Bluesky channel

**Files:**
- Create: `publish/lib/channels/bluesky.js`, `publish/test/bluesky.test.js`

**Interfaces:**
- Consumes: `request`, `mask` (Task 4); `facets`, `graphemeCount` (Task 2); item shape (Task 1); `assets` shape from Task 8: `{ image: { path, bytes: Buffer, mime, alt, width?, height? } | null }`.
- Produces the **channel interface** every channel module implements and Task 8 calls:
  - `name: string`
  - `REQUIRED: string[]` (environment variable names)
  - `configure(env) -> { ok: true, config } | { ok: false, missing: string[] }`
  - `hasContent(item) -> boolean`
  - `authenticate(config, { fetch }) -> session` (throws on refusal or failure)
  - `preview(item) -> object` (pure)
  - `publish(session, item, assets, { fetch, dryRun, now }) -> { status: 'posted', url, ... } | { status: 'dry-run', preview }`
- Endpoints: `POST https://bsky.social/xrpc/com.atproto.server.createSession`, `POST .../com.atproto.repo.uploadBlob`, `POST .../com.atproto.repo.createRecord`. Post URL: `https://bsky.app/profile/<handle>/post/<rkey>`.

- [ ] **Step 1: Write the failing tests**

`publish/test/bluesky.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as bluesky from '../lib/channels/bluesky.js';
import { fakeFetch, fakePng, fixtureItem } from './fixtures/fake-fetch.js';

const ENV = { BLUESKY_HANDLE: 'marigoldbuilds.bsky.social', BLUESKY_APP_PASSWORD: 'app-pass' };
const assets = { image: { path: '/tiles/day-01.png', bytes: fakePng(), mime: 'image/png', alt: 'Day 1 tile', width: 1200, height: 630 } };
const now = () => new Date('2026-10-01T06:00:00Z');

test('configure names the missing variables', () => {
  assert.deepEqual(bluesky.configure({}), { ok: false, missing: ['BLUESKY_HANDLE', 'BLUESKY_APP_PASSWORD'] });
  assert.equal(bluesky.configure(ENV).ok, true);
});

test('authenticate posts identifier and password and keeps only did, handle and accessJwt', async () => {
  const { fetch, calls } = fakeFetch({ 'POST /xrpc/com.atproto.server.createSession': { body: { did: 'did:plc:abc', handle: 'marigoldbuilds.bsky.social', accessJwt: 'A', refreshJwt: 'R' } } });
  const session = await bluesky.authenticate(bluesky.configure(ENV).config, { fetch });
  assert.deepEqual(JSON.parse(calls[0].init.body), { identifier: 'marigoldbuilds.bsky.social', password: 'app-pass' });
  assert.deepEqual(session, { did: 'did:plc:abc', handle: 'marigoldbuilds.bsky.social', accessJwt: 'A' });
});

test('a dry run builds the full record with facets and embed but makes no write call', async () => {
  const { fetch, calls } = fakeFetch({});
  const r = await bluesky.publish({ did: 'd', handle: 'h', accessJwt: 'A' }, fixtureItem(), assets, { fetch, dryRun: true, now });
  assert.equal(calls.length, 0);
  assert.equal(r.status, 'dry-run');
  assert.equal(r.preview.record.$type, 'app.bsky.feed.post');
  assert.equal(r.preview.record.facets.length, 2);
  assert.equal(r.preview.record.embed.images[0].alt, 'Day 1 tile');
  assert.deepEqual(r.preview.record.embed.images[0].aspectRatio, { width: 1200, height: 630 });
  assert.equal(r.preview.record.createdAt, '2026-10-01T06:00:00.000Z');
  assert.ok(!JSON.stringify(r).includes('"A"'), 'the session token is not in the preview');
});

test('a live publish uploads the blob then creates the record and returns the post URL', async () => {
  const blob = { $type: 'blob', ref: { $link: 'bafy' }, mimeType: 'image/png', size: 33 };
  const { fetch, calls } = fakeFetch({
    'POST /xrpc/com.atproto.repo.uploadBlob': { body: { blob } },
    'POST /xrpc/com.atproto.repo.createRecord': { body: { uri: 'at://did:plc:abc/app.bsky.feed.post/3k2a', cid: 'bafyrec' } },
  });
  const r = await bluesky.publish({ did: 'did:plc:abc', handle: 'marigoldbuilds.bsky.social', accessJwt: 'A' }, fixtureItem(), assets, { fetch, dryRun: false, now });
  assert.equal(calls[0].init.headers['Content-Type'], 'image/png');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer A');
  assert.ok(Buffer.isBuffer(calls[0].init.body));
  const body = JSON.parse(calls[1].init.body);
  assert.equal(body.repo, 'did:plc:abc');
  assert.equal(body.collection, 'app.bsky.feed.post');
  assert.deepEqual(body.record.embed.images[0].image, blob);
  assert.deepEqual(body.record.langs, ['en']);
  assert.deepEqual(r, { status: 'posted', uri: 'at://did:plc:abc/app.bsky.feed.post/3k2a', cid: 'bafyrec', url: 'https://bsky.app/profile/marigoldbuilds.bsky.social/post/3k2a' });
});

test('a text-only item has no embed', async () => {
  const { fetch } = fakeFetch({});
  const r = await bluesky.publish({ did: 'd', handle: 'h', accessJwt: 'A' }, fixtureItem({ day: null }), { image: null }, { fetch, dryRun: true, now });
  assert.equal(r.preview.record.embed, undefined);
});

test('a failed createRecord surfaces status and code without the body', async () => {
  const { fetch } = fakeFetch({
    'POST /xrpc/com.atproto.repo.uploadBlob': { body: { blob: {} } },
    'POST /xrpc/com.atproto.repo.createRecord': { status: 400, body: { error: 'InvalidRequest', message: 'record too long', debug: 'SECRET' } },
  });
  await assert.rejects(bluesky.publish({ did: 'd', handle: 'h', accessJwt: 'A' }, fixtureItem(), assets, { fetch, dryRun: false, now }), (e) => {
    assert.equal(e.message, 'bluesky: HTTP 400 InvalidRequest - record too long');
    return true;
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd publish && node --test test/bluesky.test.js`
Expected: fails with `Cannot find module '.../lib/channels/bluesky.js'`.

- [ ] **Step 3: Write the channel**

`publish/lib/channels/bluesky.js`:

```js
import { request, mask } from '../http.js';
import { facets, graphemeCount } from '../richtext.js';

export const name = 'bluesky';
export const PDS = 'https://bsky.social';
export const REQUIRED = ['BLUESKY_HANDLE', 'BLUESKY_APP_PASSWORD'];

export function configure(env) {
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) return { ok: false, missing };
  return { ok: true, config: { handle: env.BLUESKY_HANDLE, password: env.BLUESKY_APP_PASSWORD } };
}

export function hasContent(item) {
  return item.posts.bluesky !== undefined;
}

function bearer(session) {
  return { Authorization: `Bearer ${session.accessJwt}` };
}

export async function authenticate(config, { fetch }) {
  const { json } = await request(fetch, name, `${PDS}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: config.handle, password: config.password }),
  });
  mask(json.accessJwt);
  mask(json.refreshJwt);
  if (!json.did || !json.handle || !json.accessJwt) throw new Error('bluesky: createSession succeeded but the response was missing did, handle or accessJwt; not printed');
  return { did: json.did, handle: json.handle, accessJwt: json.accessJwt };
}

// Pure: what the post will contain, before any network call.
export function preview(item) {
  const text = item.posts.bluesky;
  return { text, graphemes: graphemeCount(text), facets: facets(text) };
}

export async function publish(session, item, assets, { fetch, dryRun, now = () => new Date() }) {
  const p = preview(item);
  const record = { $type: 'app.bsky.feed.post', text: p.text, langs: ['en'], createdAt: now().toISOString() };
  if (p.facets.length) record.facets = p.facets;
  if (assets.image) {
    const image = { alt: assets.image.alt };
    if (assets.image.width && assets.image.height) image.aspectRatio = { width: assets.image.width, height: assets.image.height };
    if (dryRun) {
      image.image = `<blob: ${assets.image.bytes.length} bytes of ${assets.image.mime}, uploaded at publish time>`;
    } else {
      const { json } = await request(fetch, name, `${PDS}/xrpc/com.atproto.repo.uploadBlob`, {
        method: 'POST',
        headers: { ...bearer(session), 'Content-Type': assets.image.mime },
        body: assets.image.bytes,
      });
      image.image = json.blob;
    }
    record.embed = { $type: 'app.bsky.embed.images', images: [image] };
  }
  if (dryRun) return { status: 'dry-run', preview: { graphemes: p.graphemes, record } };
  const { json } = await request(fetch, name, `${PDS}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: { ...bearer(session), 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo: session.did, collection: 'app.bsky.feed.post', record }),
  });
  const rkey = String(json.uri).split('/').pop();
  return { status: 'posted', uri: json.uri, cid: json.cid, url: `https://bsky.app/profile/${session.handle}/post/${rkey}` };
}
```

- [ ] **Step 4: Run the tests**

Run: `cd publish && npm test`
Expected: 40 passing.

- [ ] **Step 5: Commit**

```bash
git add publish/lib/channels/bluesky.js publish/test/bluesky.test.js
git commit -m "feat(publish): Bluesky channel with facets, image embed and dry run" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
```

---

### Task 6: Mastodon channel

**Files:**
- Create: `publish/lib/channels/mastodon.js`, `publish/test/mastodon.test.js`

**Interfaces:**
- Consumes: `request` (Task 4); `mastodonLength` (Task 2); the channel interface from Task 5.
- Produces: a channel module. Endpoints on `MASTODON_INSTANCE`: `GET /api/v1/accounts/verify_credentials` (must return `bot: true`), `POST /api/v2/media` (multipart `file` + `description`; 200 ready, 202 processing, then `GET /api/v1/media/:id` until 200), `POST /api/v1/statuses` with an `Idempotency-Key` header. `publish` accepts an injectable `sleep` for the poll.
- Refuses: an instance not starting with `https://`, `fosstodon.org`, and any account without the bot flag.

- [ ] **Step 1: Write the failing tests**

`publish/test/mastodon.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mastodon from '../lib/channels/mastodon.js';
import { fakeFetch, fakePng, fixtureItem } from './fixtures/fake-fetch.js';

const ENV = { MASTODON_INSTANCE: 'https://mastodon.social/', MASTODON_ACCESS_TOKEN: 'tok' };
const assets = { image: { path: '/tiles/day-01.png', bytes: fakePng(), mime: 'image/png', alt: 'Day 1 tile', width: 1200, height: 630 } };
const session = { instance: 'https://mastodon.social', token: 'tok', acct: 'marigoldbuilds' };
const noSleep = async () => {};

test('configure trims the trailing slash and names missing variables', () => {
  assert.deepEqual(mastodon.configure({ MASTODON_INSTANCE: 'https://x' }), { ok: false, missing: ['MASTODON_ACCESS_TOKEN'] });
  assert.equal(mastodon.configure(ENV).config.instance, 'https://mastodon.social');
});

test('authenticate refuses Fosstodon, a non-https instance, and an account without the bot flag', async () => {
  const { fetch } = fakeFetch({ 'GET /api/v1/accounts/verify_credentials': { body: { acct: 'marigoldbuilds', bot: false } } });
  await assert.rejects(mastodon.authenticate({ instance: 'https://fosstodon.org', token: 't' }, { fetch }), /fosstodon.org forbids unattended posting/);
  await assert.rejects(mastodon.authenticate({ instance: 'http://mastodon.social', token: 't' }, { fetch }), /must start with https/);
  await assert.rejects(mastodon.authenticate({ instance: 'https://mastodon.social', token: 't' }, { fetch }), /not flagged as a bot/);
});

test('authenticate sends the bearer token and returns the acct', async () => {
  const { fetch, calls } = fakeFetch({ 'GET /api/v1/accounts/verify_credentials': { body: { acct: 'marigoldbuilds', bot: true } } });
  const s = await mastodon.authenticate(mastodon.configure(ENV).config, { fetch });
  assert.equal(calls[0].init.headers.Authorization, 'Bearer tok');
  assert.equal(s.acct, 'marigoldbuilds');
});

test('a dry run makes no calls and previews the status params', async () => {
  const { fetch, calls } = fakeFetch({});
  const r = await mastodon.publish(session, fixtureItem(), assets, { fetch, dryRun: true, sleep: noSleep });
  assert.equal(calls.length, 0);
  assert.equal(r.preview.params.visibility, 'public');
  assert.match(r.preview.params.media_ids[0], /alt "Day 1 tile"/);
});

test('a live publish uploads media with a description, then posts with an idempotency key', async () => {
  const { fetch, calls } = fakeFetch({
    'POST /api/v2/media': { body: { id: '9001' } },
    'POST /api/v1/statuses': { body: { id: '1234', url: 'https://mastodon.social/@marigoldbuilds/1234' } },
  });
  const r = await mastodon.publish(session, fixtureItem(), assets, { fetch, dryRun: false, sleep: noSleep });
  assert.ok(calls[0].init.body instanceof FormData);
  assert.equal(calls[0].init.body.get('description'), 'Day 1 tile');
  assert.equal(calls[0].init.body.get('file').type, 'image/png');
  assert.equal(calls[1].init.headers['Idempotency-Key'], '31dog-2026-10-01-day-01');
  assert.deepEqual(JSON.parse(calls[1].init.body), { status: fixtureItem().posts.mastodon, visibility: 'public', language: 'en', media_ids: ['9001'] });
  assert.deepEqual(r, { status: 'posted', id: '1234', url: 'https://mastodon.social/@marigoldbuilds/1234' });
});

test('a 202 from media upload is polled until 200', async () => {
  let polls = 0;
  const { fetch, calls } = fakeFetch({
    'POST /api/v2/media': { status: 202, body: { id: '9001' } },
    'GET /api/v1/media/9001': () => ({ status: ++polls < 2 ? 206 : 200, body: { id: '9001' } }),
    'POST /api/v1/statuses': { body: { id: '1', url: 'u' } },
  });
  await mastodon.publish(session, fixtureItem(), assets, { fetch, dryRun: false, sleep: noSleep });
  assert.equal(polls, 2);
  assert.equal(calls.length, 4);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd publish && node --test test/mastodon.test.js`
Expected: fails with `Cannot find module '.../lib/channels/mastodon.js'`.

- [ ] **Step 3: Write the channel**

`publish/lib/channels/mastodon.js`:

```js
import { basename } from 'node:path';
import { request } from '../http.js';
import { mastodonLength } from '../richtext.js';

export const name = 'mastodon';
export const REQUIRED = ['MASTODON_INSTANCE', 'MASTODON_ACCESS_TOKEN'];
// docs/05-marketing-playbook.md: Fosstodon forbids unattended posting.
export const FORBIDDEN_HOSTS = ['fosstodon.org'];
const MEDIA_POLL_ATTEMPTS = 10;

export function configure(env) {
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) return { ok: false, missing };
  return { ok: true, config: { instance: env.MASTODON_INSTANCE.replace(/\/+$/, ''), token: env.MASTODON_ACCESS_TOKEN } };
}

export function hasContent(item) {
  return item.posts.mastodon !== undefined;
}

function bearer(c) {
  return { Authorization: `Bearer ${c.token}` };
}

export async function authenticate(config, { fetch }) {
  let host;
  try { host = new URL(config.instance).hostname; } catch { throw new Error('mastodon: MASTODON_INSTANCE is not a URL; expected e.g. https://mastodon.social'); }
  if (!config.instance.startsWith('https://')) throw new Error('mastodon: MASTODON_INSTANCE must start with https://');
  if (FORBIDDEN_HOSTS.includes(host)) throw new Error(`mastodon: ${host} forbids unattended posting (docs/05-marketing-playbook.md); refusing to post there`);
  const { json } = await request(fetch, name, `${config.instance}/api/v1/accounts/verify_credentials`, { headers: bearer(config) });
  if (!json.acct) throw new Error('mastodon: verify_credentials succeeded but the response had no acct field; not printed');
  // A public commitment (docs/05): the account is marked as a bot or it does not post.
  if (json.bot !== true) throw new Error(`mastodon: @${json.acct} is not flagged as a bot. Set Preferences > Profile > "This is an automated account" and re-run`);
  return { instance: config.instance, token: config.token, acct: json.acct };
}

export function preview(item) {
  const text = item.posts.mastodon;
  return { text, length: mastodonLength(text) };
}

async function waitForMedia(session, id, { fetch, sleep }) {
  for (let i = 0; i < MEDIA_POLL_ATTEMPTS; i++) {
    await sleep(1000);
    const { status } = await request(fetch, name, `${session.instance}/api/v1/media/${id}`, { headers: bearer(session), expect: [200, 206] });
    if (status === 200) return;
  }
  throw new Error(`mastodon: media ${id} was still processing after ${MEDIA_POLL_ATTEMPTS} seconds`);
}

export async function publish(session, item, assets, { fetch, dryRun, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  const p = preview(item);
  const params = { status: p.text, visibility: 'public', language: 'en' };
  if (assets.image) {
    if (dryRun) {
      params.media_ids = [`<media: ${assets.image.bytes.length} bytes of ${assets.image.mime}, alt "${assets.image.alt}", uploaded at publish time>`];
    } else {
      const form = new FormData();
      form.append('file', new Blob([assets.image.bytes], { type: assets.image.mime }), basename(assets.image.path));
      form.append('description', assets.image.alt);
      const { status, json } = await request(fetch, name, `${session.instance}/api/v2/media`, {
        method: 'POST', headers: bearer(session), body: form, expect: [200, 202],
      });
      if (status === 202) await waitForMedia(session, json.id, { fetch, sleep });
      params.media_ids = [json.id];
    }
  }
  if (dryRun) return { status: 'dry-run', preview: { length: p.length, params } };
  const { json } = await request(fetch, name, `${session.instance}/api/v1/statuses`, {
    method: 'POST',
    headers: { ...bearer(session), 'Content-Type': 'application/json', 'Idempotency-Key': `31dog-${item.id}` },
    body: JSON.stringify(params),
  });
  return { status: 'posted', id: String(json.id), url: json.url };
}
```

- [ ] **Step 4: Run the tests**

Run: `cd publish && npm test`
Expected: 46 passing.

- [ ] **Step 5: Commit**

```bash
git add publish/lib/channels/mastodon.js publish/test/mastodon.test.js
git commit -m "feat(publish): Mastodon channel with media upload, bot-flag check and dry run" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
```

---

### Task 7: dev.to channel

**Files:**
- Create: `publish/lib/channels/devto.js`, `publish/test/devto.test.js`

**Interfaces:**
- Consumes: `request` (Task 4); `firstParagraph` (Task 3); the channel interface from Task 5; the article shape from Task 1.
- Produces: a channel module. Endpoints: `GET https://dev.to/api/users/me`, `POST https://dev.to/api/articles` (expects 201) with header `api-key` and `Accept: application/vnd.forem.api-v1+json`; body `{ article: { title, body_markdown, published: true, tags, series?, description? } }`.

- [ ] **Step 1: Write the failing tests**

`publish/test/devto.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as devto from '../lib/channels/devto.js';
import { fakeFetch, fixtureItem } from './fixtures/fake-fetch.js';

test('configure names the missing key', () => {
  assert.deepEqual(devto.configure({}), { ok: false, missing: ['DEVTO_API_KEY'] });
});

test('hasContent is true only with an article', () => {
  assert.equal(devto.hasContent(fixtureItem()), true);
  assert.equal(devto.hasContent(fixtureItem({ article: null })), false);
});

test('authenticate sends the api-key header and returns the username', async () => {
  const { fetch, calls } = fakeFetch({ 'GET /api/users/me': { body: { username: 'marigoldbuilds' } } });
  const s = await devto.authenticate({ key: 'k' }, { fetch });
  assert.equal(calls[0].init.headers['api-key'], 'k');
  assert.equal(s.username, 'marigoldbuilds');
});

test('a dry run previews the article without its body and makes no calls', async () => {
  const { fetch, calls } = fakeFetch({});
  const r = await devto.publish({ key: 'k' }, fixtureItem(), { image: null }, { fetch, dryRun: true });
  assert.equal(calls.length, 0);
  assert.equal(r.preview.article.published, true);
  assert.match(r.preview.article.body_markdown, /characters of markdown/);
  assert.match(r.preview.firstParagraph, /Claude/);
});

test('a live publish creates a published article in the series and expects 201', async () => {
  const { fetch, calls } = fakeFetch({ 'POST /api/articles': { status: 201, body: { id: 77, url: 'https://dev.to/marigoldbuilds/sdg-badge' } } });
  const r = await devto.publish({ key: 'k' }, fixtureItem(), { image: null }, { fetch, dryRun: false });
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.article.published, true);
  assert.equal(body.article.series, '31 Days of Good');
  assert.deepEqual(body.article.tags, ['opensource', 'sdg']);
  assert.deepEqual(r, { status: 'posted', id: '77', url: 'https://dev.to/marigoldbuilds/sdg-badge' });
});

test('a 200 instead of 201 is treated as unexpected', async () => {
  const { fetch } = fakeFetch({ 'POST /api/articles': { status: 200, body: {} } });
  await assert.rejects(devto.publish({ key: 'k' }, fixtureItem(), { image: null }, { fetch, dryRun: false }), /devto: HTTP 200/);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd publish && node --test test/devto.test.js`
Expected: fails with `Cannot find module '.../lib/channels/devto.js'`.

- [ ] **Step 3: Write the channel**

`publish/lib/channels/devto.js`:

```js
import { request } from '../http.js';
import { firstParagraph } from '../lint.js';

export const name = 'devto';
export const API = 'https://dev.to/api';
export const REQUIRED = ['DEVTO_API_KEY'];

export function configure(env) {
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) return { ok: false, missing };
  return { ok: true, config: { key: env.DEVTO_API_KEY } };
}

export function hasContent(item) {
  return item.article !== null;
}

function auth(c) {
  return { 'api-key': c.key, Accept: 'application/vnd.forem.api-v1+json' };
}

export async function authenticate(config, { fetch }) {
  const { json } = await request(fetch, name, `${API}/users/me`, { headers: auth(config) });
  if (!json.username) throw new Error('devto: /users/me succeeded but the response had no username; not printed');
  return { key: config.key, username: json.username };
}

export function preview(item) {
  const a = item.article;
  return { title: a.title, tags: a.tags, series: a.series, description: a.description, bodyCharacters: a.body.length, firstParagraph: firstParagraph(a.body) };
}

export async function publish(session, item, assets, { fetch, dryRun }) {
  const a = item.article;
  const article = { title: a.title, body_markdown: a.body, published: true, tags: a.tags };
  if (a.series) article.series = a.series;
  if (a.description) article.description = a.description;
  if (dryRun) return { status: 'dry-run', preview: { ...preview(item), article: { ...article, body_markdown: `<${a.body.length} characters of markdown>` } } };
  const { json } = await request(fetch, name, `${API}/articles`, {
    method: 'POST',
    headers: { ...auth(session), 'Content-Type': 'application/json' },
    body: JSON.stringify({ article }),
    expect: [201],
  });
  return { status: 'posted', id: String(json.id), url: json.url };
}
```

- [ ] **Step 4: Run the tests**

Run: `cd publish && npm test`
Expected: 52 passing.

- [ ] **Step 5: Commit**

```bash
git add publish/lib/channels/devto.js publish/test/devto.test.js
git commit -m "feat(publish): dev.to channel posting the article into the series" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
```

---

### Task 8: Receipts, assets, the orchestrator and the summary

**Files:**
- Create: `publish/lib/receipts.js`, `publish/lib/assets.js`, `publish/lib/run.js`, `publish/lib/summary.js`, `publish/test/run.test.js`

**Interfaces:**
- Consumes: `loadQueue` (Task 1), `lintItem`, `IMAGE_MAX_BYTES` (Task 3), `pngSize` (Task 4), the three channel modules (Tasks 5 to 7).
- Produces: `readReceipt(path) -> object`; `writeReceipt(path, receipt)`; `recordChannel(path, channel, entry) -> receipt`; `loadAssets(item, { root, tilesDir }) -> { image: { path, bytes, mime, alt, width, height } | null }`; `run({ root, queueDir, tilesDir, env, mode, only, fetch, now, channels }) -> report` where `report = { dryRun, results: { item, channel, outcome, detail }[], failed, considered }` and `outcome` is one of `posted | dry-run | skipped | failed`; `CHANNELS`; `renderSummary(report) -> markdown`.
- Receipt file shape, `queue/<id>.posted.json`: `{ "<channel>": { "status": "posted", "url", "at", ...channel fields } | { "status": "skipped", "reason", "at" } }`.

- [ ] **Step 1: Write the failing tests**

`publish/test/run.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../lib/run.js';
import { renderSummary } from '../lib/summary.js';
import { readReceipt, recordChannel } from '../lib/receipts.js';
import { loadAssets } from '../lib/assets.js';
import { fakePng } from './fixtures/fake-fetch.js';

const FIXTURES = join(import.meta.dirname, 'fixtures', 'queue');
const now = () => new Date('2026-10-01T06:00:00Z');

// A repo-shaped temp dir: queue/ from the fixtures, site/tiles/day-01.png present.
function repo() {
  const root = mkdtempSync(join(tmpdir(), 'repo-'));
  cpSync(FIXTURES, join(root, 'queue'), { recursive: true });
  mkdirSync(join(root, 'site', 'tiles'), { recursive: true });
  writeFileSync(join(root, 'site', 'tiles', 'day-01.png'), fakePng());
  return { root, queueDir: join(root, 'queue'), tilesDir: join(root, 'site', 'tiles'), receipt: join(root, 'queue', '2026-10-01-day-01.posted.json') };
}

// A channel double with a scripted publish outcome.
function channel(name, { configured = true, outcome = 'posted', hasContent = () => true } = {}) {
  const calls = [];
  return {
    name, calls, hasContent,
    configure: () => (configured ? { ok: true, config: {} } : { ok: false, missing: [`${name.toUpperCase()}_TOKEN`] }),
    authenticate: async () => ({ token: 'session-secret' }),
    publish: async (session, item, assets, { dryRun }) => {
      calls.push({ item: item.id, dryRun, image: assets.image?.mime ?? null });
      if (outcome === 'throw') throw new Error(`${name}: HTTP 500`);
      if (dryRun) return { status: 'dry-run', preview: { text: 'p' } };
      return { status: 'posted', url: `https://${name}.example/1` };
    },
  };
}

test('live: posted channels get a receipt, an unconfigured channel gets a skip receipt, a failing one gets nothing', async () => {
  const r = repo();
  const ok = channel('bluesky');
  const off = channel('mastodon', { configured: false });
  const bad = channel('devto', { outcome: 'throw' });
  const report = await run({ ...r, env: {}, mode: 'live', fetch: null, now, channels: [ok, off, bad] });
  assert.equal(report.failed, 1);
  assert.deepEqual(report.results.map((x) => [x.channel, x.outcome]), [['bluesky', 'posted'], ['mastodon', 'skipped'], ['devto', 'failed']]);
  const receipt = readReceipt(r.receipt);
  assert.equal(receipt.bluesky.url, 'https://bluesky.example/1');
  assert.equal(receipt.bluesky.at, '2026-10-01T06:00:00.000Z');
  assert.equal(receipt.mastodon.status, 'skipped');
  assert.match(receipt.mastodon.reason, /MASTODON_TOKEN not set/);
  assert.equal(receipt.devto, undefined);
  assert.equal(ok.calls[0].image, 'image/png');
});

test('a re-run posts only the channel that has no receipt', async () => {
  const r = repo();
  recordChannel(r.receipt, 'bluesky', { status: 'posted', url: 'u', at: 't' });
  recordChannel(r.receipt, 'mastodon', { status: 'skipped', reason: 'x', at: 't' });
  const b = channel('bluesky'); const m = channel('mastodon'); const d = channel('devto');
  const report = await run({ ...r, env: {}, mode: 'live', fetch: null, now, channels: [b, m, d] });
  assert.equal(b.calls.length, 0);
  assert.equal(m.calls.length, 0, 'a configured channel with a skip receipt does not post retroactively');
  assert.equal(d.calls.length, 1);
  assert.deepEqual(report.results.map((x) => x.channel), ['devto']);
});

test('an item with every channel settled is silent', async () => {
  const r = repo();
  for (const c of ['bluesky', 'mastodon', 'devto']) recordChannel(r.receipt, c, { status: 'posted', at: 't' });
  const report = await run({ ...r, env: {}, mode: 'live', fetch: null, now, channels: [channel('bluesky'), channel('mastodon'), channel('devto')] });
  assert.deepEqual(report.results, []);
  assert.equal(report.considered, 1);
});

test('dry run: everything up to the write call runs and no receipt is written, not even a skip', async () => {
  const r = repo();
  const b = channel('bluesky'); const m = channel('mastodon', { configured: false });
  const report = await run({ ...r, env: {}, mode: 'dry-run', fetch: null, now, channels: [b, m] });
  assert.equal(report.dryRun, true);
  assert.deepEqual(report.results.map((x) => x.outcome), ['dry-run', 'skipped']);
  assert.equal(b.calls[0].dryRun, true);
  assert.equal(existsSync(r.receipt), false);
});

test('an unset mode is a dry run', async () => {
  const r = repo();
  const report = await run({ ...r, env: {}, mode: undefined, fetch: null, now, channels: [channel('bluesky')] });
  assert.equal(report.dryRun, true);
});

test('a lint failure blocks the whole item and posts nothing', async () => {
  const r = repo();
  writeFileSync(join(r.queueDir, '2026-10-01-day-01.md'), '---\nday: 1\nalt: a\n---\n## bluesky\nno disclosure here\n');
  const b = channel('bluesky');
  const report = await run({ ...r, env: {}, mode: 'live', fetch: null, now, channels: [b] });
  assert.equal(b.calls.length, 0);
  assert.equal(report.failed, 1);
  assert.match(report.results[0].detail, /^lint: bluesky: missing the disclosure/);
  assert.equal(existsSync(r.receipt), false);
});

test('a missing tile fails the item before any channel is tried', async () => {
  const r = repo();
  const b = channel('bluesky');
  const report = await run({ ...r, tilesDir: join(r.root, 'nowhere'), env: {}, mode: 'live', fetch: null, now, channels: [b] });
  assert.equal(b.calls.length, 0);
  assert.match(report.results[0].detail, /day-01.png does not exist/);
});

test('an authentication failure is reported once per channel and does not stop the others', async () => {
  const r = repo();
  const b = channel('bluesky');
  b.authenticate = async () => { throw new Error('bluesky: HTTP 401 AuthenticationRequired'); };
  const d = channel('devto');
  const report = await run({ ...r, env: {}, mode: 'live', fetch: null, now, channels: [b, d] });
  assert.deepEqual(report.results.map((x) => [x.channel, x.outcome]), [['bluesky', 'failed'], ['devto', 'posted']]);
  assert.equal(report.results[0].detail, 'bluesky: HTTP 401 AuthenticationRequired');
});

test('only restricts the run to one item', async () => {
  const r = repo();
  writeFileSync(join(r.queueDir, '2026-10-04-digest.md'), '---\n---\n## bluesky\nDigest. Built by Marigold Builds, an AI, directed by Dom.\n');
  const b = channel('bluesky');
  const report = await run({ ...r, env: {}, mode: 'live', only: '2026-10-04-digest', fetch: null, now, channels: [b] });
  assert.deepEqual(b.calls.map((c) => c.item), ['2026-10-04-digest']);
  assert.equal(report.considered, 1);
});

test('loadAssets picks the tile for a day item and the named file otherwise', () => {
  const r = repo();
  const day = loadAssets({ id: 'a', day: 1, image: null, alt: 'alt' }, { root: r.root, tilesDir: r.tilesDir });
  assert.equal(day.image.mime, 'image/png');
  assert.deepEqual([day.image.width, day.image.height], [1200, 630]);
  writeFileSync(join(r.root, 'queue', 'card.jpg'), 'jpg');
  const named = loadAssets({ id: 'b', day: null, image: 'queue/card.jpg', alt: 'alt' }, { root: r.root, tilesDir: r.tilesDir });
  assert.equal(named.image.mime, 'image/jpeg');
  assert.deepEqual(loadAssets({ id: 'c', day: null, image: null }, { root: r.root, tilesDir: r.tilesDir }), { image: null });
});

test('renderSummary distinguishes posted, skipped, failed and dry run, and never carries a session', async () => {
  const r = repo();
  const b = channel('bluesky'); const m = channel('mastodon', { configured: false }); const d = channel('devto', { outcome: 'throw' });
  const md = renderSummary(await run({ ...r, env: {}, mode: 'live', fetch: null, now, channels: [b, m, d] }));
  assert.match(md, /^## Publish: live/);
  assert.match(md, /\| 2026-10-01-day-01 \| bluesky \| posted \| https:\/\/bluesky.example\/1 \|/);
  assert.match(md, /\| mastodon \| skipped \(not configured\) \| not configured: MASTODON_TOKEN not set \|/);
  assert.match(md, /\| devto \| FAILED \| devto: HTTP 500 \|/);
  assert.match(md, /1 failure\(s\)/);
  assert.ok(!md.includes('session-secret'));
  const dry = renderSummary(await run({ ...repo(), env: {}, mode: 'dry-run', fetch: null, now, channels: [channel('bluesky')] }));
  assert.match(dry, /dry run \(nothing posted/);
  assert.match(dry, /<details><summary>2026-10-01-day-01 · bluesky: what would be sent<\/summary>/);
});

test('renderSummary says so when nothing is outstanding', () => {
  assert.match(renderSummary({ dryRun: false, results: [], failed: 0, considered: 3 }), /Nothing outstanding in 3 queue item\(s\)/);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd publish && node --test test/run.test.js`
Expected: fails with `Cannot find module '.../lib/run.js'`.

- [ ] **Step 3: Write receipts**

`publish/lib/receipts.js`:

```js
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// A receipt is queue/<id>.posted.json: one key per channel that reached a
// terminal state. A key present means "never touch this channel for this
// item again"; a failed attempt writes nothing, so a re-run retries it.
export function readReceipt(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
}

export function writeReceipt(path, receipt) {
  writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`);
}

export function recordChannel(path, channel, entry) {
  const receipt = readReceipt(path);
  receipt[channel] = entry;
  writeReceipt(path, receipt);
  return receipt;
}
```

- [ ] **Step 4: Write assets**

`publish/lib/assets.js`:

```js
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pngSize } from './http.js';
import { IMAGE_MAX_BYTES } from './lint.js';

const pad = (n) => String(n).padStart(2, '0');

// A day item attaches the day's tile from the site build (site/tiles/,
// produced by `npm run build` in site-build/ from the same commit); any
// other item may name an image committed in the repository.
export function loadAssets(item, { root, tilesDir }) {
  let path = null;
  if (item.day !== null) path = join(tilesDir, `day-${pad(item.day)}.png`);
  else if (item.image !== null) path = join(root, item.image);
  if (path === null) return { image: null };
  if (!existsSync(path)) throw new Error(`${item.id}: image ${path} does not exist${item.day !== null ? ' (run the site build first: it renders the tiles)' : ''}`);
  const bytes = readFileSync(path);
  if (bytes.length > IMAGE_MAX_BYTES) throw new Error(`${item.id}: image ${path} is ${bytes.length} bytes, over the ${IMAGE_MAX_BYTES} limit`);
  const mime = /\.png$/i.test(path) ? 'image/png' : 'image/jpeg';
  const size = mime === 'image/png' ? pngSize(bytes) : null;
  return { image: { path, bytes, mime, alt: item.alt, width: size?.width, height: size?.height } };
}
```

- [ ] **Step 5: Write the orchestrator**

`publish/lib/run.js`:

```js
import { loadQueue } from './queue.js';
import { lintItem } from './lint.js';
import { loadAssets } from './assets.js';
import { readReceipt, recordChannel } from './receipts.js';
import * as bluesky from './channels/bluesky.js';
import * as mastodon from './channels/mastodon.js';
import * as devto from './channels/devto.js';

export const CHANNELS = [bluesky, mastodon, devto];

async function sessionFor(channel, config, cache, fetch) {
  if (!cache.has(channel.name)) {
    try { cache.set(channel.name, { session: await channel.authenticate(config, { fetch }) }); }
    catch (error) { cache.set(channel.name, { error }); }
  }
  const entry = cache.get(channel.name);
  if (entry.error) throw entry.error;
  return entry.session;
}

// One run over the queue. Outcomes per (item, channel):
//   posted    live post went out; receipt written
//   dry-run   everything up to the write call ran; nothing sent, nothing written
//   skipped   channel not configured; receipt written (live) so it never posts retroactively
//   failed    tried and failed; nothing written, so a re-run retries
// Items with nothing outstanding are silent.
export async function run({ root, queueDir, tilesDir, env, mode, only = '', fetch, now, channels = CHANNELS }) {
  const dryRun = mode !== 'live';
  const items = loadQueue(queueDir).filter((item) => !only || item.id === only);
  const results = [];
  const sessions = new Map();
  let failed = 0;
  for (const item of items) {
    const receipt = readReceipt(item.receiptPath);
    const pending = channels.filter((ch) => ch.hasContent(item) && receipt[ch.name] === undefined);
    if (pending.length === 0) continue;
    const problems = lintItem(item, { root });
    if (problems.length) {
      failed++;
      results.push({ item, channel: '*', outcome: 'failed', detail: `lint: ${problems.join('; ')}` });
      continue;
    }
    let assets;
    try {
      assets = loadAssets(item, { root, tilesDir });
    } catch (e) {
      failed++;
      results.push({ item, channel: '*', outcome: 'failed', detail: e.message });
      continue;
    }
    for (const ch of pending) {
      const configured = ch.configure(env);
      if (!configured.ok) {
        const reason = `not configured: ${configured.missing.join(', ')} not set`;
        if (!dryRun) recordChannel(item.receiptPath, ch.name, { status: 'skipped', reason, at: now().toISOString() });
        results.push({ item, channel: ch.name, outcome: 'skipped', detail: reason });
        continue;
      }
      try {
        const session = await sessionFor(ch, configured.config, sessions, fetch);
        const result = await ch.publish(session, item, assets, { fetch, dryRun, now });
        if (result.status === 'posted') {
          recordChannel(item.receiptPath, ch.name, { ...result, at: now().toISOString() });
          results.push({ item, channel: ch.name, outcome: 'posted', detail: result.url });
        } else {
          results.push({ item, channel: ch.name, outcome: 'dry-run', detail: result.preview });
        }
      } catch (e) {
        failed++;
        results.push({ item, channel: ch.name, outcome: 'failed', detail: e.message });
      }
    }
  }
  return { dryRun, results, failed, considered: items.length };
}
```

- [ ] **Step 6: Write the summary renderer**

`publish/lib/summary.js`:

````js
const LABEL = { posted: 'posted', skipped: 'skipped (not configured)', failed: 'FAILED', 'dry-run': 'dry run' };

function cell(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

// Markdown for the Actions job summary. Contains post text and previews,
// never sessions, headers or response bodies.
export function renderSummary(report) {
  const lines = [`## Publish: ${report.dryRun ? 'dry run (nothing posted, no receipts written)' : 'live'}`, ''];
  if (report.results.length === 0) {
    lines.push(`Nothing outstanding in ${report.considered} queue item(s).`);
    return `${lines.join('\n')}\n`;
  }
  lines.push('| Item | Channel | Outcome | Detail |', '| --- | --- | --- | --- |');
  for (const r of report.results) {
    lines.push(`| ${r.item.id} | ${r.channel} | ${LABEL[r.outcome]} | ${r.outcome === 'dry-run' ? 'see below' : cell(r.detail)} |`);
  }
  for (const r of report.results.filter((x) => x.outcome === 'dry-run')) {
    lines.push('', `<details><summary>${r.item.id} · ${r.channel}: what would be sent</summary>`, '', '```json', JSON.stringify(r.detail, null, 2), '```', '', '</details>');
  }
  if (report.failed) {
    lines.push('', `**${report.failed} failure(s).** Fix the cause and re-run the failed job. Channels that posted are in the receipt and will not post again.`);
  }
  return `${lines.join('\n')}\n`;
}
````

- [ ] **Step 7: Run the tests**

Run: `cd publish && npm test`
Expected: 64 passing.

- [ ] **Step 8: Commit**

```bash
git add publish/lib/receipts.js publish/lib/assets.js publish/lib/run.js publish/lib/summary.js publish/test/run.test.js
git commit -m "feat(publish): orchestrator with receipts, per-channel outcomes and job summary" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
```

---

### Task 9: The `publish` command and the workflow

**Files:**
- Modify: `publish/cli.js` (replace the Task 3 version)
- Create: `publish/test/cli.test.js`, `.github/workflows/publish.yml`

**Interfaces:**
- Consumes: `run`, `renderSummary` (Task 8), `loadQueue`, `lintItem`.
- Produces: `node publish/cli.js publish`, driven by environment: `PUBLISH_ROOT` (default: repository root), `PUBLISH_MODE` (`live` posts; anything else is a dry run), `PUBLISH_ONLY` (one item id, optional), the five credential variables, `GITHUB_STEP_SUMMARY` (appended to when set). Exit 0 when nothing failed, 1 otherwise, 2 on usage.
- The `publish` workflow, whose "Record receipts" step is the only thing that commits to `main` without a PR.

- [ ] **Step 1: Write the failing CLI tests**

`publish/test/cli.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fakePng } from './fixtures/fake-fetch.js';

const CLI = join(import.meta.dirname, '..', 'cli.js');
const FIXTURES = join(import.meta.dirname, 'fixtures', 'queue');

function repo() {
  const root = mkdtempSync(join(tmpdir(), 'repo-'));
  cpSync(FIXTURES, join(root, 'queue'), { recursive: true });
  mkdirSync(join(root, 'site', 'tiles'), { recursive: true });
  writeFileSync(join(root, 'site', 'tiles', 'day-01.png'), fakePng());
  return root;
}

// Credentials are stripped from the child's environment so the test can
// never reach a real API, whatever the developer's shell holds.
function cli(args, root, extraEnv = {}) {
  const env = { PATH: process.env.PATH, PUBLISH_ROOT: root, GITHUB_STEP_SUMMARY: join(root, 'summary.md'), ...extraEnv };
  return spawnSync(process.execPath, [CLI, ...args], { env, encoding: 'utf8' });
}

test('lint exits 0 on the clean fixture and 1 with a file-annotated error on a bad item', () => {
  const root = repo();
  assert.equal(cli(['lint'], root).status, 0);
  writeFileSync(join(root, 'queue', '2026-10-02-day-02.md'), '---\nday: 2\n---\n## bluesky\nNo disclosure.\n');
  const bad = cli(['lint'], root);
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /::error file=.*2026-10-02-day-02\.md::2026-10-02-day-02: an image will be attached .* but alt is missing/);
});

test('publish without PUBLISH_MODE is a dry run: exit 0, summary written, no receipts, no network', () => {
  const root = repo();
  const res = cli(['publish'], root);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  const summary = readFileSync(join(root, 'summary.md'), 'utf8');
  assert.match(summary, /dry run/);
  assert.match(summary, /bluesky \| skipped \(not configured\) \| not configured: BLUESKY_HANDLE, BLUESKY_APP_PASSWORD not set/);
  assert.match(res.stdout, /::notice::Dry run/);
});

test('publish exits 1 when an item fails lint', () => {
  const root = repo();
  writeFileSync(join(root, 'queue', '2026-10-01-day-01.md'), '---\nday: 1\nalt: a\n---\n## bluesky\nAI-powered 🚀\n');
  const res = cli(['publish'], root);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /::error::2026-10-01-day-01 \*: lint:/);
});

test('an unknown command exits 2', () => {
  assert.equal(cli(['frobnicate'], repo()).status, 2);
});
```

- [ ] **Step 2: Run them to see the `publish` ones fail**

Run: `cd publish && node --test test/cli.test.js`
Expected: the lint test and the usage test pass; the two `publish` tests fail, because the Task 3 CLI answers `publish` with the usage message and exit code 2.

- [ ] **Step 3: Replace the CLI**

`publish/cli.js` (whole file):

```js
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadQueue } from './lib/queue.js';
import { lintItem } from './lib/lint.js';
import { run } from './lib/run.js';
import { renderSummary } from './lib/summary.js';

const ROOT = process.env.PUBLISH_ROOT || join(import.meta.dirname, '..');
const QUEUE = join(ROOT, 'queue');

function lint() {
  const items = loadQueue(QUEUE);
  let problems = 0;
  for (const item of items) {
    for (const e of lintItem(item, { root: ROOT })) {
      console.log(`::error file=${item.path}::${item.id}: ${e}`);
      problems++;
    }
  }
  console.log(problems ? `${problems} problem(s) in ${items.length} queue item(s).` : `${items.length} queue item(s), no problems.`);
  return problems ? 1 : 0;
}

async function publish() {
  const report = await run({
    root: ROOT,
    queueDir: QUEUE,
    tilesDir: join(ROOT, 'site', 'tiles'),
    env: process.env,
    mode: process.env.PUBLISH_MODE || 'dry-run',
    only: process.env.PUBLISH_ONLY || '',
    fetch: globalThis.fetch,
    now: () => new Date(),
  });
  const summary = renderSummary(report);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(summary);
  for (const r of report.results) {
    if (r.outcome === 'failed') console.log(`::error::${r.item.id} ${r.channel}: ${r.detail}`);
    if (r.outcome === 'skipped') console.log(`::notice::${r.item.id} ${r.channel}: ${r.detail}`);
  }
  if (report.dryRun) console.log('::notice::Dry run: PUBLISH_MODE is not "live". Nothing was posted and no receipts were written.');
  return report.failed ? 1 : 0;
}

const command = process.argv[2];
try {
  if (command === 'lint') process.exit(lint());
  else if (command === 'publish') process.exit(await publish());
  console.error('usage: node publish/cli.js lint | publish');
  process.exit(2);
} catch (err) {
  // The message only: a stack or a response body could carry something that must not reach a public log.
  console.log(`::error::${err.message}`);
  process.exit(1);
}
```

- [ ] **Step 4: Run all tests**

Run: `cd publish && npm test`
Expected: 68 passing.

- [ ] **Step 5: Try a local dry run against the fixtures, with no credentials in the environment**

Run:

```bash
env -i PATH="$PATH" PUBLISH_ROOT=publish/test/fixtures node publish/cli.js publish
```

Expected: exit 1 and a summary whose only row is `| 2026-10-01-day-01 | * | FAILED | 2026-10-01-day-01: image .../site/tiles/day-01.png does not exist (run the site build first: it renders the tiles) |`. That is correct: the fixtures directory has no built site. Now give it one:

```bash
mkdir -p publish/test/fixtures/site/tiles && cp site/tiles/day-01.png publish/test/fixtures/site/tiles/ 2>/dev/null || (cd site-build && npm run build && cp ../site/tiles/day-01.png ../publish/test/fixtures/site/tiles/)
env -i PATH="$PATH" PUBLISH_ROOT=publish/test/fixtures node publish/cli.js publish; echo "exit $?"
rm -rf publish/test/fixtures/site
```

Expected: exit 0; three rows, all `skipped (not configured)` naming `BLUESKY_HANDLE, BLUESKY_APP_PASSWORD`, `MASTODON_INSTANCE, MASTODON_ACCESS_TOKEN` and `DEVTO_API_KEY`; the notice `Dry run: PUBLISH_MODE is not "live"`. No `.posted.json` was written under `publish/test/fixtures/queue/` (check with `git status`).

- [ ] **Step 6: Write the workflow**

`.github/workflows/publish.yml`:

```yaml
name: publish
on:
  push:
    branches: [main]
    paths: ['queue/*.md']
  workflow_dispatch:
    inputs:
      mode:
        description: "dry-run posts nothing and writes no receipts; live posts and records receipts"
        type: choice
        options: [dry-run, live]
        default: dry-run
      only:
        description: "Optional: one queue item id to consider, e.g. 2026-10-01-day-01"
        type: string
        default: ''
permissions:
  contents: write
concurrency:
  group: publish
  cancel-in-progress: false
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.ref }}
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: site-build/package-lock.json }
      - run: sudo apt-get update && sudo apt-get install -y fonts-dejavu-core
      - run: npm ci
        working-directory: site-build
      - name: Build the site so the day's tile exists
        run: npm run build
        working-directory: site-build
        env: { BASE_URL: /31-days-of-good/, SITE_ORIGIN: https://marigold-builds.github.io }
      - name: Publish outstanding queue items
        run: node publish/cli.js publish
        env:
          PUBLISH_MODE: ${{ inputs.mode || vars.PUBLISH_MODE || 'dry-run' }}
          PUBLISH_ONLY: ${{ inputs.only }}
          BLUESKY_HANDLE: ${{ vars.BLUESKY_HANDLE }}
          BLUESKY_APP_PASSWORD: ${{ secrets.BLUESKY_APP_PASSWORD }}
          MASTODON_INSTANCE: ${{ vars.MASTODON_INSTANCE }}
          MASTODON_ACCESS_TOKEN: ${{ secrets.MASTODON_ACCESS_TOKEN }}
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
      - name: Record receipts
        if: always()
        run: |
          set -euo pipefail
          if [ -z "$(git status --porcelain -- queue)" ]; then
            echo "No receipts to record."
            exit 0
          fi
          git config user.name 'github-actions[bot]'
          git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
          git add -A -- queue
          items=$(git diff --cached --name-only | sed -e 's#^queue/##' -e 's#\.posted\.json$##' | tr '\n' ' ')
          git commit -m "publish: record receipts for ${items}"
          for attempt in 1 2 3; do
            if git push origin "HEAD:${GITHUB_REF_NAME}"; then
              echo "Receipts pushed (attempt ${attempt})."
              exit 0
            fi
            git fetch origin "${GITHUB_REF_NAME}"
            git rebase "origin/${GITHUB_REF_NAME}"
          done
          echo "::error::Posts went out but the receipts could not be pushed. Do NOT re-run this workflow: a re-run would post again. Commit the receipt files printed below to ${GITHUB_REF_NAME} by hand, then re-run."
          for f in queue/*.posted.json; do
            echo "--- ${f}"
            cat "${f}"
          done
          exit 1
```

Notes for the reviewer, each of which is load-bearing:
- `ref: ${{ github.ref }}` checks out the branch tip, so a re-run of a failed run sees receipts that the first attempt pushed. Without it a re-run would check out the original merge SHA and post again.
- `paths: ['queue/*.md']` excludes every docs and site push. Receipt commits are made with `GITHUB_TOKEN`, which triggers no workflow, so there is no loop.
- `concurrency` with `cancel-in-progress: false` serialises runs and never cancels one mid-post.
- `PUBLISH_MODE` falls back to `dry-run` when neither the dispatch input nor the variable is set. Nothing posts until Dom sets the variable to `live`.
- The site build runs first so `site/tiles/day-NN.png` exists for the day item; it also fails loudly if the day's log entry is malformed, before anything posts.
- "Record receipts" runs `if: always()` so a channel failure still records the channels that succeeded.

- [ ] **Step 7: Commit, push, and watch the workflow do nothing correctly**

```bash
git add publish/cli.js publish/test/cli.test.js .github/workflows/publish.yml
git commit -m "feat(publish): publish command and the publish workflow (dry run by default)" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
git push
```

The push touches no `queue/*.md`, so `publish` must not run on it. Check: `gh run list --workflow publish --limit 3` shows no run for this commit. Then dispatch a dry run on `main`:

```bash
gh workflow run publish --ref main -f mode=dry-run
sleep 10
gh run watch --exit-status "$(gh run list --workflow publish --limit 1 --json databaseId --jq '.[0].databaseId')"
gh run view "$(gh run list --workflow publish --limit 1 --json databaseId --jq '.[0].databaseId')" --log | grep -E 'Publish: dry run|Nothing outstanding|No receipts to record'
```

Expected: the run is green; the log contains `## Publish: dry run (nothing posted, no receipts written)`, `Nothing outstanding in 0 queue item(s).` and `No receipts to record.`

---

### Task 10: Extend the credentials check to Mastodon and dev.to

**Files:**
- Modify: `.github/workflows/check-credentials.yml` (append two steps; leave the two existing steps untouched)

**Interfaces:**
- Consumes: the same variable and secret names as `publish.yml`.
- Produces: a `workflow_dispatch` probe that says, per channel, "not configured" (notice, green), "misconfigured" (error, red, naming which of variable/secret is missing), or "authenticated as ..." with the bot flag for Mastodon.

- [ ] **Step 1: Append the Mastodon step**

After the `Authenticate to Bluesky` step, add:

```yaml
      - name: Check Mastodon credentials (notice only until the account exists)
        env:
          MASTODON_INSTANCE: ${{ vars.MASTODON_INSTANCE }}
          MASTODON_ACCESS_TOKEN: ${{ secrets.MASTODON_ACCESS_TOKEN }}
        run: |
          set -euo pipefail
          if [ -z "${MASTODON_INSTANCE:-}" ] && [ -z "${MASTODON_ACCESS_TOKEN:-}" ]; then
            echo "::notice::Mastodon is not configured (no MASTODON_INSTANCE variable, no MASTODON_ACCESS_TOKEN secret). The publish pipeline will skip it."
            exit 0
          fi
          missing=0
          if [ -z "${MASTODON_INSTANCE:-}" ]; then
            echo "::error::MASTODON_INSTANCE is empty but MASTODON_ACCESS_TOKEN is set. Expected a VARIABLE (vars.MASTODON_INSTANCE) holding the instance URL, e.g. https://mastodon.social"
            missing=1
          fi
          if [ -z "${MASTODON_ACCESS_TOKEN:-}" ]; then
            echo "::error::MASTODON_ACCESS_TOKEN is empty but MASTODON_INSTANCE is set. Expected a SECRET (secrets.MASTODON_ACCESS_TOKEN)."
            missing=1
          fi
          if [ "$missing" -ne 0 ]; then
            exit 1
          fi
          case "$MASTODON_INSTANCE" in
            https://*) : ;;
            *) echo "::error::MASTODON_INSTANCE must start with https://"; exit 1 ;;
          esac
          host=$(printf '%s' "$MASTODON_INSTANCE" | sed -E 's#^https://([^/]+).*#\1#')
          if [ "$host" = "fosstodon.org" ]; then
            echo "::error::Fosstodon forbids unattended posting (docs/05-marketing-playbook.md). Use another instance."
            exit 1
          fi
          response_file="$(mktemp)"
          trap 'rm -f "$response_file"' EXIT
          http_status=$(
            curl --silent --show-error --output "$response_file" --write-out '%{http_code}' \
              --header "Authorization: Bearer ${MASTODON_ACCESS_TOKEN}" \
              "${MASTODON_INSTANCE%/}/api/v1/accounts/verify_credentials"
          )
          if ! jq empty "$response_file" >/dev/null 2>&1; then
            echo "::error::Mastodon returned HTTP ${http_status} with a response body that was not valid JSON. Refusing to print it."
            exit 1
          fi
          case "$http_status" in
            2[0-9][0-9]) : ;;
            *)
              error_message=$(jq -r '.error // "no error field"' "$response_file")
              echo "::error::Mastodon authentication failed (HTTP ${http_status}): ${error_message}"
              exit 1
              ;;
          esac
          acct=$(jq -r '.acct // empty' "$response_file")
          bot=$(jq -r '.bot // false' "$response_file")
          if [ -z "$acct" ]; then
            echo "::error::verify_credentials returned HTTP ${http_status} without an acct field. Response shape may have changed; refusing to print it."
            exit 1
          fi
          echo "Authenticated to ${host} as @${acct} (bot flag: ${bot})."
          if [ "$bot" != "true" ]; then
            echo "::error::The Mastodon account is not flagged as a bot. Set Preferences > Profile > 'This is an automated account'. The pipeline refuses to post until it is."
            exit 1
          fi
```

- [ ] **Step 2: Append the dev.to step**

```yaml
      - name: Check dev.to credentials (notice only until the account exists)
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
        run: |
          set -euo pipefail
          if [ -z "${DEVTO_API_KEY:-}" ]; then
            echo "::notice::dev.to is not configured (no DEVTO_API_KEY secret). The publish pipeline will skip it."
            exit 0
          fi
          response_file="$(mktemp)"
          trap 'rm -f "$response_file"' EXIT
          http_status=$(
            curl --silent --show-error --output "$response_file" --write-out '%{http_code}' \
              --header "api-key: ${DEVTO_API_KEY}" \
              --header 'Accept: application/vnd.forem.api-v1+json' \
              'https://dev.to/api/users/me'
          )
          if ! jq empty "$response_file" >/dev/null 2>&1; then
            echo "::error::dev.to returned HTTP ${http_status} with a response body that was not valid JSON. Refusing to print it."
            exit 1
          fi
          case "$http_status" in
            2[0-9][0-9]) : ;;
            *)
              error_message=$(jq -r '.error // "no error field"' "$response_file")
              echo "::error::dev.to authentication failed (HTTP ${http_status}): ${error_message}"
              exit 1
              ;;
          esac
          username=$(jq -r '.username // empty' "$response_file")
          if [ -z "$username" ]; then
            echo "::error::/users/me returned HTTP ${http_status} without a username. Response shape may have changed; refusing to print it."
            exit 1
          fi
          echo "Authenticated to dev.to as ${username}."
```

- [ ] **Step 3: Check the YAML parses and the shell is well-formed**

Run: `python3 -c "import yaml; d = yaml.safe_load(open('.github/workflows/check-credentials.yml')); print([s['name'] for s in d['jobs']['check']['steps']])"`
Expected: four step names, the two existing ones first.

Run: `python3 -c "import yaml; d = yaml.safe_load(open('.github/workflows/check-credentials.yml')); [open(f'/tmp/step{i}.sh','w').write(s['run']) for i, s in enumerate(d['jobs']['check']['steps'])]" && bash -n /tmp/step2.sh && bash -n /tmp/step3.sh && echo ok`
Expected: `ok`.

- [ ] **Step 4: Commit, push, dispatch**

```bash
git add .github/workflows/check-credentials.yml
git commit -m "ci: probe Mastodon and dev.to credentials in the same shape as Bluesky" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
git push
gh workflow run check-credentials --ref main
sleep 10
gh run watch --exit-status "$(gh run list --workflow check-credentials --limit 1 --json databaseId --jq '.[0].databaseId')"
```

Expected: green. The Bluesky steps pass as before; the two new steps each print a `::notice::` saying the channel is not configured. When Dom adds the Mastodon and dev.to credentials, re-dispatching is how he checks them; a red step names exactly what is wrong.

---

### Task 11: Templates and documents

**Files:**
- Modify: `templates/launch-post.md` (rewrite), `docs/02-daily-process.md`, `docs/05-marketing-playbook.md`, `docs/06-preparation-plan.md`, `docs/07-decisions.md`, `README.md`
- Create: `templates/launch-article.md`, `publish/test/templates.test.js`

**Interfaces:**
- Consumes: `parseQueueFile`, `parseArticle`, `KNOWN_SECTIONS` (Task 1).
- Produces: the two templates the nightly builder fills in; a test that they parse into the shape the pipeline expects; documents that describe what was built. `docs/07-decisions.md` gains rows 21 and 22 as applied defaults (the controller has standing authorisation to add rows; Dom's confirmation is an open question at the end of this plan).

- [ ] **Step 1: Rewrite the launch post template as the exact queue file**

`templates/launch-post.md` (whole file). The fixed parts of the short post are about 200 graphemes, which leaves about 100 for the name, the sentence, the target, the limitation and the repository slug; the template says so.

```markdown
---
day: NN
alt: Day NN of 31 Days of Good. SDG N, <goal name>. <project-name>: <one sentence>.
---

## bluesky

Day NN/31 · SDG N
<project-name>: <one sentence, who and what>.
Target N.N. Does not <limitation>.
Try it, break it, or steward it: https://github.com/marigold-builds/<repo>
Built by Marigold Builds, an AI, directed by Dom. #MarigoldBuilds #31DaysOfGood

## mastodon

Day NN/31 · SDG N
<project-name>: <one sentence, who and what>.
Target N.N. Does not <limitation>.
Try it, break it, or steward it: https://github.com/marigold-builds/<repo>
Built by Marigold Builds, an AI, directed by Dom. #MarigoldBuilds #31DaysOfGood

## linkedin

<Only if this is a twice-weekly story day; otherwise delete this section. Practitioner-facing. Lead with the person who has the problem, not the tool. Disclosure in line two. One link. Dom pastes it by hand.>

## outreach

- **To:** <named community or person from the brief>
- **Why them:** <one line>
- **Draft:** "Hi <name>, I saw <the thing they said or do>. Today I published <project-name>, a small open-source tool that <does X>. It is built by an AI I direct, fully disclosed, MIT-licensed, and honestly limited: it does not <limitation>. If it is useful, or wrong, I would like to know. <link>"

## provider

- **To:** <data provider, if a public API was used; otherwise delete this section>
- **Draft:** "We built <project-name> on your <API> today as part of 31 Days of Good. Thank you for the open data. Repo: <link>. Happy to add attribution in any form you prefer."

## notes

- Screenshot or GIF: <path> · Alt text: <what it shows>
- Tile status (set in `log/YYYY-MM-DD.md`): shipped / partial / missed
- The fixed lines of the short post are about 200 graphemes; the name, the sentence, the target, the limitation and the repo slug share the remaining 100. Bluesky counts graphemes and does not shorten links; Mastodon counts each link as 23.
- Checklist: every post contains the disclosure · the tile has alt text · no post mentions build speed · no emoji · Reddit or Show HN only if today is a planned exception, and never the same text to two subs
```

- [ ] **Step 2: Write the article template**

`templates/launch-article.md`:

```markdown
---
title: <project-name>: <plain description> (31 Days of Good, day NN)
tags: opensource, sdg, showdev
description: <one sentence for the listing>
---

This is day NN of 31 Days of Good, a month in which an AI (Claude, published as Marigold Builds) builds one small open-source tool a night for the Sustainable Development Goals, with Dom setting the direction and merging every post before it goes out. Today: SDG N, <goal name>.

## The problem

<Who has it, on which Tuesday, and what they do by hand today. Link the demand: the request issue, the forum thread, the field manual.>

## What already existed

<The prior-art table from the brief, in prose: what is out there and why it did not fit.>

## What I built

<What it does, for whom, with the screenshot and its alt text. Install and the one-minute quickstart, or a link to the README's.>

## What I cut and why

<The scope-cut ladder rungs taken, honestly.>

## What it does not do

<The limitation, and any others.>

## Data sources

<Each source with licence and retrieval date.>

## How to help

<Try it; the good-first-issues; the call for a steward; the intake inbox for the next need.>

## Tomorrow

<One line on the next SDG.>
```

- [ ] **Step 3: Test that both templates parse into the pipeline's shape**

`publish/test/templates.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseQueueFile, parseArticle, KNOWN_SECTIONS } from '../lib/queue.js';
import { firstParagraph } from '../lib/lint.js';

const TEMPLATES = join(import.meta.dirname, '..', '..', 'templates');

test('templates/launch-post.md is a queue item with the sections the pipeline knows', () => {
  const item = parseQueueFile(readFileSync(join(TEMPLATES, 'launch-post.md'), 'utf8'), 'queue/2026-10-NN-day-NN.md'.replace(/NN/g, '01'));
  assert.deepEqual(Object.keys(item.sections), ['bluesky', 'mastodon', 'linkedin', 'outreach', 'provider', 'notes']);
  for (const name of Object.keys(item.sections)) assert.ok(KNOWN_SECTIONS.includes(name), `unknown section ${name}`);
  assert.match(item.posts.bluesky, /Built by Marigold Builds, an AI, directed by Dom\. #MarigoldBuilds #31DaysOfGood$/);
  assert.equal(item.posts.bluesky, item.posts.mastodon);
  assert.match(item.alt, /^Day NN of 31 Days of Good/);
});

test('templates/launch-article.md is an article whose first paragraph discloses', () => {
  const a = parseArticle(readFileSync(join(TEMPLATES, 'launch-article.md'), 'utf8'), 'launch-article.md');
  assert.match(a.title, /31 Days of Good, day NN\)$/);
  assert.deepEqual(a.tags, ['opensource', 'sdg', 'showdev']);
  assert.equal(a.series, '31 Days of Good');
  assert.match(firstParagraph(a.body), /Claude, published as Marigold Builds/);
  assert.match(a.body, /## What it does not do/);
});

test('a filled-in copy of the launch post template fits Bluesky', async () => {
  const { graphemeCount } = await import('../lib/richtext.js');
  const filled = readFileSync(join(TEMPLATES, 'launch-post.md'), 'utf8')
    .replace(/<project-name>/g, 'sdg-badge')
    .replace(/<one sentence, who and what>/g, 'a badge and a checked SDG.yml so a repo can say which goal it serves')
    .replace(/<limitation>/g, 'verify the claim')
    .replace(/<repo>/g, 'sdg-badge')
    .replace(/NN/g, '1').replace(/N\.N/g, '17.6').replace(/SDG N/g, 'SDG 17');
  const item = parseQueueFile(filled, 'queue/2026-10-01-day-01.md');
  assert.ok(graphemeCount(item.posts.bluesky) <= 300, `${graphemeCount(item.posts.bluesky)} graphemes`);
});
```

Run: `cd publish && npm test`
Expected: 71 passing.

- [ ] **Step 4: Bring `docs/05-marketing-playbook.md` in line**

Replace the whole `## The publish queue and the pipeline` section (its three paragraphs up to and including "with after-the-fact review.") with:

```markdown
## The publish queue and the pipeline

Each night ends with a pull request against the programme repo adding the day's log entry (`log/YYYY-MM-DD.md`, which the site and the tile are built from) and the day's queue item: `queue/YYYY-MM-DD-<slug>.md` (front matter, then one `## bluesky` and one `## mastodon` section holding the post text verbatim, then sections Dom pastes by hand) and, for the long-form write-up, `queue/YYYY-MM-DD-<slug>.article.md`. Launch items use the slug `day-NN`; a Sunday digest or an announcement gets its own slug, so two items can share a date. The format is in `queue/README.md`, and CI lints every queue PR against it: length limits, the disclosure, alt text, no emoji, no "AI-powered".

On merge, the `publish` workflow builds the tile, posts the Bluesky and Mastodon items with the tile attached, posts the article to dev.to, and commits a receipt (`queue/<id>.posted.json`) recording what went where. A channel that has no credentials yet is skipped and recorded as skipped, so it never posts old items retroactively when it comes online; a channel that fails is left unrecorded, the run goes red, GitHub emails the merger, and re-running the failed job retries only that channel. Nothing posts twice. Nothing posts at all until the `PUBLISH_MODE` variable is `live`; until then every run is a dry run whose summary shows exactly what would have been sent. Dom's job is to read, edit if needed, and merge at 08:00. Target: five minutes.

Set-up, done once in September by Dom: create the Marigold Builds accounts on Bluesky (done 7 September), a Mastodon instance that permits flagged bot accounts, and dev.to; generate an app password or API key on each; store them in the `marigold-builds` organisation under the exact names in [07-decisions.md](07-decisions.md) rows 20 and 22, scoped to this repository. The `check-credentials` workflow proves each one authenticates without posting. The builder writes the workflow and rehearses it in dry-run mode; it never sees the credentials.

Why this design: the safety rules the builder runs under treat every public post, every account, and every accepted terms-of-service as needing a human's explicit approval. The merge is that approval, and it means a human has read every public word before it goes out. That fact goes in the disclosure. If Dom later wants zero daily effort, auto-merge at 08:00 is a one-line change, with after-the-fact review.
```

In the channel table, change the Mastodon rule cell from `Account must be on an instance that allows flagged bot accounts (mastodon.social or botsin.space-style instances), marked as a bot, with the disclosure in the bio.` to `Account must be on an instance that allows flagged bot accounts (mastodon.social does; botsin.space, the old bot-only instance, closed in 2024), marked as a bot, with the disclosure in the bio. The pipeline refuses to post to an account without the bot flag.` Leave the rest of the cell as it is.

- [ ] **Step 5: Bring `docs/02-daily-process.md` in line**

Replace the Deliver step 3 line with:

```markdown
3. **Launch pack (35 min).** From [../templates/launch-post.md](../templates/launch-post.md) and [../templates/launch-article.md](../templates/launch-article.md): `queue/YYYY-MM-DD-day-NN.md` (the Bluesky and Mastodon posts, the LinkedIn draft if it is a story day, the outreach drafts) and `queue/YYYY-MM-DD-day-NN.article.md` (the dev.to write-up), with alt text for the tile. Both go into the day's **queue PR** against the programme repo together with the log entry; CI lints them; the pipeline posts them when Dom merges. Nothing is posted directly.
```

In "Dom's ten minutes", replace the 08:00 row with:

```markdown
| 08:00 | Read the queue PR (CI green means the format and the limits are fine); edit if needed; merge (or hold). A red `publish` run afterwards means one channel failed: re-run the failed job | 5 min |
```

- [ ] **Step 6: Bring `docs/06-preparation-plan.md` in line**

Replace the Week 2 publish-pipeline bullet with:

```markdown
- [ ] **Publish pipeline:** the `publish` workflow posts to Bluesky (AT Protocol), Mastodon (bot-flagged account) and dev.to (API) when a queue PR merges, records receipts so nothing posts twice, and is a dry run until `PUBLISH_MODE` is `live`. Plan: `docs/superpowers/plans/2026-09-07-publish-pipeline.md`. Secrets are Dom's; the builder never handles them.
```

Replace the Week 2 "Queue PR convention" bullet with:

```markdown
- [ ] **Queue PR convention** (`queue/README.md`, CI lint on every queue PR) so Dom's 08:00 merge takes under five minutes.
```

In Week 3, replace the Dry run 2 bullet with:

```markdown
- [ ] **Dry run 2 (night of 25 Sep):** a second full overnight, including the queue PR and the pipeline posting to a test account: repository-level `BLUESKY_HANDLE` and `BLUESKY_APP_PASSWORD` pointing at a test account override the organisation ones for the rehearsal, dispatched with `mode=live` from the rehearsal branch, then removed. Measure Dom's actual time at 08:00.
```

In Week 4, after the "Go / no-go with Dom on 29 Sep." bullet, add:

```markdown
- [ ] Dom sets the `PUBLISH_MODE` organisation variable (scoped to this repository) to `live`. Until then every merge is a dry run and posts nothing.
```

- [ ] **Step 7: Bring `docs/07-decisions.md` in line**

Append two rows to the decisions table, after row 20:

```markdown
| 21 | Queue item convention | *Default applied:* one file per item, `queue/YYYY-MM-DD-<slug>.md` (`day-NN` for launches; `digest`, `launch` and the like for the rest, so two items can share a date), an optional `queue/YYYY-MM-DD-<slug>.article.md` for dev.to, and a `queue/YYYY-MM-DD-<slug>.posted.json` receipt written only by the workflow. Live posting is gated on a `PUBLISH_MODE` variable equal to `live`; anything else is a dry run | `queue/README.md`; the plan at `docs/superpowers/plans/2026-09-07-publish-pipeline.md` |
| 22 | Mastodon and dev.to credential names | *Default applied:* `MASTODON_INSTANCE` (organisation **variable**, the instance URL, e.g. `https://mastodon.social`), `MASTODON_ACCESS_TOKEN` (organisation **secret**, scopes `read:accounts write:media write:statuses`), `DEVTO_API_KEY` (organisation **secret**); all scoped to `31-days-of-good`, same pattern as row 20 | The pipeline skips a channel, and says so, until its values exist; `check-credentials` proves them without posting |
```

In the "Still open" list, replace the Mastodon instance bullet with:

```markdown
- **Mastodon instance** for the bot-flagged account: Dom's choice; mastodon.social permits bots when flagged (botsin.space closed in 2024; Fosstodon forbids unattended posting and the pipeline refuses it). Once chosen, store `MASTODON_INSTANCE` and `MASTODON_ACCESS_TOKEN` per row 22 and dispatch `check-credentials`.
```

- [ ] **Step 8: Bring `README.md` in line**

In the Templates list, after the `templates/launch-post.md` line, add:

```markdown
- [templates/launch-article.md](templates/launch-article.md), the dev.to write-up that goes beside it
```

and change the `launch-post.md` line's description to `the daily queue item: the Bluesky and Mastodon posts and the drafts Dom pastes by hand`.

- [ ] **Step 9: Search for stale wording and commit**

Run: `grep -rn 'queue/YYYY-MM-DD\.md\|botsin' docs templates README.md`
Expected: no matches.

```bash
git add templates/launch-post.md templates/launch-article.md publish/test/templates.test.js docs/02-daily-process.md docs/05-marketing-playbook.md docs/06-preparation-plan.md docs/07-decisions.md README.md
git commit -m "docs: queue item and article templates; describe the publish pipeline as built" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
git push
```

---

### Task 12: Rehearsal from a branch, and the recipe W15 and W16 follow

**Files:**
- Create on a throwaway branch only (never merged): `log/2026-10-01.md`, `queue/2026-10-01-day-01.md`, `queue/2026-10-01-day-01.article.md`
- Modify: `queue/README.md` (append the "Rehearsing" section; this part is committed to `main`)

**Interfaces:**
- Consumes: everything. This is the acceptance test of the plan.
- Produces: a green dry run of the real workflow against a real queue item on a branch, with the tile built from a real log entry; and the written recipe the two dry-run nights use.

The controller may dispatch `mode=dry-run` itself: it authenticates with the org credentials but posts nothing and writes nothing (`docs/10-controller-brief.md` stop rule 3 is about publishing). Dispatching `mode=live` is Dom's action, always.

- [ ] **Step 1: Create the rehearsal branch with a real-shaped day**

```bash
git checkout -b rehearsal-publish main
cat > log/2026-10-01.md <<'EOF'
---
day: 1
name: rehearsal
tagline: A rehearsal of the publish pipeline; not a real project.
status: shipped
repo: https://github.com/marigold-builds/31-days-of-good
demo:
---
# Day 1 rehearsal

This entry exists only on the rehearsal branch.
EOF
cp publish/test/fixtures/queue/2026-10-01-day-01.md queue/
cp publish/test/fixtures/queue/2026-10-01-day-01.article.md queue/
node publish/cli.js lint
git add log/2026-10-01.md queue/2026-10-01-day-01.md queue/2026-10-01-day-01.article.md
git commit -m "rehearsal: day 1 queue item for a publish dry run (branch only)" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
git push -u origin rehearsal-publish
```

Expected: `1 queue item(s), no problems.` The `ci` workflow runs on the push and is green (it lints the item).

- [ ] **Step 2: Dispatch a dry run from the branch and read the summary**

```bash
gh workflow run publish --ref rehearsal-publish -f mode=dry-run
sleep 10
run=$(gh run list --workflow publish --branch rehearsal-publish --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch --exit-status "$run"
gh run view "$run" --log | grep -E 'Publish: dry run|dry run \||skipped \(not configured\)|No receipts to record|add-mask|accessJwt'
```

Expected, in the log of the "Publish outstanding queue items" step:
- `## Publish: dry run (nothing posted, no receipts written)`
- a row `| 2026-10-01-day-01 | bluesky | dry run | see below |` followed by a `<details>` block whose record has `"$type": "app.bsky.feed.post"`, three facets (one link, two tags), and an embed with `"aspectRatio": { "width": 1200, "height": 630 }` and the alt text from the front matter
- rows for `mastodon` and `devto` reading `skipped (not configured)` (until those accounts exist; once they do, `dry run` rows with their previews)
- `No receipts to record.` from the last step
- no line containing `accessJwt`, and no line containing `::add-mask::` (the runner consumes that command; if the literal text appears in the log, the masking failed and that is a Critical finding)

Open the run in the browser (`gh run view "$run" --web`) and confirm the same table renders as the job summary.

- [ ] **Step 3: Confirm the branch is untouched and delete it**

```bash
git fetch origin rehearsal-publish
git diff --stat HEAD origin/rehearsal-publish
git checkout main
git push origin --delete rehearsal-publish
git branch -D rehearsal-publish
```

Expected: the diff is empty (a dry run pushes no receipt commit).

- [ ] **Step 4: Write the recipe into `queue/README.md`**

Append to `queue/README.md`:

```markdown

## Rehearsing

The pipeline is rehearsed from a branch that is never merged, so the live calendar and the accounts are untouched.

1. Branch from `main`. Add `log/2026-10-01.md` with `day: 1` and a rehearsal name, and `queue/2026-10-01-day-01.md` plus its article (the fixtures in `publish/test/fixtures/queue/` are a lint-clean starting point). Push the branch; CI lints it.
2. **Dry run (W15 shape):** `gh workflow run publish --ref <branch> -f mode=dry-run`. The job summary shows, per channel, the exact record, status parameters or article that would be sent, or "skipped (not configured)". Nothing is posted; no receipt is written; the branch is unchanged.
3. **Live run to a test account (W16 shape):** Dom creates repository-level `BLUESKY_HANDLE` and `BLUESKY_APP_PASSWORD` (and the Mastodon and dev.to values, if those test accounts exist) pointing at test accounts; repository-level values override the organisation ones. Dom dispatches `gh workflow run publish --ref <branch> -f mode=live`. The posts appear on the test accounts and a receipt commit lands on the branch. Dom deletes the repository-level overrides afterwards and confirms with `check-credentials` that the organisation values are back in effect.
4. Delete the branch.

Never merge a rehearsal branch: its log entry would appear on the public calendar, and its queue item would post from the real accounts once `PUBLISH_MODE` is `live`.
```

- [ ] **Step 5: Commit**

```bash
git add queue/README.md
git commit -m "docs(queue): how to rehearse the pipeline from a branch" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
git push
```

---

## Spec corrections

Things found while planning that the documents get wrong or leave unresolvable; Task 11 fixes the wording, and the open questions below ask Dom where a choice is his.

1. **`queue/YYYY-MM-DD.md` cannot hold both a Sunday digest and that day's launch** (`docs/05`, `docs/02`, `templates/launch-post.md`). The plan uses `queue/YYYY-MM-DD-<slug>.md`.
2. **botsin.space closed in 2024**; `docs/05` still offers "botsin.space-style instances". Wording fixed; mastodon.social is the live example.
3. **"≤ 300 chars" in `templates/launch-post.md` is not what Bluesky counts.** It counts graphemes, does not shorten links, and the template's fixed text alone is about 200 graphemes. The rewritten template says what is left for the variable parts. The fixture in Task 1 is a worked example at 296.
4. **The tile is not on Pages when the pipeline runs.** `pages` and `publish` trigger on the same push; the plan builds the tile inside `publish` from the same commit rather than fetching it. For the same reason the dev.to article carries no cover image URL in this version (open question 5).
5. **`docs/02` says the long-form post goes to "dev.to / programme site"**; the site does not render articles and this plan does not add that. dev.to is the article's home (open question 6).
6. **A re-run of a failed workflow checks out the original SHA by default**, which would not see receipts pushed by the first attempt and would post again. The plan checks out `github.ref` explicitly; this is the kind of detail a reviewer should verify in `publish.yml` rather than trust.
7. **W16's "posting to a test account"** needs credentials for a different account than the org ones. Repository-level variables and secrets override organisation ones of the same name; the recipe in Task 12 uses that and says to remove them afterwards.

## Open questions for Dom

Each with a recommendation and what it costs to defer. None blocks the code; the pipeline runs on Bluesky alone with everything else reported as "skipped (not configured)".

1. **Mastodon instance.** Recommendation: mastodon.social, account marked as a bot, disclosure in the bio, scopes `read:accounts write:media write:statuses`. Cost to defer: Mastodon stays skipped; no code changes when decided, only two org values and a `check-credentials` dispatch. If the chosen instance has a limit other than 500 characters, change `MASTODON_MAX_CHARS` in `publish/lib/lint.js`.
2. **dev.to account and API key** (`DEVTO_API_KEY`). Recommendation: create it in week 2 so W16 can rehearse the article path live. Cost to defer: the article path is only ever dry-run before October.
3. **Confirm rows 21 and 22 of `docs/07-decisions.md`** (the queue item naming and the credential names), applied as defaults by Task 11. Cost to defer: none unless the names change after W16, which would mean re-storing values.
4. **`PUBLISH_MODE=live` is a deliberate switch Dom flips at the 29 September go/no-go.** Recommendation: keep the fail-safe default even though forgetting it means Day 1 posts nothing (the run summary and a `::notice::` say so loudly, and re-dispatching with `mode=live` posts within a minute). Alternative: default to live from 1 October by setting the variable now and relying on the branch rehearsal for testing.
5. **Cover image on dev.to articles.** Needs a stable public URL for the tile; the site's tile URL exists but may be a deploy behind at post time and dev.to may cache it. Recommendation: no cover in v1; revisit after seeing how dev.to proxies images. Cost: articles show without a card image.
6. **Should the article also be rendered on the programme site**, with dev.to's `canonical_url` pointing at it? Recommendation: not in September; it is site-build work, not pipeline work. Cost: dev.to is canonical for the write-ups.
7. **Failure visibility beyond the red run and GitHub's email.** Recommendation: rely on those and confirm in GitHub notification settings that "Actions: failed workflows" emails are on for the account that merges. Alternative: open a `pipeline` issue on failure; not recommended because the issue inbox is the public intake form's home.
8. **Backfill when a channel comes online mid-month.** The receipts mark earlier days as skipped so nothing posts retroactively. Recommendation: keep it that way; a retrospective burst of ten posts reads as automation. If Dom wants a specific day backfilled, delete that channel's key from its receipt and dispatch `publish` with `mode=live` and `only=<id>`.
9. **Scheduled posting** (merge in the evening, post at 08:00). Recommendation: no; "merge is what makes the day public" is the property the whole design protects, and a cron path is a second way for content to go out. Dom merges at 08:00; the announcement on 30 September is merged when it should post.
10. **Threads.** Launch week mentions "one Bluesky/Mastodon thread". Recommendation: model a thread as several queue items with slugs (`launch-1`, `launch-2`) posted as separate posts; reply-chaining (`reply.root`/`reply.parent` on Bluesky, `in_reply_to_id` on Mastodon) is a small later addition once there is a receipt to chain from.
11. **Branch protection on `main`.** The receipt step pushes with `GITHUB_TOKEN`. If Dom adds a required-review rule, that push fails (loudly, with the receipt printed for manual commit). Recommendation: no rule while Dom is the only merger; if one is added, allow `github-actions[bot]` to bypass it.

