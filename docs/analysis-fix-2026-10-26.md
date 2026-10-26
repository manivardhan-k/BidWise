# Analysis and click feedback — October 26, 2026

The learner reported `invalid_output / numeric` using the source example and unwanted purple outlines around section headings after button clicks. They then asked for a consolidated AI take and suggestions instead of repeated record fields.

## Root cause and changes

A bounded public Richardson replay reproduced numeric claims citing `rent_assumptions` and `flip_assumptions`, which are text/JSON containers rather than scalar numeric evidence. The cited amounts existed inside those containers, but could not pass the exact typed reference check. The route now supplies individual numeric assumptions, including zero and repair-row values, while retaining the complete context. Unknowns and labels are not promoted to numeric evidence.

Groq now selects compact exact `ID=value` reference strings from a schema enum. The adapter resolves only known pairs to the existing numeric-claim objects, adds the already validated numeric reference IDs to the displayed evidence list, then runs the unchanged exact-value and finding-reference validator. A regression reproduces a valid numeric reference omitted from the model’s duplicate evidence list; deterministic linking fixes it without accepting invented IDs or values. Fabricated, mismatched and rounded references still fail; no tolerance or invented replacement explanation was added. A larger numeric-union schema passed tiny controls but was rejected for the full report, so it is not the implementation. The compact enum avoids that provider limitation and extra schema bulk. One request per operation, existing model, Free account and no automatic provider fallback remain unchanged.

The analysis instructions now request a conditional research judgment, decision-relevant implications and up to three prioritized actions, tied to the property's evidence. The UI separates “BidWise’s take”, “What drives this view” and “Recommended next steps”. It does not provide an unconditional purchase verdict or automatically choose the user's rental/resale strategy. Detailed source fields stay available above.

The heading focus outline introduced in the usability pass is removed. Programmatic heading focus remains for accessibility; interactive controls retain keyboard focus indicators.

## Evidence and limits

- Reproduced the original numeric failure before changes; new provider/route and heading tests failed before their fixes.
- 116 unit tests passed, including decimal precision, wrong references, missing values and independent scalar assumptions. Typecheck and lint passed.
- 34 browser cases passed against an isolated production snapshot, including the new take/next-step layout and heading-click/keyboard behavior. Shared-preview restarts initially interrupted a run; the isolated preview and separate artifacts avoid those collisions.
- A source-only live control passed after scalar references. A fuller production control still failed; a subsequent control hit the free token quota. Following the compact-reference change, the saved public-example case with 19 starting values returned four validated findings in one request. These are individual controls, not an uptime or semantic-accuracy guarantee.
- No private user paste, key, raw provider error or production request was logged. Public-example generated test allowances remain temporary local artifacts, outside Git. Concurrent UI work is preserved and excluded from this fix's commit.

The source example is a public-data diagnostic, not a listing, valuation or investment recommendation. Full noisy-page/semantic, manual assistive-technology and final learner acceptance remain open.
