# Copied-page recovery and free limits - October 26, 2026

The learner reported the generic free-limit message again while processing a copied page. The empty map is downstream of that failure: no property had reached matching/confirmation. A fresh key does not remove the selected model's per-minute limits. The original rejected response was not retained, so its exact limit type cannot be reconstructed from the UI message alone.

One bounded replay of the latest authorized 9,651-character attachment returned HTTP200 with Groq headers reporting an8,000-token/minute limit, but failed local quotation validation. Two separate issues were therefore addressed rather than attributing every failure to account access.

Changes:

- Every extracted address remains mandatory and strictly source-backed. Each optional claim independently passes the same quote/value/property-context checks with all extracted target anchors retained. Bad references, invented/changed values and mislabeled construction years are excluded. The report shows how many details were left out. This establishes textual support only, not source truth or complete semantic attribution.
- Valid extraction outputs are kept in private process memory for10minutes, capped at20entries; simultaneous identical work is shared. Keys are opaque digests of exact text and provider/model/instruction policy. No raw-page disk/database store, credentials or failed response is saved. Reads are revalidated against the supplied text; fresh signed receipts are issued. The process cache expires and clears on restart, while the existing saved allowance store is unchanged. Analysis itself is not newly cached by this increment.
- Only fixed quota categories and bounded numeric counts/retry times survive a provider error. The message now distinguishes daily tokens, daily requests, minute tokens/requests and a request too large for the model. A known longer cooldown returns without spending another request; its namespace is an opaque digest of the configured key/model, so a manually updated key does not inherit the old cooldown.
- A documented short minute-limit response can wait once for `Retry-After` (plus250ms). Each minute-limit wait is bounded to35seconds, including a known cooldown before the first attempt, and the complete operation has a45second total deadline. At most two HTTP attempts occur. No daily, unknown, oversized-request, authentication, provider or invalid-output retry/fallback was added. No model/key/account rotation, purchase or billing change is performed.

Verified:

- Five new behavioral checks first failed against the old implementation, then passed. Final full suite:150unit tests across21files; typecheck, lint and production build passed.
- All39production browser regressions passed with external model/data calls mocked. Copied-page coverage checks the omission notice, target separation, receipt use and input recovery; existing finance/identity/flood/PDF/accessibility regressions passed.
- One final production replay of the authorized real page returned its correct main address with two source-backed details (advertised monthly rent2,375 and interior area1,200). Two optional extractions were omitted with a visible notice. An immediate identical request returned the saved result with the same generation time and `reused:true`; it did not launch a new model operation.
- Its freshly signed parsed result reached NJ matching with one selectable candidate, no source failure and the existing block-identifier conflict explicitly requiring review. This is a research-only review path, not a certified parcel agreement. No analysis/new cost-allowance/map request was made for this control.
- Canonical preview http://127.0.0.1:3100 is running the tested build (owned session23167). Two page replay operations total were used in this investigation, plus the no-model repeat. No further live model testing is planned for this increment.

The original full-page source and provider payloads were not committed or logged. Concurrent UI/PDF work remains separate. Learner retry and the wider final review/semantic/accessibility/release gates remain open. Free capacity and model output can still fail; these changes preserve useful verified input and make actual limits actionable, rather than promising unlimited reliability.

Official limit/header reference: [Groq rate limits](https://console.groq.com/docs/rate-limits). Local cache is independent of Groq's provider-side prompt caching.
