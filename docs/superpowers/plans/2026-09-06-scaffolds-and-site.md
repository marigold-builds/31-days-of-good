# Scaffolds and Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `marigold-builds` GitHub org with the programme repo, a static site that renders the 31-day calendar and per-day tiles from data files, Pages deployment, three template repos the nightly builds start from, and the org profile.

**Architecture:** The programme repo (`31-days-of-good`) holds the strategy docs, a `data/calendar.json` with the 31 planned days, a `log/` of per-day markdown files with a small key-value front matter, and a dependency-light Node build (`site-build/`) that turns those into `site/` (HTML, CSS, PNG tiles) deployed by GitHub Actions to Pages. Template repos are independent GitHub "template repositories" with tests, CI, licence and the README skeleton already in place.

**Tech Stack:** Node 22 (built-in `node:test`, no framework), `@resvg/resvg-js` for SVG→PNG, GitHub Actions, GitHub Pages. Python template uses `uv`, `pytest`, `ruff`, Python ≥3.11. `gh` CLI for repo creation. Licence MIT for code, CC-BY-4.0 for content.

**Spec:** `docs/01-strategy.md`, `docs/02-daily-process.md`, `docs/04-identity.md`, `docs/05-marketing-playbook.md`, `docs/06-preparation-plan.md`, `docs/07-decisions.md`, `backlog/calendar.md`, `templates/project-README.md`.

## Global Constraints

- Org: `marigold-builds`. Programme repo: `31-days-of-good`. Templates: `template-python-cli`, `template-web-static`, `template-node-action`. Org profile repo: `.github`.
- All repos public (Free plan; Pages and unlimited CI need public repos).
- Licence: MIT for code; CC-BY-4.0 for content. No package registries.
- Disclosure text (verbatim, from `docs/04-identity.md`): "Marigold Builds is Claude, an AI model by Anthropic, directed and reviewed by Dom. Every project here was researched, built and documented by Marigold overnight, in one session. Dom sets the calendar, can veto each brief, merges every day's posts before they go out, and is accountable for what ships."
  - **Superseded:** BOARD Decided 17/18 — this wording is superseded; current text names the model on the disclosure page only and drops "Dom sets the calendar" (false since Decided 16). See `docs/04-identity.md` and `site-build/lib/html.js`.
- Identity colour: `#F4A300`. SDG colours (official): 1 `#E5243B`, 2 `#DDA63A`, 3 `#4C9F38`, 4 `#C5192D`, 5 `#FF3A21`, 6 `#26BDE2`, 7 `#FCC30B`, 8 `#A21942`, 9 `#FD6925`, 10 `#DD1367`, 11 `#FD9D24`, 12 `#BF8B2E`, 13 `#3F7E44`, 14 `#0A97D9`, 15 `#56C02B`, 16 `#00689D`, 17 `#19486A`.
- Tiles use SDG number, title and colour only. Do not reproduce the SDG icon graphics.
- No emoji in READMEs. No "AI-powered" wording. No build-speed claims.
- Commits end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
  - **Superseded:** BOARD Decided 11 — commit trailers name the model that actually authored the commit, not this hard-coded value.
- Zero spend. No external services beyond GitHub.

---

### Task 1: Programme repo on GitHub

**Files:**
- Create: `.gitignore`, `LICENSE` (MIT for code), `LICENSE-CONTENT` (CC-BY-4.0 notice)
- Modify: `docs/06-preparation-plan.md` (dry runs in public repos)

**Interfaces:**
- Produces: git repo at `/Users/dom/Documents/Coding/DoGood` with remote `origin` = `git@github.com:marigold-builds/31-days-of-good.git`, default branch `main`.

- [ ] **Step 1: Init git and ignore files**

```bash
cd /Users/dom/Documents/Coding/DoGood
git init -b main
cat > .gitignore <<'G'
node_modules/
site/
.DS_Store
*.log
.venv/
__pycache__/
G
```

- [ ] **Step 2: Add licences**

`LICENSE`:
```
MIT License

Copyright (c) 2026 Dom (marigold-builds)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`LICENSE-CONTENT`:
```
Documents, plans, logs and other prose in this repository are licensed under
Creative Commons Attribution 4.0 International (CC BY 4.0).
https://creativecommons.org/licenses/by/4.0/
Code is licensed under the MIT License in LICENSE.
```

- [ ] **Step 3: Fix the dry-run note in the preparation plan**

In `docs/06-preparation-plan.md` replace `private repo, real time boxes, 20:45 start` with `public repo named dry-run-1 (deleted afterwards; Free plan has no Pages for private repos), real time boxes, 20:45 start`.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "docs: strategy, process, templates and backlog for 31 Days of Good

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
gh repo create marigold-builds/31-days-of-good --public --source=. --remote=origin --push \
  --description "One small open-source tool a night for the UN Sustainable Development Goals, October 2026. Built by Marigold Builds (Claude), directed by Dom."
```
Expected: repo URL printed; `git log origin/main` shows the commit.

---

### Task 2: Calendar data and day loader

**Files:**
- Create: `data/calendar.json`, `data/sdgs.json`, `site-build/lib/days.js`, `site-build/package.json`, `log/README.md`
- Test: `site-build/test/days.test.js`

**Interfaces:**
- Produces: `loadDays({calendarPath, logDir}) → Day[]` where `Day = {day:number, date:string(YYYY-MM-DD), sdg:number[], sdgTitle:string, observance:string, archetype:string, seed:string, name:string|null, tagline:string|null, status:"planned"|"shipped"|"partial"|"missed", repo:string|null, demo:string|null, logPath:string|null}`; `parseFrontMatter(text) → {meta:Object, body:string}`; `SDGS` exported from `data/sdgs.json` as `{[n]: {title, colour}}`.

- [ ] **Step 1: Write `site-build/package.json`**

```json
{
  "name": "site-build",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test test/",
    "build": "node build.js"
  },
  "dependencies": {
    "@resvg/resvg-js": "2.6.2"
  }
}
```

- [ ] **Step 2: Write `data/sdgs.json`**

```json
{
  "1":  {"title": "No Poverty", "colour": "#E5243B"},
  "2":  {"title": "Zero Hunger", "colour": "#DDA63A"},
  "3":  {"title": "Good Health and Well-being", "colour": "#4C9F38"},
  "4":  {"title": "Quality Education", "colour": "#C5192D"},
  "5":  {"title": "Gender Equality", "colour": "#FF3A21"},
  "6":  {"title": "Clean Water and Sanitation", "colour": "#26BDE2"},
  "7":  {"title": "Affordable and Clean Energy", "colour": "#FCC30B"},
  "8":  {"title": "Decent Work and Economic Growth", "colour": "#A21942"},
  "9":  {"title": "Industry, Innovation and Infrastructure", "colour": "#FD6925"},
  "10": {"title": "Reduced Inequalities", "colour": "#DD1367"},
  "11": {"title": "Sustainable Cities and Communities", "colour": "#FD9D24"},
  "12": {"title": "Responsible Consumption and Production", "colour": "#BF8B2E"},
  "13": {"title": "Climate Action", "colour": "#3F7E44"},
  "14": {"title": "Life Below Water", "colour": "#0A97D9"},
  "15": {"title": "Life on Land", "colour": "#56C02B"},
  "16": {"title": "Peace, Justice and Strong Institutions", "colour": "#00689D"},
  "17": {"title": "Partnerships for the Goals", "colour": "#19486A"}
}
```

- [ ] **Step 3: Write `data/calendar.json`** (31 entries; transcribed from `backlog/calendar.md`)

  **Superseded:** BOARD Decided 21 — the `sdg`, `archetype` and `seed` fields in this schema were removed after launch (decision to make every night start from zero). Current `data/calendar.json` carries only `day` and `date`.

```json
[
 {"day":1,"date":"2026-10-01","sdg":[17],"observance":"Launch day; International Day of Older Persons","archetype":"GitHub Action + badge","seed":"sdg-badge"},
 {"day":2,"date":"2026-10-02","sdg":[16],"observance":"International Day of Non-Violence","archetype":"Static tool","seed":"foia-draft"},
 {"day":3,"date":"2026-10-03","sdg":[3],"observance":"Older Persons (carried from 1 Oct)","archetype":"PWA, offline","seed":"med-times"},
 {"day":4,"date":"2026-10-04","sdg":[15],"observance":"World Space Week begins; World Animal Day","archetype":"Library","seed":"inat-pull"},
 {"day":5,"date":"2026-10-05","sdg":[4],"observance":"World Teachers' Day; World Habitat Day","archetype":"CLI","seed":"md2quiz"},
 {"day":6,"date":"2026-10-06","sdg":[11],"observance":"World Habitat Day (carried)","archetype":"Static map tool","seed":"walkshed"},
 {"day":7,"date":"2026-10-07","sdg":[12],"observance":"World Cotton Day","archetype":"Static tool","seed":"repair-or-replace"},
 {"day":8,"date":"2026-10-08","sdg":[10],"observance":"World Sight Day","archetype":"GitHub Action","seed":"a11y-gate"},
 {"day":9,"date":"2026-10-09","sdg":[9],"observance":"World Post Day","archetype":"CLI","seed":"slowlint"},
 {"day":10,"date":"2026-10-10","sdg":[3],"observance":"World Mental Health Day; World Migratory Bird Day","archetype":"PWA, offline","seed":"steady"},
 {"day":11,"date":"2026-10-11","sdg":[5],"observance":"International Day of the Girl Child","archetype":"CLI + Action","seed":"jobad-lint"},
 {"day":12,"date":"2026-10-12","sdg":[14],"observance":"","archetype":"Static tool","seed":"beach-tally"},
 {"day":13,"date":"2026-10-13","sdg":[13],"observance":"International Day for Disaster Risk Reduction","archetype":"CLI/library","seed":"flood-check"},
 {"day":14,"date":"2026-10-14","sdg":[8],"observance":"","archetype":"Library","seed":"fair-rota"},
 {"day":15,"date":"2026-10-15","sdg":[6],"observance":"Global Handwashing Day; International Day of Rural Women","archetype":"PWA","seed":"wash-timer"},
 {"day":16,"date":"2026-10-16","sdg":[2],"observance":"World Food Day","archetype":"Library","seed":"faostat-py"},
 {"day":17,"date":"2026-10-17","sdg":[1],"observance":"International Day for the Eradication of Poverty","archetype":"CLI/library","seed":"pip-lines"},
 {"day":18,"date":"2026-10-18","sdg":[12],"observance":"Maintenance sprint","archetype":"Dataset","seed":"off-facts"},
 {"day":19,"date":"2026-10-19","sdg":[9],"observance":"","archetype":"GitHub Action","seed":"oss-pulse"},
 {"day":20,"date":"2026-10-20","sdg":[6],"observance":"","archetype":"Library","seed":"water-footprint"},
 {"day":21,"date":"2026-10-21","sdg":[14],"observance":"","archetype":"Static tool","seed":"catch-check"},
 {"day":22,"date":"2026-10-22","sdg":[1],"observance":"","archetype":"Template","seed":"benefit-finder-kit"},
 {"day":23,"date":"2026-10-23","sdg":[15],"observance":"International Day of the Snow Leopard","archetype":"CLI","seed":"firms-watch"},
 {"day":24,"date":"2026-10-24","sdg":[17],"observance":"United Nations Day; World Development Information Day","archetype":"Library","seed":"sdg-data"},
 {"day":25,"date":"2026-10-25","sdg":[16],"observance":"Global Media and Information Literacy Week","archetype":"Static tool","seed":"source-check"},
 {"day":26,"date":"2026-10-26","sdg":[4],"observance":"Global Media and Information Literacy Week","archetype":"Static tool","seed":"readable"},
 {"day":27,"date":"2026-10-27","sdg":[11],"observance":"World Day for Audiovisual Heritage","archetype":"Template","seed":"civic-report-kit"},
 {"day":28,"date":"2026-10-28","sdg":[7],"observance":"","archetype":"CLI","seed":"grid-now"},
 {"day":29,"date":"2026-10-29","sdg":[5],"observance":"International Day of Care and Support","archetype":"Library","seed":"care-hours"},
 {"day":30,"date":"2026-10-30","sdg":[13],"observance":"","archetype":"Library","seed":"stripes"},
 {"day":31,"date":"2026-10-31","sdg":[11,17],"observance":"World Cities Day; close","archetype":"Template","seed":"day-of-good-kit"}
]
```

- [ ] **Step 4: Write `log/README.md`** documenting the front matter

```markdown
# Daily log

One file per night, `YYYY-MM-DD.md`. The first lines are a front matter block between `---` lines with `key: value` pairs; the site build reads it. Keys:

- `day` (1–31), `name` (project name), `tagline` (one sentence)
- `status`: `shipped`, `partial` or `missed`
- `repo`: full URL; `demo`: full URL or blank

The body is the brief followed by the retro (see `templates/`). Example:

---
day: 1
name: sdg-badge
tagline: Declare a repo's SDG alignment with a badge and a validated SDG.yml.
status: shipped
repo: https://github.com/marigold-builds/sdg-badge
demo: https://marigold-builds.github.io/sdg-badge/
---
```

- [ ] **Step 5: Write the failing tests `site-build/test/days.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFrontMatter, loadDays, SDGS } from '../lib/days.js';

const CAL = join(import.meta.dirname, '..', '..', 'data', 'calendar.json');

test('parseFrontMatter splits keys and body', () => {
  const { meta, body } = parseFrontMatter('---\nday: 3\nname: med-times\n---\n# Brief\n');
  assert.equal(meta.day, '3');
  assert.equal(meta.name, 'med-times');
  assert.equal(body.trim(), '# Brief');
});

test('parseFrontMatter without front matter returns empty meta', () => {
  const { meta, body } = parseFrontMatter('just text');
  assert.deepEqual(meta, {});
  assert.equal(body, 'just text');
});

test('loadDays returns 31 planned days with SDG titles when log is empty', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  const days = loadDays({ calendarPath: CAL, logDir });
  assert.equal(days.length, 31);
  assert.equal(days[0].status, 'planned');
  assert.equal(days[0].sdgTitle, 'Partnerships for the Goals');
  assert.equal(days[30].sdgTitle, 'Sustainable Cities and Communities + Partnerships for the Goals');
  assert.equal(days[0].name, null);
});

test('loadDays merges a log entry by day number', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-01.md'),
    '---\nday: 1\nname: sdg-badge\ntagline: A badge.\nstatus: shipped\nrepo: https://github.com/marigold-builds/sdg-badge\ndemo:\n---\nbody');
  const days = loadDays({ calendarPath: CAL, logDir });
  assert.equal(days[0].name, 'sdg-badge');
  assert.equal(days[0].status, 'shipped');
  assert.equal(days[0].demo, null);
  assert.equal(days[0].logPath, '2026-10-01.md');
});

test('loadDays rejects an unknown status', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-02.md'), '---\nday: 2\nstatus: done\n---\n');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /status/);
});

test('SDGS has 17 entries with colours', () => {
  assert.equal(Object.keys(SDGS).length, 17);
  assert.match(SDGS[6].colour, /^#[0-9A-F]{6}$/);
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `cd site-build && npm install && npm test`
Expected: FAIL, cannot find module `../lib/days.js`.

- [ ] **Step 7: Write `site-build/lib/days.js`**

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
export const SDGS = JSON.parse(readFileSync(join(ROOT, 'data', 'sdgs.json'), 'utf8'));
const STATUSES = new Set(['planned', 'shipped', 'partial', 'missed']);

export function parseFrontMatter(text) {
  if (!text.startsWith('---\n')) return { meta: {}, body: text };
  const end = text.indexOf('\n---', 4);
  if (end === -1) return { meta: {}, body: text };
  const meta = {};
  for (const line of text.slice(4, end).split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: text.slice(end + 4).replace(/^\n/, '') };
}

function blankToNull(v) { return v === undefined || v === '' ? null : v; }

export function loadDays({ calendarPath, logDir }) {
  const calendar = JSON.parse(readFileSync(calendarPath, 'utf8'));
  const logs = new Map();
  if (existsSync(logDir)) {
    for (const f of readdirSync(logDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))) {
      const { meta } = parseFrontMatter(readFileSync(join(logDir, f), 'utf8'));
      if (meta.day) logs.set(Number(meta.day), { ...meta, logPath: f });
    }
  }
  return calendar.map((entry) => {
    const log = logs.get(entry.day) || {};
    const status = log.status || 'planned';
    if (!STATUSES.has(status)) throw new Error(`Day ${entry.day}: unknown status "${status}"`);
    return {
      ...entry,
      sdgTitle: entry.sdg.map((n) => SDGS[n].title).join(' + '),
      name: blankToNull(log.name),
      tagline: blankToNull(log.tagline),
      status,
      repo: blankToNull(log.repo),
      demo: blankToNull(log.demo),
      logPath: log.logPath || null,
    };
  });
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd site-build && npm test`
Expected: 6 passing.

- [ ] **Step 9: Commit**

```bash
git add data site-build log
git commit -m "feat(site): calendar data, SDG table and day loader

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Tile generator (SVG and PNG)

**Files:**
- Create: `site-build/lib/tile.js`
- Test: `site-build/test/tile.test.js`

**Interfaces:**
- Consumes: `Day` from Task 2, `SDGS`.
- Produces: `tileSvg(day) → string` (1200×630 SVG), `tilePng(day) → Promise<Buffer>`, `escapeXml(s) → string`.

- [ ] **Step 1: Write the failing tests `site-build/test/tile.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tileSvg, tilePng, escapeXml } from '../lib/tile.js';

const day = { day: 6, date: '2026-10-06', sdg: [11], sdgTitle: 'Sustainable Cities and Communities',
  observance: 'World Habitat Day', archetype: 'Static map tool', seed: 'walkshed',
  name: 'walkshed', tagline: '15-minute walking isochrones from OpenStreetMap, no key.',
  status: 'shipped', repo: 'x', demo: null, logPath: null };

test('escapeXml escapes the five characters', () => {
  assert.equal(escapeXml('a<b>&"c\''), 'a&lt;b&gt;&amp;&quot;c&apos;');
});

test('tileSvg contains day, SDG, name, tagline and colour', () => {
  const svg = tileSvg(day);
  assert.match(svg, /^<svg[^>]*viewBox="0 0 1200 630"/);
  assert.match(svg, />Day 6 of 31</);
  assert.match(svg, /SDG 11/);
  assert.match(svg, /Sustainable Cities and Communities/);
  assert.match(svg, /walkshed/);
  assert.match(svg, /#FD9D24/);
  assert.match(svg, /Marigold Builds/);
});

test('tileSvg for a planned day shows the seed and Planned', () => {
  const svg = tileSvg({ ...day, name: null, tagline: null, status: 'planned' });
  assert.match(svg, /Planned/);
  assert.match(svg, /walkshed/);
});

test('tileSvg wraps a long tagline onto more than one line', () => {
  const svg = tileSvg({ ...day, tagline: 'x'.repeat(30) + ' ' + 'y'.repeat(30) + ' ' + 'z'.repeat(30) });
  assert.ok((svg.match(/<tspan/g) || []).length >= 2);
});

test('tilePng returns a PNG', async () => {
  const png = await tilePng(day);
  assert.equal(png.subarray(0, 4).toString('hex'), '89504e47');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd site-build && npm test`
Expected: FAIL, cannot find module `../lib/tile.js`.

- [ ] **Step 3: Write `site-build/lib/tile.js`**

```js
import { Resvg } from '@resvg/resvg-js';
import { SDGS } from './days.js';

const MARIGOLD = '#F4A300';
const FONT = 'system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

export function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function wrap(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) { lines.push(line); line = w; }
    else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

const STATUS_LABEL = { planned: 'Planned', shipped: 'Shipped', partial: 'Shipped, reduced scope', missed: 'Missed' };

export function tileSvg(day) {
  const colour = SDGS[day.sdg[0]].colour;
  const title = day.name || day.seed;
  const tagline = day.tagline || (day.status === 'planned' ? `Planned: ${day.archetype} for SDG ${day.sdg.join(' and ')}` : '');
  const lines = wrap(tagline, 48);
  const tspans = lines.map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 46}">${escapeXml(l)}</tspan>`).join('');
  const sdgLabel = day.sdg.map((n) => `SDG ${n}`).join(' + ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<rect width="1200" height="630" fill="#FFFFFF"/>
<rect x="0" y="0" width="28" height="630" fill="${colour}"/>
<rect x="0" y="0" width="1200" height="10" fill="${MARIGOLD}"/>
<text x="80" y="110" font-family='${FONT}' font-size="30" fill="#555555">Day ${day.day} of 31</text>
<text x="1120" y="110" text-anchor="end" font-family='${FONT}' font-size="30" fill="${colour}" font-weight="700">${escapeXml(sdgLabel)}</text>
<text x="1120" y="150" text-anchor="end" font-family='${FONT}' font-size="26" fill="#555555">${escapeXml(day.sdgTitle)}</text>
<text x="80" y="260" font-family='${FONT}' font-size="88" font-weight="700" fill="#111111">${escapeXml(title)}</text>
<text x="80" y="340" font-family='${FONT}' font-size="36" fill="#333333">${tspans}</text>
<text x="80" y="560" font-family='${FONT}' font-size="26" fill="#555555">${escapeXml(STATUS_LABEL[day.status])} · ${escapeXml(day.date)}</text>
<text x="1120" y="560" text-anchor="end" font-family='${FONT}' font-size="26" fill="${MARIGOLD}" font-weight="700">Marigold Builds · 31 Days of Good</text>
</svg>`;
}

export async function tilePng(day) {
  const resvg = new Resvg(tileSvg(day), { fitTo: { mode: 'width', value: 1200 } });
  return Buffer.from(resvg.render().asPng());
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd site-build && npm test`
Expected: 11 passing. If `tilePng` renders no text (resvg has no fonts on some CI images), that is acceptable for the test; the Pages workflow in Task 5 installs `fonts-dejavu-core`.

- [ ] **Step 5: Commit**

```bash
git add site-build
git commit -m "feat(site): SVG and PNG tile generator

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Site build (HTML, CSS, tiles)

**Files:**
- Create: `site-build/lib/html.js`, `site-build/build.js`, `site-build/static/style.css`
- Test: `site-build/test/html.test.js`, `site-build/test/build.test.js`

**Interfaces:**
- Consumes: `loadDays`, `tilePng`, `escapeXml`.
- Produces: `renderIndex(days, {baseUrl}) → string`, `renderDay(day, body, {baseUrl}) → string`, `build({outDir, calendarPath, logDir, baseUrl}) → Promise<{files:string[]}>`. Output layout: `site/index.html`, `site/day/NN/index.html`, `site/tiles/day-NN.png`, `site/style.css`.

- [ ] **Step 1: Write `site-build/static/style.css`**

```css
:root { --marigold: #F4A300; --ink: #111; --muted: #555; --line: #e6e6e6; --bg: #fff; }
@media (prefers-color-scheme: dark) { :root { --ink: #f2f2f2; --muted: #b5b5b5; --line: #2a2a2a; --bg: #121212; } }
* { box-sizing: border-box; }
body { margin: 0; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: var(--ink); background: var(--bg); }
a { color: inherit; }
header, main, footer { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
header { padding-top: 40px; border-top: 8px solid var(--marigold); }
header h1 { font-size: 2.2rem; margin: 0 0 4px; }
header p.lede { font-size: 1.15rem; color: var(--muted); max-width: 60ch; margin: 0 0 24px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; list-style: none; padding: 0; margin: 24px 0 48px; }
.tile { border: 1px solid var(--line); border-left: 8px solid var(--sdg); border-radius: 6px; padding: 12px 14px; display: block; text-decoration: none; min-height: 150px; }
.tile .day { color: var(--muted); font-size: .85rem; }
.tile .sdg { color: var(--sdg); font-weight: 700; font-size: .85rem; }
.tile .name { font-weight: 700; font-size: 1.1rem; margin: 6px 0 4px; word-break: break-word; }
.tile .tagline { color: var(--muted); font-size: .9rem; }
.tile .status { font-size: .8rem; margin-top: 8px; }
.tile[data-status="planned"] { opacity: .75; }
.tile[data-status="missed"] .status { color: #b00020; }
.day-page img { width: 100%; height: auto; border: 1px solid var(--line); border-radius: 6px; }
.meta { color: var(--muted); }
footer { border-top: 1px solid var(--line); padding: 24px 20px 48px; color: var(--muted); font-size: .9rem; }
footer p { max-width: 80ch; }
```

- [ ] **Step 2: Write the failing tests `site-build/test/html.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderIndex, renderDay, DISCLOSURE } from '../lib/html.js';

const day = { day: 2, date: '2026-10-02', sdg: [16], sdgTitle: 'Peace, Justice and Strong Institutions',
  observance: 'International Day of Non-Violence', archetype: 'Static tool', seed: 'foia-draft',
  name: null, tagline: null, status: 'planned', repo: null, demo: null, logPath: null };

test('renderIndex lists every day as a tile with SDG colour and status', () => {
  const html = renderIndex([day], { baseUrl: '/31-days-of-good/' });
  assert.match(html, /<title>31 Days of Good<\/title>/);
  assert.match(html, /href="\/31-days-of-good\/day\/02\/"/);
  assert.match(html, /--sdg:#00689D/);
  assert.match(html, /data-status="planned"/);
  assert.match(html, /foia-draft/);
  assert.ok(html.includes(DISCLOSURE));
});

test('renderDay shows tile image, observance, links and body', () => {
  const shipped = { ...day, name: 'foia-draft', tagline: 'FOI requests.', status: 'shipped',
    repo: 'https://github.com/marigold-builds/foia-draft', demo: 'https://example.org/' };
  const html = renderDay(shipped, '<p>brief</p>', { baseUrl: '/31-days-of-good/' });
  assert.match(html, /<title>Day 2 · foia-draft · 31 Days of Good<\/title>/);
  assert.match(html, /tiles\/day-02\.png/);
  assert.match(html, /International Day of Non-Violence/);
  assert.match(html, /href="https:\/\/github.com\/marigold-builds\/foia-draft"/);
  assert.match(html, /<p>brief<\/p>/);
  assert.match(html, /og:image/);
});

test('renderDay escapes user text', () => {
  const html = renderDay({ ...day, tagline: '<script>' }, '', { baseUrl: '/' });
  assert.ok(!html.includes('<script>'));
});
```

- [ ] **Step 3: Write `site-build/lib/html.js`**

```js
import { escapeXml as esc } from './tile.js';
import { SDGS } from './days.js';

export const DISCLOSURE = 'Marigold Builds is Claude, an AI model by Anthropic, directed and reviewed by Dom. Every project here was researched, built and documented by Marigold overnight, in one session. Dom sets the calendar, can veto each brief, merges every day&apos;s posts before they go out, and is accountable for what ships.';

const pad = (n) => String(n).padStart(2, '0');
const STATUS = { planned: 'Planned', shipped: 'Shipped', partial: 'Shipped, reduced scope', missed: 'Missed' };

function layout({ title, baseUrl, head = '', body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${baseUrl}style.css">
${head}
</head>
<body>
${body}
<footer>
<p>${DISCLOSURE}</p>
<p>Code is MIT licensed; writing is CC BY 4.0. <a href="https://github.com/marigold-builds/31-days-of-good">Programme repository</a>.</p>
</footer>
</body>
</html>
`;
}

export function renderIndex(days, { baseUrl }) {
  const tiles = days.map((d) => {
    const colour = SDGS[d.sdg[0]].colour;
    return `<li><a class="tile" style="--sdg:${colour}" data-status="${d.status}" href="${baseUrl}day/${pad(d.day)}/">
<div class="day">Day ${d.day} · ${esc(d.date)}</div>
<div class="sdg">SDG ${d.sdg.join(' + ')} · ${esc(d.sdgTitle)}</div>
<div class="name">${esc(d.name || d.seed)}</div>
<div class="tagline">${esc(d.tagline || d.archetype)}</div>
<div class="status">${STATUS[d.status]}</div>
</a></li>`;
  }).join('\n');
  const shipped = days.filter((d) => d.status === 'shipped' || d.status === 'partial').length;
  return layout({
    title: '31 Days of Good', baseUrl,
    body: `<header>
<h1>Marigold Builds: 31 Days of Good</h1>
<p class="lede">One small open-source tool a night for the UN Sustainable Development Goals, 1–31 October 2026. Built in the open by an AI, directed by a human, handed to people who need it.</p>
<p class="meta">${shipped} of 31 shipped so far.</p>
</header>
<main>
<ul class="grid">
${tiles}
</ul>
</main>`,
  });
}

export function renderDay(d, bodyHtml, { baseUrl }) {
  const title = `Day ${d.day} · ${d.name || d.seed} · 31 Days of Good`;
  const img = `${baseUrl}tiles/day-${pad(d.day)}.png`;
  const links = [
    d.repo ? `<a href="${esc(d.repo)}">Repository</a>` : '',
    d.demo ? `<a href="${esc(d.demo)}">Demo</a>` : '',
  ].filter(Boolean).join(' · ');
  return layout({
    title, baseUrl,
    head: `<meta property="og:title" content="${esc(title)}">
<meta property="og:image" content="${img}">
<meta property="og:description" content="${esc(d.tagline || d.archetype)}">`,
    body: `<header>
<p class="meta"><a href="${baseUrl}">31 Days of Good</a> · Day ${d.day} of 31 · ${esc(d.date)}</p>
<h1>${esc(d.name || d.seed)}</h1>
<p class="lede">${esc(d.tagline || `Planned: ${d.archetype}`)}</p>
<p class="meta">SDG ${d.sdg.join(' + ')} · ${esc(d.sdgTitle)}${d.observance ? ` · ${esc(d.observance)}` : ''} · ${STATUS[d.status]}</p>
${links ? `<p>${links}</p>` : ''}
</header>
<main class="day-page">
<img src="${img}" alt="Day ${d.day} of 31 Days of Good. SDG ${d.sdg.join(' and ')}, ${esc(d.sdgTitle)}. ${esc(d.name || d.seed)}: ${esc(d.tagline || d.archetype)}.">
${bodyHtml}
</main>`,
  });
}
```

- [ ] **Step 4: Run html tests**

Run: `cd site-build && npm test`
Expected: html tests pass.

- [ ] **Step 5: Write the failing test `site-build/test/build.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../build.js';

const CAL = join(import.meta.dirname, '..', '..', 'data', 'calendar.json');

test('build writes index, 31 day pages, 31 tiles and css', async () => {
  const outDir = mkdtempSync(join(tmpdir(), 'site-'));
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-01.md'), '---\nday: 1\nname: sdg-badge\ntagline: Badge.\nstatus: shipped\nrepo: https://github.com/marigold-builds/sdg-badge\n---\n# Brief\n\nSome *text*.\n');
  const { files } = await build({ outDir, calendarPath: CAL, logDir, baseUrl: '/' });
  assert.ok(existsSync(join(outDir, 'index.html')));
  assert.ok(existsSync(join(outDir, 'style.css')));
  assert.ok(existsSync(join(outDir, 'day', '31', 'index.html')));
  assert.ok(existsSync(join(outDir, 'tiles', 'day-31.png')));
  assert.equal(files.filter((f) => f.endsWith('.png')).length, 31);
  const day1 = readFileSync(join(outDir, 'day', '01', 'index.html'), 'utf8');
  assert.match(day1, /<h1>Brief<\/h1>/);
  assert.match(day1, /<em>text<\/em>/);
});
```

- [ ] **Step 6: Write `site-build/build.js`** (tiny markdown: headings, paragraphs, emphasis, links, lists, code fences; enough for briefs and retros)

  **Superseded:** final review Important 1 — this renderer could not render the programme's own `templates/daily-brief.md` and `templates/retro.md` (no pipe tables, ordered lists or hard line breaks). Fixed in `site-build/build.js`'s `markdown()`; "enough for briefs and retros" was a plan defect, not just an implementer gap.

```js
import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadDays, parseFrontMatter } from './lib/days.js';
import { tilePng, escapeXml as esc } from './lib/tile.js';
import { renderIndex, renderDay } from './lib/html.js';

const HERE = import.meta.dirname;
const ROOT = join(HERE, '..');
const pad = (n) => String(n).padStart(2, '0');

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
}

export function markdown(md) {
  const out = [];
  const lines = md.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`), i++;
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (line.trim() === '') { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,6}\s|```|\s*[-*]\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}

export async function build({ outDir, calendarPath, logDir, baseUrl }) {
  const days = loadDays({ calendarPath, logDir });
  const files = [];
  mkdirSync(join(outDir, 'tiles'), { recursive: true });
  copyFileSync(join(HERE, 'static', 'style.css'), join(outDir, 'style.css'));
  files.push('style.css');
  writeFileSync(join(outDir, 'index.html'), renderIndex(days, { baseUrl }));
  files.push('index.html');
  for (const d of days) {
    const png = join(outDir, 'tiles', `day-${pad(d.day)}.png`);
    writeFileSync(png, await tilePng(d));
    files.push(`tiles/day-${pad(d.day)}.png`);
    const body = d.logPath ? markdown(parseFrontMatter(readFileSync(join(logDir, d.logPath), 'utf8')).body) : '';
    const dir = join(outDir, 'day', pad(d.day));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderDay(d, body, { baseUrl }));
    files.push(`day/${pad(d.day)}/index.html`);
  }
  return { files };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const baseUrl = process.env.BASE_URL || '/31-days-of-good/';
  const { files } = await build({ outDir: join(ROOT, 'site'), calendarPath: join(ROOT, 'data', 'calendar.json'), logDir: join(ROOT, 'log'), baseUrl });
  console.log(`built ${files.length} files to site/`);
}
```

- [ ] **Step 7: Run all tests, then a real build**

Run: `cd site-build && npm test && npm run build && ls ../site ../site/tiles | head`
Expected: all tests pass; `site/index.html`, 31 tiles.

- [ ] **Step 8: Visual check and blind critic**

Open `site/index.html` and `site/day/06/index.html` in the Browser pane (`file://` path). Confirm the grid renders, tiles show SDG colours, dark mode is legible, no horizontal scroll at 375px. Look at `site/tiles/day-06.png`; confirm text rendered (if blank, fonts are missing locally; note it and rely on CI fonts).

Then run the critic loop from `docs/08-article-evaluation.md` once on the tile: hand `site/tiles/day-06.png` and a screenshot of the index to a reviewer subagent that has not seen the code, ask for a 0–10 score on structure, detail, restraint and "obviously AI" patterns, plus the single most valuable change. Apply that change if it is under fifteen minutes; stop at 8/10 or after two iterations. Record the score in the commit message.

- [ ] **Step 9: Commit**

```bash
git add site-build
git commit -m "feat(site): static site build with calendar grid, day pages and tiles

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: CI and Pages deployment for the programme repo

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/pages.yml`

**Interfaces:**
- Produces: site live at `https://marigold-builds.github.io/31-days-of-good/`.

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

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
```

- [ ] **Step 2: Write `.github/workflows/pages.yml`**

```yaml
name: pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: site-build/package-lock.json }
      - run: sudo apt-get update && sudo apt-get install -y fonts-dejavu-core
      - run: npm ci
        working-directory: site-build
      - run: npm run build
        working-directory: site-build
        env: { BASE_URL: /31-days-of-good/ }
      - uses: actions/upload-pages-artifact@v3
        with: { path: site }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Enable Pages with the Actions source, commit, push, watch**

```bash
git add .github
git commit -m "ci: tests and Pages deployment

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
gh api -X POST repos/marigold-builds/31-days-of-good/pages -f build_type=workflow || gh api -X PUT repos/marigold-builds/31-days-of-good/pages -f build_type=workflow
gh run watch --exit-status $(gh run list --workflow=pages --limit 1 --json databaseId --jq '.[0].databaseId')
curl -sI https://marigold-builds.github.io/31-days-of-good/ | head -1
```
Expected: both workflows green; HTTP 200. Open the URL in the Browser pane and confirm the tiles show rendered text.

---

### Task 6: Template repo: Python CLI / library

**Files (in a new directory `/Users/dom/Documents/Coding/marigold-templates/template-python-cli/`):**
- Create: `pyproject.toml`, `src/tool/__init__.py`, `src/tool/cli.py`, `tests/test_cli.py`, `fixtures/README.md`, `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SDG.yml`, `.editorconfig`, `.gitignore`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/ISSUE_TEMPLATE/good-first-issue.md`, `.github/ISSUE_TEMPLATE/steward.md`

**Interfaces:**
- Produces: GitHub template repo `marigold-builds/template-python-cli`. Nightly builds run `gh repo create marigold-builds/<name> --template marigold-builds/template-python-cli --public --clone`, then rename `tool` to the project name.

- [ ] **Step 1: `pyproject.toml`**

```toml
[project]
name = "tool"
version = "0.1.0"
description = "One-line description. Replace."
readme = "README.md"
requires-python = ">=3.11"
license = { text = "MIT" }
dependencies = []

[project.scripts]
tool = "tool.cli:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/tool"]

[dependency-groups]
dev = ["pytest>=8", "ruff>=0.6"]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: Failing test `tests/test_cli.py`**

```python
from tool.cli import main


def test_main_prints_greeting(capsys):
    assert main(["--name", "world"]) == 0
    assert capsys.readouterr().out.strip() == "hello, world"


def test_main_defaults(capsys):
    assert main([]) == 0
    assert capsys.readouterr().out.strip() == "hello, there"
```

- [ ] **Step 3: Run to verify failure**

Run: `cd template-python-cli && uv run --python 3.12 pytest -q`
Expected: ImportError.

- [ ] **Step 4: Implement `src/tool/__init__.py` (empty, with `__version__ = "0.1.0"`) and `src/tool/cli.py`**

```python
"""Command-line entry point. Replace the body; keep main(argv) -> int."""

import argparse
import sys


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="tool", description="One-line description. Replace.")
    parser.add_argument("--name", default="there")
    args = parser.parse_args(argv)
    print(f"hello, {args.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 5: Run tests and lint**

Run: `uv run --python 3.12 pytest -q && uv run --python 3.12 ruff check . && uv run --python 3.12 ruff format --check .`
Expected: 2 passed; ruff clean.

- [ ] **Step 6: Repo furniture**

`fixtures/README.md`:
```markdown
Bundled snapshots of any external data this tool reads, so tests run offline.
Name files `<source>-<YYYY-MM-DD>.<ext>` and record the source URL and licence here.
```

`SDG.yml`:
```yaml
# Which Sustainable Development Goal targets this project serves. Read by the sdg-badge Action.
goals: []        # e.g. [6]
targets: []      # e.g. ["6.2"]
indicators: []   # e.g. ["6.2.1"]
```

`CONTRIBUTING.md`:
```markdown
# Contributing

Thank you. This project was built in one night as part of 31 Days of Good and needs people.

- Issues labelled `good first issue` have enough context to be picked up cold.
- Run `uv run pytest` before opening a pull request; CI runs the same.
- Keep the scope small. If a change needs a design discussion, open an issue first.
- Looking to own this project after October 2026? Open an issue titled "Steward".

By contributing you agree your work is released under the MIT licence.
```

`.editorconfig`:
```
root = true
[*]
indent_style = space
indent_size = 4
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
[*.{yml,yaml,json,md}]
indent_size = 2
```

`.gitignore`:
```
.venv/
__pycache__/
*.pyc
dist/
.pytest_cache/
.ruff_cache/
```

`.github/ISSUE_TEMPLATE/good-first-issue.md`:
```markdown
---
name: Good first issue
about: A small, well-scoped task with enough context to pick up cold
labels: good first issue
---
## What
## Where in the code
## How to test
## Why it matters
```

`.github/ISSUE_TEMPLATE/steward.md`:
```markdown
---
name: Steward
about: Offer to maintain this project after October 2026
labels: steward
title: "Steward"
---
Tell us who you are, why this project matters to you, and roughly how much time you could give it. No commitment yet; this starts a conversation.
```

`README.md`: copy `templates/project-README.md` from the programme repo verbatim, with the quickstart block set to:
```bash
uv tool install git+https://github.com/marigold-builds/<name>
<name> --help
```

`LICENSE`: the MIT text from Task 1.

- [ ] **Step 7: Workflows**

`.github/workflows/ci.yml`:
```yaml
name: ci
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: uv python install 3.12
      - run: uv run pytest -q
      - run: uv run ruff check . && uv run ruff format --check .
```

`.github/workflows/release.yml`:
```yaml
name: release
on:
  push:
    tags: ["v*"]
permissions: { contents: write }
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: uv build
      - run: gh release create "$GITHUB_REF_NAME" dist/* --generate-notes
        env: { GH_TOKEN: "${{ github.token }}" }
```

- [ ] **Step 8: Create the template repo and push**

```bash
git init -b main && git add -A
git commit -m "feat: Python CLI/library template for 31 Days of Good

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
gh repo create marigold-builds/template-python-cli --public --source=. --remote=origin --push --description "Template: Python CLI or library (uv, pytest, ruff) for 31 Days of Good"
gh repo edit marigold-builds/template-python-cli --template
gh run watch --exit-status $(gh run list -R marigold-builds/template-python-cli --limit 1 --json databaseId --jq '.[0].databaseId')
```
Expected: CI green; repo shows "Template" badge.

---

### Task 7: Template repo: static web tool / PWA

**Files (in `/Users/dom/Documents/Coding/marigold-templates/template-web-static/`):**
- Create: `index.html`, `app.js`, `lib/core.js`, `style.css`, `manifest.webmanifest`, `sw.js`, `test/core.test.js`, `package.json`, `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SDG.yml`, `.editorconfig`, `.gitignore`, `fixtures/README.md`, `.github/workflows/ci.yml`, `.github/workflows/pages.yml`, `.github/workflows/release.yml`, issue templates as in Task 6

**Interfaces:**
- Produces: template repo `marigold-builds/template-web-static`; pure logic in `lib/*.js` (tested with `node --test`), DOM wiring in `app.js`, deployed to Pages at `https://marigold-builds.github.io/<name>/`.

- [ ] **Step 1: `package.json`**

```json
{ "name": "web-tool", "private": true, "type": "module", "scripts": { "test": "node --test test/" } }
```

- [ ] **Step 2: Failing test `test/core.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greet } from '../lib/core.js';

test('greet trims and defaults', () => {
  assert.equal(greet('  world '), 'hello, world');
  assert.equal(greet(''), 'hello, there');
});
```

- [ ] **Step 3: Run to verify failure**: `npm test` → cannot find `../lib/core.js`.

- [ ] **Step 4: `lib/core.js`**

```js
// Pure logic lives here so it can be tested without a browser. Replace.
export function greet(name) {
  const n = String(name ?? '').trim();
  return `hello, ${n || 'there'}`;
}
```

- [ ] **Step 5: Run tests**: `npm test` → 1 passing.

- [ ] **Step 6: Page files**

`index.html`:
```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Tool name</title>
<link rel="stylesheet" href="style.css">
<link rel="manifest" href="manifest.webmanifest">
</head>
<body>
<header>
  <h1>Tool name</h1>
  <p class="lede">One sentence: what it does, for whom.</p>
</header>
<main>
  <form id="form">
    <label for="name">Name</label>
    <input id="name" name="name" autocomplete="off">
    <button type="submit">Go</button>
  </form>
  <output id="out" for="name" aria-live="polite"></output>
</main>
<footer>
  <p>Built by Marigold Builds (Claude), directed by Dom, for <a href="https://marigold-builds.github.io/31-days-of-good/">31 Days of Good</a>. Works offline. No data leaves your device.</p>
</footer>
<script type="module" src="app.js"></script>
</body>
</html>
```

`app.js`:
```js
import { greet } from './lib/core.js';

const form = document.getElementById('form');
const out = document.getElementById('out');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  out.textContent = greet(new FormData(form).get('name'));
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
```

`style.css`:
```css
:root { --ink: #111; --bg: #fff; --muted: #555; --accent: #F4A300; }
@media (prefers-color-scheme: dark) { :root { --ink: #f2f2f2; --bg: #121212; --muted: #b5b5b5; } }
body { margin: 0 auto; max-width: 720px; padding: 24px 20px; font: 18px/1.5 system-ui, sans-serif; color: var(--ink); background: var(--bg); }
header { border-top: 8px solid var(--accent); padding-top: 24px; }
.lede { color: var(--muted); }
label { display: block; font-weight: 700; margin-top: 16px; }
input, button { font: inherit; padding: 10px 12px; margin-top: 6px; }
input { width: 100%; max-width: 420px; }
button { background: var(--ink); color: var(--bg); border: 0; border-radius: 6px; cursor: pointer; }
output { display: block; margin-top: 16px; font-size: 1.3rem; }
footer { margin-top: 48px; color: var(--muted); font-size: .9rem; }
```

`manifest.webmanifest`:
```json
{ "name": "Tool name", "short_name": "Tool", "start_url": "./", "display": "standalone", "background_color": "#ffffff", "theme_color": "#F4A300", "icons": [] }
```

`sw.js`:
```js
const CACHE = 'tool-v1';
const ASSETS = ['./', './index.html', './app.js', './lib/core.js', './style.css', './manifest.webmanifest'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))));
self.addEventListener('fetch', (e) => e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request))));
```

`.gitignore`: `node_modules/` and `.DS_Store`. `.editorconfig`: as Task 6 with `indent_size = 2`. `fixtures/README.md`, `SDG.yml`, `CONTRIBUTING.md` (replace `uv run pytest` with `npm test`), `LICENSE`, issue templates: as Task 6. `README.md`: `templates/project-README.md` with quickstart:
```bash
git clone https://github.com/marigold-builds/<name>
cd <name> && python3 -m http.server 8000   # then open http://localhost:8000
```
plus a line "Or use the hosted copy: https://marigold-builds.github.io/<name>/".

**Superseded:** final review Important 5 (BOARD Decided 14 overturning O11) — the `sw.js` and `app.js` above are cache-first with no `.catch`, so a returning visitor never sees a fix and an offline cache miss surfaces an unhandled rejection; `manifest.webmanifest` also ships no icons. Every clone of `template-web-static` inherited this. The parallel template-repo fix wave addresses it there (network-first navigation with a cached-index fallback, `.catch` on both, a version-derived cache name, at least one icon); this plan's code sample is left as written for the historical record.

- [ ] **Step 7: Workflows**

`.github/workflows/ci.yml`:
```yaml
name: ci
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm test
```

`.github/workflows/pages.yml`:
```yaml
name: pages
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-pages-artifact@v3
        with: { path: . }
      - id: deployment
        uses: actions/deploy-pages@v4
```

`.github/workflows/release.yml`:
```yaml
name: release
on: { push: { tags: ["v*"] } }
permissions: { contents: write }
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: zip -r "site-$GITHUB_REF_NAME.zip" . -x ".git/*" "node_modules/*" ".github/*"
      - run: gh release create "$GITHUB_REF_NAME" "site-$GITHUB_REF_NAME.zip" --generate-notes
        env: { GH_TOKEN: "${{ github.token }}" }
```

- [ ] **Step 8: Create template repo, push, verify Pages**

```bash
git init -b main && git add -A
git commit -m "feat: static web tool / PWA template for 31 Days of Good

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
gh repo create marigold-builds/template-web-static --public --source=. --remote=origin --push --description "Template: offline-first static web tool (no framework, node:test, Pages) for 31 Days of Good"
gh repo edit marigold-builds/template-web-static --template
gh api -X POST repos/marigold-builds/template-web-static/pages -f build_type=workflow
gh run watch --exit-status $(gh run list -R marigold-builds/template-web-static --workflow=pages --limit 1 --json databaseId --jq '.[0].databaseId')
curl -sI https://marigold-builds.github.io/template-web-static/ | head -1
```
Expected: 200. Open in the Browser pane; submit the form; see "hello, …".

---

### Task 8: Template repo: Node GitHub Action

**Files (in `/Users/dom/Documents/Coding/marigold-templates/template-node-action/`):**
- Create: `action.yml`, `src/main.js`, `src/lib.js`, `test/lib.test.js`, `package.json`, `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SDG.yml`, `.editorconfig`, `.gitignore`, `fixtures/README.md`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, issue templates as in Task 6

**Interfaces:**
- Produces: template repo `marigold-builds/template-node-action`. Actions are dependency-free (`node20` runtime, reads inputs from `INPUT_*` env, writes outputs to `$GITHUB_OUTPUT`) so no bundling step is needed.

- [ ] **Step 1: `package.json`**

```json
{ "name": "action", "private": true, "type": "module", "scripts": { "test": "node --test test/" } }
```

- [ ] **Step 2: Failing test `test/lib.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getInput, run } from '../src/lib.js';

test('getInput reads INPUT_ env with dashes to underscores', () => {
  assert.equal(getInput('who', { INPUT_WHO: 'x' }), 'x');
  assert.equal(getInput('who-else', { INPUT_WHO_ELSE: 'y' }), 'y');
  assert.equal(getInput('missing', {}), '');
});

test('run returns outputs from inputs', () => {
  assert.deepEqual(run({ who: 'world' }), { greeting: 'hello, world' });
  assert.deepEqual(run({ who: '' }), { greeting: 'hello, there' });
});
```

- [ ] **Step 3: Run to verify failure**: `npm test` → cannot find module.

- [ ] **Step 4: `src/lib.js` and `src/main.js`**

`src/lib.js`:
```js
export function getInput(name, env = process.env) {
  return (env[`INPUT_${name.replace(/-/g, '_').toUpperCase()}`] ?? '').trim();
}

// Pure: inputs object in, outputs object out. Replace.
export function run(inputs) {
  return { greeting: `hello, ${inputs.who || 'there'}` };
}
```

`src/main.js`:
```js
import { appendFileSync } from 'node:fs';
import { getInput, run } from './lib.js';

const outputs = run({ who: getInput('who') });
for (const [k, v] of Object.entries(outputs)) {
  console.log(`${k}=${v}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
}
```

`action.yml`:
```yaml
name: "Tool name"
description: "One line. Replace."
author: "Marigold Builds"
inputs:
  who:
    description: "Example input"
    required: false
    default: "there"
outputs:
  greeting:
    description: "Example output"
runs:
  using: "node20"
  main: "src/main.js"
branding:
  icon: "sun"
  color: "orange"
```

**Superseded:** final review Important 6 — `node20` was already deprecated when this plan was written (GitHub forces `node20` actions onto the Node 24 runner with a warning today, and will fail them once forcing stops). The parallel template-repo fix wave changes this to `using: "node24"`, with `actions/checkout` and `actions/setup-node` bumped to v5; this plan's code sample is left as written for the historical record.

- [ ] **Step 5: Run tests**: `npm test` → 2 passing. Then a smoke run: `INPUT_WHO=ci node src/main.js` prints `greeting=hello, ci`.

- [ ] **Step 6: Furniture** as Task 7 (`.gitignore`, `.editorconfig`, `fixtures/README.md`, `SDG.yml`, `CONTRIBUTING.md` with `npm test`, `LICENSE`, issue templates). `README.md` from `templates/project-README.md` with quickstart:
```yaml
- uses: marigold-builds/<name>@v0.1.0
  with:
    who: world
```

- [ ] **Step 7: Workflows**

`.github/workflows/ci.yml`:
```yaml
name: ci
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm test
  self-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - id: act
        uses: ./
        with: { who: ci }
      - run: test "${{ steps.act.outputs.greeting }}" = "hello, ci"
```

`.github/workflows/release.yml`:
```yaml
name: release
on: { push: { tags: ["v*"] } }
permissions: { contents: write }
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: gh release create "$GITHUB_REF_NAME" --generate-notes
        env: { GH_TOKEN: "${{ github.token }}" }
```

- [ ] **Step 8: Create template repo, push, verify CI**

```bash
git init -b main && git add -A
git commit -m "feat: dependency-free Node GitHub Action template for 31 Days of Good

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
gh repo create marigold-builds/template-node-action --public --source=. --remote=origin --push --description "Template: dependency-free Node 20 GitHub Action for 31 Days of Good"
gh repo edit marigold-builds/template-node-action --template
gh run watch --exit-status $(gh run list -R marigold-builds/template-node-action --limit 1 --json databaseId --jq '.[0].databaseId')
```
Expected: both jobs green including `self-test`.

---

### Task 9: Org profile

**Files (in `/Users/dom/Documents/Coding/marigold-templates/dot-github/`):**
- Create: `profile/README.md`

- [ ] **Step 1: Write `profile/README.md`**

```markdown
# Marigold Builds

One small open-source tool a night for the UN Sustainable Development Goals, 1–31 October 2026. The programme is called **31 Days of Good**.

**Calendar and daily log:** https://marigold-builds.github.io/31-days-of-good/

Marigold Builds is Claude, an AI model by Anthropic, directed and reviewed by Dom. Every project here was researched, built and documented by Marigold overnight, in one session. Dom sets the calendar, can veto each brief, merges every day's posts before they go out, and is accountable for what ships.

Every project ships with tests, a README a stranger can follow, an MIT licence, a bundled data snapshot so tests run offline, good-first-issues, and an open call for a steward to own it after October. Templates the nightly builds start from: `template-python-cli`, `template-web-static`, `template-node-action`.

We never open pull requests into other people's repositories as part of this programme. Issues and pull requests here are answered within a day during October.
```

- [ ] **Step 2: Create and push**

```bash
git init -b main && git add -A
git commit -m "docs: org profile with disclosure

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
gh repo create marigold-builds/.github --public --source=. --remote=origin --push --description "Org profile"
```
Expected: https://github.com/marigold-builds shows the profile README.

---

### Task 10: Close the loop in the programme docs

**Files:**
- Modify: `docs/06-preparation-plan.md` (tick scaffold and site items), `README.md` (add site URL and templates), `docs/02-daily-process.md` (scaffold step names the template command)

- [ ] **Step 1: Edit the docs**

In `docs/06-preparation-plan.md` week 2, tick "Project scaffold template repo" and "Programme site" and add the three template names and the site URL. In `README.md` add under Status: "Site: https://marigold-builds.github.io/31-days-of-good/ · Templates: template-python-cli, template-web-static, template-node-action". In `docs/02-daily-process.md` Develop step 1 replace "Repo from the project template" with "Repo from the matching template (`gh repo create marigold-builds/<name> --template marigold-builds/template-<kind> --public --clone`)".

- [ ] **Step 2: Rebuild the site locally, run tests, commit, push, confirm Pages redeploys**

```bash
cd site-build && npm test && cd ..
git add -A
git commit -m "docs: record scaffolds and site in the preparation plan

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
```
