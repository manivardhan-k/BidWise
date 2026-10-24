# BidWise tools, usage and limits

Documentation checked October 19, 2026. This is supporting research for the now-approved `spec.md`, not evidence of working integrations. No API keys/accounts were inspected and no billable API requests were made. The learner's URL Context question is recorded as a permitted-source feasibility investigation in the spec and build checklist; it does not establish universal URL support.

## Recommended roles

| Tool | Proposed use in BidWise | Usage and limitations |
|---|---|---|
| Next.js + TypeScript | One application for the browser interface and server-side requests | Local application code, not a per-analysis credit service. Hosting, if chosen later, has separate limits. [Installation](https://nextjs.org/docs/app/getting-started/installation), [MIT license](https://github.com/vercel/next.js/blob/canary/license.md). |
| Tailwind CSS + shadcn/ui | Light styling, forms, cards, accessible help/popovers | Code integrated into the project; no hosted UI credit dependency proposed. Still verify actual keyboard/mobile behavior. [Tailwind](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [shadcn/ui](https://ui.shadcn.com/docs). |
| Recharts | Resale sensitivity visualization | A local charting library, not a source of property values. [Docs](https://recharts.github.io/en-US/). |
| Official Google GenAI SDK, `@google/genai` | Gemini performs both copied-text extraction AND evidence-grounded property analysis, scenario interpretation and supplementary consistency review | Server-only key. Code validates structured results, supporting snippets, source references and numeric claims. Model review helps flag possible problems; it does not establish correctness or replace records/tests. [SDK](https://ai.google.dev/gemini-api/docs/libraries), [structured output](https://ai.google.dev/gemini-api/docs/structured-output). |
| NJGIN geocoding and parcels/MOD-IV | Find candidate identities and obtain available official parcel attributes | Published government services, not a selected paid property-data subscription. Exact access terms, endpoint behavior/limits and field coverage need build-stage verification. [Geocoding](https://www.nj.gov/njgin/edata/geocoding/), [parcels](https://nj.gov/njgin/edata/parcels/). |
| NJDEP-hosted FEMA flood layer | Screen the confirmed location for mapped flood-zone evidence | Layer documentation verified; no real-property lookup performed yet. A geographic screen is not an inspection or insurance determination. [Layer 43](https://mapsdep.nj.gov/arcgis/rest/services/Features/Hydrography/MapServer/43). |
| Mapbox GL JS | Display the flat property map and selected-house marker | Requires an account/token; usage is metered separately from Gemini. Trial/standard allowances differ; see below. [Map-load pricing](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/). |
| Zod | Validate submitted text, extracted fields and provider responses | Shape/type validation cannot establish that a fact is true. [Docs](https://zod.dev/). |
| Vitest + Playwright | Finance/matching/adapter checks and real-browser workflow/accessibility checks | Proposed local test tools; tests do not replace inspecting actual records and rendered UI. Any test that calls a live provider can consume its quota, so normal automated tests use properly attributed recorded public responses or explicit test doubles. [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/). |

Installed versions, compatible runtime and dependency licenses will be recorded in the build lockfile and release documentation. Current documentation review does not prove installation compatibility.

## Gemini: quota, tokens and privacy

[Pricing](https://ai.google.dev/gemini-api/docs/pricing) lists free-tier Flash options, including `gemini-3.5-flash-lite` as a candidate. Its listed standard paid rates are $0.30 per million input tokens and $2.50 per million output tokens; this is information, not authorization to enable paid usage. Final model selection needs account availability and extraction-quality tests. Free-tier content may be used to improve Google's products, so handle public material only.

[Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) cover requests and input tokens per minute and requests per day. Limits vary by model/tier and apply per project, not per key. Check the project's actual limits in AI Studio before promising throughput; no fixed requests/day allowance has been verified for this account. Tokens are units of text processed, so copying a large page uses more input than a short listing.

Corrected model roles, explicitly requested by the learner: Gemini is part of both text processing and property analysis. A typed address skips only extraction, then receives Gemini analysis once the available records and calculation results are assembled. Pasted text ordinarily uses extraction first and analysis second. Analysis explains available evidence, scenario implications, inconsistencies and missing information, citing the supplied source/field identifiers. It may flag suspected errors for investigation; it never overwrites an official record or deterministic calculation based on model confidence.

Editing assumptions recalculates numbers immediately in code. The AI narrative must be tied to the same input/evidence snapshot: mark it outdated after edits and provide analysis refresh, or use another explicitly agreed refresh behavior. Do not present old commentary as analysis of new numbers. Avoid calls for intermediate keystrokes; this is a trigger/reuse decision, not removal of Gemini analysis. Invalid outputs and transient errors receive bounded handling; quota errors do not trigger endless retries or paid fallback. A provider failure can leave sourced facts/calculations usable while clearly marking AI analysis unavailable.

The earlier extraction-only recommendation was narrower than v3 §5.7 and has been withdrawn. Usage estimates must account for both stages. Select a suitable Flash model after testing extraction and analysis quality; the lowest-priced candidate is not automatically the default.

## Mapbox: two different allowances

- [Card-free signup documentation](https://docs.mapbox.com/accounts/guides/signup/) currently lists **5,000 web-map loads/month** for the trial. Trial rate limits are lower; access can stop at a limit or trial end. Trial token management is restricted. Verify actual allowance, expiry and token options in the user's console before relying on it through judging.
- [Standard Mapbox pricing](https://www.mapbox.com/pricing) lists **50,000 map loads/month free**, then **$5 per 1,000** in the next band. A billing-enabled account can incur overage charges; a notification is not a hard spending cap.
- A map load is counted when a map object is initialized. Panning and zooming within that load do not each count as another map load. Repeatedly rebuilding the map can consume additional loads.
- P0 proposes NJGIN geocoding rather than Mapbox geocoding. Map display and address lookup are separate services; do not conflate their quotas. Keep required Mapbox attribution and use an appropriately scoped public token with origin restrictions where supported.

## Public data limitations

NJGIN documents county-dependent parcel updates, non-survey boundaries and redacted owner names. These records are not live listings or a complete condition/title/history database. Do not infer missing bedrooms/bathrooms/interior area, reverse protected identities, or label missing records as proof of no issues.

The public flood layer metadata exposes a query-capable polygon layer with a 2,000-record response maximum; this is not a promised request quota or real-property coverage result. Final adapters need bounded queries, timeouts and honest partial-data states. No universal government-service uptime guarantee or per-call pricing claim is made.

## Scraping and copy/paste

[Zillow terms](https://www.zillow.com/corporate/terms-of-use/) and [Auction.com terms](https://www.auction.com/lp/legal/terms/) prohibit automated scraping. No paid scraper or browser agent is proposed to bypass those restrictions. The approved workflow accepts an address or manually supplied visible page text, subject to permission to supply it, with a clear fallback for URLs. Manual copying does not itself grant republication rights; do not publish raw copied listings/photos in the repository or demo without permission.

Firecrawl, RentCast, OpenRouter, paid data feeds and additional orchestration are not required for the approved core. No subscription or paid account is being added through this research.

## Development tools versus the running app

Codex is the current implementation agent; Claude Code can also work on the repository if the learner chooses. Those development sessions are separate from the proposed Gemini/Mapbox calls inside BidWise. The deployed/local application will not depend on an active coding-agent conversation. Personal coding-agent limits and balances have not been inspected.

## Cost policy and unresolved checks

Carry forward the user's instruction: free tiers/public sources where feasible, and no unexpected paid API usage. This is cost visibility and control, not authority to remove approved functionality. Preserve Gemini extraction and analysis plus the other approved features; if account limits prove insufficient, present measured usage/cost and let the learner decide before a paid change or scope reduction. Prefer free-tier Gemini and a card-free mapping trial if its terms and duration fit. If an existing account is billing enabled, inspect its settings with the learner and establish enforceable limits before calls or public sharing; do not assume a token is free because the service offers a free tier. Provider failure/quota exhaustion must degrade honestly, not trigger paid fallback.

Still unverified: account access/remaining quotas, model quality/availability, map trial expiry, exact NJ service behavior/rights, repeatable real-property coverage and installed dependency compatibility. These belong in the spec and build-stage evidence, not in a claim that BidWise already works.

## October22 verified configuration and availability refinement

The learner approved3.8 as preferred with free3.5 Flash-Lite only after503 failures. Both models' text input/output are currently listed free-tier eligible; no purchases/billing/key change occurred. Two primary attempts maximum, then one free fallback only if both returned503. Maximum three calls per operation, or six across extraction plus analysis; ordinary successful pasted input still needs two operations, and address input one. Each attempt has a45-second timeout. These are request bounds, not guaranteed quotas or success rates. Quota/auth/timeout/network/bad-request/invalid-output failures stop without fallback.

Current3.8 API controls still return high-demand503 despite Studio success. The same key completed3.5 extraction/analysis in a separate public/synthetic control; later failures persisted, including unavailable full-report analysis. UI identifies actual successful model/fallback origin. No validators, source checks or either AI role were removed. See docs/gemini-api-diagnosis-2026-10-22.md for observed results and a repeatable diagnostic command. Full live quality and public release acceptance remain pending.

The learner now requests property-specific editable starting estimates. This is recorded as an additional estimate-evidence step; implementation/call bounds for that step remain to verify. It must not silently reuse assessment/nominal sale as purchase value or invent missing condition details. See docs/property-estimate-plan.md.

## October23 starting-estimate implementation

The new estimate operation runs after confirmed records: two bounded public geography/ACS requests for a new precise point, with a100-entry/one-hour public cache, then at most one Gemini allowance operation using the existing3.8/3.5 policy. Census Reporter is an independent free ACS mirror, identified by a truthful project User-Agent; exact release, geography, suppression and MOE guards apply. No account/key/payment was added. A successful uncached address report now has estimate and analysis model operations; copied text adds extraction. Each operation can make at most three inference attempts under the approved repeated503 rule. That gives at most six attempts for address input or nine for copied text, plus explicit user-requested refreshes. Quota/timeouts/invalid output never trigger paid or alternate-key fallback. No per-minute/daily allowance is promised.

Source seeds remain useful during model failures and are visibly distinguished from provisional model cost allowances. Input/cost origins are untrusted analysis context, not official record proof. See docs/starting-estimates-checkpoint-2026-10-23.md.
