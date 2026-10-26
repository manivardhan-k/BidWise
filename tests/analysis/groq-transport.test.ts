import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { analyzeEvidence, estimateStartingAssumptions, extractListing } from "../../src/lib/providers/groq";
import { safeAiFailure, aiFailureMessage } from "../../src/lib/providers/ai";

const request = vi.fn();
const answer = (data: unknown, finish = "stop") => new Response(JSON.stringify({ model: "openai/gpt-oss-120b", choices: [{ finish_reason: finish, message: { content: JSON.stringify(data) } }] }));
const analysis = { summary: "Review the supplied assessment and verify current records.", findings: [{ explanation: "The assessment is a record, not a market valuation.", evidenceIds: ["assessment"], numericClaims: [{ evidenceId: "assessment", value: 100 }] }], unansweredQuestions: [], consistencyFlags: [] };
beforeEach(() => { vi.stubEnv("GROQ_API_KEY", "fictional-groq-secret"); vi.stubEnv("GROQ_MODEL", "openai/gpt-oss-120b"); vi.stubGlobal("fetch", request); });
afterEach(() => { request.mockReset(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("uses the fixed Groq endpoint with strict schema, one bounded request and exact quoted extraction", async () => {
  const data = { candidates: [{ address: "10 Sample St, Sample, NJ", addressSnippet: "10 Sample St, Sample, NJ", claims: [] }] };
  request.mockResolvedValue(answer(data));
  const result = await extractListing("10 Sample St, Sample, NJ");
  expect(result).toMatchObject({ data, model: "openai/gpt-oss-120b", attempts: 1 });
  expect(request).toHaveBeenCalledTimes(1);
  const [url, options] = request.mock.calls[0];
  expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
  expect(options.redirect).toBe("error");
  const body = JSON.parse(options.body);
  expect(body).toMatchObject({ model: "openai/gpt-oss-120b", reasoning_effort: "low", stream: false, response_format: { type: "json_schema", json_schema: { strict: true } } });
  expect(body.response_format.json_schema.schema.properties.candidates.maxItems).toBe(5);
  expect(body.messages).not.toContainEqual(expect.objectContaining({ role: "tool" }));
});
it("keeps numeric grounding checks after strict schema generation", async () => {
  request.mockResolvedValueOnce(answer(analysis));
  expect((await analyzeEvidence(new Map([["assessment", 100]]))).data).toEqual(analysis);
  const sent = JSON.parse(request.mock.calls[0][1].body);
  expect(sent.response_format.json_schema.schema.properties.findings.items.properties.evidenceIds.items.enum).toEqual(["assessment"]);
  request.mockResolvedValueOnce(answer(analysis));
  await expect(analyzeEvidence(new Map([["assessment", 200]]))).rejects.toMatchObject({ category: "invalid_output", validationFailure: "numeric", attempts: 1 });
});
it("rejects unsupported quotations and model-owned valuations", async () => {
  request.mockResolvedValueOnce(answer({ candidates: [{ address: "20 Other St", addressSnippet: "10 Sample St", claims: [] }] }));
  await expect(extractListing("10 Sample St")).rejects.toMatchObject({ category: "invalid_output", validationFailure: "quotation" });
  request.mockResolvedValueOnce(answer({ estimates: [{ field: "flip.resale", value: 100, low: 50, high: 200, evidenceIds: ["property_year"], explanation: "A valuation must never be supplied as a model allowance." }] }));
  await expect(estimateStartingAssumptions(new Map([["property_year", { value: 1900, description: "Year" }]]))).rejects.toMatchObject({ category: "invalid_output", validationFailure: "schema" });
});
it.each([[401, "authentication"], [429, "quota"], [503, "provider"]])("stops after HTTP %s without retrying or retaining payloads", async (status, category) => {
  request.mockResolvedValue(new Response('{"error":{"message":"private raw request"}}', { status }));
  try { await extractListing("10 Sample St"); throw new Error("Expected failure"); }
  catch (error) {
    const failure = safeAiFailure(error);
    expect(failure).toMatchObject({ category, provider: "groq", model: "openai/gpt-oss-120b", attempts: 1 });
    expect(JSON.stringify(failure)).not.toContain("private");
    expect(aiFailureMessage(failure)).not.toContain("fictional-groq-secret");
  }
  expect(request).toHaveBeenCalledTimes(1);
});
it("rejects incomplete or wrong-model output rather than accepting partial JSON", async () => {
  request.mockResolvedValueOnce(answer({ candidates: [] }, "length"));
  await expect(extractListing("10 Sample St")).rejects.toMatchObject({ validationFailure: "incomplete" });
  request.mockResolvedValueOnce(new Response(JSON.stringify({ model: "other-model", choices: [{ finish_reason: "stop", message: { content: '{"candidates":[]}' } }] })));
  await expect(extractListing("10 Sample St")).rejects.toMatchObject({ category: "invalid_output" });
});
it("fails before sending a request when the key or approved model is missing", async () => {
  vi.stubEnv("GROQ_API_KEY", "");
  await expect(extractListing("10 Sample St")).rejects.toMatchObject({ category: "configuration", attempts: 0 });
  vi.stubEnv("GROQ_API_KEY", "fictional-groq-secret"); vi.stubEnv("GROQ_MODEL", "unapproved-model");
  await expect(extractListing("10 Sample St")).rejects.toMatchObject({ category: "configuration", attempts: 0 });
  expect(request).not.toHaveBeenCalled();
});
