# Gemini reliability check — October 20, 2026

## Result

The learner explicitly asked to retry Gemini and investigate other developers' experiences. **No verified repair yet.** The configured model remains `gemini-3.8-flash`; no environment file, billing, provider or application request format was changed. Diagnostics used the existing user-authorized free-tier key; no keys, raw provider exceptions or raw error bodies were printed or committed.

Observed this round:

| Bounded check | Observed outcome | What it establishes |
|---|---|---|
| Existing app extraction probe, configured 3.8 Flash | HTTP 400, one attempt; analysis skipped | A new request failure distinct from the earlier overload response. Its validation reason is not yet established. |
| Direct REST 3.8 with app extraction schema | HTTP 503 in about 0.8 seconds | The service still rejects a small request as unavailable. |
| SDK 3.8, tiny text prompt, no JSON schema, low thinking, 256-output-token cap | HTTP 503, high-demand category, about 1.8 seconds | Failure is not confined to BidWise's large evidence input or schema. |
| App extraction with a short public parcel excerpt | Timeout after 45 seconds; one attempt | The configured deadline is enforced; no timeout retry loop. |
| SDK 3.5 Flash-Lite, same tiny prompt/profile | Completed in about 14.3 seconds, but exact expected output check did not pass | Transport completion only, not an accepted extraction/analysis result. |
| Both app operations with temporary process-only 3.5 Flash-Lite override | Extraction HTTP 400 in about 1.7 seconds; analysis skipped | The reported alternative is not yet a working drop-in replacement for BidWise. |
| Direct REST 3.5 Flash-Lite with app extraction schema | HTTP 400 on bounded checks | Confirms a structured-request compatibility issue remains to isolate; do not claim its exact cause or weaken validators speculatively. |

Fixed-vocabulary diagnostics did not identify a specific offending request field. No raw error text was retained. The app already uses the documented `v1beta/interactions`, `input`, `response_format.type=text`, `mime_type=application/json`, and `schema` structure. Installed SDK 2.30.0 bridges the 45-second timeout and zero SDK retries correctly. Neither an endpoint migration nor an SDK upgrade has been demonstrated to repair this case. Do not classify every HTTP 400 as capacity or infer that the API key is invalid.

Local ignored evidence: `docs/evidence/gemini-probe.json` and `docs/evidence/gemini-flash-lite-probe.json`. Temporary diagnostic scripts under `/private/tmp` are not application code or committed artifacts.

## Reports and remedies found

- **Closest matching case, October 6–9:** [Gemini 3.8 Flash API returns 503, but AI Studio works](https://discuss.ai.google.dev/t/gemini-3-8-flash-api-returns-503-but-ai-studio-works/187076). The original poster describes a free-tier project and even a one-line API failure while Studio succeeds. Another developer reports successful local development with 3.5 Flash-Lite. Google's forum response attributes 503s to overload. This is primary user-reported experience, not proof the alternative meets BidWise's schema or quality requirements.
- **Google's pinned guidance:** [Handling 429 / 503 errors](https://discuss.ai.google.dev/t/handling-429-503-errors-from-the-gemini-api/124640). Google distinguishes 503 overload from quota and recommends capped retries/backoff. [Official troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting) also recommends jitter, maximum retry counts and checking API/model compatibility. BidWise already owns a maximum one-retry budget for 503 and does not stack SDK retries. More retries can mask an outage and increase latency; no infinite retry or success guarantee.
- **Recent timeout case, October 19:** [3.8 Flash reaches client deadline before response headers](https://discuss.ai.google.dev/t/gemini-3-8-flash-generatecontent-reaches-client-deadline-before-response-headers/188354/2). Google's response confirms the described free-tier configuration is supported and attributes that user's timeouts to demand. That does not establish the cause of our separate 400 response.
- **A reported endpoint fix on 3.7:** [First-person report of migration to Interactions](https://www.reddit.com/r/GeminiAI/comments/1vofwap/paid_gemini_api_project_gemini37_flash_constantly/). The author reports an endpoint/request-format migration fixed their case. This is an anecdote about a different model. BidWise already follows the [official Interactions quickstart](https://ai.google.dev/gemini-api/docs/get-started), which currently documents `v1beta/interactions` and `input`; do not copy an undocumented `user_input`/version change from the thread.
- **Billing is not an established repair:** [Persistent 503 with file_data](https://discuss.ai.google.dev/t/persistent-503-unavailable/167927) reports that upgrading did not resolve a file-specific failure. BidWise sends text, so this is not the same failure, but it does not support telling this learner to pay as a fix.
- **Alternative's cost checked:** [Official pricing](https://ai.google.dev/gemini-api/docs/pricing) lists text input/output for 3.5 Flash-Lite as free of charge on the free tier. The diagnostic enabled no tools, search, maps or paid inference tier. Availability/quality remains separate from price.

A public status page did not expose a readable current service state to the text browser. No global outage or recovery claim was made.

## Next action

Keep both required Gemini roles. Isolate the HTTP 400 using a minimal documented JSON response schema and privacy-safe error classification before changing the adapter; compare a minimally constrained schema with the current schema while retaining full local validation. If a model/format combination passes, test extraction attribution, multi-property clutter, prompt-injection resistance and evidence-grounded analysis before adopting it. Separately preserve the existing unavailable-state behavior during overload.

The approved next product slice is copied-page text extraction, quoted claims, property confirmation and claim-versus-record comparisons, followed by renovation and cash resale/rental scenarios. The learner approved the early source/report/UI checkpoint with "looks good so far"; this is not completed AI acceptance or readiness to publish.
