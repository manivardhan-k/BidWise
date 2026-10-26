import { z } from "zod";
import { verifyIdentity } from "@/lib/property/identity";
import { matchReviewMessage } from "@/lib/property/match-review";
import { recordsFor } from "@/lib/property/report";
import { cachedAreaBenchmarksFor } from "@/lib/providers/census";
import { estimateStartingAssumptions, safeAiFailure, aiFailureMessage, allowancePolicy } from "@/lib/providers/ai";
import { ALLOWANCE_INSTRUCTION } from "@/lib/providers/model-instructions";
import { baselineEstimates, recordEvidenceKey, modelEstimateEvidence, modelStartingEstimates, modelEstimatesSchema } from "@/lib/finance/starting-estimates";
import { createEstimateSnapshotStore, estimateSnapshotId, EstimateSnapshotError } from "@/lib/finance/estimate-snapshots";
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
    if (matchReview) return json({ ...common, modelStatus: "unavailable", message: "Model cost allowances are withheld until the parcel identifiers can be verified. General editable assumptions remain available." });
    const evidence = modelEstimateEvidence(records, area, candidate);
    if (![...evidence.keys()].some(id => id.startsWith("property_"))) return json({ ...common, modelStatus: "unavailable", message: "Property records are unavailable. No model cost allowances were invented without property context." });
    try {
      const store = createEstimateSnapshotStore();
      const id = estimateSnapshotId({ version: 1, pin: identity.pin, recordKey: common.recordKey,
        area: area.status === "available" ? { geoid: area.data.geoid, period: area.data.period, homeValue: area.data.homeValue, homeValueMoe: area.data.homeValueMoe, contractRent: area.data.contractRent, contractRentMoe: area.data.contractRentMoe } : { status: "unavailable" },
        evidence: Object.fromEntries(evidence), policy: allowancePolicy(), prompt: ALLOWANCE_INSTRUCTION, schema: z.toJSONSchema(modelEstimatesSchema),
      });
      const saved = stage === "sources" ? await store.read(id, evidence) : null;
      if (stage === "sources" && !saved) return json({ ...common, modelStatus: "not_requested" });
      const { snapshot, reused } = saved ? { snapshot: saved, reused: true } : await store.getOrCreate(id, evidence, async () => {
        const result = await estimateStartingAssumptions(evidence);
        return { ...result, provider: result.provider === "groq" ? "groq" : "gemini" };
      });
      return json({ ...common, estimates: [...baseline.estimates, ...modelStartingEstimates(snapshot.data, snapshot.generatedAt, snapshot.model)], modelStatus: "available", model: snapshot.model, provider: snapshot.provider, fallbackFrom: snapshot.fallbackFrom,
        modelSnapshot: { id: snapshot.id, generatedAt: snapshot.generatedAt, reused },
      });
    } catch (error) {
      if (error instanceof EstimateSnapshotError) return json({ ...common, modelStatus: "unavailable", category: "storage", message: error.message });
      const failure = safeAiFailure(error);
      return json({ ...common, modelStatus: "unavailable", category: failure.category, provider: failure.provider, validationFailure: failure.validationFailure, attempts: failure.attempts, failedModel: failure.model, message: `AI planning allowances are unavailable. ${aiFailureMessage(failure)} Sourced starting values and editable planning assumptions remain usable.` });
    }
  } catch (error) { return inputFailure(error); }
}
