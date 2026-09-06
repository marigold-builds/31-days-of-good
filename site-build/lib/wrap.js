// Shared text-wrapping used by both tile rendering (lib/tile.js) and log
// validation (lib/days.js). Living in its own module keeps those two files
// from importing each other, and — more importantly — means validation and
// rendering can never quietly diverge on what "fits" means: they call the
// exact same function.
export function wrap(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean)
    // 'u' flag: without it, {1,n} counts UTF-16 code units, and an astral
    // character (e.g. an emoji) is two code units, so a split can land
    // inside a surrogate pair and produce invalid XML.
    .flatMap(w => [...w].length > maxChars ? w.match(new RegExp(`(.{1,${maxChars}})`, 'gu')) : [w]);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) { lines.push(line); line = w; }
    else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

// The width (in characters) that a tile title wraps at, and the most lines
// a title may take on the tile. Shared so lib/days.js can reject at build
// time any name that would not fit — see lib/tile.js's layoutTitle.
export const TITLE_WRAP_MAX_CHARS = 20;
export const TITLE_MAX_LINES = 2;
