# Free OpenRouter extraction comparison - October 26, 2026

The learner supplied a key and requested a more capable free model if Groq was misunderstanding copied pages. The app still selects Groq. Adding an OpenRouter key does not change extraction, analysis, saved allowances or the Gemini fallback policy.

The authenticated metadata check accepted the key, reported Free tier, and initially showed 0 of 50 daily free requests used. Four bounded request attempts used fictional text only: a main rental listing, split bed/bath/area lines, two related listings, rental/sale history, calculator prices and an instruction-injection line. No user page, contact details, scenario inputs or source records were sent to OpenRouter.

| Candidate | Result |
| --- | --- |
| `google/gemma-4-31b-it:free` | Two HTTP 404 results. The final sanitized error identified unsupported output controls; the advertised response-format capability did not establish an eligible strict-schema route for this request. Reasoning off did not resolve it. |
| `nvidia/nemotron-3.5-super-vl:free` | Low reasoning exhausted the 2,400-token completion budget before finishing. Disabling reasoning completed in about 3.5 seconds at reported cost 0, with the correct main target and four expected claims, but added an unsupported construction-year classification from history text. It failed the semantic acceptance gate. |

The larger Nemotron 3 Ultra free endpoint did not advertise response-format/structured-output support in the current catalog/endpoints check, so it was not called. Model size alone is not evidence of better task performance. NVIDIA's free endpoint also warns against personal/confidential uploads and describes session logging; it is unsuitable for a silent switch of arbitrary pasted pages containing contacts.

The comparison exposed a local guard gap: a quoted history year could satisfy literal source checks while being labeled `year_built`. The validator now requires an explicit construction-year label paired with the quoted year. Its regression first failed, then passed with the fix; existing valid build-year formats remain supported. This strengthens both configured app providers. It does not certify every other semantic classification or source truth.

No OpenRouter model passed this comparison, so no production adapter, automatic fallback or weaker output check was enabled. Groq's revised line-reference extraction already passed the learner's actual rental page. After the trials, a fresh account check reported **2 used / 50 daily free requests, 48 remaining**; the two routing failures were not counted in that observed snapshot. Limits and availability can change.

`scripts/probe-openrouter.ts` makes metadata calls only by default. An explicit `--run` sends only its fixed fictional fixture, checks the selected catalog entry has zero pricing, requires the Free account and more than five remaining demo requests, requests strict schema with zero-price routing, disables reasoning and provider fallback, and makes one bounded inference without retries. It prints fixed diagnostics and scores only, never raw provider output or credentials. It cannot take a pasted page or arbitrary model ID.

From the app directory, use `node --env-file=.env.local --import tsx scripts/probe-openrouter.ts` for metadata. Only when a new provider/model hypothesis warrants another comparison, append `--run --model=nvidia/nemotron-3.5-super-vl:free` or the allowlisted Gemma ID. Keep keys in ignored `.env.local`; no account, billing or privacy settings were changed.

Official references checked for this comparison:

- [Free catalog variants and paid fallback warning](https://openrouter.ai/docs/guides/routing/model-variants/free)
- [Endpoint-specific structured output support](https://openrouter.ai/docs/guides/features/structured-outputs)
- [Zero-price routing and required parameters](https://openrouter.ai/docs/guides/routing/provider-selection)
- [Account free-request metadata](https://openrouter.ai/docs/api_reference/limits)
- [Reasoning controls](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens)
- [Nemotron 3.5 free endpoint terms](https://openrouter.ai/nvidia/nemotron-3.5-super-vl:free)
