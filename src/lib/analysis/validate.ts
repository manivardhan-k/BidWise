import { z } from "zod";

export const listingCandidateSchema = z.object({
  address: z.string().min(1).max(300), addressSnippet: z.string().min(1).max(500),
  claims: z.array(z.object({
    kind: z.enum(["asking_price", "opening_bid", "judgment", "bedrooms", "bathrooms", "interior_area", "condition", "year_built", "residential_units"]),
    value: z.string().min(1).max(500), snippet: z.string().min(1).max(1000),
  })).max(30),
});
export const extractionSchema = z.object({ candidates: z.array(listingCandidateSchema).max(5) });
export type ListingCandidate = z.infer<typeof listingCandidateSchema>;
export type ListingClaim = ListingCandidate["claims"][number];
export type ParsedProperty = { candidate: ListingCandidate; receipt: string };

// Exact quotations establish textual support, not truth or correct attribution.
// Target-context attribution still needs live adversarial checks and user confirmation.
export function validateExtraction(body: unknown, suppliedText: string) {
  const result = extractionSchema.parse(body);
  const anchors = result.candidates.map(candidate => ({ candidate, start: suppliedText.indexOf(candidate.addressSnippet) })).sort((a, b) => a.start - b.start);
  for (const candidate of result.candidates) {
    if (!suppliedText.includes(candidate.addressSnippet) || !candidate.addressSnippet.includes(candidate.address)) throw new Error("Unsupported address quotation.");
    for (const claim of candidate.claims) {
      if (!suppliedText.includes(claim.snippet) || !claim.snippet.includes(claim.value)) throw new Error("Unsupported claim quotation or value.");
      if (anchors.length > 1) {
        const index = anchors.findIndex(anchor => anchor.candidate === candidate);
        const start = index === 0 ? 0 : anchors[index].start;
        const end = anchors[index + 1]?.start ?? suppliedText.length;
        let occurrence = suppliedText.indexOf(claim.snippet);
        let supported = false;
        while (occurrence >= 0) {
          if (occurrence >= start && occurrence + claim.snippet.length <= end) { supported = true; break; }
          occurrence = suppliedText.indexOf(claim.snippet, occurrence + 1);
        }
        if (!supported) throw new Error("Claim belongs to another or ambiguous property context.");
      }
    }
  }
  return result;
}

export const analysisSchema = z.object({
  summary: z.string().min(1).max(2000),
  findings: z.array(z.object({
    explanation: z.string().min(1).max(1500), evidenceIds: z.array(z.string()).min(1).max(12),
    numericClaims: z.array(z.object({ evidenceId: z.string(), value: z.number().finite() })).max(20),
  })).max(12),
  unansweredQuestions: z.array(z.string().min(1).max(500)).max(15),
  consistencyFlags: z.array(z.string().min(1).max(500)).max(10),
});
export function validateAnalysis(body: unknown, evidence: ReadonlyMap<string, string | number | null>) {
  const result = analysisSchema.parse(body);
  for (const finding of result.findings) {
    if (finding.evidenceIds.some(id => !evidence.has(id))) throw new Error("Unknown evidence reference.");
    for (const claim of finding.numericClaims) {
      if (!finding.evidenceIds.includes(claim.evidenceId) || evidence.get(claim.evidenceId) !== claim.value) {
        throw new Error("Unsupported numeric claim.");
      }
    }
  }
  return result;
}
