// Server/CLI only. The Groq key is never included in a browser response.
import { z } from "zod";
import { analysisSchema, validateAnalysis } from "../analysis/validate";
import { numberedSource, referencedExtractionSchema, validateReferencedExtraction } from "../analysis/source-lines";
import { modelEstimatesSchema, validateModelEstimates, type EstimateEvidence } from "../finance/starting-estimates";
import { LINE_EXTRACTION_INSTRUCTION, ANALYSIS_INSTRUCTION, ALLOWANCE_INSTRUCTION } from "./model-instructions";

type Category = "configuration" | "authentication" | "quota" | "not_found" | "bad_request" | "provider" | "timeout" | "invalid_output" | "network";
type ValidationFailure = "json" | "schema" | "evidence" | "reference" | "numeric" | "quotation" | "range" | "incomplete";
export class GroqFailure extends Error {
  readonly provider = "groq";
  constructor(public readonly category: Category, public readonly httpStatus?: number, public readonly attempts = 1, public readonly model = "openai/gpt-oss-120b", public readonly validationFailure?: ValidationFailure) {
    super(`Groq unavailable (${category}${validationFailure ? `/${validationFailure}` : ""}).`);
  }
}
const statusCategory = (status: number): Category => status === 401 || status === 403 ? "authentication" : status === 429 ? "quota" : status === 404 ? "not_found" : status === 400 || status === 422 ? "bad_request" : "provider";

type NumericReference = { evidenceId: string; value: number };
const analysisWireSchema = analysisSchema.extend({ findings: z.array(analysisSchema.shape.findings.element.extend({ numericClaims: z.array(z.string().min(1).max(400)).max(20) })).max(12) });
function restrictEvidence(schema: unknown, ids: string[], numericValues?: ReadonlyMap<string, NumericReference>): unknown {
  if (Array.isArray(schema)) return schema.map(item => restrictEvidence(item, ids, numericValues));
  if (!schema || typeof schema !== "object") return schema;
  return Object.fromEntries(Object.entries(schema).map(([key, value]) => [key,
    key === "evidenceId" ? { type: "string", enum: ids }
      : key === "evidenceIds" ? { ...(value as object), items: { type: "string", enum: ids } }
      : key === "numericClaims" && numericValues ? numericValues.size ? { ...(value as object), items: { type: "string", enum: [...numericValues.keys()] } } : { ...(value as object), maxItems: 0 }
      : restrictEvidence(value, ids, numericValues),
  ]));
}
async function structured<T>(schema: z.ZodType<T>, name: string, instruction: string, input: string, evidenceIds?: string[], numericEvidence?: ReadonlyMap<string, NumericReference>): Promise<{ data: T; model: string; attempts: number; fallbackFrom?: string }> {
  const model = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
  const apiKey = process.env.GROQ_API_KEY?.trim();
  // This is a trial on the learner's Free account, not permission to upgrade.
  // No alternate model, service tier, cross-provider fallback or retry is used.
  if (!apiKey || model !== "openai/gpt-oss-120b") throw new GroqFailure("configuration", undefined, 0);
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(45_000),
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, stream: false, reasoning_effort: "low", max_completion_tokens: 2400,
        messages: [{ role: "system", content: `${instruction} Keep the response concise and within the schema's local limits. ${name === "property_analysis" ? "When records are available, supply 3 to 4 decision-relevant findings with existing evidence IDs. For numericClaims select exact ID=value reference strings offered by the schema, and include the reference ID in evidenceIds. NumericClaims may be empty when no numeric claim is needed. Never invent an evidence ID or certify source accuracy." : "Omit unsupported claims or allowances rather than inventing them."}` }, { role: "user", content: input }],
        response_format: { type: "json_schema", json_schema: { name, strict: true, schema: evidenceIds?.length ? restrictEvidence(z.toJSONSchema(schema), evidenceIds, numericEvidence) : z.toJSONSchema(schema) } },
      }),
    });
    // Raw provider errors may contain the key or supplied text. Do not retain,
    // print, forward, or attach them as a cause, including after HTTP errors.
    if (!response.ok) throw new GroqFailure(statusCategory(response.status), response.status, 1, model);
    let body;
    try { body = await response.json(); } catch { throw new GroqFailure("invalid_output", undefined, 1, model, "json"); }
    const choice = body?.choices?.[0];
    if (body.model !== model || choice?.finish_reason !== "stop" || typeof choice?.message?.content !== "string") throw new GroqFailure("invalid_output", undefined, 1, model, "incomplete");
    let data;
    try { data = JSON.parse(choice.message.content); } catch { throw new GroqFailure("invalid_output", undefined, 1, model, "json"); }
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new GroqFailure("invalid_output", undefined, 1, model, "schema");
    return { data: parsed.data, model, attempts: 1 };
  } catch (error) {
    if (error instanceof GroqFailure) throw error;
    throw new GroqFailure(error instanceof Error && /timeout|abort/i.test(error.name) ? "timeout" : "network", undefined, 1, model);
  }
}
export async function extractListing(text: string) {
  z.string().trim().min(1).max(50_000).parse(text);
  const result = await structured(referencedExtractionSchema, "listing_extraction", LINE_EXTRACTION_INSTRUCTION, numberedSource(text).input);
  try { return { ...result, data: validateReferencedExtraction(result.data, text) }; }
  catch { throw new GroqFailure("invalid_output", undefined, result.attempts, result.model, "quotation"); }
}
export async function analyzeEvidence(evidence: ReadonlyMap<string, string | number | null>) {
  const numericValues = new Map<string, NumericReference>();
  for (const [id, value] of evidence) if (typeof value === "number" && Number.isFinite(value)) numericValues.set(`${id}=${value}`, { evidenceId: id, value });
  const result = await structured(analysisWireSchema, "property_analysis", ANALYSIS_INSTRUCTION, JSON.stringify(Object.fromEntries(evidence)), [...evidence.keys()], numericValues);
  try {
    const data = { ...result.data, findings: result.data.findings.map(finding => {
      const numericClaims = finding.numericClaims.map(reference => {
        const claim = numericValues.get(reference);
        if (!claim) throw new Error("Unsupported numeric claim.");
        return claim;
      });
      return { ...finding, evidenceIds: [...new Set([...finding.evidenceIds, ...numericClaims.map(claim => claim.evidenceId)])], numericClaims };
    }) };
    return { ...result, data: validateAnalysis(data, evidence) };
  }
  catch (error) { throw new GroqFailure("invalid_output", undefined, result.attempts, result.model, error instanceof Error && error.message === "Unknown evidence reference." ? "reference" : "numeric"); }
}
export async function estimateStartingAssumptions(evidence: ReadonlyMap<string, EstimateEvidence>) {
  const result = await structured(modelEstimatesSchema, "cost_allowances", ALLOWANCE_INSTRUCTION, JSON.stringify(Object.fromEntries(evidence)), [...evidence.keys()]);
  try { return { ...result, data: validateModelEstimates(result.data, evidence) }; }
  catch { throw new GroqFailure("invalid_output", undefined, result.attempts, result.model, "range"); }
}
