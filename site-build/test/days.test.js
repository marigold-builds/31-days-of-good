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
