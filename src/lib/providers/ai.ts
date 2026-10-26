// Explicit server-side selection. Adding a Groq key alone never selects it.
import * as gemini from "./gemini";
import * as groq from "./groq";
import type { EstimateEvidence } from "../finance/starting-estimates";

function selected() {
  const provider = process.env.AI_PROVIDER?.trim() || "gemini";
  if (provider === "groq") return groq;
  if (provider === "gemini") return gemini;
  throw new gemini.GeminiFailure("configuration", undefined, 0);
}
export async function extractListing(text: string) { const provider = selected(); return { ...await provider.extractListing(text), provider: provider === groq ? "groq" : "gemini" }; }
export async function analyzeEvidence(evidence: ReadonlyMap<string, string | number | null>) { const provider = selected(); return { ...await provider.analyzeEvidence(evidence), provider: provider === groq ? "groq" : "gemini" }; }
export async function estimateStartingAssumptions(evidence: ReadonlyMap<string, EstimateEvidence>) { const provider = selected(); return { ...await provider.estimateStartingAssumptions(evidence), provider: provider === groq ? "groq" : "gemini" }; }
export function safeAiFailure(error: unknown) {
  if (error instanceof groq.GroqFailure) return error;
  const failure = gemini.safeGeminiFailure(error);
  return { category: failure.category, httpStatus: failure.httpStatus, attempts: failure.attempts, model: failure.model, provider: "gemini", validationFailure: undefined };
}
export function aiFailureMessage(failure: ReturnType<typeof safeAiFailure>) {
  const model = failure.model ?? (failure.provider === "groq" ? "Groq" : "Gemini");
  const reason = failure.category === "invalid_output" ? `the response failed ${failure.validationFailure ?? "output"} validation; it was not accepted`
    : failure.category === "quota" ? "the free account's request or token limit was reached; wait for its limit to reset or supply a shorter page"
    : failure.category === "timeout" ? "the request timed out after 45 seconds"
    : failure.category === "authentication" ? "the API key or account access was rejected"
    : failure.category === "configuration" ? "the selected provider's local key or model configuration is missing or unsupported"
    : failure.category === "bad_request" ? "the provider rejected this request"
    : failure.category === "network" ? "the provider could not be reached"
    : "the provider could not serve the request";
  return `${model}: ${reason}. ${failure.attempts} model ${failure.attempts === 1 ? "attempt" : "attempts"}. No automatic provider switch was made.`;
}
