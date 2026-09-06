import { escapeXml as esc } from './tile.js';
import { SDGS } from './days.js';

export const DISCLOSURE = 'Marigold Builds is Claude, an AI model by Anthropic, directed and reviewed by Dom. Every project here was researched, built and documented by Marigold overnight, in one session. Dom sets the calendar, can veto each brief, merges every day&apos;s posts before they go out, and is accountable for what ships.';

const pad = (n) => String(n).padStart(2, '0');
const STATUS = { planned: 'Planned', shipped: 'Shipped', partial: 'Shipped, reduced scope', missed: 'Missed' };

function layout({ title, baseUrl, head = '', body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${baseUrl}style.css">
${head}
</head>
<body>
${body}
<footer>
<p>${DISCLOSURE}</p>
<p>Code is MIT licensed; writing is CC BY 4.0. <a href="https://github.com/marigold-builds/31-days-of-good">Programme repository</a>.</p>
</footer>
</body>
</html>
`;
}

export function renderIndex(days, { baseUrl, siteOrigin = '' }) {
  const tiles = days.map((d) => {
    const colour = SDGS[d.sdg[0]].colour;
    return `<li><a class="tile" style="--sdg:${colour}" data-status="${d.status}" href="${baseUrl}day/${pad(d.day)}/">
<div class="day">Day ${d.day} · ${esc(d.date)}</div>
<div class="sdg">SDG ${d.sdg.join(' + ')} · ${esc(d.sdgTitle)}</div>
<div class="name">${esc(d.name || d.seed)}</div>
<div class="tagline">${esc(d.tagline || d.archetype)}</div>
${d.status !== 'planned' ? `<div class="status">${STATUS[d.status]}</div>` : ''}
</a></li>`;
  }).join('\n');
  const shipped = days.filter((d) => d.status === 'shipped' || d.status === 'partial').length;
  return layout({
    title: '31 Days of Good', baseUrl,
    body: `<header>
<h1>Marigold Builds: 31 Days of Good</h1>
<p class="lede">One small open-source tool a night for the UN Sustainable Development Goals, 1–31 October 2026. Built in the open by an AI, directed by a human, handed to people who need it.</p>
<p class="meta">${shipped} of 31 shipped so far.</p>
</header>
<main>
<ul class="grid">
${tiles}
</ul>
</main>`,
  });
}

export function renderDay(d, bodyHtml, { baseUrl, siteOrigin = '' }) {
  const title = `Day ${d.day} · ${d.name || d.seed} · 31 Days of Good`;
  const img = `${baseUrl}tiles/day-${pad(d.day)}.png`;
  const links = [
    d.repo ? `<a href="${esc(d.repo)}">Repository</a>` : '',
    d.demo ? `<a href="${esc(d.demo)}">Demo</a>` : '',
  ].filter(Boolean).join(' · ');
  return layout({
    title, baseUrl,
    head: `<meta property="og:title" content="${esc(title)}">
<meta property="og:image" content="${siteOrigin}${img}">
<meta property="og:description" content="${esc(d.tagline || d.archetype)}">`,
    body: `<header>
<p class="meta"><a href="${baseUrl}">31 Days of Good</a> · Day ${d.day} of 31 · ${esc(d.date)}</p>
<h1>${esc(d.name || d.seed)}</h1>
<p class="lede">${esc(d.tagline || `Planned: ${d.archetype}`)}</p>
<p class="meta">SDG ${d.sdg.join(' + ')} · ${esc(d.sdgTitle)}${d.observance ? ` · ${esc(d.observance)}` : ''} · ${STATUS[d.status]}</p>
${links ? `<p>${links}</p>` : ''}
</header>
<main class="day-page">
<img src="${img}" alt="Day ${d.day} of 31 Days of Good. SDG ${d.sdg.join(' and ')}, ${esc(d.sdgTitle)}. ${esc(d.name || d.seed)}: ${esc(d.tagline || d.archetype)}.">
${bodyHtml}
</main>`,
  });
}
