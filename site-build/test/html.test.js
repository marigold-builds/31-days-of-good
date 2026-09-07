import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderIndex, renderDay, DISCLOSURE } from '../lib/html.js';

const IDENTITY_DOC = join(import.meta.dirname, '..', '..', 'docs', '04-identity.md');

// A day whose SDG is known (chosen during that night's own research and
// recorded in its log) but whose name has not been written yet - a
// realistic in-progress state now that data/calendar.json carries no SDG
// (Decided 21).
const sdgKnownDay = { day: 2, date: '2026-10-02', sdg: [16], sdgTitle: 'Peace, Justice and Strong Institutions',
  observance: 'International Day of Non-Violence',
  name: null, tagline: null, status: 'planned', repo: null, demo: null, logPath: null };

// A day with no log at all: nothing has been chosen yet, not even the SDG.
const unbuiltDay = { day: 5, date: '2026-10-05', sdg: null, sdgTitle: null, observance: null,
  name: null, tagline: null, status: 'planned', repo: null, demo: null, logPath: null };

const shippedDay = { day: 2, date: '2026-10-02', sdg: [16], sdgTitle: 'Peace, Justice and Strong Institutions',
  observance: 'International Day of Non-Violence', name: 'foia-draft', tagline: 'FOI requests.',
  status: 'shipped', repo: 'https://github.com/marigold-builds/foia-draft', demo: 'https://example.org/', logPath: '2026-10-02.md' };

test('renderIndex lists a day with a known SDG as a tile in that SDG colour, status hidden while planned', () => {
  const html = renderIndex([sdgKnownDay], { baseUrl: '/31-days-of-good/' });
  assert.match(html, /<title>31 Days of Good<\/title>/);
  assert.match(html, /href="\/31-days-of-good\/day\/02\/"/);
  assert.match(html, /--sdg:#00689D/);
  assert.match(html, /data-status="planned"/);
  assert.ok(html.includes(DISCLOSURE));
  assert.ok(!html.includes('class="status"'));
});

// The card, title and description for a night nobody has worked yet must
// say plainly that nothing is chosen - never invent a name, an SDG or a
// description (Decided 21).
test('renderIndex renders an unbuilt day honestly: no invented SDG, name or colour', () => {
  const html = renderIndex([unbuiltDay], { baseUrl: '/31-days-of-good/' });
  assert.match(html, /--sdg:#F4A300/); // the marigold identity colour, not an SDG colour
  assert.match(html, /SDG not yet chosen/);
  assert.match(html, /Not yet chosen/);
  assert.ok(!html.includes('foia-draft'));
  assert.ok(!html.includes('Static tool')); // the old archetype fallback text
});

test('renderIndex shows a status label for a shipped day but not a planned one', () => {
  const html = renderIndex([sdgKnownDay, shippedDay], { baseUrl: '/31-days-of-good/' });
  assert.ok(!html.includes('class="status">Planned'));
  assert.match(html, /class="status">Shipped</);
});

test('renderDay shows tile image, observance, links and body', () => {
  const html = renderDay(shippedDay, '<p>brief</p>', { baseUrl: '/31-days-of-good/' });
  assert.match(html, /<title>Day 2 · foia-draft · 31 Days of Good<\/title>/);
  assert.match(html, /tiles\/day-02\.png/);
  assert.match(html, /International Day of Non-Violence/);
  assert.match(html, /href="https:\/\/github.com\/marigold-builds\/foia-draft"/);
  assert.match(html, /<p>brief<\/p>/);
  assert.match(html, /og:image/);
});

// The day page, its <title>, <h1>, og tags and image alt text must not
// assert a goal or description for a night nobody has worked yet.
test('renderDay renders an unbuilt day honestly on every surface', () => {
  const html = renderDay(unbuiltDay, '', { baseUrl: '/31-days-of-good/', siteOrigin: 'https://example.org' });
  assert.match(html, /<title>Day 5 · Not yet chosen · 31 Days of Good<\/title>/);
  assert.match(html, /<h1>Not yet chosen<\/h1>/);
  assert.match(html, /SDG not yet chosen/);
  assert.match(html, /og:title" content="Day 5 · Not yet chosen · 31 Days of Good"/);
  assert.match(html, /alt="Day 5 of 31 Days of Good\. SDG not yet chosen\. Not yet chosen: [^"]*"/);
  assert.ok(!html.includes('foia-draft'));
});

test('renderDay escapes user text', () => {
  const html = renderDay({ ...shippedDay, tagline: '<script>' }, '', { baseUrl: '/' });
  assert.ok(!html.includes('<script>'));
});

test('renderDay makes og:image an absolute URL when siteOrigin is given', () => {
  const html = renderDay(sdgKnownDay, '', { baseUrl: '/31-days-of-good/', siteOrigin: 'https://example.org' });
  assert.match(html, /content="https:\/\/example\.org\/31-days-of-good\/tiles\/day-02\.png"/);
});

test('renderIndex includes Open Graph tags and a meta description', () => {
  const html = renderIndex([sdgKnownDay], { baseUrl: '/31-days-of-good/', siteOrigin: 'https://example.org' });
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<meta property="og:title" content="[^"]+">/);
  assert.match(html, /<meta property="og:description" content="[^"]+">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/example\.org\/31-days-of-good\/tiles\/day-02\.png">/);
});

function decodeEntities(s) {
  return s.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

test('DISCLOSURE matches the fixed wording in docs/04-identity.md', () => {
  const doc = readFileSync(IDENTITY_DOC, 'utf8');
  const line = doc.split('\n').find((l) => l.trim().startsWith('> Marigold Builds is Claude'));
  assert.ok(line, 'disclosure blockquote not found in docs/04-identity.md');
  const docText = line.trim().replace(/^>\s*/, '');
  assert.equal(decodeEntities(DISCLOSURE), docText);
});
