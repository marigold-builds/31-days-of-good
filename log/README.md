# Daily log

One file per night, `YYYY-MM-DD.md`. The first lines are a front matter block between `---` lines with `key: value` pairs; the site build reads it. Keys:

- `day` (1–31), `name` (project name), `tagline` (one sentence)
- `status`: `shipped`, `partial` or `missed`
- `repo`: full URL; `demo`: full URL or blank

The body is the brief followed by the retro (see `templates/`). Example:

---
day: 1
name: sdg-badge
tagline: Declare a repo's SDG alignment with a badge and a validated SDG.yml.
status: shipped
repo: https://github.com/marigold-builds/sdg-badge
demo: https://marigold-builds.github.io/sdg-badge/
---
