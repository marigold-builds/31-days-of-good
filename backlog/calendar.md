# Calendar research · October 2026 (reference, not a schedule)

**Nothing on this page is scheduled, assigned or committed.** `data/calendar.json` — the file the site actually builds from — carries only a day number and a date for each of October 2026's 31 nights. It assigns no SDG, no project, no archetype and no name to any night. A night's SDG and project are chosen during that night's own Discover phase, from the intake inbox and the ideas that surface that night (see [../docs/02-daily-process.md](../docs/02-daily-process.md) and [../docs/11-intake-and-triage.md](../docs/11-intake-and-triage.md)). See Decided 21 in [../docs/07-decisions.md](../docs/07-decisions.md).

What follows is the research done in September 2026, ahead of launch, before the programme became demand-first: the UN observance falling on each date, and one possible SDG-and-idea pairing worked out at the time, verified against un.org (see [../docs/09-research-notes.md](../docs/09-research-notes.md)). The **observance dates are objective facts** about October 2026 — World Food Day is 16 October whether or not this programme exists — and stay useful for a night's own research to consult. The **SDG, archetype and seed columns are a snapshot of one September afternoon's thinking**, kept here so the work is not lost, not because that thinking is any given night's plan. A night's own research may land on the same SDG this table shows, a different one, or a request nobody had thought of in September.

Legend: **Obs.** = UN or other observance falling on that date, a fact · **SDG (Sep)** = the SDG September's research happened to pair with that date, unused · **Archetype idea (Sep)**, **Seed idea (Sep)** = one candidate shape and one candidate project from [seed-ideas.md](seed-ideas.md) that September's research happened to pair with that date, unused — see that file for the fuller, SDG-organised pool of candidates, none of which is a commitment either.

| Date | Obs. | SDG (Sep) | Archetype idea (Sep) | Seed idea (Sep) |
|------|------|-----|-------|------|
| Thu 1 Oct | Launch day; Int'l Day of Older Persons | 17 Partnerships | GitHub Action + badge | `sdg-badge`: declare a repo's SDG alignment with a badge and a validated `SDG.yml` |
| Fri 2 Oct | Int'l Day of Non-Violence | 16 Peace & Justice | Static tool | `foia-draft`: freedom-of-information request generator with per-country templates |
| Sat 3 Oct | Older Persons (1 Oct, carried) | 3 Health | PWA, offline | `med-times`: large-type, offline medication schedule that prints |
| Sun 4 Oct | World Space Week begins; World Animal Day (non-UN) | 15 Life on Land | Library | `inat-pull`: iNaturalist and GBIF observations to clean CSV/GeoJSON |
| Mon 5 Oct | World Teachers' Day; World Habitat Day | 4 Education | CLI | `md2quiz`: markdown to printable and interactive quizzes, offline |
| Tue 6 Oct | World Habitat Day (carried) | 11 Cities | Static map tool | `walkshed`: 15-minute walking isochrones from OpenStreetMap, no key |
| Wed 7 Oct | World Cotton Day | 12 Responsible Consumption | Static tool | `repair-or-replace`: cost and carbon calculator with open emission factors |
| Thu 8 Oct | World Sight Day | 10 Reduced Inequalities | GitHub Action | `a11y-gate`: accessibility check on every PR with plain-language reports |
| Fri 9 Oct | World Post Day | 9 Infrastructure | CLI | `slowlint`: page-weight and 2G-readiness linter for web pages |
| Sat 10 Oct | World Mental Health Day; Migratory Bird Day | 3 Health | PWA, offline | `steady`: offline grounding and crisis-resource cards, localisable, no tracking |
| Sun 11 Oct | Int'l Day of the Girl Child | 5 Gender Equality | CLI + Action | `jobad-lint`: gendered and exclusionary language linter for job ads |
| Mon 12 Oct | — | 14 Life Below Water | Static tool | `beach-tally`: offline beach-cleanup logger exporting to open litter schemas |
| Tue 13 Oct | Int'l Day for Disaster Risk Reduction | 13 Climate Action | CLI/library | `flood-check`: Open-Meteo flood and severe-weather lookup with plain alerts |
| Wed 14 Oct | — | 8 Decent Work | Library | `fair-rota`: shift scheduling library with rest-rule enforcement |
| Thu 15 Oct | Global Handwashing Day; Int'l Day of Rural Women | 6 Clean Water | PWA | `wash-timer`: handwashing and water-treatment timers for clinics and schools, offline |
| Fri 16 Oct | World Food Day | 2 Zero Hunger | Library | `faostat-py`: thin, tested FAOSTAT client with cached fixtures |
| Sat 17 Oct | Int'l Day for the Eradication of Poverty | 1 No Poverty | CLI/library | `pip-lines`: World Bank poverty-line lookups and PPP conversions |
| Sun 18 Oct | — | 12 Responsible Consumption | Dataset | `off-facts`: Open Food Facts packaging and label dataset extract with schema |
| Mon 19 Oct | — | 9 Infrastructure | GitHub Action | `oss-pulse`: bus-factor and maintenance-health report for a repo |
| Tue 20 Oct | — | 6 Clean Water | Library | `water-footprint`: product and diet water-footprint calculator with cited factors |
| Wed 21 Oct | — | 14 Life Below Water | Static tool | `catch-check`: sustainable seafood lookup against open advisories |
| Thu 22 Oct | — | 1 No Poverty | Template | `benefit-finder-kit`: self-hostable eligibility-screener template with a rules DSL |
| Fri 23 Oct | Int'l Day of the Snow Leopard | 15 Life on Land | CLI | `firms-watch`: NASA FIRMS fire alerts for a bounding box, to RSS or webhook |
| Sat 24 Oct | United Nations Day; World Development Information Day | 17 Partnerships | Library | `sdg-data`: typed client for the UN SDG Global Database API |
| Sun 25 Oct | Global Media and Information Literacy Week | 16 Peace & Justice | Static tool | `source-check`: media-literacy checklist and citation-trace helper |
| Mon 26 Oct | Global Media and Information Literacy Week | 4 Education | Static tool | `readable`: reading-level and plain-language scorer for teachers, offline |
| Tue 27 Oct | World Day for Audiovisual Heritage | 11 Cities | Template | `civic-report-kit`: self-hostable issue-reporting template for small councils |
| Wed 28 Oct | — | 7 Affordable & Clean Energy | CLI | `grid-now`: carbon-intensity lookup for open grid APIs with "run it later" advice |
| Thu 29 Oct | Int'l Day of Care and Support | 5 Gender Equality | Library | `care-hours`: unpaid-care time accounting from ILOSTAT with a survey template |
| Fri 30 Oct | — | 13 Climate Action | Library | `stripes`: warming-stripes generator for any place, SVG, from open data |
| Sat 31 Oct | World Cities Day; close | 11 Cities + 17 | Template | `day-of-good-kit`: everything needed to run your own one-day SDG build |

## Notes on the observance dates (facts, kept for reference)

- World Statistics Day is only observed every five years and does not fall in 2026.
- World Habitat Day is the first Monday of October, so 5 October in 2026; it collides with World Teachers' Day and was noted above as carried to the 6th in September's pairing — a future night's research is free to use it on either date, or not at all.
- Global Handwashing Day is WHO/UNICEF-backed rather than a UN General Assembly day; still a strong hook if a night's own research reaches for it.

## Why this file changed

Until 7 September 2026 this page was a proposed day-by-day schedule, and `data/calendar.json` carried the SDG, observance, archetype and seed columns above as live data that the site rendered as though 31 projects were already decided. Dom ruled that this contradicted the programme's own demand-first design (Decided 17) and struck the assignment (Decided 21): every night now starts from zero, and this page is kept only as the research trail, not the plan.
