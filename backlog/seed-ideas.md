# Seed Ideas

Fifty-plus candidate projects, three or more per SDG. None is a commitment; the day's Discover phase may find something better. Each line: name, one sentence, archetype, data, and the target it serves. Scoring happens on the day using [../docs/03-selection-criteria.md](../docs/03-selection-criteria.md).

## SDG 1 · No Poverty
- **pip-lines** — poverty-line lookups, PPP conversion and "what does $2.15/day mean here" in a CLI and library. *Library.* World Bank PIP. Target 1.1.
- **benefit-finder-kit** — self-hostable eligibility screener template with a small YAML rules DSL and tests, so a local charity can encode its own benefits. *Template.* No external data. Target 1.3.
- **cash-evidence** — curated, cited dataset of cash-transfer evaluations with a schema and a static browser. *Dataset.* Published studies. Target 1.3.

## SDG 2 · Zero Hunger
- **faostat-py** — thin, typed FAOSTAT client with cached fixtures and pandas-free output. *Library.* FAOSTAT. Target 2.1, 2.c.
- **surplus-board** — self-hostable surplus-food listing board for community fridges, no accounts, QR posting. *Template.* None. Target 2.1, 12.3.
- **sowing-window** — planting calendar from latitude and climate normals, offline. *Library/CLI.* Open-Meteo climate. Target 2.4.

## SDG 3 · Good Health
- **med-times** — large-type, offline medication schedule that prints and speaks, no data leaves the device. *PWA.* None. Target 3.8.
- **steady** — offline grounding exercises and localisable crisis-resource cards; explicitly not advice. *PWA.* Curated helpline list. Target 3.4.
- **gho-cli** — WHO Global Health Observatory in the terminal, with fixtures. *CLI.* WHO GHO. Target 3.x indicators.
- **air-today** — air-quality reading for your location with plain-language guidance from official thresholds. *Static tool.* Open-Meteo air quality. Target 3.9.

## SDG 4 · Quality Education
- **md2quiz** — markdown to printable and interactive quizzes, offline, for teachers with no platform. *CLI.* None. Target 4.1, 4.c.
- **readable** — reading-level and plain-language scorer that explains itself, in the browser, offline. *Static tool.* None. Target 4.6.
- **wiki-cards** — flashcards from any Wikipedia article, exported to open formats. *Static tool.* Wikipedia API. Target 4.4.

## SDG 5 · Gender Equality
- **jobad-lint** — linter for gendered and exclusionary language in job ads, with a GitHub Action. *CLI + Action.* Curated wordlists with citations. Target 5.5, 8.5.
- **care-hours** — unpaid-care time accounting from ILOSTAT plus a survey template for local groups. *Library.* ILOSTAT. Target 5.4.
- **paygap-calc** — pay-gap calculation library implementing the UK, EU and Australian reporting formulas with tests. *Library.* None. Target 5.5, 8.5.

## SDG 6 · Clean Water and Sanitation
- **wash-timer** — handwashing, chlorination and SODIS timers for clinics and schools, offline, pictogram UI. *PWA.* None. Target 6.2.
- **water-footprint** — product and diet water-footprint calculator with cited factors and CSV export. *Library.* Published factor tables. Target 6.4.
- **jmp-extract** — clean, schema'd extract of WASH coverage data with a refresh script. *Dataset.* JMP bulk data. Target 6.1, 6.2.

## SDG 7 · Affordable and Clean Energy
- **grid-now** — carbon intensity for your grid with "run the dishwasher later" advice. *CLI.* GB Carbon Intensity, Electricity Maps. Target 7.2.
- **solar-sizer** — off-grid solar sizing library with worked examples and unit tests. *Library.* None. Target 7.1.
- **kwh-label** — appliance energy-label reader and annual-cost estimator. *Static tool.* EU EPREL open data. Target 7.3.

## SDG 8 · Decent Work
- **fair-rota** — shift-scheduling library enforcing rest rules and fairness constraints. *Library.* None. Target 8.8.
- **ilostat-cli** — ILOSTAT in the terminal with fixtures. *CLI.* ILOSTAT. Target 8.5, 8.6.
- **invoice-plain** — dependency-free invoice generator for freelancers in low-income settings, offline, multilingual. *Static tool.* None. Target 8.3.

## SDG 9 · Industry, Innovation and Infrastructure
- **slowlint** — page-weight and 2G-readiness linter with a budget file. *CLI.* None. Target 9.c.
- **oss-pulse** — bus-factor and maintenance-health report for any repo, as an Action. *GitHub Action.* GitHub API. Target 9.5.
- **postcode-reach** — distance-to-nearest-service analysis from OpenStreetMap. *Library.* Overpass. Target 9.1.

## SDG 10 · Reduced Inequalities
- **a11y-gate** — accessibility check on every PR with plain-language findings. *GitHub Action.* axe-core. Target 10.2.
- **easy-read** — helper that restructures a document into Easy Read layout conventions, offline. *Static tool.* None. Target 10.2.
- **gini-cli** — inequality indicators with context, from PIP. *CLI.* World Bank PIP. Target 10.1.

## SDG 11 · Sustainable Cities
- **walkshed** — 15-minute walking isochrones from OpenStreetMap, no key. *Static map tool.* Overpass, OSRM demo or local routing. Target 11.2, 11.7.
- **civic-report-kit** — self-hostable issue-reporting template for small councils, static plus a form backend of their choosing. *Template.* None. Target 11.3.
- **heritage-log** — audiovisual and built-heritage cataloguing template with open metadata. *Template.* Wikidata. Target 11.4.

## SDG 12 · Responsible Consumption
- **repair-or-replace** — cost and carbon comparison with open emission factors and honest uncertainty. *Static tool.* Published factors. Target 12.5.
- **off-facts** — Open Food Facts packaging and label extract with a schema and refresh script. *Dataset.* Open Food Facts. Target 12.8.
- **leftovers** — what-can-I-cook from an ingredient list using open recipe data, offline. *Static tool.* Open recipe datasets. Target 12.3.

## SDG 13 · Climate Action
- **flood-check** — flood and severe-weather lookup with plain alerts, for a coordinate or place name. *CLI/library.* Open-Meteo flood. Target 13.1.
- **stripes** — warming-stripes SVG for any place from open climate data. *Library.* Open-Meteo climate, ERA5 fixtures. Target 13.3.
- **budget-clock** — remaining carbon budget widget with cited assumptions, embeddable. *Static tool.* Published budgets. Target 13.3.

## SDG 14 · Life Below Water
- **beach-tally** — offline beach-cleanup logger exporting to open litter schemas. *PWA.* None. Target 14.1.
- **catch-check** — sustainable seafood lookup against open advisories. *Static tool.* Open advisories. Target 14.4.
- **gfw-summaries** — fishing-effort summaries by region with the non-commercial licence stated. *Library.* Global Fishing Watch. Target 14.4.

## SDG 15 · Life on Land
- **inat-pull** — iNaturalist and GBIF observations to clean CSV/GeoJSON with licence columns. *Library/CLI.* iNaturalist, GBIF. Target 15.5.
- **firms-watch** — NASA FIRMS fire alerts for a bounding box to RSS or webhook. *CLI.* NASA FIRMS. Target 15.2, 13.1.
- **tree-log** — community tree-planting register template with survival tracking. *Template.* None. Target 15.2.

## SDG 16 · Peace, Justice and Strong Institutions
- **foia-draft** — freedom-of-information request generator with per-country templates and deadlines. *Static tool.* Curated law references. Target 16.10.
- **source-check** — media-literacy checklist and citation-trace helper. *Static tool.* None. Target 16.10.
- **minutes-index** — searchable index builder for council minutes PDFs, self-hosted, no AI summaries. *CLI.* None. Target 16.6, 16.7.

## SDG 17 · Partnerships
- **sdg-badge** — declare a repo's SDG alignment with a badge, a validated `SDG.yml` and a GitHub Action; renders the official icon unchanged. *Action.* None. Target 17.6, 17.16.
- **sdg-data** — typed client for the UN SDG Global Database API in Python and TypeScript. *Library.* UN SDG API. Target 17.18.
- **dpg-check** — self-assessment against the nine Digital Public Goods indicators, generating a report for a repo. *CLI.* DPG registry API. Target 17.16.
- **day-of-good-kit** — everything needed to run your own one-day SDG build: process, templates, scaffolds, publish queue. *Template.* This repo. Target 17.17.
