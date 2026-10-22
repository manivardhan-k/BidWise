# Deterministic financial checkpoint — October 22, 2026

Implements the approved renovation, cash resale and basic cash rental behavior. All amounts are user assumptions, not provider valuations, contractor quotes or rent forecasts. No debt service, income-tax calculation, strategy ranking or return guarantee is supplied.

## Accounting and acceptance

Shared renovation has editable quantity and low/base/high unit costs, percentage contingency and a separate dollar unknown-condition reserve. Each total is line costs × (1 + contingency) + reserve. Resale includes that total once. Costs must be finite and nonnegative, and ranges ordered. An explicitly empty repair list means no modeled repair lines; contingency/reserve still require explicit values.

Resale uses the approved project-cost, selling-cost, profit, ROI-on-cost, break-even and maximum-bid equations. Base uses base renovation; Downside uses high renovation and editable stress inputs (initially 10% lower resale, three extra holding months and one extra seller percentage point). These are assumptions, not forecasts. Negative profit remains visible; an impossible target has no nonnegative bid. Zero project cost withholds ROI. Combined seller fees including stress must be below 100%.

The approved fixture yields project cost $136,000, selling costs $16,000, profit $48,000 and maximum bid $118,000. Substituting that maximum bid returns the $30,000 target profit. Additional checks cover purchase-proportional closing fees, nonzero contingency, allowance single-counting, missing versus zero inputs, invalid ranges/fractions, overflow and impossible bids.

Rental computes effective annual rent after vacancy, management on effective rent, operating expenses, operating income and a separately deducted capital reserve. The approved fixture yields $12,720 annually /$1,060 monthly after reserve. Full vacancy retains a $7,800 annual cash loss for that fixture. Missing insurance stays incomplete rather than becoming zero. Rental completeness is independent of resale/renovation; shared purchase and renovation are acquisition context, not duplicate annual deductions or a complete rental project budget.

## AI snapshot boundary

The browser updates ordinary-code results immediately. Analysis receives assumptions, never a client-authoritative profit figure. The server validates and recomputes with the same engine, adds typed result/evidence IDs, and hashes the canonical scenario with identity and fresh source results. Responses include canonical inputs/results and an input key. Browser guards reject old property, old scenario and mismatched-key responses. Editing assumptions labels existing successful commentary outdated; an in-flight superseded result is ignored. An identical successful review may be reused for 60 seconds; new/failed requests remain explicit. Provider failures leave calculations and evidence usable.

Inputs are not persisted by BidWise; they are transmitted to Gemini when analysis runs. Do not describe browser-session state as never leaving the browser. Raw financial scenarios are not placed in URLs or logged.

## Verification evidence

- 60 unit tests in total, including seven financial engine tests and server-side canonical recalculation coverage.
- 18 browser regressions, including fixture calculations, edits, shared renovation context, chart/table agreement, independent completeness, mobile overflow and stale AI rejection.
- Typecheck, lint and Webpack production build pass. Production source smoke still returns 30 fields /24 available for the documented Richardson example; parse URL/over-limit guards return 400/413 without Gemini calls.
- Recharts 3.10.1 is locked. Its chart uses the engine's five sensitivity points, disables animation, enables its accessibility layer and has a visible equivalent table. [Official installation guide](https://recharts.github.io/en-US/guide/installation/).
- Agent inspected rendered production-test fixture screenshots at `/private/tmp/bidwise-finance-desktop-test.png` and `/private/tmp/bidwise-finance-mobile-test.png`. This is a rendered-layout check using fictional fixtures, not a new real-property live-model acceptance. Interactive Work browser access is disabled.

A clean isolated Node26 install, production build, all60 unit tests and lint also pass without copying credentials. Node24 remains unverified. A successful npm audit reports zero production advisories and five development ESLint-chain advisory paths; no forced dependency downgrade was applied.

Live Gemini scenario interpretation and the complete live extraction/analysis journey remain pending because of observed 503 failures. Final learner review, public release/runtime/source-use gates and URL Context feasibility remain open. Main slice boxes are not completion claims until those required checks are resolved.
