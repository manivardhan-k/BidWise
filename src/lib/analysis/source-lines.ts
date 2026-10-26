import { z } from "zod";
import { listingCandidateSchema, validateExtraction } from "./validate";
const line = z.number().int().min(1).max(50_000);
export const referencedExtractionSchema = z.object({ candidates: z.array(z.object({
  address: listingCandidateSchema.shape.address, addressStartLine: line, addressEndLine: line,
  claims: z.array(z.object({ kind: listingCandidateSchema.shape.claims.element.shape.kind, value: listingCandidateSchema.shape.claims.element.shape.value, startLine: line, endLine: line })).max(30),
})).max(5) });
export function numberedSource(text: string) {
  const lines: { value: string; start: number; end: number }[] = [];
  for (const match of text.matchAll(/[^\r\n]+/g)) if (match[0].trim()) lines.push({ value: match[0], start: match.index, end: match.index + match[0].length });
  return { input: lines.map((item, index) => `${index + 1}|${item.value}`).join("\n"), lines };
}
export function validateReferencedExtraction(body: unknown, text: string) {
  const parsed = referencedExtractionSchema.parse(body), { lines } = numberedSource(text);
  const quote = (start: number, end: number, maximum: number) => {
    if (end < start || !lines[start - 1] || !lines[end - 1]) throw new Error("Invalid quotation line reference.");
    const result = text.slice(lines[start - 1].start, lines[end - 1].end);
    if (result.length > maximum) throw new Error("Quotation line range is too broad.");
    return result;
  };
  return validateExtraction({ candidates: parsed.candidates.map(candidate => ({
    address: candidate.address, addressSnippet: quote(candidate.addressStartLine, candidate.addressEndLine, 500),
    claims: candidate.claims.map(claim => ({ kind: claim.kind, value: claim.value, snippet: quote(claim.startLine, claim.endLine, 1000) })),
  })) }, text);
}
