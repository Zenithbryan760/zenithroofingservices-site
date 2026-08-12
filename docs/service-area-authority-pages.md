# Service-area authority pages

The service-area section is generated from two maintained data files:

- `data/service-areas.json` — cities, neighborhoods and communities, including their place type, parent area, common ZIP codes, nearby areas and local roof context.
- `data/service-area-services.json` — the complete, site-linked Zenith service library and concise explanations.

Run:

```bash
npm run generate:service-areas
npm run test:service-areas
```

The generator updates all location pages, the service-area directory and the service-area entries in `sitemap.xml`.

## Adding a location

Add one record to `data/service-areas.json`. A location must be identified accurately as a city, neighborhood, community or unincorporated community. Use common ZIP codes as search and orientation signals, not as a claim that ZIP boundaries exactly match community boundaries.

Every location needs distinct information for:

- place type and parent city or region;
- local setting and property mix;
- roof-system mix;
- condition and weather considerations;
- common ZIP codes and nearby areas.

Every generated page also contains seven substantial system-expertise panels—tile lift and reset, asphalt shingles, TPO, PVC, torch-down, self-adhered modified bitumen and silicone restoration—plus the complete 49-service catalog. Keep those summaries aligned with their linked specialty service pages whenever a system specification changes.

Do not create thin ZIP-only pages or change a neighborhood into a city for search purposes.

## Adding a verified case study

After the project page and real Zenith images exist, add the verified project to `projectBySlug` in `scripts/generate-service-areas.mjs`. The generator will replace the honest future case-study slot with a linked project card and include the project in that location page’s structured data. Until that happens, the reserved space directs visitors to the relevant specialty service pages and labels its process image as representative rather than local proof.

Never present representative process photography or a project from another city as local proof.
