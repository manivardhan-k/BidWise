# Stable property estimates — October 26, 2026

## Report and acceptance

The learner reported that renovation costs and other AI values changed each time the same property was researched. The old estimates route called the model for every model-stage request. A fixture reproduced a 25,000 allowance becoming 40,000 on the next confirmation, with no changed property evidence. Passing schema/evidence/range checks did not make a new model draw deterministic.

Keep the first validated allowance set for unchanged context. Refresh, reconfirmation, page reload and server restart must reuse its values, ranges, explanatory basis, actual model and generation time. Human edits/clears must stay protected. A changed property/evidence/model/method must not inherit the prior set. Do not equate stable output with accurate costs.

## Implementation

`src/lib/finance/estimate-snapshots.ts` retains only validated generated allowance outputs and an opaque SHA-256 context ID. The fingerprint includes confirmed PIN, substantive source records/dates, housing geography/period/statistics, canonically ordered property claims, configured provider/model policy, allowance instruction and schema. It excludes credentials, raw page bodies, confirmation tokens, request revision and retrieval-clock changes.

Snapshots live in ignored `.bidwise-cache/estimates/` by default, with private directory/file permissions. A server-only `BIDWISE_ESTIMATE_CACHE_DIR` can select another persistent local directory. No database/account/new service. Generated explanations may refer to supplied property information; this is output retention, not full-page or user-scenario storage.

Reads recheck schema, ID, field/range caps and evidence references. Successful output is written to a private temporary file, atomically linked into its final digest path, and read back from the published winner. Concurrent requests in the process share one promise; separate processes cannot overwrite the saved winner. Failed/invalid provider responses are not saved. Corrupt/unreadable storage fails closed rather than drawing replacement costs. A later retry can recover from a provider failure.

There is no automatic expiry or refresh lottery. Unchanged source-first requests return the saved set and skip the model stage. The report shows original generation time and saved/reused status. A changed source or method generates a separate set; model-generated ranges are still provisional. Source-backed prices/rent/tax and deterministic scenario formulas remain separate.

## Verification

The original route regression failed before implementation. Provider fixtures verify exact reuse, refreshed tokens/revisions/timestamps, changed evidence/property/model isolation and reordered claims. Snapshot tests exercise a new Node process, concurrent stores, provider/validation failure, invalid saved files/IDs/references, output-only storage and unavailable storage. Browser checks exercise saved-set refresh, page reload, protected repair edits, visible generation date and zero redundant model-stage requests, alongside the existing full journey.

128 unit tests across19files, typecheck, lint and the canonical Webpack production build passed. All35browser cases passed (34in the full run plus one targeted retry after an unrelated pre-confirmation timeout with no API request). The new saved-set browser case also passed after the shared preview restarted. No normal regression invokes a live model or map service.

A bounded live source-example check generated seven validated Groq allowances once, repeated the request with identical output, then confirmed the same set and generation time after the preview was rebuilt/restarted by concurrent UI work. The post-restart check used the source-only stage and made no new model request. The first generation time remained October26,2026 at18:27:20UTC. A separate new-Node-process unit check also proves persisted reuse. The current client bundle scan covered26JavaScript chunks with both configured server keys absent. Local snapshots and test artifacts are ignored; no raw request/page or key is in the intended change.

Concurrent interface changes are preserved and excluded from this increment's commit. Runtime verification used the combined local preview; the numbers and cache behavior are independent of those visual changes.

## Limits and release boundary

This stores the first accepted provisional estimate, not a reliable inspection-derived price. A local snapshot is reused only while its evidence and estimation policy match. Deleting the local cache or using another machine without it can create a new set. Existing pre-fix unsaved model draws cannot be reconstructed; the first successful research after the update establishes the saved set. Shared durable storage is required before a public/multi-instance deployment can promise this same behavior. Full semantic/manual accessibility/final learner acceptance and release controls remain pending.
