# Free Groq trial — October26,2026

User authorization: the learner requested a free alternative to Gemini, obtained a Groq key, asked where to put it and said “lets try that.” The key was entered locally into ignored `.env.local`; it was never printed or committed. The learner answered “done” to saving it and keeping the account on Free. No account/billing changes or credits were purchased.

## Implementation

`AI_PROVIDER=groq` explicitly selects the fixed `https://api.groq.com/openai/v1/chat/completions` endpoint and allowlisted `openai/gpt-oss-120b`. Gemini remains selectable with its existing bounded503-only fallback. No cross-provider retries or automatic model/account upgrade. One45-second request, strict JSON schema, low reasoning,2400completion-token ceiling, no tools/streaming, no response cache, and redirect refusal. Local quotation/schema/evidence/numeric/range limits are unchanged. Identical task instructions are shared. Strict format is not factual verification.

The selected provider serves all three operations: copied-text extraction, canonical property/scenario analysis and provisional cost allowances. Route responses identify actual model/provider. AI loading text no longer falsely names Gemini. Source labels for allowances use the actual model. Errors expose safe category/model/attempts plus a fixed validation stage for Groq; raw provider payloads, supplied pages and keys are not logged or retained. Identity-review gates, source-first seeds and human edit/stale-response protections remain.

## Free-account limits

[Groq rate limits](https://console.groq.com/docs/rate-limits) currently list30requests/minute,1000/day,8000tokens/minute and200000tokens/day for this model. The actual account limits page is authoritative. Multiple report operations and long copied pages may exhaust tokens before request count. The50,000-character application input cap remains; it does not promise every free-tier request fits available quota. No truncation, retry loop or paid fallback is used. Keep the account on Free; an API integration cannot certify or freeze the account’s billing tier. [Strict structured output](https://console.groq.com/docs/structured-outputs) is supported for GPT-OSS120B; evidence and numeric checks remain necessary.

## Verification so far

108unit tests, typecheck, lint, Webpack production build and25production browser regressions pass. Browser regressions mock provider calls. Live Groq extraction of a short public/synthetic Richardson example passed exact-quotation validators in about0.9seconds. A complete canonical source→analysis route control returned available in about1.6seconds with source records and flood results available. These are individual observed timings, not an SLA. Live browser journey and allowances are recorded below after completion. No private user paste was used for diagnostics.

## Runtime and shared work

Concurrent UI work holds the main checkout’s `.next/dev/lock`. The tested production snapshot was built in `/private/tmp/bidwise-groq-preview-_db_r1uk`, using a node_modules symlink and a symlink to the ignored local env. No extra plaintext key copy was created. Port3100/session98432 serves that isolated snapshot. It will not automatically include later UI edits; rebuild a fresh snapshot or build the canonical checkout once its dev process stops. Preserve all unrelated dirty UI/dependency/doc edits and stage only this integration’s changes. Full learner retry, noisy/multi-target semantic acceptance and release readiness remain pending.


Final backend follow-up: the first fuller browser analysis failed local evidence validation, so strict provider schemas now restrict evidence-ID fields to the exact current evidence keys; local numeric checks still run. A subsequent full report with those constraints passed with5findings. A separate fuller assumptions control encountered a provider bad-request response; tiny synthetic analysis and the later full report succeeded. Do not call this guaranteed or fully semantically accepted. Browser allowances returned7model allowances plus13source/illustrative starting values. The normal combined checkout built successfully after the user handed over completed UI work; port3101 development was stopped and port3100/session91762 now serves the canonical build.108unit tests/typecheck/lint and25browser regressions passed before the final evidence enum addition;108unit/typecheck/lint and production build also passed after it.

## Final browser result and usability follow-up

After the strict evidence-ID enum change, the actual canonical browser journey returned six findings and 19 starting values, including model allowances. This supersedes the earlier pending-browser note; it does not close broad noisy-page/semantic acceptance. No private pasted page was used. The temporary isolated snapshot and UI development server are superseded by the combined canonical production preview on3100. Backend and handed-over UI were saved separately as0d513ad andb1545ee. Subsequent usability checks are documented in `docs/usability-review-2026-10-26.md`; no additional live model requests were required for them. Failure copy now leads with a recovery action while sanitized model/category/attempt/validation details remain available in the report.
