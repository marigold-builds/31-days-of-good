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
