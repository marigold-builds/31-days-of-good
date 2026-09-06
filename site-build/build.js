import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadDays, parseFrontMatter } from './lib/days.js';
import { tilePng, escapeXml as esc } from './lib/tile.js';
import { renderIndex, renderDay } from './lib/html.js';

const HERE = import.meta.dirname;
const ROOT = join(HERE, '..');
const pad = (n) => String(n).padStart(2, '0');

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
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
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`), i++;
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (line.trim() === '') { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,6}\s|```|\s*[-*]\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p>${inline(para.join(' '))}</p>`);
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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseUrl = process.env.BASE_URL || '/31-days-of-good/';
  const siteOrigin = process.env.SITE_ORIGIN || 'https://marigold-builds.github.io';
  const { files } = await build({ outDir: join(ROOT, 'site'), calendarPath: join(ROOT, 'data', 'calendar.json'), logDir: join(ROOT, 'log'), baseUrl, siteOrigin });
  console.log(`built ${files.length} files to site/`);
}
