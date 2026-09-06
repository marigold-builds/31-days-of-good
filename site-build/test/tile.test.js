import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Resvg } from '@resvg/resvg-js';
import { tileSvg, tilePng, escapeXml, wrap } from '../lib/tile.js';

const day = { day: 6, date: '2026-10-06', sdg: [11], sdgTitle: 'Sustainable Cities and Communities',
  observance: 'World Habitat Day', archetype: 'Static map tool', seed: 'walkshed',
  name: 'walkshed', tagline: '15-minute walking isochrones from OpenStreetMap, no key.',
  status: 'shipped', repo: 'x', demo: null, logPath: null };

test('escapeXml escapes the five characters', () => {
  assert.equal(escapeXml('a<b>&"c\''), 'a&lt;b&gt;&amp;&quot;c&apos;');
});

test('tileSvg contains day, SDG, name, tagline and colour', () => {
  const svg = tileSvg(day);
  assert.match(svg, /^<svg[^>]*viewBox="0 0 1200 630"/);
  assert.match(svg, />Day 6 of 31</);
  assert.match(svg, /SDG 11/);
  assert.match(svg, /Sustainable Cities and Communities/);
  assert.match(svg, /walkshed/);
  assert.match(svg, /#FD9D24/);
  assert.match(svg, /Marigold Builds/);
});

test('tileSvg for a planned day shows the seed and Planned', () => {
  const svg = tileSvg({ ...day, name: null, tagline: null, status: 'planned' });
  assert.match(svg, /Planned/);
  assert.match(svg, /walkshed/);
});

test('tileSvg wraps a long tagline onto more than one line', () => {
  const svg = tileSvg({ ...day, tagline: 'x'.repeat(30) + ' ' + 'y'.repeat(30) + ' ' + 'z'.repeat(30) });
  assert.ok((svg.match(/<tspan/g) || []).length >= 2);
});

test('tilePng returns a PNG', async () => {
  const png = await tilePng(day);
  assert.equal(png.subarray(0, 4).toString('hex'), '89504e47');
});

test('wrap hard-splits a single word longer than maxChars', () => {
  const lines = wrap('x'.repeat(100), 48);
  assert.ok(lines.length >= 2);
  assert.ok(lines.every((l) => l.length <= 48));
});

test('wrap hard-split keeps astral characters intact (does not split a surrogate pair)', () => {
  // U+1F600 is a two-code-unit astral character; without the /u flag on the
  // hard-split regex, a {1,n} split with an odd n can land inside a
  // surrogate pair and produce an unpaired surrogate, which is invalid in
  // XML/SVG text. Use an odd maxChars so a naive UTF-16-unit split is
  // guaranteed to misalign with the (even-width) surrogate pairs somewhere.
  const emoji = '\u{1F600}'; // 😀, one grapheme, two UTF-16 code units
  const lines = wrap(emoji.repeat(60), 47);
  for (const line of lines) {
    // A string built only from complete surrogate pairs has an even number
    // of UTF-16 code units; an unpaired surrogate would make this odd.
    assert.equal(line.length % 2, 0, `line "${line}" split a surrogate pair`);
  }
  const rejoined = lines.join('');
  assert.equal([...rejoined].length, 60);
});

test('tile wraps a title over ~20 characters onto two lines and shrinks the font', () => {
  const longName = 'a-very-long-project-name'; // 25 chars
  // clear the tagline so its own tspans (used regardless of title length)
  // can't be mistaken for title tspans
  const svg = tileSvg({ ...day, name: longName, tagline: null, status: 'shipped' });
  assert.ok((svg.match(/<tspan/g) || []).length >= 2, 'title should render as more than one tspan');
  assert.doesNotMatch(svg, /font-size="88"[^>]*>/, 'font should step down once the title wraps');
});

test('a long title stays inside the 1200x630 canvas when rendered', () => {
  const longName = 'x'.repeat(40); // the documented maximum name length
  const svg = tileSvg({ ...day, name: longName });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const { pixels, width, height } = resvg.render();
  // Title text sits between the day/SDG header row (baseline ~150) and the
  // tagline row (baseline ~330); scan that band for ink past a safety margin
  // near the right edge, using the actual rendered glyphs rather than a
  // guessed character-width ratio.
  const marginX = 1150;
  const bandTop = 155;
  const bandBottom = 320;
  let overflow = false;
  for (let y = bandTop; y < Math.min(bandBottom, height) && !overflow; y++) {
    for (let x = marginX; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (pixels[idx + 3] > 0 && !(pixels[idx] === 255 && pixels[idx + 1] === 255 && pixels[idx + 2] === 255)) {
        overflow = true;
        break;
      }
    }
  }
  assert.equal(overflow, false, `title text rendered past x=${marginX} in its vertical band`);
});

test('a short title (at or under the wrap threshold) still renders at full size on one line', () => {
  const svg = tileSvg({ ...day, name: 'walkshed', tagline: null, status: 'shipped' });
  assert.equal((svg.match(/<tspan/g) || []).length, 0, 'short titles render as a single <text>, no tspans needed');
  assert.match(svg, /font-size="88"[^>]*>walkshed</);
});

// Re-reviewer's reproduction case: a 32-character, three-word name that
// slice(0, 2) used to truncate to two lines, silently dropping the third
// word. loadDays now rejects this name before a build ever reaches
// tileSvg, but tileSvg must not have a silent path of its own: if a name
// that needs more than two lines reaches it anyway, it must throw, not
// render an incomplete title.
test('a title that needs three lines throws instead of silently dropping the third', () => {
  const threeLineName = 'aaaaaaaaaa bbbbbbbbbb cccccccccc';
  assert.throws(
    () => tileSvg({ ...day, name: threeLineName, tagline: null, status: 'shipped' }),
    /needs 3 lines/
  );
});

test('a title that wraps to exactly two lines renders both lines in full, nothing dropped', () => {
  const twoLineName = 'aaaaaaaaaa bbbbbbbbbb'; // 21 chars, two 10-char words
  const svg = tileSvg({ ...day, name: twoLineName, tagline: null, status: 'shipped' });
  assert.equal((svg.match(/<tspan/g) || []).length, 2, 'expected exactly two title lines');
  assert.match(svg, />aaaaaaaaaa</);
  assert.match(svg, />bbbbbbbbbb</);
});
