# Third-party software and data

Direct runtime dependencies observed in the lockfile on October 22, 2026; typography and icons added October 26:

| Package | Version | License / source |
|---|---|---|
| Next.js | 16.4.2 | MIT, https://github.com/vercel/next.js |
| React / React DOM | 19.3.1 | MIT, https://github.com/facebook/react |
| Recharts | 3.10.1 | MIT, https://github.com/recharts/recharts |
| Tailwind CSS | 4.3.3 | MIT, https://github.com/tailwindlabs/tailwindcss |
| Zod | 4.6.7 | MIT, https://github.com/colinhacks/zod |
| Radix React Popover | 1.3.1 | MIT, https://github.com/radix-ui/primitives |
| React PDF renderer | 4.9.0 | MIT, https://github.com/diegomura/react-pdf |
| Google Gen AI SDK | 2.30.0 | Apache-2.0, https://github.com/googleapis/js-genai |
| Lucide React | 1.61.0 | ISC with bundled Feather notices; https://github.com/lucide-icons/lucide |
| DM Sans variable (Fontsource) | 5.3.0 | SIL OFL-1.1; bundled package LICENSE, https://fontsource.org/fonts/dm-sans |
| Manrope variable (Fontsource) | 5.3.0 | SIL OFL-1.1; bundled package LICENSE, https://fontsource.org/fonts/manrope |
| Mapbox GL JS | 3.33.0 | Mapbox terms; see the package's LICENSE.txt and https://www.mapbox.com/legal/tos/ |

This is a dependency index, not a replacement for package license/notice texts. Preserve the licenses and bundled notices supplied with these packages and their transitive dependencies in any distribution. Mapbox GL JS is not represented as MIT-licensed; its account/product terms apply and the map retains attribution.

Public source records are attributed in the report and source links. NJGIN parcel/MOD-IV and NJDEP/FEMA flood-service coverage, dates and limitations are described in `docs/data-feasibility.md`. Source access does not establish complete history, clear title or permission to redistribute arbitrary raw payloads. Local raw evidence remains ignored pending source-use/republication review. No Zillow/Auction.com scraping or bundled listing-page content is included.

The house marker is original project artwork. Copied text is manually supplied by the user; it is labeled as claims and processed by the configured Gemini or Groq provider. Provider service terms and free-tier data-use rules apply separately from SDK and model licenses.

A project-wide publication license has not been selected. Do not infer one from the licenses of these dependencies; resolve that and the source-use/publication review before public release.

Starting-value data added October23: US Census coordinate tract geographies and ACS2020–2024 tablesB25077/B25058, served via the independent Census Reporter public API. The publisher states Census data is not copyrighted and permits use; original Census Reporter prose/visualizations have separate licensing and are not copied into this app. Report labels disclose the mirror, source period and limitations. See https://censusreporter.org/about/ and https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html.

The October 26 interface refresh uses the Latin variable font files from the pinned Fontsource packages through `next/font/local`; browsers request them from BidWise, not a font CDN. Font and icon license texts remain in the installed packages and must accompany distributions.

Local usability checks use the development-only @axe-core/playwright package (MPL-2.0) and its bundled axe-core. Their license texts stay in the installed packages; the checker is not shipped as a production dependency or sent report data by the app.

Dedicated PDF export added October 26 uses the pinned React PDF renderer and its transitive layout/PDFKit dependencies. It generates the document locally in the browser, with standard PDF Helvetica fonts and no external font or rendering service. Preserve dependency licenses and bundled font notices in distributions.
