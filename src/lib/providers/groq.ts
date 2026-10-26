// Server/CLI only. The Groq key is never included in a browser response.
import { z } from "zod";
import { extractionSchema, analysisSchema, validateExtraction, validateAnalysis } from "../analysis/validate";
import { modelEstimatesSchema, validateModelEstimates, type EstimateEvidence } from "../finance/starting-estimates";
import { EXTRACTION_INSTRUCTION, ANALYSIS_INSTRUCTION, ALLOWANCE_INSTRUCTION } from "./model-instructions";

type Category = "configuration" | "authentication" | "quota" | "not_found" | "bad_request" | "provider" | "timeout" | "invalid_output" | "network";
type ValidationFailure = "json" | "schema" | "evidence" | "reference" | "numeric" | "quotation" | "range" | "incomplete";
export class GroqFailure extends Error {
  readonly provider = "groq";
  constructor(public readonly category: Category, public readonly httpStatus?: number, public readonly attempts = 1, public readonly model = "openai/gpt-oss-120b", public readonly validationFailure?: ValidationFailure) {
    super(`Groq unavailable (${category}${validationFailure ? `/${validationFailure}` : ""}).`);
  }
}
const statusCategory = (status: number): Category => status === 401 || status === 403 ? "authentication" : status === 429 ? "quota" : status === 404 ? "not_found" : status === 400 || status === 422 ? "bad_request" : "provider";

function restrictEvidence(schema: unknown, ids: string[]): unknown {
  if (Array.isArray(schema)) return schema.map(item => restrictEvidence(item, ids));
  if (!schema || typeof schema !== "object") return schema;
  return Object.fromEntries(Object.entries(schema).map(([key, value]) => [key,
    key === "evidenceId" ? { type: "string", enum: ids }
      : key === "evidenceIds" ? { ...(value as object), items: { type: "string", enum: ids } }
      : restrictEvidence(value, ids),
  ]));
}
async function structured<T>(schema: z.ZodType<T>, name: string, instruction: string, input: string, evidenceIds?: string[]): Promise<{ data: T; model: string; attempts: number; fallbackFrom?: string }> {
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
        messages: [{ role: "system", content: `${instruction} Keep the response concise and within the schema's local limits. ${name === "property_analysis" ? "When records are available, supply 3 to 6 useful findings with existing evidence IDs; describe both useful facts and missing checks. NumericClaims may be empty when no numeric claim is needed. Never invent an evidence ID or certify source accuracy." : "Omit unsupported claims or allowances rather than inventing them."}` }, { role: "user", content: input }],
        response_format: { type: "json_schema", json_schema: { name, strict: true, schema: evidenceIds?.length ? restrictEvidence(z.toJSONSchema(schema), evidenceIds) : z.toJSONSchema(schema) } },
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
  const result = await structured(extractionSchema, "listing_extraction", EXTRACTION_INSTRUCTION, text);
  try { return { ...result, data: validateExtraction(result.data, text) }; }
  catch { throw new GroqFailure("invalid_output", undefined, result.attempts, result.model, "quotation"); }
}
export async function analyzeEvidence(evidence: ReadonlyMap<string, string | number | null>) {
  const result = await structured(analysisSchema, "property_analysis", ANALYSIS_INSTRUCTION, JSON.stringify(Object.fromEntries(evidence)), [...evidence.keys()]);
  try { return { ...result, data: validateAnalysis(result.data, evidence) }; }
  catch (error) { throw new GroqFailure("invalid_output", undefined, result.attempts, result.model, error instanceof Error && error.message === "Unknown evidence reference." ? "reference" : "numeric"); }
}
export async function estimateStartingAssumptions(evidence: ReadonlyMap<string, EstimateEvidence>) {
  const result = await structured(modelEstimatesSchema, "cost_allowances", ALLOWANCE_INSTRUCTION, JSON.stringify(Object.fromEntries(evidence)), [...evidence.keys()]);
  try { return { ...result, data: validateModelEstimates(result.data, evidence) }; }
  catch { throw new GroqFailure("invalid_output", undefined, result.attempts, result.model, "range"); }
}
