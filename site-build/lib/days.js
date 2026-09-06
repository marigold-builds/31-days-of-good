import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { wrap, TITLE_WRAP_MAX_CHARS, TITLE_MAX_LINES } from './wrap.js';

const ROOT = join(import.meta.dirname, '..', '..');
export const SDGS = JSON.parse(readFileSync(join(ROOT, 'data', 'sdgs.json'), 'utf8'));
const STATUSES = new Set(['planned', 'shipped', 'partial', 'missed']);
const LOG_FILENAME = /^(\d{4})-(\d{2})-(\d{2})\.md$/;
const HTTPS_URL = /^https:\/\//;

function unquote(v) {
  if (v.length >= 2) {
    const first = v[0], last = v[v.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) return v.slice(1, -1);
  }
  return v;
}

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

function blankToNull(v) { return v === undefined || v === '' ? null : v; }

function checkUrl(value, label, filename) {
  if (value === undefined || value === '') return;
  if (!HTTPS_URL.test(value)) {
    throw new Error(`Log file "${filename}": ${label} "${value}" must be a full https:// URL`);
  }
}

export function loadDays({ calendarPath, logDir }) {
  const calendar = JSON.parse(readFileSync(calendarPath, 'utf8'));
  const dateByDay = new Map(calendar.map((entry) => [entry.day, entry.date]));
  const logs = new Map();
  if (existsSync(logDir)) {
    // Sorted so processing order (and therefore which of two colliding
    // files is reported as the original vs. the duplicate) is deterministic
    // across filesystems.
    for (const f of readdirSync(logDir).sort()) {
      if (f === 'README.md') continue;
      if (!f.endsWith('.md')) continue;
      const match = LOG_FILENAME.exec(f);
      if (!match) throw new Error(`Log file "${f}" is not named YYYY-MM-DD.md`);
      const filenameDate = `${match[1]}-${match[2]}-${match[3]}`;
      const { meta } = parseFrontMatter(readFileSync(join(logDir, f), 'utf8'));

      const rawDay = meta.day;
      const day = Number(rawDay);
      if (rawDay === undefined || rawDay === '' || !Number.isInteger(day) || day < 1 || day > 31) {
        throw new Error(`Log file "${f}": front matter "day" must be a whole number from 1 to 31, got ${JSON.stringify(rawDay)}`);
      }

      if (logs.has(day)) {
        throw new Error(`Day ${day} is claimed twice: "${logs.get(day).logPath}" and "${f}"`);
      }

      const expectedDate = dateByDay.get(day);
      if (expectedDate && expectedDate !== filenameDate) {
        throw new Error(`Log file "${f}": filename date does not match calendar.json's date "${expectedDate}" for day ${day}`);
      }

      if (meta.name) {
        // Run the name through the exact wrap() the tile renderer uses
        // (lib/tile.js's layoutTitle), rather than a character count: a
        // count cannot tell whether a multi-word name will actually wrap
        // to fit, only whether it's short. Two 10-character words plus a
        // space is 21 characters and wraps to two lines fine; three
        // 10-character words is 32 characters — comfortably under a naive
        // 40-character cap — but needs three lines and would have its
        // third word silently dropped by the renderer.
        const titleLines = wrap(meta.name, TITLE_WRAP_MAX_CHARS);
        if (titleLines.length > TITLE_MAX_LINES) {
          throw new Error(`Log file "${f}": day ${day} name "${meta.name}" needs ${titleLines.length} lines to fit the tile at ${TITLE_WRAP_MAX_CHARS} characters per line (max ${TITLE_MAX_LINES}); shorten it`);
        }
      }
      checkUrl(meta.repo, 'repo', f);
      checkUrl(meta.demo, 'demo', f);

      logs.set(day, { ...meta, logPath: f });
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
