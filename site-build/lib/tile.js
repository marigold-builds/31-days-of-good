import { Resvg } from '@resvg/resvg-js';
import { SDGS } from './days.js';

const MARIGOLD = '#F4A300';
const FONT = 'system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

export function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function wrap(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) { lines.push(line); line = w; }
    else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

const STATUS_LABEL = { planned: 'Planned', shipped: 'Shipped', partial: 'Shipped, reduced scope', missed: 'Missed' };

export function tileSvg(day) {
  const colour = SDGS[day.sdg[0]].colour;
  const title = day.name || day.seed;
  const tagline = day.tagline || (day.status === 'planned' ? `Planned: ${day.archetype} for SDG ${day.sdg.join(' and ')}` : '');
  const lines = wrap(tagline, 48);
  const tspans = lines.map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 46}">${escapeXml(l)}</tspan>`).join('');
  const sdgLabel = day.sdg.map((n) => `SDG ${n}`).join(' + ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<rect width="1200" height="630" fill="#FFFFFF"/>
<rect x="0" y="0" width="28" height="630" fill="${colour}"/>
<rect x="0" y="0" width="1200" height="10" fill="${MARIGOLD}"/>
<text x="80" y="110" font-family='${FONT}' font-size="30" fill="#555555">Day ${day.day} of 31</text>
<text x="1120" y="110" text-anchor="end" font-family='${FONT}' font-size="30" fill="${colour}" font-weight="700">${escapeXml(sdgLabel)}</text>
<text x="1120" y="150" text-anchor="end" font-family='${FONT}' font-size="26" fill="#555555">${escapeXml(day.sdgTitle)}</text>
<text x="80" y="260" font-family='${FONT}' font-size="88" font-weight="700" fill="#111111">${escapeXml(title)}</text>
<text x="80" y="340" font-family='${FONT}' font-size="36" fill="#333333">${tspans}</text>
<text x="80" y="560" font-family='${FONT}' font-size="26" fill="#555555">${escapeXml(STATUS_LABEL[day.status])} · ${escapeXml(day.date)}</text>
<text x="1120" y="560" text-anchor="end" font-family='${FONT}' font-size="26" fill="${MARIGOLD}" font-weight="700">Marigold Builds · 31 Days of Good</text>
</svg>`;
}

export async function tilePng(day) {
  const resvg = new Resvg(tileSvg(day), { fitTo: { mode: 'width', value: 1200 } });
  return Buffer.from(resvg.render().asPng());
}
