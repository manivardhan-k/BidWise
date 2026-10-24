# Data feasibility — October 19, 2026

Latest update: October 20, 2026. **Live Gemini verification remains blocked by generation failures; slice 1 is not complete.**

Slice 1 is **in progress**, not accepted. Source-backed address/report/map work now runs locally under the learner-authorized October 20 sequencing revision. Financial UI and successful live Gemini acceptance remain pending.

## Verified locally

- Preserved remote baseline `a87b7b4` by fetching and fast-forwarding the unborn local branch. Original README retained. Nothing pushed.
- Node 26.10.0 / npm 11.19.1; locked Next 16.4.2, React 19.3.1, Gemini SDK 2.30.0, Zod 4.6.7. Node 24 remains the intended reproducible target and is untested.
- `npm run probe:data` queried three civic control addresses: 78 Bayard Street, New Brunswick; 920 Broad Street, Newark; 280 Grove Street, Jersey City. All returned one score-100 `PointAddress`, one intersecting parcel, and flood polygons. These are public buildings, **not a residential demo or proof of residential coverage**. No candidate was marked user-confirmed.
- Local raw projected results: `docs/evidence/public-data-probe.json`, ignored until use/republication review. Owner and mailing fields were neither requested nor retained.
- Seven provider/validation tests, typecheck, lint and the final production build passed, including the transport/guard additions. Localhost production response returned HTTP 200 with the truthful build-status page.

## Contracts observed

| Source | Observed contract | Limits and interpretation |
|---|---|---|
| [NJ geocoder](https://geo.nj.gov/arcgis/rest/services/Tasks/NJ_Geocode/GeocodeServer) | `SingleLine`, `outSR=4326`, `Addr_type`, block/lot/qualifier; coordinates returned in requested CRS | Match score is not parcel identity confirmation. |
| [Parcel layer 0](https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_Composite_NJ_WM/FeatureServer/0) | `PAMS_PIN`, municipality, block/lot/qualifier, location, class, assessment, historical tax, deed string, sale price, construction year, parcel update/publication fields | Three controls are exempt class 15C. Zero tax/sale/year cannot automatically become meaningful financial evidence. Deed value `091231` needs the official date convention, not guessed formatting. Parcel update and publication timestamps differ. |
| [Flood layer 43](https://mapsdep.nj.gov/arcgis/rest/services/Features/Hydrography/MapServer/43) | `FLD_ZONE`, `ZONE_SUBTY`, point intersection in EPSG:4326 | Each control returned duplicate zone/subtype records; retain provenance before grouping display. Zone X has differing subtypes, including 0.2% annual-chance hazard. Neither X nor no polygon establishes safety. |

[NJGIN's parcel guidance](https://nj.gov/njgin/edata/parcels/) says boundaries are not survey data, county freshness varies, and owner names are redacted. Service attribution identifies NJOGIS/county contributors; flood attribution identifies FEMA. Metadata accessibility does not alone establish fixture republication permission. Item-level terms were inspected via ArcGIS item `533599bbfbaa4748bf39faf1375a8a9c`: attribution requested, non-survey use only, as-is/no availability or freshness warranty; further NJ legal/component conditions apply. Its legal link currently returns a redirect page to the browsing tool; full terms review remains pending.

## Gemini readiness

Both extraction and analysis transport functions are implemented against installed SDK types with structured schemas, 45-second timeout, zero automatic retries, no browsing tools and sanitized failures. Extraction validates quoted support; analysis validates evidence IDs and explicit numeric claims. These local checks **do not establish semantic truth, correct target attribution, prompt-injection resistance or model quality**.

No live Gemini call has run; no key was read or used. Learner confirms Gemini is free tier and authorizes model selection. Mapbox account/token exists without a linked card; no purchases authorized. Local `.env.local` was created from secret-free placeholders and opened for the learner to fill. Selected first candidate: `gemini-3.8-flash` for both operations; [official pricing](https://ai.google.dev/gemini-api/docs/pricing) lists free-tier standard text input/output. Actual account access, quota and quality remain untested; do not fall back to a paid tier. URL Context retrieval/status/citation/freshness investigation is also pending; no automatic listing import is exposed. Keep both approved AI stages.

## Setup issues and remaining gates

- TypeScript 7 failed the installed linter; stable 6.0.3 passes. ESLint 10.13.0 passes actual lint but Next's nested plugins advertise peer ranges ending at 9; fresh install compatibility needs resolution. ESLint 9 was tested successfully but npm marks it unsupported, so it was not retained silently.
- `npm audit` reports five high-severity entries in the development-only `eslint-config-next → fast-glob → micromatch → braces` chain. Registry latest braces is 3.0.3, still inside the advisory range. No forced major downgrade or fictional patched override applied. Runtime dependency audit and a safe tooling fix remain release gates.
- Before completing slice 1: verify source-use terms; choose and check a real residential sample; confirm Gemini model/quota/billing locally; run both AI stages and malicious/noisy-input quality checks; investigate permitted-source URL Context; resolve install/tooling concerns and reverify.

Commands: `npm run probe:data` (three fixed civic controls), or append up to three NJ addresses. Source failures are recorded separately and produce a failing exit status. Normal `npm test` makes no live model requests. Do not treat skipped integrations as passed.

## Residential follow-up

A bounded two-row class-2 query on official municipality `1213` returned 75 Richardson St (`1213_89_16`) and 76 Sicard St (`1213_89_40`). Subsequent geocoding returned score-100 PointAddress results with matching block/lot, and spatial queries returned each expected parcel plus zone-X/minimal-hazard polygons (duplicated). These are diagnostic joins, not user confirmation, condition/title checks or currently-for-sale claims. The latter parcel reports sale price `1`; sale-code and deed conventions must be checked before interpreting it as market evidence. Raw local evidence is ignored; no owner fields requested. A residential data path is observed, but the full Gemini/report demo is unfinished.

`npm ci --ignore-scripts --dry-run` passed with the documented ESLint plugin peer warnings; this is not a complete fresh install or Node 24 validation.

### Live AI attempt after setup

After learner confirmed `.env.local` saved, ran `node --import tsx scripts/probe-ai.ts`: one public-excerpt extraction and one evidence analysis. Both returned failure through the sanitized transport; no usable output or automatic retry. Actual failure category is not yet retained, so do not infer quota, model availability or key validity. SDK/model integration remains unverified; ignored evidence contains only stage status, model and check time. Credentials were loaded locally for these requests and never printed. Earlier statements that no live call/key use occurred describe the preceding checkpoint only.

### October 20 diagnosis

Replaced opaque failures with allowlisted categories and HTTP status only. Provider message/body/headers/keys are never retained in errors or output. Validation failures remain distinct from network failures. A model-list request succeeded and advertised the configured `gemini-3.8-flash`; that proves listing access, not generation entitlement or quota.

The bounded structured probe on 3.8 Flash returned extraction HTTP **503**, then analysis **timeout**. A separate minimal 3.8 Interactions request timed out; a minimal same-model `generateContent` request also returned **503**. Thus switching SDK methods did not repair generation. A single compatibility check against listed `gemini-2.5-flash` returned **404**; no retirement/entitlement cause was inferred. Metadata for `gemini-3.5-flash` advertised generation support, but its one minimal generation request returned **503**, classified as **capacity** by matching the provider message internally against a fixed pattern and emitting only that category. No raw message was printed. No app model configuration was changed, and no paid fallback or automatic retry was used.

These observations support a provider-generation availability/capacity blocker, not a claim that the key is invalid or the account needs billing. Further model hopping/retries were stopped. `scripts/probe-ai.ts` now skips the second stage after a service/access failure and records it as not run; local output-validation failures are stage-specific. Both successful AI stages, semantic/adversarial checks and URL Context remain pending. Keep the usable scaffold/public-data code and initial remote commit; do not tick slice 1 or proceed to slice 2 based on unavailable AI.

## October 20 source/report checkpoint

Learner explicitly requested continuing other work while considering Gemini reliability. `devpost/checklist.md` records this sequencing change; Gemini extraction AND analysis remain required and are not represented as passed.

Implemented real address matching, explicit block/lot/qualifier confirmation, signed 15-minute identity tokens, PIN-filtered records, separate flood status, source/date/caveat popovers, original Mapbox house marker, responsive layout and before-purchase unknowns. No owner fields. The source-created identity is verified across tested production route bundles. Source record parsing distinguishes missing years/zero sales, nominal sale amounts and reported zero tax; deed dates remain raw. Duplicate flood subtypes group with original match counts.

Verified **two real residential properties** through the final production browser: 75 Richardson St and 76 Sicard St in New Brunswick. The latter's nominal-sale source help was inspected. One map instance/config request served both properties, with one canvas retained; mobile width 390px had no horizontal overflow. AI requests were intercepted during these browser checks so no further live Gemini calls were made. Real desktop/mobile screenshots are local artifacts at `/private/tmp/bidwise-final-desktop.png` and `/private/tmp/bidwise-final-mobile.png`. These are source examples, not assertions of listing availability. A transient flood request failed earlier; the unavailable-source branch remained usable, and subsequent real flood queries/browser screening returned zone X with duplicate source matches.

**29 unit tests + five browser tests, typecheck, lint and production build pass.** Browser regressions use explicitly fictional fixtures and test confirmation, unavailable map/AI/flood states, source popover keyboard/Escape behavior, mobile/reduced motion, preserved unsupported URL and rejection of a late prior-property response. Production smoke verified matching/confirmation→records for `1213_89_16`. The Gemini key was absent from all 25 scanned production client chunks.

Production build uses documented Next `--webpack`: Turbopack's Tailwind worker hit a local-port permission error even on the escalated build, while Webpack passes. This is an internal bundler correction, not a framework/feature change. Generated Next `AGENTS.md` guidance was read and relevant installed route/client docs inspected. Full target Node 24/fresh install, development-only advisory/peer cleanup, public-host abuse/budget controls and shared signing-key deployment remain release gates.

### Bounded retry and export comparison

User reported successful AI Studio UI use and provided its Python export. Matching model prefix/generation settings in JS and direct REST still returned 503 capacity here; isolated Python SDK 2.31.0 timed out. No inherited key, proxy, Vertex setting or custom endpoint override was detected. This does not establish a global outage or invalid key. SDK `output_text` now supplies final JSON, avoiding concatenated intermediate outputs.

Following Google's retry guidance, only HTTP 503 gets one delayed retry (1–1.249 seconds with jitter), with SDK retries disabled and at most two attempts. Other errors do not retry automatically; attempt counts are preserved. Recovery, exhaustion, quota/timeout/invalid-output behavior are locally tested. The latest live structured probe timed out on its first attempt; successful delayed 503 recovery is **not live-proven**. Further live experiments paused at the learner's request; no model switch, feature cut or paid fallback.

Final reliability regression: when refreshed canonical records become unavailable after an earlier successful retrieval, the UI retains the previous evidence, labels it as earlier results with original retrieval times, and rejects the refreshed AI result. A browser regression exercises that exact sequence. This prevents hiding usable evidence or pairing older facts with mismatched new commentary.

## October 20 learner review — autocomplete and report depth

The learner found the early report too sparse and requested address autocomplete and a readable deed date. The initial 11-field adapter was a checkpoint subset, not an absence of further source data. The adapter now requests and exposes **30 useful non-personal property fields** in grouped report sections: address/county/municipality/identifiers, tax class, building description/class/use, dwelling counts, land description/acreage/additional lots, land/improvement/total assessment, historical tax, recorded sale, deed book/page/date, sale investigation code, exempt-facility description and previous property ID. Source shorthand stays qualified; unknown entries remain visible. Available-field count is coverage, not a reliability score.

The [official composite metadata](https://njdep.maps.arcgis.com/sharing/rest/content/items/852937c223e94fcf8e167a23b500935d/info/metadata/metadata.xml?format=default&output=html) verifies `DEED_DATE` is **YYMMDD** and explicitly warns of century ambiguity. This supersedes the earlier unverified-format limitation: `181010` now reads **October 10, ’18**, with an inline century warning and raw value in source details. Invalid dates remain unknown; no sliding century assumption is used. Metadata also verifies `DWELL`/`COMM_DWELL` count units, `CALC_ACRE` describes lot acreage, and `ZIP5` belongs to the **owner's mailing address**. ZIP5 and other owner/mailing fields are excluded; they must not be mislabeled as the property's ZIP. No interior area, bed/bath counts, asking price or listing photos are supplied by this parcel service.

Live exact-input diagnostics for `2211 Yosko Dr, Edison, NJ` returned zero geocoding candidates and zero suggestions (also with a bounded spelling/ZIP variant check); a bounded Edison parcel-location query for Yosko returned no rows. A known residential control still matched and suggested successfully. This is observed coverage failure, not proof that the user's address is invalid. UI now distinguishes an empty address index from an unconfirmed parcel or unavailable service. Do not force a nearby/similar match or infer ownership/unit identity.

Autocomplete uses the [existing public NJGIN geocoder](https://www.nj.gov/njgin/edata/geocoding/), whose `/suggest` operation succeeded without a key, token, account or payment. No Mapbox Search API, Gemini calls or paid geocoder were introduced. No unlimited-use or uptime guarantee is inferred. Requests wait 350 ms after typing, accept only 4–200-character address queries, cap results at five, abort superseded browser requests and preserve manual search on failure. Keyboard, Escape, actual touch selection, late-response rejection and mobile manual search while the dropdown is open are covered. Mobile suggestions are positioned below the form so they neither cover the search button nor move it away during a click.

A visible coverage section now separates retrieved parcel/tax/flood evidence from missing listing/interior facts, unfinished scenario tools and unchecked physical/title/environmental/local/transaction issues. Both approved Gemini roles and all financial features remain in scope. Early learner feedback has been incorporated; acceptance of the revised experience is still pending.

Validation for this review: **32 unit tests, nine Chrome browser regressions, typecheck and lint passed**. Browser provider fixtures do not consume map/AI quotas. The bundled Chromium version was not installed; the existing Chrome channel documented in README was used. ESLint now ignores generated browser-test output, avoiding a filesystem race while Playwright replaces its result directory. Production build/live smoke are recorded in the current handoff after completion.

Rebuilt production smoke passed: Richardson suggestions/confirmed identity/records returned 30 fields with 24 available, and the exact Yosko input remained an empty index response rather than a provider error. The live browser displayed the new date, deed references and grouped record. A normal confirmation triggered the existing automatic Gemini analysis flow; it ended in the explicit AI-unavailable state with all records still visible. This does not satisfy live AI acceptance. No additional diagnostic prompts, provider switch or payment changes were made.

### Learner-requested presentation refinement

The subsequent request for full years supersedes the abbreviated-year presentation above. Dates display a full year, e.g. **October 10, 2018** for raw **181010**. This is a disclosed century interpretation using the most recent matching year not after the retrieval year, not additional official evidence. The original value and interpretation rule remain in Source details, with an inline label. Century/leap-year/pivot tests use explicit reference years; dates that are invalid in the interpreted century remain unknown.

Suggestions now sit **6px below the textbox**, with a capped scrollable list and keyboard auto-scrolling. Mobile suggestions flow between the textbox and button; combined focus handling keeps the button clickable when the menu is open. This supersedes the previous mobile placement below the whole form. Tests measure placement at 1440px and 390px, verify actual scroll overflow and active-option scrolling, and submit with the menu open.

Verified follow-up: **33 unit tests, eleven production-browser regressions, typecheck, lint, production build and live Richardson date smoke pass**. No new Gemini or Mapbox requests were needed. The approved plan has no fixed final field count: 30 is the current official parcel record shape; listing comparisons, renovation, financial scenarios and AI explanations remain additional planned report sections.

## October 22 copied-page and Gemini compatibility checkpoint

See [bounded results and primary sources](gemini-reliability-check-2026-10-22.md). The provider-facing schema now omits maxItems while local limits remain enforced. A controlled 3.8 extraction returned valid JSON once; two complete app probes still stopped on 503 after the single allowed retry. Both AI roles remain required, and live acceptance is pending. No configured-model/billing change.

Copied-page processing now includes explicit target/parcel confirmation, authenticated claim binding and typed comparisons. Tests cover quote support, cross-property borrowing, receipt changes/expiry/swaps, URL fallback and oversized input without truncation. Mechanical checkpoint: 51 unit / 14 browser tests, typecheck, lint and production build pass. Fresh visual inspection is pending because Work local-browser access is disabled.


## October 23 — address found, parcel discarded

Reproduced the learner's current condo case through the actual NJ services: the address index returned a score100 PointAddress with block528, lot43 and unitC0834. Point intersection returned exactly one parcel, `1222_528.05_43_C0834`, with block528.05, lot43 and unitC0834. The matcher silently discarded the result because the blocks differ. This is an observed source disagreement, not evidence that the user typed an invalid address, a Gemini failure or proof of which block is current. The services do not establish the cause of the disagreement.

The ordinary exact-identifier path is preserved. A block conflict can be offered for explicit research selection only when score is at least95, precision is PointAddress, the complete intersection contains exactly one feature, both sources supply the same nonempty lot and unit, and the parcel's PIN agrees with its own municipality/block/lot/unit fields. No decimal stripping, nearby-property substitution or unit/lot mismatch relaxation is used. The source warning survives signed confirmation, appears in the report and is included in canonical AI evidence. Non-reviewable conflicts get a specific source-disagreement message instead of repeatedly blaming the entered address.

Parcel-based starting estimates and Gemini cost allowances are withheld while this join is unresolved. General editable assumptions and independently quoted claims remain separate. No Census lookup is made for that case. AI property analysis can still review the uncertainty; it receives the signed source disagreement. This is an identity gate, not a removal of either Gemini role.

The same parcel's current response has **5 available report fields out of30**, all identifiers: parcel PIN, municipality code, block, lot and qualifier. Property address, municipality name, class, tax, assessment, sale and building data are null. The UI now explains missing tax details; a successful parcel lookup is not a claim of a complete tax record. No raw copied page, owner/mailing data or contact details were saved.

Verification: **96 unit tests**, typecheck, lint and Webpack production build passed. **25 browser regressions** passed across the suite and one targeted rerun correcting a test selector that also matched Next's empty accessibility announcer (24 passed in the suite, then the remaining test passed). Production identify→records→source-estimates round-trip retained the signed conflict and withheld uncertain parcel-based values. Real browser observation shows the review candidate; screenshot `/private/tmp/bidwise-parcel-match-review.png`. No Gemini or Mapbox requests were used in these live diagnostics; browser fixtures intercept external providers. Existing user paste was left untouched; the result is in a separate preview tab. Final learner retry remains pending.
