# BidWise build handoff — October 22, 2026

## Current checkpoint

Fast mode; approved scope/PRD/spec/order. Early learner source/report UI review is accepted. Both Gemini extraction and analysis, shared renovation, cash resale and basic cash rental remain required. Stop at **5% remaining /95% used** in the five-hour Codex window; latest check was 39% used /61% remaining. Recheck live before continuing. No purchases, billing change, paid fallback, automatic reset or public push authorized.

App root `/Users/mani/current_projects/BidWise/app`, main. Original remote README/history a87b7b4 preserved. Local checkpoints: caf57d4 source/report, 835105e copied-page and claim binding. The verified financial checkpoint is the next local commit after835105e. Main slice boxes remain unchecked because complete live Gemini acceptance has not passed. The learner authorized independent work during the outage; do not cut either AI role or repeat the early interview.

## Built and verified

- NJGIN autocomplete → real address candidates → explicit PIN/block/lot/qualifier confirmation → 30 useful non-personal record fields, source/date/caveat popovers, flood screening and Mapbox. Records/flood have independent partial/failure states. Owner/mailing details stay excluded. Geometry/publication dates remain distinct.
- Full-year deed interpretation: raw181010 displays October 10, 2018, using the most recent matching year not after retrieval. Original value and inferred-century caveat stay visible. This is not independent date verification.
- Suggestions debounce350ms, require4–200 characters, maxfive, keyboard/Escape/touch/manual fallback. Scrollable dropdown6px below textbox; mobile flow and focus/manual-submit tested. Exact Yosko Edison input has an observed source-coverage gap, not proof of an invalid address.
- Signed 15-minute identity tokens bind selected source PIN/location/precision. Process-local secrets invalidate on restart. Source requests use fixed adapters/identifier allowlists; no client-owned official-record labels. Public source cache lasts60seconds; no private text/scenario cache/database.
- Copied-page UI/API: 50,000-character plus320,000-byte request limits, explicit rejection without truncation, URL-only fallback with no fetching, failure preserves paste. Multiple targets require selection followed by parcel confirmation. Exact address/claim quotations and conservative address-region checks reject unsupported/cross-target output. This is not semantic proof; noisy/adversarial real-page acceptance remains pending.
- Authenticated15-minute candidate receipts bind validated claims to the confirmed identity digest. Tampering, expiry, missing bound claims and swapping another valid candidate fail before provider calls. Receipt contains a digest, not raw page text.
- Typed comparisons distinguish price kinds and parcel acreage/interior area. Exact year-built/unit-count claims can compare with numeric tax facts; bedrooms/bathrooms/condition remain unverified. Agreement does not certify truth.
- Renovation: editable quantity × low/base/high unit costs, contingency and separate unknown-condition reserve. Ordinary code calculates totals and counts allowances once.
- Cash resale: complete explicit cost inputs, Base/Downside, editable stress assumptions, profit, ROI-on-cost, break-even, scenario maximum bid/difference, Recharts sensitivity chart and equivalent table. No invented market value. Impossible target shows no nonnegative bid; losses remain visible.
- Basic cash rental: explicit rent/vacancy/annual costs/management/capital reserve, separate operating income and annual/monthly cash after reserve. Independent completeness. Shared purchase/renovation remain acquisition context, not duplicate annual deductions. Cash-only, before income tax; no strategy ranking.
- Analysis validates and recomputes scenarios on the server, includes canonical inputs/results and source evidence, hashes them together and rejects old property/scenario or mismatched-key replies. Edits update math immediately and mark old successful commentary outdated. Failed source refresh retains earlier timestamps and rejects refreshed commentary. Successful identical review may be reused for60seconds. Failed AI leaves facts/math usable.

## Verification and preview

**60 unit tests, 18 production browser regressions, typecheck, lint and Webpack production build pass.** See `docs/finance-verification.md`. Domain tests include both approved hand fixtures, max-bid round trips, allowance single-counting, missing/zero/negative/overflow guards and independent completeness. Browser fixtures exercise recalculation, chart/table agreement, stale/mismatched AI, mobile width390, source failures and pasted targets without model/map credits.

Real production source smoke returned 30 fields /24 available for75RichardsonSt, full-year deed date and URL/oversize parse rejection400/413, with zero live AI calls. Gemini credential absent from all27 checked production client chunks. Intended staging must still be scanned before commit; keep .env.local, private learner-profile, raw evidence and test artifacts ignored.

Production preview `http://127.0.0.1:3100`, session58801. Processes can expire. Restart `npm run build` then `npm start -- --hostname 127.0.0.1 --port 3100`. Stop an agent-owned preview before rebuilding to avoid mixing output. Development uses port3000. Node26.10.0 tested; targetNode24 remains unverified.

Rendered production-test fixture screenshots inspected: `/private/tmp/bidwise-finance-desktop-test.png`, `/private/tmp/bidwise-finance-mobile-test.png`. Mobile stacks without overflow. These are fictional test calculations, not real-property/model acceptance. Interactive Work browser control is disabled; the user's existing tab/search was not modified. Prior real map/source visual review remains recorded in the previous checkpoint.

## Gemini status and remaining gates

See `docs/gemini-reliability-check-2026-10-22.md` and the October20 report. Google staff reproduced a nested maxItems structured-output issue; the app omits only that provider-facing keyword and retains all local Zod/resource/evidence guards. A minimal3.8JSON call and one controlled extraction returned200. The original-schema3.8comparison returned503, so this does not prove why capacity failed. Two actual-app rechecks after correction still returned extraction503 after the one allowed retry; analysis skipped. No further live experiments during financial work. Configuration remains gemini-3.8-flash/free tier. SDK2.30.0,45-second timeout,maxRetries0, one1–1.249second retry only on503; no quota/auth/timeout retry.

Remaining: complete real extraction AND property/scenario-analysis acceptance, malicious/noisy/multi-property live fixtures, bounded permitted-source URL Context investigation, target Node24/release tooling checks, source-use/republication review, project-wide license choice, public-host signing/abuse/provider-budget controls, final learner review and learning wrap-up/app map. Do not call this ready to ship or author submission/reflections for the learner. No public push/deployment authorized.

The current npm install reported existing ESLint peer warnings and five high advisories; no existing package versions changed when adding Recharts3.10.1 and its38 dependencies. A subsequent successful network-enabled audit reports zero production dependency advisories; all five reported paths belong to the development ESLint chain (braces3.0.3 via micromatch/fast-glob). The upstream advisory lists no patched version; do not blindly accept npm's suggested downgrade to Next14 lint tooling. See https://github.com/advisories/GHSA-vfj7-8cjw-p6xm. This is an advisory result, not proof that the app has no security defects. Resolve tooling/release assessment before public sharing; never force-upgrade dependencies blindly.

## Clean-install evidence

An isolated copy at `/private/tmp/bidwise-fresh-check-e6bh75l8` excluded .env.local, private learner profile and raw evidence. `npm ci --no-audit --no-fund`, Webpack production build, all60 unit tests and lint passed on Node26.10.0. Network permissions were needed for dependency resolution; the live workspace and its preview were preserved. Node24 is not installed at the checked standard locations and remains unverified.

## Next work

Save the reviewed financial checkpoint, then resolve outstanding live-provider and release gates. Invite feedback on the now-usable financial UI without marking the final review complete. The user's early review is already accepted; final completion still needs the actual full-journey review. `devpost/checklist.md` is the approval/progress authority; preserve both AI features and all approved financial behavior.
