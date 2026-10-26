# BidWise usability review, October 26, 2026

The learner asked to perfect the project and make everything user friendly after handing over the finished UI. Preserve that visual direction and the full approved property/scenario scope. The checks below concern practical task completion, not a claim of perfection or investment suitability.

## Findings and acceptance criteria

- P1: The address field accepts edits while matching is in flight. Disable the active input and preserve its contents when cancelling; reject stale results.
- P1: Reconfirming the same parcel resets scenario edits. Preserve in-page drafts by confirmed parcel, including cleared fields; never carry them into another parcel. No browser storage or saved raw page.
- P1: Rental advertisements have no separate price type. Support quoted monthly rent and reject explicit monthly-rent text masquerading as purchase asking price. Do not equate advertised rent with an actual lease or valuation.
- P2: Long reports are difficult to navigate on a phone. Add section links and a compact record-availability explanation; make the current property and unresolved match warning easy to find.
- P2: AI explanations expose internal evidence IDs, and failures expose technical model wording. Use readable source names and direct recovery guidance, keeping sanitized diagnostics available separately.
- P2: Number-field errors only appear in a remote section summary. Mark invalid fields, attach inline messages and preserve the user's value for correction.
- P2: Map failure offers no recovery. Add a scoped retry without rerunning records or AI. Keep the map independent of source results.
- P2: Source buttons, input-mode controls and fine print are small; the mobile address input can trigger input zoom. Increase control targets and mobile input font size, preserve focus and reduced motion, and check narrow screens/enlarged text.
- P2: Copied-page help still names Gemini during a Groq trial. Describe the selected AI provider accurately, with no promise that a website was fetched or facts certified.

## Verification plan

Use existing financial/identity/receipt regressions plus targeted browser tests for cancellation, offline recovery, same-parcel drafts, different-parcel isolation, invalid fields, readable AI sources, map retry, touch targets and report navigation. Inspect desktop/mobile rendered states. Provider fixtures avoid extra live model/map consumption. Run unit tests, typecheck, lint, production build and browser checks after implementation. Manual screen-reader certification and full noisy-page semantic/model acceptance remain separate from automated tests.

## Preserved behavior

Keep source dates/caveats, every available record field, independent source failures, unknowns, model provenance, canonical numeric checks, explicit parcel confirmation, copy/paste privacy, editable estimates, negative scenario results, charts with equivalent tables, and source disagreement warnings. Gemini remains selectable; the authorized free Groq trial is active locally. No paid service, billing change, public push or deployment.

## Resolution and measured checks

All findings above are implemented. The final source-link review caught missing flood/history anchors; both were fixed and every report/AI reference target is now checked in the browser regression. Purchase/rental quotation guards also withhold a monthly-rent claim with no explicit monthly period and a copied amount that overflows to infinity.

- 111 Vitest tests across 18 files passed, including new rental-price separation, quoted monthly-period and copied-amount overflow boundaries.
- All 32 production Playwright regressions passed (30 in the final full run plus two source-dialog selector corrections rerun successfully): the existing 25 plus seven focused usability cases. Their fixtures cover no live model/map/data services and do not spend account quota.
- Typecheck, lint and the Webpack production build passed. The preview is served from the canonical checkout on port3100. The source-link and print-metadata cases passed after the final corrections. The two existing popover assertions now target the actual dialog, avoiding the intentionally hidden print copies; their behavior and Escape/focus checks are unchanged.
- The empty and populated mobile reports returned zero automated axe violations for WCAG2A,2AA and2.1AA tags. No rules were disabled. The map placeholder's original 4.47:1 text contrast was corrected; the tested source/mode/example controls are at least44×44px.
- Reviewed rendered 1440px desktop,390px mobile and AI-panel fixture screenshots. The browser checks include320px reflow, printable report content, active-input cancellation, offline paste recovery, invalid field recovery, same-parcel edited/cleared drafts and different-parcel isolation.

Artifacts (fictional test property/AI, not a live property assessment): `/private/tmp/bidwise-usability-desktop.png`, `/private/tmp/bidwise-usability-mobile.png`, `/private/tmp/bidwise-usability-ai.png`. Runtime artifacts remain outside Git. Print includes the field caveats, original source values when present, publication/retrieval dates and source links that are normally in a popover. Those details are hidden on screen and tested for print visibility. Native Print report allows the browser's print/save-PDF workflow; no PDF upload service or account was introduced.

The final production client scan covered26JavaScript chunks and found neither configured Gemini nor Groq server key. Keys/private learner context/runtime artifacts remain ignored and outside the intended commit.

## Remaining limits

Automated checks and screenshot inspection are not full screen-reader certification, source completeness or AI semantic approval. Live browser control is disabled in Work settings, so this usability pass used the development regression harness for rendered review. Manual assistive-technology review and the learner's final full-journey feedback remain pending. Free provider availability, address coverage, uncertain identity and unverified condition/title/market inputs are still disclosed. No facts were invented to hide these gaps; all available adapter fields and approved scenarios remain in the product.
