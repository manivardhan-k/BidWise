// Server/CLI only. The Groq key is never included in a browser response.
import { z } from "zod";
import { createHash } from "node:crypto";
import { analysisSchema, validateAnalysis } from "../analysis/validate";
import { numberedSource, referencedExtractionSchema, verifiedReferencedExtraction } from "../analysis/source-lines";
import { modelEstimatesSchema, validateModelEstimates, type EstimateEvidence } from "../finance/starting-estimates";
import { LINE_EXTRACTION_INSTRUCTION, ANALYSIS_INSTRUCTION, ALLOWANCE_INSTRUCTION } from "./model-instructions";
import { readGroqQuota, type GroqQuota } from "./groq-quota";

type Category = "configuration" | "authentication" | "quota" | "not_found" | "bad_request" | "provider" | "timeout" | "invalid_output" | "network";
type ValidationFailure = "json" | "schema" | "evidence" | "reference" | "numeric" | "quotation" | "range" | "incomplete";
export class GroqFailure extends Error {
  readonly provider = "groq";
  constructor(public readonly category: Category, public readonly httpStatus?: number, public readonly attempts = 1, public readonly model = "openai/gpt-oss-120b", public readonly validationFailure?: ValidationFailure, public readonly quota?: GroqQuota) {
    super(`Groq unavailable (${category}${validationFailure ? `/${validationFailure}` : ""}).`);
  }
}
const statusCategory = (status: number): Category => status === 401 || status === 403 ? "authentication" : status === 429 ? "quota" : status === 404 ? "not_found" : status === 400 || status === 422 ? "bad_request" : "provider";
const processState = globalThis as typeof globalThis & { bidwiseGroqCooldowns?: Map<string, GroqQuota> };
const cooldowns = processState.bidwiseGroqCooldowns ??= new Map<string, GroqQuota>();
const minuteLimit = (quota: GroqQuota) => quota.kind === "tokens_per_minute" || quota.kind === "requests_per_minute";

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
  // No alternate model, service tier or cross-provider fallback is used.
  if (!apiKey || model !== "openai/gpt-oss-120b") throw new GroqFailure("configuration", undefined, 0);
  const scope = createHash("sha256").update(`${apiKey}:${model}`).digest("hex");
  const deadline = Date.now() + 45_000;
  let attempts = 0;
  try {
    const blocked = cooldowns.get(scope);
    if (blocked?.retryAt && blocked.retryAt > Date.now()) {
      const wait = blocked.retryAt - Date.now() + 250;
      if (!minuteLimit(blocked) || wait > 35_000) throw new GroqFailure("quota", 429, 0, model, undefined, blocked);
      await new Promise(resolve => setTimeout(resolve, wait));
    }
    cooldowns.delete(scope);
    while (attempts < 2) {
      attempts++;
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())),
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, stream: false, reasoning_effort: "low", max_completion_tokens: 2400,
          messages: [{ role: "system", content: `${instruction} Keep the response concise and within the schema's local limits. ${name === "property_analysis" ? "When records are available, supply 3 to 4 decision-relevant findings with existing evidence IDs. For numericClaims select exact ID=value reference strings offered by the schema, and include the reference ID in evidenceIds. NumericClaims may be empty when no numeric claim is needed. Never invent an evidence ID or certify source accuracy." : "Omit unsupported claims or allowances rather than inventing them."}` }, { role: "user", content: input }],
          response_format: { type: "json_schema", json_schema: { name, strict: true, schema: evidenceIds?.length ? restrictEvidence(z.toJSONSchema(schema), evidenceIds, numericEvidence) : z.toJSONSchema(schema) } },
        }),
      });
      // Raw provider errors may contain the key or supplied text. Do not retain,
      // print, forward, or attach them as a cause, including after HTTP errors.
      if (!response.ok) {
        if (response.status === 429 || response.status === 413) {
          const quota = await readGroqQuota(response);
          if (quota.retryAt && quota.kind !== "request_too_large") {
            if (cooldowns.size >= 20) cooldowns.delete(cooldowns.keys().next().value!);
            cooldowns.set(scope, quota);
          }
          const wait = quota.retryAt ? quota.retryAt - Date.now() + 250 : 0;
          if (attempts === 1 && minuteLimit(quota) && wait > 0 && wait <= 35_000 && Date.now() + wait < deadline - 2000) {
            await new Promise(resolve => setTimeout(resolve, wait)); continue;
          }
          throw new GroqFailure("quota", response.status, attempts, model, undefined, quota);
        }
        throw new GroqFailure(statusCategory(response.status), response.status, attempts, model);
      }
      let body;
      try { body = await response.json(); } catch { throw new GroqFailure("invalid_output", undefined, attempts, model, "json"); }
      const choice = body?.choices?.[0];
      if (body.model !== model || choice?.finish_reason !== "stop" || typeof choice?.message?.content !== "string") throw new GroqFailure("invalid_output", undefined, attempts, model, "incomplete");
      let data;
      try { data = JSON.parse(choice.message.content); } catch { throw new GroqFailure("invalid_output", undefined, attempts, model, "json"); }
      const parsed = schema.safeParse(data);
      if (!parsed.success) throw new GroqFailure("invalid_output", undefined, attempts, model, "schema");
      cooldowns.delete(scope);
      return { data: parsed.data, model, attempts };
    }
    throw new GroqFailure("quota", 429, attempts, model);
  } catch (error) {
    if (error instanceof GroqFailure) throw error;
    throw new GroqFailure(error instanceof Error && /timeout|abort/i.test(error.name) ? "timeout" : "network", undefined, attempts, model);
  }
}
export async function extractListing(text: string) {
  z.string().trim().min(1).max(50_000).parse(text);
  const result = await structured(referencedExtractionSchema, "listing_extraction", LINE_EXTRACTION_INSTRUCTION, numberedSource(text).input);
  try { return { ...result, ...verifiedReferencedExtraction(result.data, text) }; }
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
