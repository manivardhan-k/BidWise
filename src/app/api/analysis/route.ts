import { z } from "zod";
import { analyzeEvidence, safeGeminiFailure } from "@/lib/providers/gemini";
import { verifyIdentity } from "@/lib/property/identity";
import { recordsFor, hazardsFor, snapshotId } from "@/lib/property/report";
import { inputFailure, json, readJson } from "@/lib/http";
import { InputError } from "@/lib/http";
import { parsedPropertySchema, verifyListingReceipt } from "@/lib/analysis/listing-receipt";
import { compareListingClaims } from "@/lib/analysis/comparisons";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { token, revision, listing } = await readJson(request, z.object({ token: z.string().max(4096), revision: z.number().int().min(0), listing: parsedPropertySchema.optional() }), 320_000);
    const identity = verifyIdentity(token);
    if (Boolean(identity.listingHash) !== Boolean(listing)) throw new InputError("The copied-page claims do not match this confirmation. Research the property again.");
    let candidate;
    if (listing) {
      try { candidate = verifyListingReceipt(listing, identity.listingHash); }
      catch { throw new InputError("The copied-page result changed, expired or belongs to another property. Paste the page again."); }
    }
    const [records, flood] = await Promise.all([recordsFor(identity), hazardsFor(identity)]);
    const listingEvidence = candidate ? { candidate, comparisons: compareListingClaims(candidate.claims, records) } : undefined;
    const evidence = new Map<string, string | number | null>([["address", identity.address], ["parcel", identity.pin],
      ["limits", "No physical inspection, title/liens, complete history, occupancy, market valuation or financial scenario has been checked. Source-matched means retrieved from a record, not certified true."],
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
    try {
      const response = await analyzeEvidence(evidence);
      return json({ status: "available", ...response.data, model: response.model, generatedAt: new Date().toISOString(), snapshotId: snapshotId(identity, records, flood), revision, records, flood, listingEvidence });
    } catch (error) {
      const failure = safeGeminiFailure(error);
      return json({ status: "unavailable", category: failure.category, revision, records, flood, listingEvidence,
        message: "AI analysis is unavailable. The source records remain usable; no substitute AI explanation was generated." });
    }
  } catch (error) { return inputFailure(error); }
}
