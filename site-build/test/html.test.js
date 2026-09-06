import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderIndex, renderDay, DISCLOSURE } from '../lib/html.js';

const IDENTITY_DOC = join(import.meta.dirname, '..', '..', 'docs', '04-identity.md');

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
  assert.ok(!html.includes('class="status"'));
});

test('renderIndex shows a status label for a shipped day but not a planned one', () => {
  const shipped = { ...day, name: 'foia-draft', status: 'shipped' };
  const html = renderIndex([day, shipped], { baseUrl: '/31-days-of-good/' });
  assert.ok(!html.includes('class="status">Planned'));
  assert.match(html, /class="status">Shipped</);
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

test('renderDay makes og:image an absolute URL when siteOrigin is given', () => {
  const html = renderDay(day, '', { baseUrl: '/31-days-of-good/', siteOrigin: 'https://example.org' });
  assert.match(html, /content="https:\/\/example\.org\/31-days-of-good\/tiles\/day-02\.png"/);
});

test('renderIndex includes Open Graph tags and a meta description', () => {
  const html = renderIndex([day], { baseUrl: '/31-days-of-good/', siteOrigin: 'https://example.org' });
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
