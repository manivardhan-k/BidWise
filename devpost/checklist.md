---
doc: checklist
status: approved
---

# BidWise Build Checklist

Build mode: fast — selected by the learner on October 19, 2026. Verify and commit each slice; pause for the planned early and final hands-on reviews.

Usage boundary: monitor the Codex five-hour window and stop at 5% remaining (95% used), preserving an accurate handoff. Initial live check: 83% used / 17% remaining. No automatic limit reset or credit purchase.

Scope, PRD, spec and this build order are approved. The learner approved this order with "okay good" on October 19, 2026; no second order sign-off is needed. Fast mode is selected. Each slice is mechanically verified and committed. Both modes require learner feedback. Preserve the existing remote README/history and unrelated work. No paid usage, unrelated credential use or public push is authorized by this checklist.

## Slices

- [ ] **1. Prove real NJ data and both Gemini stages with a runnable probe**
  Becomes usable: A repeatable local command reports real property identities, parcel/flood fields, Gemini extraction/analysis, source links and explicit gaps. This is the skill's allowed critical-risk probe exception, not a mock app.
  Why now: Verify records, rights, model quality and actual limits before building UI around assumed fields. Provides evidence for the learner's tools/limits question.
  PRD ref: `prd.md > Property Input and Identity`, `Property Summary and Map`, `Detailed Evidence and Analysis`.
  Spec ref: `spec.md > Stack`, `Where It Runs and How Someone Tries It`, `External Services and Dependencies`, `Gemini URL Context Feasibility Investigation`, `Verification and Evidence`.
  Build: Integrate the remote baseline without overwriting local plans/skills; check Git privacy/staging. Bootstrap compatible locked dependencies, the minimal app scaffold and source probe within this slice. Provide env placeholders and local credential-configuration guidance; verify account billing/quota constraints before live calls. Test 2–3 authentic NJ inputs and Gemini extraction AND analysis. Investigate URL Context on permitted allowlisted sources, recording retrieval status, freshness, citations, quality and usage. Save `docs/data-feasibility.md`, attributed permitted samples and gaps; do not advertise universal URL import or bypass restrictions.
  Verify (mechanical): Run and inspect the probe's actual responses against the chosen real sample; exercise malicious text and model failures. Verify reported URL access and quoted support; record exact fields/endpoints/dates and model/account constraints. Confirm scaffold starts/typechecks without logging secrets. Missing credentials or untested provider calls remain pending, never passed.
  Learner check: Run the documented probe, inspect source links/statuses and discuss one actual provider/model limitation. In fast mode this may be combined with the early product checkpoint after slice 2; only record completion after learner feedback.
  Commit: `Verify NJ property data and Gemini extraction and analysis`

- [ ] **2. Enter an address and inspect a confirmed, sourced property report**
  Becomes usable: A real NJ address yields candidates, confirmation, map, available property/history/flood facts, unknowns and grounded Gemini property analysis in the intended layout.
  Why now: Delivers the distinctive evidence-first core early enough for useful learner feedback, using measured source contracts.
  PRD ref: `prd.md > The Core Journey`, `Screens and Layout`, `Look and Feel`, `Property Summary and Map`, `Detailed Evidence and Analysis`, `States and Boundaries`.
  Spec ref: `spec.md > Identity and Confirmation`, `Parcel Records Adapter`, `Flood Adapter`, `Evidence and Claim Comparison`, `Gemini Analysis and Supplementary Review`, `Map and Basic Summary`.
  Build: Implement address identification, confirmation, parallel per-source statuses, Fact/source display, original house marker and responsive light report. Preserve available basic/history fields and dates. Address input skips extraction only, not Gemini analysis. Include ambiguity/no-match/partial-source/map-failure states without invented facts.
  Verify (mechanical): Run identity/adapter/analysis tests, lint/typecheck and browser address-to-report checks with the real selected sample. Exercise ambiguity, no match, source timeout, missing fields and map failure. Inspect actual UI and verify map/summary/analysis share the same property and snapshot.
  Learner check: Start the app, enter the documented address, confirm the parcel, inspect evidence/explanations and report unclear behavior or layout changes wanted.
  Commit: `Add confirmed property report with grounded AI analysis`

- [ ] **3. Paste a whole property page and reconcile its claims**
  Becomes usable: Copied visible listing/notice text becomes target candidates and supported claims, then typed comparisons against confirmed official evidence. URL-only input retains the agreed fallback.
  Why now: Adds the second approved input path on a working evidence core and makes copied-page clutter/incorrect attribution testable end to end.
  PRD ref: `prd.md > Property Input and Identity`, `Detailed Evidence and Analysis`, `States and Boundaries`.
  Spec ref: `spec.md > Property Input`, `Gemini Extraction`, `Identity and Confirmation`, `Evidence and Claim Comparison`, `Important Failure Modes`.
  Build: Add bounded text extraction, exact supporting snippets, price kinds, clutter filtering and multiple-property confirmation. Show matches/differences/unverifiable/non-comparable claims with sources. Preserve paste/address fallback; expose a new URL path only after permitted access/source quality is evidenced and the product/spec revision is agreed. Never weaken source checks to force an import.
  Verify (mechanical): Test noisy pages, multiple properties, malformed/non-NJ/oversized input and prompt injection. Confirm related-property attributes never merge, assessment versus asking price is not a false conflict, and genuine same-kind discrepancies are explained. Test quota/invalid-model response paths without claiming success.
  Learner check: Paste the permitted notice/page example, confirm its target and inspect an extracted snippet/comparison. Try a link-only input and describe whether the fallback is understandable.
  Commit: `Add copied-page extraction and typed claim checks`

- [ ] **4. Edit renovation assumptions and explore cash resale outcomes**
  Becomes usable: Repairs, contingency and reserve feed Base/Downside profit, break-even, scenario max bid, an accessible sensitivity chart and Gemini scenario interpretation.
  Why now: Adds the first complete investment scenario while isolating accounting for focused verification.
  PRD ref: `prd.md > Renovation and Cash Scenarios`, `Detailed Evidence and Analysis`, `States and Boundaries`.
  Spec ref: `spec.md > Renovation Engine`, `Cash Resale Engine`, `Gemini Analysis and Supplementary Review`, `Verification and Evidence`.
  Build: Implement shared repair ranges, contingency/reserve, explicit resale/purchase/fees/carry inputs, editable downside and all approved outputs/chart. Label incomplete/invalid assumptions. Recalculate numbers immediately; mark earlier AI commentary outdated and refresh against the current canonical snapshot. Keep accounting in code.
  Verify (mechanical): Pass hand fixtures, max-bid round trips, single-counting of allowances, null/zero/negative/NaN/infinity cases, impossible bid and invalid fee sums. Browser-check chart/text/engine agreement and rejection of superseded AI responses.
  Learner check: Change resale price, a repair allowance and holding time; inspect changed numbers, refresh the AI explanation and compare its assumptions to the visible inputs.
  Commit: `Add verified renovation and cash resale scenarios`

- [ ] **5. Explore basic cash rental results alongside resale**
  Becomes usable: Shared property/repair assumptions support clearly explained monthly/annual rental income after modeled expenses and reserves, separately from one-time resale profit.
  Why now: Completes the learner-approved rental/resale scope using the tested evidence and calculation boundaries.
  PRD ref: `prd.md > Renovation and Cash Scenarios`, `Detailed Evidence and Analysis`, `Product Decisions`.
  Spec ref: `spec.md > Basic Cash Rental Engine`, `Renovation Engine`, `Gemini Analysis and Supplementary Review`, `Data Model`, `Verification and Evidence`.
  Build: Add rent, vacancy, operating costs and reserve inputs with plain-language help and null/explicit-zero handling. Keep cash-only/before-tax labels and independent scenario completeness. Explain cost context without claiming a complete budget from missing inputs. Extend grounded Gemini interpretation to both outcomes; no automatic strategy choice.
  Verify (mechanical): Pass the rental hand fixture, fraction guards, zero rent/full vacancy/negative outcome/missing-cost/reserve tests. Browser-check shared repair updates, independently incomplete scenarios and current-snapshot AI discussion of both outcomes.
  Learner check: Fill illustrative rental inputs, change rent/vacancy/maintenance and inspect how the different rental/resale outcomes are explained without promising returns.
  Commit: `Add basic cash rental scenario and outcome analysis`

- [ ] **6. Polish and verify the full real-property experience**
  Becomes usable: A polished accessible app completes the authentic journey and documented failure paths, with reproducible setup and a safe review candidate.
  Why now: Validate actual behavior and finish approved features before recording or calling the project ready to ship.
  PRD ref: `prd.md > What We're Building`, `Look and Feel`, `States and Boundaries`, `Non-Goals`.
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `Look and Feel`, `Accessible Explanations and Before-Purchase Checks`, `Important Failure Modes`, `Verification and Evidence`.
  Build: Finish mobile layout, restrained/reduced motion, keyboard/touch help, source details and honest loading/error/partial/stale states. Complete README, env example, license/notices, provider limitations and measured usage guidance. Exclude personal profile/credentials. Prepare the real-property demo path; public push/upload/submission still follow `6-ship` authorization.
  Verify (mechanical): Run relevant domain/adapter/AI-contract/browser checks, lint/typecheck and production build/smoke. Verify fresh install, actual desktop/mobile UI, keyboard/focus/contrast/reduced motion and the real demo flow. Inspect staged files/history for secrets, private context and unrelated work. Record passed checks and actual remaining gaps.
  Learner check: Start the documented app and freely explore the complete journey and awkward inputs. Report broken/confusing behavior and desired refinements before final-review completion.
  Commit: `Polish and verify the complete BidWise proof of concept`

## Hands-on Checkpoints

Current checkpoint: early source/report/map review completed on October 20. Learner tried the report, requested richer records, readable full-year dates and a correctly positioned scrollable autocomplete, then said "looks good so far." Those UI revisions are verified. Gemini live acceptance is still pending, so slices 1–2 remain unchecked; this is not build completion.

- [x] Early usable behavior explored — source/report/UI checkpoint approved with "looks good so far" on October 20 under the explicit sequencing revision. Requested UI feedback resolved and retried; full Gemini acceptance remains pending.
- [ ] Final kick-the-tires exploration and feedback completed — after slice 6. Learn mode also uses each slice's learner check; fast mode keeps these early/final checkpoints and adds others only when useful.

## Final Review

- [ ] Final review complete — agreed feedback resolved, verified, committed and retried; learner explicitly confirms ready to ship.

## Code Tour and App Map

- [ ] Learning activity complete — connect an actual BidWise action/provider limit/verification decision to reliable work with agents.
- [ ] Optional edit and transfer reflection addressed — offered once, declined or already covered, without a quiz.
- [ ] `devpost/app-map.html` generated from finished code, checked and shown, with real code pointers and a project-grounded practice to reuse.

Activity and evidence: Not started; record only actual work and real paths/tests.
Route and stops: Choose from finished code; no invented learning activity.
Edit outcome: Not yet offered.
Reflection: Not yet offered; personal responses belong in the ignored profile.
Activity mode: Select the proportionate guided route or focused alternative during the single final wrap-up.

## Revisions

- October 20 learner instruction: "lets do the other stuff now" while considering Gemini reliability. Proceed with the source-backed report/map and other independent work while preserving both Gemini features and their pending live acceptance. Slice 1 stays unchecked; later source/UI milestones may proceed without claiming AI succeeded. No automatic provider/model switch or extra live Gemini probes while the learner considers it. Use explicit AI-unavailable states and keep the early hands-on review.

- October 20: Added sanitized Gemini failure categories and tests after opaque live-call failures. Required generation remains unavailable (503/timeouts); slice 1 stays unchecked and model configuration is unchanged. Stop further requests and resume this slice when generation can be verified. No scope cut or approval reset.

- October 20 early hands-on feedback: learner reported no result for `2211 Yosko Dr, Edison, NJ`, requested free autocomplete, readable deed dates and a more complete report. Live diagnostics returned no geocoder candidate/suggestion or matching Yosko parcel address in Edison; this establishes a source-coverage limitation, not an invalid address. Add explicit coverage messaging, no-key NJGIN suggestions and expanded non-personal record fields. Validate fixes before counting this checkpoint complete; the learner has not accepted the revised experience yet.

- October 20 follow-up: learner requests full four-digit deed years and the scrollable suggestion dropdown directly below the textbox. This supersedes the previous abbreviated-year presentation and mobile dropdown below the entire form. Preserve the original date and disclose the century interpretation; do not claim independent date verification. The final product has no fixed field-count target: 30 describes the current parcel adapter, while listing claims/comparisons, renovation, resale/rental calculations and analysis remain approved requirements.

- October 20: learner approves the current UI checkpoint ("looks good so far"), asks what comes next and explicitly authorizes another Gemini check plus research into other developers' reports. Resume bounded free-tier diagnostics; do not infer permission for paid upgrades or feature removal.

- October 22: resumed bounded Gemini diagnosis. Google staff reproduced a nested maxItems structured-output problem; omit that keyword only on the wire and retain local limits. A controlled 3.8 extraction succeeded once, but both actual-app rechecks still returned 503; full live AI acceptance remains pending. Added copied-page UI/API, quoted claim validation, conservative target-region checks, authenticated candidate-to-parcel binding and typed comparisons. 51 unit tests, 14 browser regressions, typecheck, lint and production build pass. This is a partial slice-3 checkpoint, not a checked full slice. Preview restarted at port 3100; fresh agent visual inspection is blocked by disabled local browser access. Continue the approved deterministic scenarios under the existing sequencing revision.
