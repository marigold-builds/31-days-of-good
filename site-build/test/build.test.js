import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, markdown } from '../build.js';

const CAL = join(import.meta.dirname, '..', '..', 'data', 'calendar.json');
const TEMPLATES = join(import.meta.dirname, '..', '..', 'templates');

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

// Decided 21: data/calendar.json carries only day and date, so every day
// without a log (days 2-31 here) must build cleanly and render as honestly
// unchosen end to end, not crash on a missing SDG and not invent a name.
test('build renders an unbuilt day (no log, no SDG) honestly on its card and its own page', async () => {
  const outDir = mkdtempSync(join(tmpdir(), 'site-'));
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  await build({ outDir, calendarPath: CAL, logDir, baseUrl: '/' });
  const index = readFileSync(join(outDir, 'index.html'), 'utf8');
  assert.match(index, /Not yet chosen/);
  assert.match(index, /SDG not yet chosen/);
  const day2 = readFileSync(join(outDir, 'day', '02', 'index.html'), 'utf8');
  assert.match(day2, /<h1>Not yet chosen<\/h1>/);
  assert.match(day2, /SDG not yet chosen/);
});

test('markdown renders the real daily-brief template with a table and an ordered list', () => {
  const html = markdown(readFileSync(join(TEMPLATES, 'daily-brief.md'), 'utf8'));
  assert.match(html, /<table>[\s\S]*<th>Source<\/th>[\s\S]*<\/table>/);
  assert.match(html, /<ol>[\s\S]*<li>Drop: &lt;nice-to-have&gt;<\/li>[\s\S]*<\/ol>/);
  // the four **Key:** metadata lines at the top must stay on separate lines, not merge into one paragraph
  assert.match(html, /<strong>Project name:<\/strong>[^<]*<br>\s*<strong>One sentence:<\/strong>/);
});

test('markdown renders the real retro template with a table and keeps status/repo lines separate', () => {
  const html = markdown(readFileSync(join(TEMPLATES, 'retro.md'), 'utf8'));
  assert.match(html, /<table>[\s\S]*<th>Phase<\/th>[\s\S]*<\/table>/);
  assert.match(html, /<strong>Status:<\/strong>[^<]*<br>\s*<strong>Repo:<\/strong>/);
  // The template's literal "<link>" placeholder must come through
  // entity-escaped, not as a real (void) <link> element - otherwise it
  // would render invisibly instead of as the placeholder text a builder
  // is meant to replace.
  assert.match(html, /&lt;link&gt;/);
  assert.doesNotMatch(html, /<link>/);
});
