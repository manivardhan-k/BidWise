# BidWise

New Jersey property research with visible evidence and explicit unknowns. **Build in progress:** NJ address autocomplete, parcel confirmation, 30 property-record fields, flood screening and a responsive Mapbox report work locally. Copied-page processing includes target selection and typed claim comparisons. Editable renovation, cash resale and basic cash rental tools are implemented, with automatic starting values and visible basis/uncertainty. Successful end-to-end live Gemini acceptance and release readiness remain unfinished.

## Local setup

Use Node 24 LTS (target); current checks ran on Node 26.10.0. Install with `npm ci`, then `cp -n .env.example .env.local`. Edit that file locally; never paste keys into chat or commit it. Choose `AI_PROVIDER=groq` with `GROQ_API_KEY` and `GROQ_MODEL=openai/gpt-oss-120b` for the Free-tier Groq trial, or leave `AI_PROVIDER=gemini` for the existing Gemini setup. Configure a **public** Mapbox token after checking actual account allowances. No paid tier or card is needed for the selected local workflow.

Run `npm run dev`, then open http://localhost:3000. Enter an NJ address or use the source example, find its parcel, check the block/lot and confirm. `75 Richardson St, New Brunswick, NJ` is a real source-data example; listing availability is not checked. Address suggestions use NJGIN’s public no-key service, adding no paid search API; the index can miss real addresses. Available records remain usable during map/AI/source failures. The expanded report shows useful source fields, readable full-year deed dates with the source interpretation disclosed, missing entries and explicit coverage gaps. No complete-history, condition/title or investment-return guarantee.

Choose **Copied page text** to paste up to 50,000 characters of public property information you have the right to supply. The selected AI provider extracts quoted claims; multiple targets require selection, then parcel confirmation. URL-only input is never fetched. Failed extraction preserves your paste. Copied claims are not official records; price types and unknown details stay distinct. Extraction remains subject to the selected provider’s availability and free-account limits.

After confirmation, **Explore the numbers** fills available starting values before asking the configured AI provider for broad cost allowances. Quoted asking price, historical tax, older tract-level Census medians and illustrative fee/schedule assumptions have different labels. Census Reporter is an independent ACS mirror; no additional API key is needed. Area medians are not current property valuations or rent forecasts. Review the basis, edit any input or restore defaults explicitly. Refresh preserves your edits and cleared fields; HOA dues and your target profit still need your input. Failed AI leaves the source-based seeds usable. See [starting-value verification](docs/starting-estimates-checkpoint-2026-10-23.md).

Keys, pasted text and report drafts are not persisted by the application. Confirmation expires after 15 minutes or server restart; search again. The current confirmation secret is process-local. Public/multi-instance deployment needs shared signing-key provisioning, host-level abuse controls and provider-budget verification before sharing a URL.

## Verification

- `npm test` — provider/domain/identity/AI guards; no live model calls.
- `npm run typecheck` and `npm run lint`.
- `npm run build` — Next production build using its supported Webpack mode; the local sandbox blocks Turbopack's Tailwind worker port.
- `npm start` — serve a successful production build.
- `npm run test:e2e` — browser regressions with fictional provider fixtures; no map or AI credits used. Install the bundled browser with `npx playwright install chromium`, or use an existing Chrome via `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:e2e`.
- `npm run probe:gemini` — read-only metadata by default; add `-- --case=logged` to explicitly replay the fixed public arithmetic prompt once. See [API diagnosis](docs/gemini-api-diagnosis-2026-10-22.md).
- `npm run probe:estimates` — source-only starting values for the public Richardson example, no model/map call. Add `-- --model` only for an explicit bounded Gemini cost-allowance check.
- `npm run probe:data` — three public-building controls, or append up to three NJ addresses. Writes ignored local evidence; no owner fields requested.
- `node --import tsx scripts/probe-ai.ts` — **explicit live free-tier probe**, only after local configuration and account verification. At most one delayed primary retry for HTTP503, then one configured free3.5 Flash-Lite fallback only if that retry also returns503; stops on all other failures. Normal tests never run it.

Current measured state: **85 unit tests, 23 browser tests, typecheck, lint and production build passed**. Real address→confirmation→records works in production; a real Mapbox report was inspected. Both AI functions succeeded in a temporary3.5 control; the preferred3.8 API continues to return503, and later3.5 requests can also fail. Full live journey/semantic acceptance and release readiness remain pending. The approved bounded fallback is configured, with actual model labels and unchanged validation. Known development-tool advisories/peer warnings and the untested Node24 target are documented. A clean Node26 install, build, unit tests and lint also passed in an isolated copy without credentials.

See [data feasibility](docs/data-feasibility.md), [build handoff](docs/build-handoff.md), [approved specification](devpost/spec.md) and [checklist](devpost/checklist.md). The financial tools keep missing costs unknown, calculate Base/Downside resale and recurring rental cash separately, and mark AI commentary outdated after edits. Inputs/results are recomputed on the server for AI review; that live review still needs acceptance. See [financial verification](docs/finance-verification.md) and [third-party notices](THIRD_PARTY_NOTICES.md). Nothing has been pushed beyond the original repository baseline.

Groq trial: strict structured output plus unchanged quotation/evidence/numeric checks; one45-second request per operation, no automatic retry or cross-provider fallback. Keep the Groq account on Free. Long copied pages or several report operations may hit token limits; failures preserve input/source evidence and explain the category. See [Groq trial verification](docs/groq-trial-2026-10-26.md).
