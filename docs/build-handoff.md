# BidWise build handoff — October 26, 2026

## Current checkpoint

The learner approved the scope, PRD, spec and build order, chose fast mode, accepted the early source/report UI review, authorized the free Groq trial, handed over completed UI work and asked to make the project user friendly. Continue those decisions without re-interviewing or removing features.

Local app/Git root: `/Users/mani/current_projects/BidWise/app`, branch `main`. Nothing pushed or deployed. Saved checkpoints include `e871802` starting estimates, `a1b0216` precise parcel-conflict review, `0d513ad` explicit free Groq and `b1545ee` completed interface refresh. The usability increment is recorded in `docs/usability-review-2026-10-26.md`; use current Git for its final commit identity.

Stop at **5% remaining /95% used** in the Codex five-hour window; check live rather than relying on old percentages. No reset, purchase, billing/card change, paid fallback, public push or deployment is authorized. Stage only reviewed intended changes. Keep `.env.local`, learner profile, raw evidence and test artifacts ignored. The learner authors submission/reflection/narration.

## Working product

- Address or copied public-page text leads to NJ address/PIN/block/lot/qualifier choices and explicit confirmation. No site is fetched from a supplied URL. No guessed parcel or fabricated first-use property.
- NJGIN no-key suggestions can miss real addresses. A precise, unique same-lot/same-unit block conflict can be explicitly selected for research with a persistent signed warning. Wrong/ambiguous lot or unit stays withheld; parcel-derived estimates/model allowances remain withheld while identity is unresolved. See `docs/data-feasibility.md`.
- All 30 non-personal parcel adapter fields, source links, dates, missing entries and caveats stay visible. Readable deed years retain the original YYMMDD value and inferred-century rule. Flood data loads independently; empty results and Zone X do not establish safety.
- Mapbox uses the original house marker and attribution. Completed coral/violet/light interface and self-hosted fonts are saved separately. Desktop map-left/summary-right stacks on mobile. See `docs/ui-refresh-2026-10-26.md`, `PRODUCT.md` and `DESIGN.md`.
- Copied text is bounded to 50,000 characters/320,000 request bytes. Exact quoted claims, conservative per-target checks and signed 15-minute candidate-to-parcel receipts prevent arbitrary claim swapping. Purchase asking price, advertised monthly rent, opening bid and judgment stay distinct. No raw-page cache/database.
- Deterministic renovation low/base/high costs, contingency and separate reserve feed independent cash resale and rental scenarios. Resale has Base/Downside, maximum bid, break-even and sensitivity chart/table. Null, explicit zero, negative outcomes, invalid values and numeric overflow are handled; no mortgage, automatic strategy choice or promised return.
- Source-first editable starting values distinguish copied asking price/rent, historical tax, dated area medians, illustrative assumptions and AI cost allowances. No assessment/nominal-sale/opening-bid substitution for purchase. ACS2024 geography and independent Census Reporter mirror require no new account/key. One-residential-dwelling/precision/MOE/suppression gates remain. HOA and target profit need the user's evidence/choice. See `docs/starting-estimates-checkpoint-2026-10-23.md`.
- Replies are bound to property/revision and substantive source evidence; late replies preserve edits, clears and repair rows. Explicit Restore replaces only available starting values. AI uses canonical server calculations and becomes outdated after edits; failed refreshes preserve earlier records/timestamps. Identical successful analysis can be reused for 60 seconds.

## Usability increment

Search locks its active input while matching and preserves entered text on cancel/network failure. Parcel choices and confirmed summary receive keyboard focus. Invalid financial amounts get associated inline errors without deleting the user's value.

In-page scenario drafts are keyed to confirmed parcel PIN, capped at ten, and retain edits/clears when researching that parcel again. Another parcel starts independently; reload clears all drafts. No localStorage/database was added.

Report and scenario navigation, readable AI source references, separate request diagnostics, a scoped map retry and native Print report improve long-report use. Printed fields retain source links, publication/retrieval dates, raw values when present and caveats from the interactive source popovers. Missing-record counts describe availability, not reliability. Small controls meet the tested 44px targets, mobile inputs avoid input zoom, narrow screens reflow and reduced motion remains supported. All supported rental quotations need an explicit monthly period; explicit rental text cannot seed a purchase price. Nonfinite copied amounts are withheld.

## AI configuration and measured results

Local ignored configuration explicitly selects `AI_PROVIDER=groq`, `GROQ_MODEL=openai/gpt-oss-120b` and the learner-supplied Groq key. The learner confirmed Free; no billing changes. All three roles use the same provider: extraction, property/scenario analysis and cost allowances.

Groq uses one 45-second fixed-endpoint request, strict JSON schema, exact current evidence-ID enums, 2,400 completion-token ceiling and unchanged local quote/numeric/range checks. No retry, cross-provider fallback, tools, streaming, raw payload logging or client key. Free token/request limits can interrupt work. Structured format and local validation do not certify prose accuracy.

Live short extraction, canonical report and allowance controls succeeded. An initial fuller report failed evidence checks; a fuller allowance control returned provider400. After strict evidence-ID enum constraints, a full report passed with five findings, followed by a real browser journey with six findings and 19 starting values. Earlier browser allowances had seven model allowances plus 13 source/illustrative values. These are observed individual controls, not a guarantee of availability or complete semantic acceptance. No private user paste was used for probes. See `docs/groq-trial-2026-10-26.md`.

Gemini remains selectable. Its existing policy prefers3.8, retries once only after503, then attempts free3.5 Flash-Lite only after a second503; SDK retries0 and 45 seconds per attempt. No fallback on timeout/quota/auth/network/invalid output. Studio success did not establish API health; prior API controls failed despite Studio working. Do not repeatedly probe without a new hypothesis or provider-state change. Actual model/fallback is labeled; failure details are sanitized.

## Verification and local preview

The usability increment has **111 unit tests and 32 production Playwright regressions passed**, plus typecheck, lint and Webpack production build. Existing financial/identity/receipt/stale guards remain covered. Browser fixtures intercept external model/map/data requests and use fictional property values. Empty/populated 390px reports have zero automated axe WCAG A/AA violations; this is not full manual accessibility certification. Desktop/mobile screenshots, 320px reflow and print visibility were reviewed. See the usability review for artifacts and acceptance limits.

Real identity→confirmation→records/source-starting-values smoke and the live Groq journey were verified at their prior checkpoints. No new live AI/map calls were needed for the usability pass. The client chunk scan compares configured server keys without printing them. Browser interactive control is currently disabled in Work settings; regression screenshots were used for this pass, not a claim of interactive review.

Canonical production preview: `http://127.0.0.1:3100`. The user handed over UI; the old UI development server on3101 was stopped and the isolated preview is superseded. Check the current owned process before restarting. Stop an owned preview before `npm run build`, then `npm start -- --hostname 127.0.0.1 --port 3100`. Development defaults to3000. Node26.10.0 is tested; Node24 target and fresh-install release checks for this increment are pending.

## Remaining acceptance

- Final learner exploration/retry of the complete journey and parcel-conflict review; resolve reported issues before marking final review complete.
- Full noisy/malicious/multi-target real-page semantic acceptance for extraction, analysis and allowances; bounded permitted-source URL Context investigation remains separate. Current success does not close these criteria.
- Manual screen-reader/assistive-technology review; automated axe results cover tested states only.
- The single learning wrap-up and finished-code app map after final revisions. Main slice/final-review boxes remain unchecked until their actual criteria pass.
- Target Node24, current fresh-install/release gates, project publication license/source-use review, and any public-host shared signing/abuse/provider-budget controls. Do not push/deploy or mark ready to ship.

## Latest analysis follow-up

The learner's source-example numeric failure was reproduced. Scalar assumption IDs plus compact exact reference tokens now prevent citing a JSON container as a number or changing the cited value. Local exact-value guards remain unchanged. The analysis now presents a conditional take, evidence-backed implications and prioritized next actions. Heading-focus boxes were removed; keyboard controls stay visible.116unit and34isolated browser cases pass. See `docs/analysis-fix-2026-10-26.md` for controls, the free-quota observation and remaining acceptance. Concurrent UI edits remain separate; inspect Git before staging.

## Latest estimate-consistency follow-up

The learner's repeated-property amount changes were reproduced: the old route made a new model call and returned different renovation values for the same input. Validated AI allowance sets now persist in ignored `.bidwise-cache/estimates` (optional server-only `BIDWISE_ESTIMATE_CACHE_DIR`). Exact property/evidence/provider/method matches reuse original values and generation time, including after a Node restart; source-phase hits skip the model request. Failure/corruption never overwrites a saved set, and changed evidence/method gets a different fingerprint. Human edits/clears remain protected. See `docs/stable-estimates-2026-10-26.md`; published multi-instance consistency needs shared durable storage. Preserve the output cache across local restarts and never commit it. No new provider or paid service was added.

## Copied-page follow-up

See docs/copied-page-fix-2026-10-26.md. Groq now chooses original source-line references instead of paraphrasing quotes; the strict validator checks reconstructed spans, narrowly recovers area formatting and /mo amounts, and requires an explicit construction-year label. The latest actual pasted rental page returned the correct main target and all4quoted numeric facts. The free OpenRouter comparison did not pass: Gemma's strict route was unavailable, and reasoning-disabled Nemotron added an unsupported build-year classification. Groq remains the app provider. See docs/openrouter-comparison-2026-10-26.md and scripts/probe-openrouter.ts (metadata only by default, opt-in fictional page only). Latest free OpenRouter budget48of50daily requests remaining; no purchases, paid routes or privacy-setting changes. The full production baseline passed137unit/37browser tests plus typecheck/lint/build. Final139unit tests, typecheck/lint/build and all3copied-page browser regressions passed after the year guard and shared-prompt/probe additions. Canonical preview http://127.0.0.1:3100 was restarted with the final build (owned session15961); temporary3110preview stopped. All34client chunks passed the3configured-server-key scan. Preserve concurrent PDF/UI work; its download test passed in the full baseline and its separate layout/acceptance evidence lives in docs/pdf-report-2026-10-26.md. Original final-review/semantic/release gates remain pending.
