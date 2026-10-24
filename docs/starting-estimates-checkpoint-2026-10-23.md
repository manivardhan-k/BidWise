# Property starting values — October 23, 2026

Implements the learner's October 22 request to prefill editable financial inputs for the confirmed property. This extends the existing finance engines; it does not turn sparse records into an appraisal or establish repair condition.

## Current behavior

After explicit parcel confirmation and source checks, `/api/estimates` runs a public-source phase first and a model-allowance phase second. Source-based values become usable before Gemini finishes. The existing property/scenario analysis then reviews the resulting current inputs; it is still requested on both input paths. The estimate phase uses the same 3.8-first, one503 primary retry, one free3.5 fallback policy. Timeouts, quotas, authentication and invalid outputs do not trigger fallback.

- One unambiguous numeric asking-price claim can seed proposed purchase, labeled as a copied, unverified asking price. Opening bids, judgments, assessment and nominal recorded sales are never silently used as purchase prices.
- With a precise confirmed location and a tax-record single residential dwelling, dated local Census medians may seed purchase/resale and rent as **area benchmarks**. No renovation uplift or current market-value claim is supplied. Whole-building multi-unit and per-dwelling rent cannot be silently mixed, so these prefills are withheld outside this gate.
- Historical positive tax can seed annual tax, retaining its source/caveat; missing or zero historic tax is not assumed to mean zero future tax.
- Editable illustrative assumptions seed contingency, buyer/seller fee allowances, holding time, vacancy and management. These are application planning choices, not local researched fees or negotiated terms. Fixed buyer/seller extras begin at zero only because the percentage allowances explicitly model those costs; this does not claim services are free.
- Gemini can propose broad ranges for an uninspected renovation budget, unknown-condition reserve, insurance, owner utilities, routine maintenance, capital reserve and monthly carry. The schema excludes market prices/rent, HOA dues and investor target profit. Every accepted proposal needs allowed evidence IDs, a finite ordered range, a field-specific cap and an explanation. These bounds catch malformed or unsupported references; they do not prove a cost estimate is accurate. No square footage, discovered defect or insurability certification is inferred.
- HOA dues still need documents, and target profit remains the user's goal. Unsupported inputs stay visibly incomplete. A generic number is not labeled as a reliable property estimate merely to fill a box.

The review panel and field labels distinguish historical records, copied claims, area benchmarks, illustrative defaults and provisional AI allowances. They show basis, data period, check date, source link where applicable and low confidence. Survey margin of error is labeled separately from a planning range and is not presented as a property-price prediction interval.

## Source contract and limits

Census coordinate geographies are queried at the selected server-signed point with benchmark `Public_AR_Current`, vintage `ACS2024_Current`, tract layer8. Exactly one consistent NJ GEOID is required; approximate points are withheld. [Official API documentation](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html).

Direct Census data access returned an HTTP200 HTML “Missing Key” page in this environment. No Census account/key was created. Instead the fixed public [Census Reporter API](https://github.com/censusreporter/census-api/blob/master/API.md) supplies ACS2024_5yr tablesB25077 (owner-occupied median value) andB25058 (median contract rent). It is an independent mirror, not the Census Bureau. Its service requested a project-specific User-Agent; the truthful BidWise project agent returned200. [Publisher/data-use information](https://censusreporter.org/about/).

ReleaseID, period2020–2024, exact GEOID and numeric schema are checked. Suppressed/missing/negative/sentinel values remain unavailable. Estimates with absent MOE or MOE greater than50% of the median are withheld from autofill as an application quality rule. Contract rent is per rented dwelling, with varied lease/utility coverage, and owner-occupied values cover different homes. These are older area statistics, not comparable-sale analysis. [Census guidance on multiyear estimates](https://www.census.gov/programs-surveys/acs/guidance/estimates.html).

At most two public lookups for a new precise location; only public geography/statistics are cached for one hour, bounded to100 points. Provider timeout15seconds per request. No account, paid feed, unrestricted destination, raw listing scraping or extra map load is introduced. The nonprofit API has no availability/quota guarantee evidenced here; failures remain visible.

## Identity, edits and snapshot consistency

The server authenticates the parcel token and any signed copied-claim receipt before source/model requests. It fetches canonical records; browser-provided “facts” do not control estimates. Replies echo property/revision and a substantive-record key. The browser rejects superseded properties, mismatched PIN/revision and changed source evidence, ignoring differences in retrieval clocks alone.

Edits are tracked by field, including clearing or changing back a value. Sources/model/refresh replies fill only untouched fields. “Restore supplied starting values” explicitly replaces edited fields where a proposal exists. Repair rows are protected as a group. All changes invalidate old/in-flight AI commentary. The server still recomputes finance results; browser-provided estimate-origin context is untrusted context, not promoted to official evidence. Inputs remain in browser memory and are sent to Gemini when its operations run, never persisted in a page-text/scenario database or URL.

## Actual evidence and pending acceptance

The documented real Richardson parcel matched Census Tract51, MiddlesexNJ. The source-only probe supplied13 starting values (four evidence-linked, nine explicitly illustrative), including area home-value median443800, median contract rent1712 and reported historical tax12453.35. These are diagnostic observed inputs with the caveats above, **not a price, rent or current-tax recommendation for this house**. Ignored evidence: `docs/evidence/starting-estimates-probe-2026-10-23.json`. Source-only reproduction: `npm run probe:estimates`; `-- --model` explicitly enables the additional bounded live model operation.

Today's bounded extraction/analysis recheck timed out in the initial3.8 extraction and skipped analysis. The new allowance-operation probe also timed out on its first3.8 attempt; no fallback on timeouts. No repeated live experiments followed. Therefore source-prefill mechanics are live-proven, but real Gemini allowance quality and complete live extraction/analysis acceptance remain pending.

Mechanical checkpoint:85 unit tests,23 browser regressions, typecheck, lint and Webpack production build. Tests cover exact geography/release, suppression, approximate location, asking-price kinds, one-unit gating, missing/large MOE, model field/range/reference guards, canonical records, preserved edits/clears/restore, changed property and changed source evidence. Normal browser tests intercept external data, model and map operations. Rendered desktop/mobile fixture artifacts are inspected separately; production real-source smoke is recorded in the handoff.
