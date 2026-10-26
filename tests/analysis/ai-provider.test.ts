import { afterEach, beforeEach, expect, it, vi } from "vitest";
const calls = vi.hoisted(() => ({ gemini: vi.fn(), groq: vi.fn() }));
vi.mock("../../src/lib/providers/gemini", async original => ({ ...await original<object>(), extractListing: calls.gemini, analyzeEvidence: calls.gemini, estimateStartingAssumptions: calls.gemini }));
vi.mock("../../src/lib/providers/groq", async original => ({ ...await original<object>(), extractListing: calls.groq, analyzeEvidence: calls.groq, estimateStartingAssumptions: calls.groq }));
import { analyzeEvidence, estimateStartingAssumptions, extractListing } from "../../src/lib/providers/ai";
beforeEach(() => { calls.gemini.mockResolvedValue({ model: "gemini-test", data: {} }); calls.groq.mockResolvedValue({ model: "groq-test", data: {} }); });
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
it("uses Gemini by default even when a Groq key is present", async () => {
  vi.stubEnv("AI_PROVIDER", ""); vi.stubEnv("GROQ_API_KEY", "fictional-key");
  await extractListing("test");
  expect(calls.gemini).toHaveBeenCalledOnce(); expect(calls.groq).not.toHaveBeenCalled();
});
it("uses the explicitly selected Groq provider for extraction, analysis and allowances", async () => {
  vi.stubEnv("AI_PROVIDER", "groq");
  await extractListing("test"); await analyzeEvidence(new Map()); await estimateStartingAssumptions(new Map());
  expect(calls.groq).toHaveBeenCalledTimes(3); expect(calls.gemini).not.toHaveBeenCalled();
});
it("does not silently switch providers after a Groq failure", async () => {
  vi.stubEnv("AI_PROVIDER", "groq"); calls.groq.mockRejectedValue(new Error("Provider failed"));
  await expect(extractListing("test")).rejects.toThrow("Provider failed");
  expect(calls.groq).toHaveBeenCalledOnce(); expect(calls.gemini).not.toHaveBeenCalled();
});
it("rejects unsupported provider selection before inference", async () => {
  vi.stubEnv("AI_PROVIDER", "unknown");
  await expect(extractListing("test")).rejects.toMatchObject({ category: "configuration", attempts: 0 });
  expect(calls.groq).not.toHaveBeenCalled(); expect(calls.gemini).not.toHaveBeenCalled();
});
