import { z } from "zod";
import { verifyIdentity } from "@/lib/property/identity";
import { matchReviewMessage } from "@/lib/property/match-review";
import { recordsFor } from "@/lib/property/report";
import { cachedAreaBenchmarksFor } from "@/lib/providers/census";
import { estimateStartingAssumptions, safeGeminiFailure } from "@/lib/providers/gemini";
import { baselineEstimates, recordEvidenceKey, modelEstimateEvidence, modelStartingEstimates, validateModelEstimates } from "@/lib/finance/starting-estimates";
import { parsedPropertySchema, verifyListingReceipt } from "@/lib/analysis/listing-receipt";
import { InputError, inputFailure, json, readJson } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { token, revision, stage, listing } = await readJson(request, z.object({ token: z.string().max(4096), revision: z.number().int().min(0), stage: z.enum(["sources", "model"]), listing: parsedPropertySchema.optional() }), 320_000);
    const identity = verifyIdentity(token);
    if (Boolean(identity.listingHash) !== Boolean(listing)) throw new InputError("Copied-page claims do not match this confirmation. Research the property again.");
    let candidate;
    if (listing) {
      try { candidate = verifyListingReceipt(listing, identity.listingHash); }
      catch { throw new InputError("The copied-page result changed, expired or belongs to another property. Paste the page again."); }
    }
    const matchReview = matchReviewMessage(identity);
    const withheld = { status: "unavailable" as const, message: "Parcel-based starting values are withheld while the address and parcel blocks disagree." };
    const [records, area] = await Promise.all([recordsFor(identity), matchReview ? withheld : cachedAreaBenchmarksFor(identity)]);
    const baseline = baselineEstimates(matchReview ? withheld : records, area, candidate);
    if (matchReview) baseline.gaps.unshift(matchReview);
    const common = { ...baseline, pin: identity.pin, revision, checkedAt: new Date().toISOString(), area, recordKey: recordEvidenceKey(records) };
    if (stage === "sources") return json({ ...common, modelStatus: "not_requested" });
    if (matchReview) return json({ ...common, modelStatus: "unavailable", message: "Model cost allowances are withheld until the parcel identifiers can be verified. General editable assumptions remain available." });
    const evidence = modelEstimateEvidence(records, area, candidate);
    if (![...evidence.keys()].some(id => id.startsWith("property_"))) return json({ ...common, modelStatus: "unavailable", message: "Property records are unavailable. No model cost allowances were invented without property context." });
    try {
      const result = await estimateStartingAssumptions(evidence);
      const validated = validateModelEstimates(result.data, evidence);
      return json({ ...common, estimates: [...baseline.estimates, ...modelStartingEstimates(validated, common.checkedAt)], modelStatus: "available", model: result.model, fallbackFrom: result.fallbackFrom });
    } catch (error) {
      const failure = safeGeminiFailure(error);
      return json({ ...common, modelStatus: "unavailable", category: failure.category, attempts: failure.attempts, failedModel: failure.model, message: "Gemini planning allowances are unavailable. Sourced starting values and editable planning assumptions remain usable; no model estimates were fabricated." });
    }
  } catch (error) { return inputFailure(error); }
}
