# BidWise build handoff — October 23, 2026

## Current state and boundaries

Fast mode; scope/PRD/spec/build order are approved. Early source/report UI review is accepted. Preserve both Gemini extraction and property/scenario analysis plus renovation, cash resale and basic cash rental. The learner explicitly requested editable starting estimates and authorized independent work during model failures. Do not reinterview settled choices or remove approved features.

Stop at **5% remaining /95% used** in the Codex five-hour window. Today's latest check was51% used /49% remaining; recheck live before continuing. No purchase, billing/card change, paid fallback, automatic reset, public push or deployment is authorized.

App root `/Users/mani/current_projects/BidWise/app`, local main. Original remote a87b7b4 preserved. Local checkpoints caf57d4 source/report,835105e copied claims,6e43885 finance,f4376ce Gemini fallback. Starting estimates are saved as e871802. The current condo matching correction is the next reviewed checkpoint. Inspect intended staging for credentials/private/unrelated files before every commit; never blanket-add. Keep .env.local, learner-profile, raw evidence and test artifacts ignored. Submission text/reflections/narration remain learner-authored.

## Usable behavior

- NJGIN no-key suggestions, real address/PIN/block/lot/qualifier choices, explicit confirmation and signed15-minute process-local identity. Fixed provider adapters omit owner/mailing data and reject ambiguous identifiers. Precise unique lot/unit matches with a block-only disagreement can be selected explicitly for research; the signed source warning stays visible and parcel-based automatic estimates/model allowances remain withheld. See the October23 matching section in docs/data-feasibility.md. Exact Yosko Edison input has an observed coverage gap, not proof of an invalid address.
- Source/date/caveat details for30 non-personal parcel slots; independent records/flood loading/failure; flood precision gate and grouped duplicate polygons. ZoneX/empty results do not mean safe. Full-year deed181010→October10,2018 retains raw value and disclosed inferred-century rule. Geometry/publication dates remain distinct.
- Mapbox flat map with original house marker/attribution, responsive map-left/summary-right report, keyboard/Escape source popovers and reduced motion. No invented initial property or fabricated fallback records.
- Copied text up to50,000characters/320,000bytes, URL-only fallback with no website fetching, preserved paste on failure, exact quoted claims, conservative cross-target region checks, target selection then parcel confirmation. Authenticated15-minute receipts bind validated candidate/claims to the parcel identity digest; no raw-page cache/database. Semantic/noisy/adversarial real-page quality still needs live acceptance.
- Typed claim comparisons distinguish price kinds and parcel acreage/interior area. Exact year-built/unit-count values can compare with tax facts; bedroom/bathroom/condition claims remain unverified. Agreement is not certification.
- Deterministic shared low/base/high renovation with contingency and separate reserve, Base/Downside cash resale with editable stresses/max bid/break-even/ROI and Recharts sensitivity plus equivalent table, and independently complete basic cash rental with separate capital reserve. Null/zero/negative/overflow guards and allowance single-counting are tested. Cash-only, before income tax, no strategy ranking.

## New automatic starting values

See `docs/starting-estimates-checkpoint-2026-10-23.md`. After confirmation/source checks, `/api/estimates` runs sources first, then a bounded Gemini allowance operation. Available source seeds fill before Gemini completes. Analysis follows the resulting current inputs and receives untrusted starting-origin context while recomputing calculations server-side.

One unambiguous quoted asking price may seed purchase as a copied claim. Historical positive tax may seed annual tax with its caveat. Precise-location/one-residential-dwelling gates allow dated ACS tract medians as clearly labeled area benchmarks for price/rent, without renovation uplift. These are not appraisals, current prices or property-specific rent predictions. Suppression, wrong geography/release and excessive/missing MOE are withheld.

US Census geocoder matchesACS2024 tract geography; independent Census Reporter mirrorsACS2024_5yr B25077/B25058 with a truthful project User-Agent. Direct Census data required a key here; no account/key/payment was added. Two bounded15-second public lookups, public cache1hour/max100points. Labels retain mirror, period, source links, check dates and confidence. SurveyMOE is not a prediction range. Illustrative fee/carry-schedule/vacancy/management/contingency assumptions have separate labels. HOA dues need documents; target profit is the user's goal.

Model proposals are restricted to broad cost allowances, typed fields, finite ordered ranges, caps and evidence IDs. They cannot set market prices/rent/HOA/target profit. No inspection findings or insurance certification. Real model quality is pending because today's allowance call timed out. Source seeds remain usable; no fake AI estimates.

Per-field edit tracking preserves edits, clears and changed-back values, including repair rows as a group. Refresh preserves them; explicit Restore replaces available starting values. Replies must match property/revision and substantive current record evidence, ignoring retrieval-clock differences alone. Old-property or changed-record replies are rejected. Changes invalidate old/in-flight AI commentary. Failed source refresh retains earlier records/timestamps and rejects new commentary; successful identical analysis can be reused60seconds.

## Verification and preview

**96 unit tests,25 production browser regressions, typecheck, lint and Webpack production build pass.** The browser suite passed24 tests initially; a selector-only correction passed the remaining targeted test. The live condo identity→records→source-estimates smoke and actual browser review candidate passed without AI/map calls. Learner retry is pending. Browser fixtures intercept external data/model/map calls. Coverage includes both finance hand fixtures, quote/receipt guards, exact Census vintage/geography, suppression/MOE/one-unit gates, model field/range/reference guards, source-first autofill, edits/clears/restore, model failures, stale property/record/AI responses, chart/table agreement and mobile overflow.

Production identity→records→source-estimates smoke succeeded for75RichardsonSt:30record fields,13starting values, exact substantive-record key matches across route bundles. Source-matched tract51 gives older owner-value median443800, contract-rent median1712; historical tax12453.35. These are diagnostic observed values, not purchase/rent/current-tax recommendations. No model/map calls in this smoke. `npm run probe:estimates` reproduces the source-only example; `-- --model` explicitly enables the bounded model operation.

Gemini key absent from26production client chunks in the current parcel-match build. Rendered desktop/mobile starting-value fixture screenshots inspected at `/private/tmp/bidwise-starting-estimates-desktop.png` and `/private/tmp/bidwise-starting-estimates-mobile.png`. Interactive Work browser control was disabled in the prior run. It works now: the condo review candidate was observed and saved at `/private/tmp/bidwise-parcel-match-review.png` in a separate deliverable tab. The existing pasted-page tab was preserved. Existing real map/source visual review was accepted previously.

Production preview `http://127.0.0.1:3100`, owned session12224; agent sessions may expire. Stop an owned preview before rebuilding; `npm run build`, then `npm start -- --hostname 127.0.0.1 --port 3100`. Development uses3000. Node26.10 tested; targetNode24 remains unverified. A clean isolated Node26 install/build/tests/lint passed at the previous financial checkpoint, not rerun for this increment.

## Gemini status

Preferred3.8, one delayed503-only primary retry, then at most one free3.5 Flash-Lite attempt if that retry also returns503; SDK retries0,45seconds per attempt. No quota/auth/bad-request/network/timeout/invalid-output fallback or alternate keys/paid providers. Actual model/fallback origin is shown. Safe failure category/model/attempt count excludes raw provider payloads. maxItems is omitted only from provider-facing JSONSchema; local caps remain.

Prior exact/minimal/v1/generateContent3.8 calls returned high-demand503 while Studio worked; same-key3.5 extraction/analysis controls succeeded separately. Last October22 full-report live analysis still failed. Today the bounded extraction probe timed out on initial3.8, skipped analysis, and the new allowance probe also timed out on initial3.8; no fallback on timeouts. No more repeated diagnosis without a meaningful provider-state change/new hypothesis. See diagnosis documents for primary-source evidence. Do not mark full AI slices or live model quality complete.

## Remaining work

- Full real extraction, property/scenario analysis and cost-allowance quality acceptance, including malicious/noisy/multi-target fixtures; bounded permitted-source URLContext investigation.
- Final learner full-journey review and revisions, then the single learning wrap-up/app map. Main slice boxes stay unchecked until their actual criteria pass; this is not ready-to-ship approval.
- TargetNode24, current fresh-install/release checks, project-wide license selection, source-use/republication review and any public-host signing/abuse/provider-budget controls. No push/deployment authorized.
- Existing lint-chain advisory paths involve unpatched braces3.0.3 via micromatch/fast-glob. Previous successful audit reported zero production advisories; that is dated evidence, not a security guarantee. Do not blindly apply the proposed Next14 lint downgrade. See third-party notices and finance checkpoint.


## October26 Groq trial supersedes Gemini-only selection

User requested free Groq, entered the key locally and confirmed done. `AI_PROVIDER=groq` now selects GPT-OSS120B for extraction, analysis and allowances. Gemini remains configured/selectable with its original policy. No paid tier, purchase or automatic provider switch.108unit tests/typecheck/lint/build and25browser regressions passed; a live extraction, allowances and full canonical report each succeeded. A fuller browser attempt initially failed evidence checks; the new strict evidence-ID enum passed a later full report with5findings. Full noisy-page/semantic acceptance and learner review remain pending; do not promise availability. See docs/groq-trial-2026-10-26.md. Canonical production preview3100/session91762; UI dev3101stopped after handoff. Existing UI/dependency changes remain separate; do not sweep them into the API commit. Latest usage89%used/11%remaining; stop95%.
