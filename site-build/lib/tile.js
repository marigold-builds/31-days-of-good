import { Resvg } from '@resvg/resvg-js';
import { SDGS } from './days.js';
import { wrap, TITLE_WRAP_MAX_CHARS, TITLE_MAX_LINES } from './wrap.js';

const MARIGOLD = '#F4A300';
const FONT = 'system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

export function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export { wrap };

const STATUS_LABEL = { planned: 'Planned', shipped: 'Shipped', partial: 'Shipped, reduced scope', missed: 'Missed' };

// A live tile showed an 18-character name already spanning x=80->930 of the
// 1040px usable width (x=80 to x=1120) at 88px bold; anything past ~22
// characters runs off the edge. Wrap above 20 chars (before that happens)
// into two lines at a smaller size, using the same wrap() and width that
// lib/days.js validates a log's `name` against at build time — so a name
// that reaches this function is already guaranteed to fit in
// TITLE_MAX_LINES. See the throw below: it is a defence against that
// guarantee being wrong or bypassed, not an expected path.
const TITLE_WRAP_THRESHOLD = TITLE_WRAP_MAX_CHARS;
const TITLE_FONT_SIZE = 88;
const TITLE_FONT_SIZE_WRAPPED = 56;
const TITLE_LINE_HEIGHT = 60;
const TITLE_Y = 250;
const TITLE_Y_WRAPPED = 205;

function layoutTitle(title) {
  const wrapped = [...String(title)].length > TITLE_WRAP_THRESHOLD;
  const lines = wrapped ? wrap(title, TITLE_WRAP_MAX_CHARS) : [String(title)];
  if (lines.length > TITLE_MAX_LINES) {
    // loadDays validates every name against this same wrap() before a build
    // ever reaches here, so this means that guard was skipped or disagrees
    // with this function — fail loudly rather than silently drop a line.
    throw new Error(`Tile title "${title}" needs ${lines.length} lines to wrap at ${TITLE_WRAP_MAX_CHARS} characters each; loadDays should have rejected this name`);
  }
  return {
    lines,
    fontSize: wrapped ? TITLE_FONT_SIZE_WRAPPED : TITLE_FONT_SIZE,
    y: wrapped ? TITLE_Y_WRAPPED : TITLE_Y,
    lineHeight: TITLE_LINE_HEIGHT,
  };
}

export function tileSvg(day) {
  const colour = SDGS[day.sdg[0]].colour;
  const title = day.name || day.seed;
  const tagline = day.tagline || (day.status === 'planned' ? `Planned: ${day.archetype} for SDG ${day.sdg.join(' and ')}` : '');
  const lines = wrap(tagline, 48);
  const tspans = lines.map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 48}">${escapeXml(l)}</tspan>`).join('');
  const sdgLabel = day.sdg.map((n) => `SDG ${n}`).join(' + ');
  const titleLayout = layoutTitle(title);
  const titleContent = titleLayout.lines.length > 1
    ? titleLayout.lines.map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : titleLayout.lineHeight}">${escapeXml(l)}</tspan>`).join('')
    : escapeXml(titleLayout.lines[0]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<rect width="1200" height="630" fill="#FFFFFF"/>
<rect x="0" y="0" width="28" height="630" fill="${colour}"/>
<rect x="0" y="0" width="1200" height="10" fill="${MARIGOLD}"/>
<text x="80" y="110" font-family='${FONT}' font-size="30" fill="#555555">Day ${day.day} of 31</text>
<text x="1120" y="110" text-anchor="end" font-family='${FONT}' font-size="30" fill="${colour}" font-weight="700">${escapeXml(sdgLabel)}</text>
<text x="1120" y="150" text-anchor="end" font-family='${FONT}' font-size="26" fill="#555555">${escapeXml(day.sdgTitle)}</text>
<text x="80" y="${titleLayout.y}" font-family='${FONT}' font-size="${titleLayout.fontSize}" font-weight="700" fill="#111111">${titleContent}</text>
<text x="80" y="330" font-family='${FONT}' font-size="36" fill="#333333">${tspans}</text>
<text x="80" y="500" font-family='${FONT}' font-size="26" fill="#555555">${escapeXml(STATUS_LABEL[day.status])} · ${escapeXml(day.date)}</text>
<text x="1120" y="500" text-anchor="end" font-family='${FONT}' font-size="26" fill="${MARIGOLD}" font-weight="700">Marigold Builds · 31 Days of Good</text>
</svg>`;
}

export async function tilePng(day) {
  const resvg = new Resvg(tileSvg(day), { fitTo: { mode: 'width', value: 1200 } });
  return Buffer.from(resvg.render().asPng());
}
