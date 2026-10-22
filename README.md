# BidWise

New Jersey property research with visible evidence and explicit unknowns. **Build in progress:** NJ address autocomplete, parcel confirmation, 30 property-record fields, flood screening and a responsive Mapbox report work locally. Copied-page processing includes target selection and typed claim comparisons. Editable renovation, cash resale and basic cash rental tools are also implemented. Successful end-to-end live Gemini acceptance and release readiness remain unfinished.

## Local setup

Use Node 24 LTS (target); current checks ran on Node 26.10.0. Install with `npm ci`, then `cp -n .env.example .env.local`. Edit that file locally; never paste keys into chat or commit it. Configure the Gemini key/model and a **public** Mapbox token after checking actual account allowances. No paid tier or card is needed for the selected local workflow.

Run `npm run dev`, then open http://localhost:3000. Enter an NJ address or use the source example, find its parcel, check the block/lot and confirm. `75 Richardson St, New Brunswick, NJ` is a real source-data example; listing availability is not checked. Address suggestions use NJGIN’s public no-key service, adding no paid search API; the index can miss real addresses. Available records remain usable during map/AI/source failures. The expanded report shows useful source fields, readable full-year deed dates with the source interpretation disclosed, missing entries and explicit coverage gaps. No complete-history, condition/title or investment-return guarantee.

Choose **Copied page text** to paste up to 50,000 characters of public property information you have the right to supply. Gemini extracts quoted claims; multiple targets require selection, then parcel confirmation. URL-only input is never fetched. Failed extraction preserves your paste. Copied claims are not official records; price types and unknown details stay distinct. Extraction uses Gemini and remains subject to its service availability.

Keys, pasted text and report drafts are not persisted by the application. Confirmation expires after 15 minutes or server restart; search again. The current confirmation secret is process-local. Public/multi-instance deployment needs shared signing-key provisioning, host-level abuse controls and provider-budget verification before sharing a URL.

## Verification

- `npm test` — provider/domain/identity/AI guards; no live model calls.
- `npm run typecheck` and `npm run lint`.
- `npm run build` — Next production build using its supported Webpack mode; the local sandbox blocks Turbopack's Tailwind worker port.
- `npm start` — serve a successful production build.
- `npm run test:e2e` — browser regressions with fictional provider fixtures; no map or AI credits used. Install the bundled browser with `npx playwright install chromium`, or use an existing Chrome via `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run test:e2e`.
- `npm run probe:data` — three public-building controls, or append up to three NJ addresses. Writes ignored local evidence; no owner fields requested.
- `node --import tsx scripts/probe-ai.ts` — **explicit live free-tier probe**, only after local configuration and account verification. At most one delayed retry for HTTP 503; stops on service failure. Normal tests never run it.

Current measured state: **60 unit tests, 18 browser tests, typecheck, lint and production build passed**. Real address→confirmation→records works in production; a real Mapbox report was inspected. Successful live AI analysis/extraction and release readiness remain pending. Known development-tool advisories/peer warnings and the untested Node24 target are documented. A clean Node26 install, build, unit tests and lint also passed in an isolated copy without credentials.

See [data feasibility](docs/data-feasibility.md), [build handoff](docs/build-handoff.md), [approved specification](devpost/spec.md) and [checklist](devpost/checklist.md). The financial tools keep missing costs unknown, calculate Base/Downside resale and recurring rental cash separately, and mark AI commentary outdated after edits. Inputs/results are recomputed on the server for AI review; that live review still needs acceptance. See [financial verification](docs/finance-verification.md) and [third-party notices](THIRD_PARTY_NOTICES.md). Nothing has been pushed beyond the original repository baseline.
