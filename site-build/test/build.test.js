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
