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
export function allowancePolicy() {
  const provider = selected() === groq ? "groq" : "gemini";
  return provider === "groq" ? { provider, model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b" }
    : { provider, model: process.env.GEMINI_MODEL?.trim() || "unconfigured", fallback: process.env.GEMINI_FALLBACK_MODEL?.trim() || null };
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
  if (failure.category === "invalid_output") return "The AI response did not pass the source and output checks, so it was not accepted. You can try again; the response has not replaced your source information.";
  if (failure.category === "quota") return "The AI service has reached its free usage limit. Wait before trying again; a shorter copied page may fit the available limit.";
  if (failure.category === "timeout") return "The AI service did not respond within 45 seconds. You can try again; your records and entered values remain available.";
  if (failure.category === "authentication") return "The AI service rejected its API key or account access. The local configuration needs to be checked before retrying.";
  if (failure.category === "configuration") return "AI is not configured yet. Check the selected provider and local API key, then restart BidWise.";
  return "The AI service could not complete this request. Try again later; you can continue with the source records and editable scenarios.";
}
