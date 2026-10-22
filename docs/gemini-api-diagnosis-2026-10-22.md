# Gemini API versus Studio diagnosis — October 22, 2026

The learner supplied an earlier completed 3.8 Flash arithmetic interaction, then reran the prompt successfully in AI Studio during this investigation. That is current evidence of Studio success. It does not establish that the API-key path is healthy or that Studio selected the same Cloud project.

## What the controlled calls establish

All API controls read the key directly from `.env.local`; no inherited key was present. No key contents were printed, no billing changed, and no replacement key/project was created.

| Control | Observed result |
|---|---|
| Exact supplied request, including models/ prefix, step input, store=true, 65536-token ceiling and medium thinking | HTTP503, explicit high-demand message |
| Minimal 3.8 request, no schema or application code, store=false | HTTP503, same high-demand message |
| Minimal 3.8 request on stable v1 Interactions | HTTP503, same high-demand message |
| Same 3.8 arithmetic prompt through generateContent | HTTP503 /UNAVAILABLE, high-demand message |
| Model metadata for3.8 and3.5 Flash-Lite | HTTP200; listing is not successful generation |
| Same key, tiny3.5 Flash-Lite generation | HTTP200, correct arithmetic answer |
| Actual BidWise extraction and analysis functions with temporary3.5 override, public/synthetic quoted text and illustrative financial evidence | Both returned, passed local quotation/schema/reference/numeric guards; output inspected |
| Configured3.8→3.5 policy, real public-record probe | Extraction succeeded through3.5 after two3.8 failures; a later analysis attempt received503 from all three attempts |
| Final production copied-page → signed claims → confirmed parcel → canonical analysis smoke | Extraction returned200 via3.5; identity and canonical financial calculations succeeded. Full-report analysis ended unavailable/network after three attempts, last model3.5. No synthetic AI explanation was substituted. |

This rules out the application schema as a necessary cause of the current3.8 failures: the minimal request has no schema. It also makes a universally invalid key or total account/network failure unlikely. It does not prove Google's internal scheduling cause, a global outage, or freedom from future project-specific issues.

Google currently lists3.8 Flash text input/output on the [free tier](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.8-flash). Its [error reference](https://ai.google.dev/gemini-api/docs/api-errors) distinguishes503 serving unavailability from403 permission failures and429 quota failures. A Google staff [reply to the same API-fails/Studio-works report](https://discuss.ai.google.dev/t/gemini-3-8-flash-api-returns-503-but-ai-studio-works/187076/3) attributes that symptom to overloaded services. Those sources and our observed error support API serving availability as the immediate blocker; they do not promise when it will recover. Do not present a paid upgrade, key regeneration, store=true or switching API versions as a verified fix.

## Learner-selected mitigation

The learner chose: keep3.8 preferred; use free3.5 Flash-Lite only after503 failures. `GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite` is configured locally and documented in the secret-free example. The policy is:

1. One primary request.
2. Only after503, one1–1.249second delayed primary retry.
3. Only if that retry also returns503, one configured free fallback attempt.
4. Stop. No fallback/retry on quota, authentication, bad request, timeout, network failure or invalid output. No alternate keys, paid models or providers.

Maximum three inference requests per operation; every attempt has a45-second timeout and SDK retries disabled. Disabling the fallback restores the prior two-attempt behavior. Only the verified, approved3.5 Flash-Lite fallback is accepted. Both models retain store=false, local limits, exact quotations, candidate/parcel binding and evidence/numeric validation. The response/UI identify the actual successful model and fallback origin; failures expose only category/model/attempt count, never raw provider errors. Each input path still receives analysis.

This is a bounded availability mitigation, not a guarantee:3.5 also returned503 in a later call. A valid JSON response is not certification of truth or a complete semantic-quality gate. Real noisy/multi-property and full live journey acceptance remains pending until actually observed.

## Repeatable diagnostics

`npm run probe:gemini` defaults to a read-only model-metadata request. Explicit generation examples:

```sh
npm run probe:gemini -- --case=logged
npm run probe:gemini -- --case=minimal
npm run probe:gemini -- --case=stable
npm run probe:gemini -- --case=legacy
```

Each case makes **one** request containing only the fixed public arithmetic prompt, with no automatic retries; it writes sanitized ignored local evidence. The logged case reproduces the learner's literal payload, including store=true, for public arithmetic only. Production private text remains stateless. Never put a key on the command line. Stop repeated generation diagnostics when serving failure is established; default tests use mocks.

Raw sanitized probe evidence stays under ignored `docs/evidence/`. The failed first production journey stopped at extraction and did not retain its underlying category, so it is not evidence of a specific additional cause. The final production smoke captured unavailable/network, three attempts and last model3.5 for full-report analysis. Its returned canonical calculations were still $48,000 one-time fixture profit and $12,720 annual fixture rental cash; these are hypothetical test assumptions, not property estimates. Full live journey acceptance has not passed.

## Requested next product change

The learner also requests editable property-specific starting estimates in Explore the numbers. This supersedes the entirely manual starting-input design; see `property-estimate-plan.md`. It is recorded, not implemented or silently replaced with arbitrary values. Gemini reliability takes priority in this turn.

Mechanical verification:69 unit tests,19 production browser regressions, typecheck, lint and production build pass. The mobile chart test now waits on the actual resize condition before checking overflow; it does not mask a persistent layout failure.
