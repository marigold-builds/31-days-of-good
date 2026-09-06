# Daily log

One file per night, `YYYY-MM-DD.md`. The first lines are a front matter block between `---` lines with `key: value` pairs; the site build reads it. Keys:

- `day` (whole number, 1–31, matching this file's own date in `data/calendar.json`), `name` (project name, up to 40 characters — longer names do not fit the tile), `tagline` (one sentence)
- `status`: `shipped`, `partial` or `missed`
- `repo`: a full `https://` URL; `demo`: a full `https://` URL or blank

The build fails loudly (rather than dropping the day from the calendar) if the filename is not `YYYY-MM-DD.md`, `day` is missing, mis-cased or out of range, two files claim the same day, the filename's date does not match `calendar.json`, `name` is over 40 characters, or `repo`/`demo` is not a full `https://` URL.

The body is the brief followed by the retro (see `templates/`). Example:

---
day: 1
name: sdg-badge
tagline: Declare a repo's SDG alignment with a badge and a validated SDG.yml.
status: shipped
repo: https://github.com/marigold-builds/sdg-badge
demo: https://marigold-builds.github.io/sdg-badge/
---
