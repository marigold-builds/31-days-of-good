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

// Decided 21: data/calendar.json carries only day and date, so a day with
// no log has no SDG - it has not been chosen yet. loadDays must not invent
// one, and sdgTitle must not be computed from a non-existent sdg.
test('loadDays returns 31 planned days with no SDG, name or observance when log is empty', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  const days = loadDays({ calendarPath: CAL, logDir });
  assert.equal(days.length, 31);
  assert.equal(days[0].status, 'planned');
  assert.equal(days[0].sdg, null);
  assert.equal(days[0].sdgTitle, null);
  assert.equal(days[0].observance, null);
  assert.equal(days[0].name, null);
  assert.equal(days[0].tagline, null);
  assert.equal(days[0].day, 1);
  assert.equal(days[0].date, '2026-10-01');
});

test('loadDays merges a log entry by day number, including its SDG and observance', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-01.md'),
    '---\nday: 1\nname: sdg-badge\ntagline: A badge.\nsdg: 17\nobservance: International Day of Older Persons\nstatus: shipped\nrepo: https://github.com/marigold-builds/sdg-badge\ndemo:\n---\nbody');
  const days = loadDays({ calendarPath: CAL, logDir });
  assert.equal(days[0].name, 'sdg-badge');
  assert.deepEqual(days[0].sdg, [17]);
  assert.equal(days[0].sdgTitle, 'Partnerships for the Goals');
  assert.equal(days[0].observance, 'International Day of Older Persons');
  assert.equal(days[0].status, 'shipped');
  assert.equal(days[0].demo, null);
  assert.equal(days[0].logPath, '2026-10-01.md');
});

test('loadDays parses a multi-SDG log entry and joins their titles', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-31.md'), '---\nday: 31\nsdg: 11,17\nstatus: shipped\n---\nbody');
  const days = loadDays({ calendarPath: CAL, logDir });
  assert.deepEqual(days[30].sdg, [11, 17]);
  assert.equal(days[30].sdgTitle, 'Sustainable Cities and Communities + Partnerships for the Goals');
});

test('loadDays rejects an sdg number outside 1-17', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-01.md'), '---\nday: 1\nsdg: 18\nstatus: shipped\n---\nbody');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /sdg/);
});

test('loadDays rejects a non-numeric sdg', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-01.md'), '---\nday: 1\nsdg: seventeen\nstatus: shipped\n---\nbody');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /sdg/);
});

test('loadDays rejects an unknown status', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-02.md'), '---\nday: 2\nstatus: done\n---\n');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /status/);
});

test('loadDays ignores README.md in the log directory', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, 'README.md'), '# Daily log\nOne file per night, `YYYY-MM-DD.md`.\n');
  const days = loadDays({ calendarPath: CAL, logDir });
  assert.equal(days.length, 31);
  assert.equal(days[0].status, 'planned');
});

test('loadDays throws on a log file not named YYYY-MM-DD.md', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, 'day-3.md'), '---\nday: 3\nstatus: shipped\n---\nbody');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /YYYY-MM-DD/);
});

test('loadDays throws when day is missing from front matter', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-04.md'), '---\nstatus: shipped\n---\nbody');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /day/);
});

test('loadDays throws when the day key is capitalised', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-05.md'), '---\nDay: 5\nstatus: shipped\n---\nbody');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /day/);
});

test('loadDays throws when day is non-numeric', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-06.md'), '---\nday: six\nstatus: shipped\n---\nbody');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /day/);
});

test('loadDays throws when day is out of the 1-31 range', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-07.md'), '---\nday: 32\nstatus: shipped\n---\nbody');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /day/);
});

test('loadDays throws when two logs claim the same day', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-08.md'), '---\nday: 8\nstatus: shipped\n---\nbody');
  writeFileSync(join(logDir, '2026-10-09.md'), '---\nday: 8\nstatus: shipped\n---\nbody');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /twice|already|duplicate/);
});

test('loadDays throws when the filename date disagrees with calendar.json for that day', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  // day 1's date in calendar.json is 2026-10-01, not 2026-10-09
  writeFileSync(join(logDir, '2026-10-09.md'), '---\nday: 1\nstatus: shipped\n---\nbody');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /date/);
});

test('loadDays rejects a repo or demo URL that is not https', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-10.md'), '---\nday: 10\nstatus: shipped\nrepo: github.com/marigold-builds/x\n---\nbody');
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /https/);
});

test('loadDays strips one matching pair of surrounding quotes from a front-matter value', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-11.md'), '---\nday: 11\nname: "walkshed"\nstatus: shipped\n---\nbody');
  const days = loadDays({ calendarPath: CAL, logDir });
  assert.equal(days[10].name, 'walkshed');
});

test('parseFrontMatter handles CRLF line endings', () => {
  const { meta, body } = parseFrontMatter('---\r\nday: 3\r\nname: med-times\r\n---\r\n# Brief\r\n');
  assert.equal(meta.day, '3');
  assert.equal(meta.name, 'med-times');
  assert.equal(body.trim(), '# Brief');
});

test('SDGS has 17 entries with colours', () => {
  assert.equal(Object.keys(SDGS).length, 17);
  assert.match(SDGS[6].colour, /^#[0-9A-F]{6}$/);
});

test('loadDays throws when name is longer than the tile can carry', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  writeFileSync(join(logDir, '2026-10-12.md'), `---\nday: 12\nname: ${'x'.repeat(41)}\nstatus: shipped\n---\nbody`);
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /name/);
});

// Re-reviewer's reproduction: a 32-character, three-word name that is well
// under any plausible character cap (the old NAME_MAX_LENGTH was 40) but
// needs three wrapped lines at 20 characters each, so the tile renderer
// used to drop its third word silently. Validation must run the real
// wrap() instead of counting characters, so this is rejected at build time.
test('loadDays rejects a multi-word name that needs three wrapped lines, even though it is under 40 characters', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  const name = 'aaaaaaaaaa bbbbbbbbbb cccccccccc'; // 32 chars, three 10-char words
  assert.equal(name.length, 32);
  writeFileSync(join(logDir, '2026-10-13.md'), `---\nday: 13\nname: ${name}\nstatus: shipped\n---\nbody`);
  assert.throws(() => loadDays({ calendarPath: CAL, logDir }), /name|lines/);
});

test('loadDays accepts a multi-word name that wraps to exactly two lines', () => {
  const logDir = mkdtempSync(join(tmpdir(), 'log-'));
  const name = 'aaaaaaaaaa bbbbbbbbbb'; // 21 chars, two 10-char words - wraps to exactly two lines
  writeFileSync(join(logDir, '2026-10-14.md'), `---\nday: 14\nname: ${name}\nstatus: shipped\n---\nbody`);
  const days = loadDays({ calendarPath: CAL, logDir });
  assert.equal(days[13].name, name);
});

test('every SDG colour is a valid 6-digit hex code', () => {
  for (const [n, sdg] of Object.entries(SDGS)) {
    assert.match(sdg.colour, /^#[0-9A-F]{6}$/, `SDG ${n} colour "${sdg.colour}"`);
  }
  assert.equal(Object.keys(SDGS).length, 17);
});
