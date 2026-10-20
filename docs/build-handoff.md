# BidWise build handoff — October 20, 2026

## Current state

Fast mode, approved scope/PRD/spec/build order. Stop at **5% remaining** in the Codex five-hour window; latest check before this handoff was 83% used / 17% remaining. Check live limits before resuming. No reset, card linking or paid usage authorized.

The learner explicitly said **"lets do the other stuff now"** while thinking about Gemini reliability. This authorizes continuing independent source/report/map work while preserving both AI features and pending live acceptance. Do not repeat the prior blanket pause on all work. Early learner feedback is resolved and the learner approved the revised UI with "looks good so far." Next: copied-page extraction, then renovation and cash resale/rental tools; full live-AI acceptance remains pending.

## Built and verified

- App root `BidWise/app`, branch `main`; original GitHub README/history `a87b7b4` preserved. No push. The early UI review is now accepted; save the verified source/report baseline as a truthful local checkpoint. No full AI slice is claimed complete. All main slice boxes remain unchecked because full Gemini acceptance is incomplete.
- Address → NJ geocode candidates → explicit parcel confirmation → real parcel facts and flood screening. Records/flood have independent loading/failure states. Match filtering checks returned block/lot/qualifier; ambiguous parcels remain choices.
- Server-signed identity tokens bind the source-selected PIN/location/precision; 15-minute expiry and restart invalidation. Shared process secret works across tested production routes. This is a local single-process PoC; shared signing-key provisioning and host abuse controls are prerequisites for any later multi-instance/public deployment.
- Parcel source query uses an identifier allowlist, bounded row count and no owner fields. Source popovers retain caveats/retrieval/publication dates. Geometry/publication dates stay distinct; deed date now uses the documented YYMMDD format, rendered with a full four-digit year, a short interpretation label and the original value/century rule in Source details. Zero sale/year remain unknown, zero historical tax stays a reported value, nominal amounts are qualified.
- Flood precision gate withholds uncertain locations. Exact duplicate zones group with source counts; different subtypes remain separate. No polygon or zone X never means safe.
- Real Mapbox map, original house marker, attribution, one instance per mounted view, textual failure fallback. Card-free token works in the browser; no account billing change. Token values are never logged/committed.
- Light responsive layout, desktop map-left/summary-right, evidence below, keyboard/Escape source popovers, reduced motion, before-purchase unknowns. No invented first-use property. Page-text extraction and financial UI are still pending.
- `/api/analysis` builds canonical source evidence and returns snapshot/revision and canonical records with its result. Browser rejects superseded responses. If a canonical source refresh fails, earlier results stay visible with original retrieval times and an explicit earlier-results notice; the refreshed AI result is rejected. Initial analysis remains wired; failed AI leaves facts visible. Normal/browser tests do not call live AI.
- **33 unit tests + eleven browser tests pass**, including mobile, failure states, URL fallback, source popover keyboard return and old-property response rejection. Typecheck, lint, production build and production identity→records smoke pass. Two real properties passed final production browser checks: one map-config request and one canvas were reused; 390px mobile had no horizontal overflow. Nominal-sale source help was inspected.
- Gemini key absent from all 25 checked production client chunks. Local keys, learner profile, raw evidence and test artifacts remain ignored/untracked. Development-only dependency advisories/ESLint peer warnings remain documented for release work.

## Gemini findings and retry policy

Learner confirms the `.env.local` key looks correct and reports Gemini 3.8 Flash works in AI Studio. This is user-observed UI success, not a successful API probe here.

JavaScript SDK 2.30.0, direct REST, and Python SDK 2.31.0 were compared using the exported `models/gemini-3.8-flash`, medium thinking, 65536-token ceiling and a short public arithmetic prompt. JS/REST returned 503 capacity; Python timed out. No inherited key, proxy, Vertex or custom-base-URL override was detected. No key contents or raw provider errors were output. This does not establish a global outage or a bad key.

The app now reads the SDK's `output_text` rather than concatenating all execution steps. Added one 1–1.249s delayed retry **only for HTTP 503**, with SDK retries disabled, at most two attempts. Quota/auth/timeout/network/invalid-output failures do not auto-retry. Attempt counts survive retried output-validation failures. Unit tests verify recovery and hard stop. Latest live structured probe ended at a timeout on its first attempt, so the delayed 503 recovery is locally tested but **not live-proven**. No more live model experiments were made after the learner asked to work on other things. No configured model switch or paid fallback.

## How to review

Production preview: `http://127.0.0.1:3100`; dev preview: `http://127.0.0.1:3000`. Agent-started processes may expire; restart with `npm run dev`, or `npm run build` then `npm start -- --hostname 127.0.0.1 --port 3100`.

Use the source-example button or enter `75 Richardson St, New Brunswick, NJ`, Find property, then confirm. Inspect map, assessment versus tax, source details, flood screening and unavailable AI. Example is a real source address, not a claim that it is for sale. Ask the learner what is unclear/worth changing; do not infer a performed learner check or readiness approval.

## Next work

1. Complete early learner review and address feedback. Preserve live-AI/URL Context acceptance as pending rather than checking unfinished slices.
2. Save a truthful verified checkpoint after review (no public push); inspect intended staging for credentials/private/unrelated files, never blanket-add unreviewed content.
3. Continue approved copied-page input and deterministic renovation/resale/rental work in the agreed sequence, subject to the explicit temporary bypass of live-AI blockage. No feature cut. Keep early/final ownership and wrap-up requirements.
4. Resolve real Gemini extraction/analysis quality, malicious/noisy/multi-property fixtures, permitted-source URL Context, source-use/deed conventions and release tooling/runtime/host gates before calling the project complete.

## Build environment correction

Tailwind's Turbopack production worker failed to bind an internal port in this environment, including on an escalated run. Next's documented `--webpack` production mode passes; `npm run build` now uses it. Development remains Next/Turbopack. The framework and product architecture are unchanged. Node 26.10.0 was tested; target Node 24/full fresh install remain pending. Generated `AGENTS.md` is framework guidance; read installed Next docs before new Next-specific changes.

## Early review improvements

User requested free autocomplete, readable deed dates and all available useful information. Implemented no-key NJGIN suggestions (350 ms debounce, max five, keyboard/Escape/touch/manual fallback), 30 non-personal property fields grouped by identity/building/land/assessment/history, original-value source details, documented tax-class names, availability count and explicit missing/unconnected coverage. Official metadata proves deed format YYMMDD with ambiguous century; `181010` reads October 10, ’18 without inventing 2018. Mailing ZIP5 is owner information and stays excluded. See data-feasibility.md for primary field-definition sources.

The user's exact `2211 Yosko Dr, Edison, NJ` returns no NJ geocoder candidates/suggestions and no Yosko parcel-location rows in a bounded Edison query. The known New Brunswick control still works. This is a source-coverage gap, not a corrected typo or proof the address is invalid. The UI explains it and does not fabricate a parcel. Autocomplete shares this index and cannot guarantee coverage. No new live Gemini experiments or paid providers.

Revised production checkpoint: build passed and preview restarted at `http://127.0.0.1:3100` (agent session 78345). Dev server was stopped to keep build output stable; use `npm run dev` if needed later. Live production `/api/suggest` returned the real Richardson address; identity→records returned **30 fields / 24 available**, including land assessment $250,000, improvement assessment $225,500, acreage 0.0574, one residential unit and deed book/page. Exact Yosko input returned addressMatches=0, choices=0, sourceFailures=0. Current browser visibly shows the updated dropdown and expanded real property record; screenshots `/private/tmp/bidwise-autocomplete-review.png` and `/private/tmp/bidwise-expanded-record-review.png`. One normal UI confirmation automatically initiated the configured Gemini property-analysis request; this was the app flow, not another model-diagnosis probe. Do not describe all browser checks as AI-intercepted. No model configuration or payment changes. Latest allowance check: **83% used / 17% remaining**; keep the 5%-remaining stop.

## Follow-up: full-year dates and textbox-anchored scrolling suggestions

The learner explicitly superseded the abbreviated-year display: show October 10, 2018, not ’18. Date normalization now selects the most recent matching year not after the retrieval year, validates the calendar date in that century and preserves the raw YYMMDD value. Source details disclose that the century is inferred, not independently verified; historical deeds require checking the recorded instrument. This is an interpretation rule, not newly retrieved century evidence.

The dropdown is now anchored 6px below the textbox, with a height-limited scrollable list and keyboard scrolling to the active option. On mobile it flows between the textbox and submit button. Focus stays within the combined input/list/button control until selection, submission or leaving the control, so collapsing the list cannot make a pending button click miss. Desktop/mobile position, scrolling, keyboard and manual-submit regressions pass.

**33 unit tests, eleven browser tests against production, typecheck, lint, production build and live full-year record smoke pass.** Live Richardson date is October 10, 2018 with raw 181010 retained. No live Gemini or Mapbox calls were made for this follow-up. Production preview session is now 64719 at port 3100; the automated-test dev server stopped after its run. Original user browser search was left untouched; visual checks use a separate temporary tab.

Final report size: no fixed field-count quota was approved. Thirty is the current official parcel adapter's slots, not a cap on the final product. Listing claims and comparisons, renovation line items, cash resale/rental inputs/results, Gemini explanations and remaining-check disclosures are separate approved parts. Availability and the number of user-added line items vary; do not invent a final numeric promise or reclassify assumptions as official facts.

## UI acceptance and Gemini recheck

Learner approved the early usable UI checkpoint with "looks good so far" and explicitly requested another Gemini check and research. Early hands-on checkbox is now checked; slices 1–2 remain unchecked because both live AI roles are not accepted. See `docs/gemini-reliability-check-2026-10-20.md` for primary-source reports and exact sanitized results. Latest 3.8 tests returned a 400, a 503 and a 45-second timeout. A temporary free-tier 3.5 Flash-Lite check completed a tiny request but failed the app extraction format with 400; analysis was skipped. No model/billing/config changes or speculative validator relaxation. The next diagnosis is minimal documented JSON schema compatibility; do not resume endless model probing or claim the workaround works.
