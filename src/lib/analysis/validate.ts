import { z } from "zod";

export const extractionSchema = z.object({ candidates: z.array(z.object({
  address: z.string().min(1).max(300), addressSnippet: z.string().min(1).max(500),
  claims: z.array(z.object({
    kind: z.enum(["asking_price", "opening_bid", "judgment", "bedrooms", "bathrooms", "interior_area", "condition"]),
    value: z.string().min(1).max(500), snippet: z.string().min(1).max(1000),
  })).max(30),
})).max(5) });

// Exact quotations establish textual support, not truth or correct attribution.
// Target-context attribution still needs live adversarial checks and user confirmation.
export function validateExtraction(body: unknown, suppliedText: string) {
  const result = extractionSchema.parse(body);
  for (const candidate of result.candidates) {
    if (!suppliedText.includes(candidate.addressSnippet)) throw new Error("Unsupported address quotation.");
    for (const claim of candidate.claims) {
      if (!suppliedText.includes(claim.snippet) || !claim.snippet.includes(claim.value)) throw new Error("Unsupported claim quotation or value.");
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
