import { z } from "zod";
import { analyzeEvidence, safeGeminiFailure } from "@/lib/providers/gemini";
import { verifyIdentity } from "@/lib/property/identity";
import { recordsFor, hazardsFor, snapshotId } from "@/lib/property/report";
import { InputError, inputFailure, json, readJson } from "@/lib/http";
import { emptyFinance, evaluateFinance, financeSchema, financeInputKey } from "@/lib/finance/engines";
import { parsedPropertySchema, verifyListingReceipt } from "@/lib/analysis/listing-receipt";
import { compareListingClaims } from "@/lib/analysis/comparisons";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { token, revision, listing, finance = emptyFinance(), financeContext } = await readJson(request, z.object({ token: z.string().max(4096), revision: z.number().int().min(0), listing: parsedPropertySchema.optional(), finance: financeSchema.optional(), financeContext: z.string().max(40_000).optional() }), 320_000);
    const identity = verifyIdentity(token);
    if (Boolean(identity.listingHash) !== Boolean(listing)) throw new InputError("The copied-page claims do not match this confirmation. Research the property again.");
    let candidate;
    if (listing) {
      try { candidate = verifyListingReceipt(listing, identity.listingHash); }
      catch { throw new InputError("The copied-page result changed, expired or belongs to another property. Paste the page again."); }
    }
    const [records, flood] = await Promise.all([recordsFor(identity), hazardsFor(identity)]);
    const financeResults = evaluateFinance(finance);
    const scenarioKey = financeInputKey(finance);
    const canonicalSnapshot = snapshotId(identity, records, flood, { finance, financeResults });
    const scenarioResponse = { finance, financeResults, financeInputKey: scenarioKey };
    const listingEvidence = candidate ? { candidate, comparisons: compareListingClaims(candidate.claims, records) } : undefined;
    const evidence = new Map<string, string | number | null>([["address", identity.address], ["parcel", identity.pin],
      ["limits", "No physical inspection, title/liens, complete history, occupancy or market valuation has been checked. Financial assumptions are editable and may include low-confidence automatic starting values, not verified forecasts; deterministic results are scenarios, not promised returns. Source-matched means retrieved from a record, not certified true."],
    ]);
    if (records.status === "available") for (const fact of records.data.facts) {
      evidence.set(fact.id, fact.value); evidence.set(`${fact.id}_caveat`, fact.caveat);
    } else evidence.set("records_status", records.message);
    evidence.set("flood", flood.status === "available" ? JSON.stringify(flood.data) : flood.message);
    if (listingEvidence) {
      evidence.set("listing_limits", "Copied-page claims are user-supplied text, not official records or verified truth. Exact quotations support only what the pasted page said. Price types, applicable dates and scope must match before comparison.");
      listingEvidence.comparisons.forEach((comparison, index) => {
        evidence.set(`listing_claim_${index}`, `${comparison.claim.kind}: ${comparison.claim.value}`);
        evidence.set(`listing_quote_${index}`, comparison.claim.snippet);
        evidence.set(`listing_comparison_${index}`, `${comparison.status}: ${comparison.explanation}`);
      });
    }
    if (financeContext) evidence.set("finance_assumption_context", `Unverified browser-provided context about starting values and user edits, not official records or independent valuation evidence: ${financeContext}`);
    evidence.set("finance_limits", "Cash purchase, before income tax, no debt service. One-time resale profit and recurring annual rental cash have different time horizons. Missing inputs remain unknown. Do not infer rent, market value, repair needs or strategy recommendations. Renovation already includes contingency and reserve once; rental capital reserve is separate from routine maintenance.");
    for (const key of ["renovation", "flip", "rent"] as const) {
      evidence.set(`${key}_assumptions`, JSON.stringify(finance[key]));
      const result = financeResults[key];
      evidence.set(`${key}_status`, result.status === "available" ? "Computed from user assumptions" : `${result.status}: ${result.issues.join(", ")}`);
      if (result.status === "available") {
        if (key === "flip" && financeResults.flip.status === "available") {
          for (const name of ["base", "downside"] as const) for (const [id, value] of Object.entries(financeResults.flip.data[name])) evidence.set(`flip_${name}_${id}`, value);
        } else if (key !== "flip") for (const [id, value] of Object.entries(result.data)) if (typeof value === "number") evidence.set(`${key}_${id}`, value);
      }
    }
    try {
      const response = await analyzeEvidence(evidence);
      return json({ status: "available", ...response.data, model: response.model, fallbackFrom: response.fallbackFrom, generatedAt: new Date().toISOString(), snapshotId: canonicalSnapshot, revision, records, flood, listingEvidence, ...scenarioResponse });
    } catch (error) {
      const failure = safeGeminiFailure(error);
      return json({ status: "unavailable", category: failure.category, attempts: failure.attempts, failedModel: failure.model, revision, records, flood, listingEvidence, ...scenarioResponse,
        message: "AI analysis is unavailable. The source records remain usable; no substitute AI explanation was generated." });
    }
  } catch (error) { return inputFailure(error); }
}
