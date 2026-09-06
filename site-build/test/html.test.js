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
