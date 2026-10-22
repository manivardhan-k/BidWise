# Gemini compatibility and copied-page checkpoint — October 22, 2026

The configured model remains `gemini-3.8-flash`, with the existing free-tier key and no billing/configuration change. This is a bounded continuation of the October 20 investigation, not proof that service reliability is repaired.

## Primary-source lead and scoped correction

A developer reported that removing nested `maxItems` constraints fixed their Interactions structured-output HTTP 400; restoring one reproduced it. Google staff confirmed reproducing the behavior on October 20. Their controlled example used 3.5 Flash-Lite; it does not establish that every 3.8 failure has this cause. [Google developer discussion](https://discuss.ai.google.dev/t/gemini-3-8-flash-interactions-v1beta-http-400-invalid-request-with-stateless-structured-output/184654). The [official structured-output guide](https://ai.google.dev/gemini-api/docs/structured-output) supplies the request shape used here.

The application now omits `maxItems` only from the provider-facing generated JSON Schema. Local Zod limits, quotation checks, evidence-reference checks, numeric checks and input byte/character limits remain enforced. Tests prove oversized model responses are rejected locally. This preserves the approved behavior; it is not permission for unlimited output or unsupported claims.

## Sanitized observed results

- Minimal 3.8 structured JSON request: HTTP 200, about 3.6 seconds.
- Temporary 3.5 Flash-Lite extraction A/B: original schema HTTP 400; maxItems-free schema reached the 45-second timeout. No successful Lite extraction established.
- Temporary 3.8 extraction A/B: original schema HTTP 503; maxItems-free schema HTTP 200 in about 3.7 seconds, locally valid. The original response was a capacity failure, so this comparison does **not** prove maxItems caused that 503.
- Two bounded actual-application probes after the correction: extraction HTTP 503 on both allowed attempts; analysis skipped by the probe's stop rule. End-to-end live extraction and analysis acceptance remains pending.

Ignored local evidence: `docs/evidence/gemini-json-isolation-2026-10-22.json`, `gemini-maxitems-ab-2026-10-22.json`, `gemini-38-maxitems-ab-2026-10-22.json`. Only sanitized statuses/metadata are saved; no key values or raw provider-error bodies are published. Temporary model overrides were process-local; no paid fallback was enabled.

## Copied-page implementation and limits

The new page-text mode submits up to 50,000 characters with a separate 320,000-byte server cap. Over-limit input is rejected visibly, not truncated. URL-only input retains the copy-text/address fallback and is never fetched. An extraction failure preserves the browser's text.

Each candidate address and claim must quote supplied text. Multi-target output receives conservative address-region attribution checks and requires target selection followed by explicit parcel confirmation. This guard is not proof of semantic correctness: noisy real-page attribution and malicious fixtures still require live acceptance. Uncertain/invalid output fails closed rather than being promoted to a record.

A 15-minute authenticated receipt binds the validated candidate/claims to a digest in the confirmed parcel identity. Changing the claims or swapping another valid receipt is rejected before sources/model analysis. The receipt contains a digest, not the raw page; signing secrets are process-local and restart invalidates them. No page-text database/cache was added.

Typed comparisons distinguish asking price/opening bid/judgment from assessment and recorded sale, and interior area from parcel acreage. Exact year-built/unit-count claims can match or differ from returned numeric facts. Bedrooms, bathrooms and condition remain unverified. Agreement does not certify truth, and a difference is not automatically seller wrongdoing.

Mechanical checkpoint: 51 unit tests and 14 browser regressions pass; typecheck and lint pass. Browser fixtures test mechanics without live model/map calls. Full live AI quality, URL Context feasibility and final release acceptance remain open.
