# Open Data Register

Free or open APIs a one-day project can lean on, grouped by SDG. Verified in September 2026 via web research; **each one must be hit again in the week-2 preparation task and a sample response saved as a fixture**. Rate limits marked "unpublished" need a direct docs check before a live tool depends on them.

| SDG | Source | Endpoint | Auth | Rate limit | Licence | Notes |
|-----|--------|----------|------|------------|---------|-------|
| All | UN SDG Global Database API | unstats.un.org/SDGAPI | None | Unpublished | UN open data terms | Swagger docs available; the canonical indicator source |
| All | Our World in Data grapher CSV/API | ourworldindata.org | None | Unpublished | CC BY 4.0 | Revamped Nov 2024; excellent for fixtures |
| All | Wikidata SPARQL | query.wikidata.org | None | ~60s query timeout, soft throttle | CC0 | Good for entity lookups (orgs, places) |
| All | HDX (Humanitarian Data Exchange) CKAN API | data.humdata.org | None for read | Unpublished, standard CKAN | Per dataset, mostly CC BY / CC0 | Check per-dataset licence |
| All | ReliefWeb API | api.reliefweb.int | None, `appname` param required | 1,000 calls/day, 1,000 entries/call | ReliefWeb terms | Reports, disasters, jobs |
| 1, 10 | World Bank PIP (poverty) API | pip.worldbank.org/api | None | Unpublished | CC BY 4.0 | Poverty lines, Gini; Swagger available |
| 1, 8, 10 | World Bank Indicators API v2 | api.worldbank.org/v2 | None | Generous | CC BY 4.0 | No key needed |
| 2 | FAOSTAT API | fao.org/faostat | None documented | Community guidance ~2 req/s | Typically CC BY-NC-SA 3.0 IGO, verify per dataset | Non-commercial clause matters for licensing derived data |
| 3 | WHO GHO OData API | ghoapi.azureedge.net/api | None | Unpublished | WHO open data terms | 2,000+ indicators |
| 4 | UNESCO UIS API | apiportal.uis.unesco.org | Free key by registration | 100,000 records/query, then bulk download | UIS open terms | Legacy SDMX endpoint dead since 2020; use REST or bulk |
| 5 | World Bank Gender Data; UN SDG API 5.x; ILOSTAT | as above | None | as above | as above | Care-work time-use indicators live in ILOSTAT |
| 6 | UN SDG API 6.x; HDX WASH datasets | as above | None | as above | Mixed | No clean dedicated WASH API found; JMP data is bulk download. Bundle fixtures |
| 7 | GB Carbon Intensity API | api.carbonintensity.org.uk | None | Unpublished, generous | Open Government Licence | UK only, no key, ideal for a CLI |
| 7 | Electricity Maps free tier | api-access.electricitymaps.com | Free key | Free-tier cap unpublished | Electricity Maps terms | Multi-country; key means a fixture is mandatory |
| 8 | ILOSTAT SDMX/REST | ilo.org/sdmx/rest | None for read | Unpublished | ILO open terms | API upgraded recently; check SDMX 2.1 vs 3.0 |
| 9, 11 | OpenStreetMap Overpass API | overpass-api.de | None, descriptive User-Agent required | Few hundred queries/day on public instance | ODbL | Share-alike applies to derived data |
| 9, 11 | Nominatim (geocoding) | nominatim.openstreetmap.org | None, User-Agent required | 1 req/s, no bulk | ODbL | Never bulk geocode against the public instance |
| 12 | Open Food Facts API | world.openfoodfacts.org/api | None | 15 req/min read, 10 req/min search per IP | ODbL data, DbCL contents | Packaging, labels, Nutri-Score, Eco-Score |
| 13 | Open-Meteo | api.open-meteo.com | None (non-commercial) | 10,000 calls/day | CC BY 4.0 | Weather, air quality, flood, climate; the best zero-friction API on this list |
| 13 | Copernicus CDS / ERA5 | cds.climate.copernicus.eu | Free account + token | Queue-based | Copernicus licence per dataset | Auth changed in 2024 migration; heavy for a one-day build, prefer fixtures |
| 13, 15 | NASA FIRMS (fire) | firms.modaps.eosdis.nasa.gov | Free MAP_KEY by email | 5,000 transactions per 10 min | NASA open data | Active fire detections |
| 14 | Global Fishing Watch API | api-doc.globalfishingwatch.org | Free token, non-commercial only | Daily/monthly caps unpublished | CC BY-NC 4.0 | Non-commercial restriction must be stated in the README |
| 14, 15 | GBIF API | api.gbif.org | None | Generous, unpublished | CC0 / CC BY / CC BY-NC per record | Check per-record licence before redistribution |
| 15 | iNaturalist API v1 | api.inaturalist.org/v1 | None for reads | 100 req/min | Per-observation CC licences | v2 still in development; build on v1 |
| 15 | Global Forest Watch Data API | data-api.globalforestwatch.org | Account + key | Unpublished | Various CC per dataset | Key required; fixture mandatory |
| 16 | OpenSanctions API | api.opensanctions.org | Free key, non-commercial / media | Monthly quota | Free non-commercial; commercial needs licence | Careful: sanctions data touches named individuals; use for org-level checks only |
| 16 | UNHCR Refugee Statistics API | api.unhcr.org | Registration appears required | Not verified | UNHCR open terms | **Partially verified.** Manual check needed |
| 17 | Digital Public Goods registry API | api.digitalpublicgoods.net | None | Static JSON on GitHub Pages | Open | Good for Day 1 and Day 24 |

## SDG icon usage (for the badge and tiles)

- Assets: un.org/sustainabledevelopment/news/communications-material. Guidelines PDF: "Guidelines for the use of the SDG logo, colour wheel and 17 icons" (August 2019).
- Use the version **without the UN emblem**; the emblem version is for UN system entities only.
- Each icon must be used whole: number, title and graphic, uncropped, colours unchanged.
- Illustrative use (README badges, tiles, slides) needs no permission. Commercial or fundraising use, printed publications, or anything implying UN endorsement needs written permission.
- The Day 1 badge tool should therefore render the official icon unchanged next to the badge, not a restyled version.

## Digital Public Goods Standard, nine indicators

Relevance to SDGs · approved open licence · clear ownership · platform independence · documentation · mechanisms for extracting data · adherence to privacy and applicable law · adherence to standards and best practices · do no harm by design.

Every project README template already covers licence, ownership (steward), documentation, data export (fixtures and CSV/JSON output) and SDG relevance (target code). The template's "What it does not do" section is where do-no-harm limitations go. Formal registry submission is a stretch goal for at most two or three of the strongest projects, after October.
