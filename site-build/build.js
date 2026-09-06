import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDays, parseFrontMatter } from './lib/days.js';
import { tilePng, escapeXml as esc } from './lib/tile.js';
import { renderIndex, renderDay } from './lib/html.js';

const HERE = import.meta.dirname;
const ROOT = join(HERE, '..');
const pad = (n) => String(n).padStart(2, '0');

const BULLET_RE = /^\s*[-*]\s+/;
const ORDERED_RE = /^\s*\d+\.\s+/;
const BLOCKQUOTE_RE = /^\s*>\s?/;
const HR_RE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
const BLOCK_START_RE = /^(#{1,6}\s|```|\s*[-*]\s|\s*\d+\.\s|\s*>\s?|\s*(-{3,}|\*{3,}|_{3,})\s*$)/;

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/!\[(.*?)\]\((https?:[^)\s]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[(.+?)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
}

// A paragraph's source lines are joined with a hard break rather than a
// space. The programme's own templates (templates/daily-brief.md,
// templates/retro.md) rely on this: e.g. "**Status:** ...\n**Repo:** ..."
// is two facts on two lines with no blank line between, not one wrapped
// sentence, and is meant to render as two lines.
function paragraph(linesOfText) {
  return `<p>${linesOfText.map(inline).join('<br>\n')}</p>`;
}

function listItemText(raw) {
  const task = /^\[([ xX])\]\s+(.*)$/.exec(raw);
  if (task) return `<input type="checkbox" disabled${task[1] === ' ' ? '' : ' checked'}> ${inline(task[2])}`;
  return inline(raw);
}

function isTableSeparator(line) {
  const t = line.trim();
  return t.includes('|') && /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/.test(t);
}

function splitTableRow(line) {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  return t.split('|').map((c) => c.trim());
}

function isTableStart(lines, i) {
  return lines[i].includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]);
}

export function markdown(md) {
  const out = [];
  const lines = md.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (HR_RE.test(line)) { out.push('<hr>'); i++; continue; }
    if (BLOCKQUOTE_RE.test(line)) {
      const buf = [];
      while (i < lines.length && BLOCKQUOTE_RE.test(lines[i])) buf.push(lines[i++].replace(BLOCKQUOTE_RE, ''));
      out.push(`<blockquote>${paragraph(buf)}</blockquote>`);
      continue;
    }
    if (isTableStart(lines, i)) {
      const header = splitTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() !== '' && lines[i].includes('|')) rows.push(splitTableRow(lines[i++]));
      const thead = `<thead><tr>${header.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }
    if (BULLET_RE.test(line)) {
      const items = [];
      while (i < lines.length && BULLET_RE.test(lines[i])) items.push(`<li>${listItemText(lines[i].replace(BULLET_RE, ''))}</li>`), i++;
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (ORDERED_RE.test(line)) {
      const items = [];
      while (i < lines.length && ORDERED_RE.test(lines[i])) items.push(`<li>${listItemText(lines[i].replace(ORDERED_RE, ''))}</li>`), i++;
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }
    if (line.trim() === '') { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() !== '' && !BLOCK_START_RE.test(lines[i]) && !isTableStart(lines, i)) para.push(lines[i++]);
    out.push(paragraph(para));
  }
  return out.join('\n');
}

export async function build({ outDir, calendarPath, logDir, baseUrl, siteOrigin = '' }) {
  const days = loadDays({ calendarPath, logDir });
  const files = [];
  mkdirSync(join(outDir, 'tiles'), { recursive: true });
  copyFileSync(join(HERE, 'static', 'style.css'), join(outDir, 'style.css'));
  files.push('style.css');
  writeFileSync(join(outDir, 'index.html'), renderIndex(days, { baseUrl, siteOrigin }));
  files.push('index.html');
  for (const d of days) {
    const png = join(outDir, 'tiles', `day-${pad(d.day)}.png`);
    writeFileSync(png, await tilePng(d));
    files.push(`tiles/day-${pad(d.day)}.png`);
    const body = d.logPath ? markdown(parseFrontMatter(readFileSync(join(logDir, d.logPath), 'utf8')).body) : '';
    const dir = join(outDir, 'day', pad(d.day));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderDay(d, body, { baseUrl, siteOrigin }));
    files.push(`day/${pad(d.day)}/index.html`);
  }
  return { files };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseUrl = process.env.BASE_URL || '/31-days-of-good/';
  const siteOrigin = process.env.SITE_ORIGIN || 'https://marigold-builds.github.io';
  const { files } = await build({ outDir: join(ROOT, 'site'), calendarPath: join(ROOT, 'data', 'calendar.json'), logDir: join(ROOT, 'log'), baseUrl, siteOrigin });
  console.log(`built ${files.length} files to site/`);
}
