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
