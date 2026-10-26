import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { analyzeEvidence, estimateStartingAssumptions, extractListing } from "../../src/lib/providers/groq";
import { safeAiFailure, aiFailureMessage } from "../../src/lib/providers/ai";

const request = vi.fn();
const answer = (data: unknown, finish = "stop") => new Response(JSON.stringify({ model: "openai/gpt-oss-120b", choices: [{ finish_reason: finish, message: { content: JSON.stringify(data) } }] }));
const analysis = { summary: "Review the supplied assessment and verify current records.", findings: [{ explanation: "The assessment is a record, not a market valuation.", evidenceIds: ["assessment"], numericClaims: [{ evidenceId: "assessment", value: 100 }] }], unansweredQuestions: [], consistencyFlags: [] };
const wire = (value: typeof analysis) => ({ ...value, findings: value.findings.map(finding => ({ ...finding, numericClaims: finding.numericClaims.map(claim => `${claim.evidenceId}=${claim.value}`) })) });
beforeEach(() => { vi.stubEnv("GROQ_API_KEY", "fictional-groq-secret"); vi.stubEnv("GROQ_MODEL", "openai/gpt-oss-120b"); vi.stubGlobal("fetch", request); });
afterEach(() => { request.mockReset(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

it("keeps verified details when an optional copied claim cannot be sourced", async () => {
  request.mockResolvedValue(answer({ candidates: [{ address: "10 Sample St", addressStartLine: 1, addressEndLine: 1, claims: [
    { kind: "bedrooms", value: "2", startLine: 2, endLine: 2 },
    { kind: "year_built", value: "2018", startLine: 3, endLine: 3 },
    { kind: "bathrooms", value: "4", startLine: 4, endLine: 4 },
  ] }] }));
  const result = await extractListing("10 Sample St\nBedrooms: 2\n2018 Sold $180,000\nBathrooms: 1");
  expect(result.data.candidates[0].claims).toEqual([{ kind: "bedrooms", value: "2", snippet: "Bedrooms: 2" }]);
  expect(result.omittedClaims).toBe(2);
});
it("reports the daily token limit and retry time without retaining raw provider text", async () => {
  vi.stubEnv("GROQ_API_KEY", "fictional-daily-limit");
  request.mockResolvedValue(new Response(JSON.stringify({ error: { message: "private payload: tokens per day (TPD): Limit 200000, Used 199587, Requested 5325" } }), { status: 429, headers: { "retry-after": "2122" } }));
  try { await extractListing("10 Sample St"); throw new Error("Expected failure"); }
  catch (error) {
    const failure = safeAiFailure(error);
    expect(failure).toMatchObject({ category: "quota", quota: { kind: "tokens_per_day", limit: 200000, used: 199587, requested: 5325, retryAfterSeconds: 2122 } });
    expect(aiFailureMessage(failure)).toMatch(/daily token/i);
    expect(aiFailureMessage(failure)).not.toContain("shorter copied page");
    expect(JSON.stringify(failure)).not.toContain("private payload");
  }
  await expect(extractListing("10 Sample St")).rejects.toMatchObject({ category: "quota", attempts: 0 });
  expect(request).toHaveBeenCalledTimes(1);
});
it("waits once for a short minute limit and then validates the extraction", async () => {
  vi.stubEnv("GROQ_API_KEY", "fictional-minute-limit");
  vi.useFakeTimers();
  request.mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "tokens per minute (TPM): Limit 8000, Used 7000, Requested 2000" } }), { status: 429, headers: { "retry-after": "1" } }))
    .mockResolvedValueOnce(answer({ candidates: [{ address: "10 Sample St", addressStartLine: 1, addressEndLine: 1, claims: [] }] }));
  const pending = extractListing("10 Sample St").then(result => ({ result }), error => ({ error }));
  await vi.advanceTimersByTimeAsync(0);
  expect(request).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1500);
  expect(await pending).toMatchObject({ result: { attempts: 2, data: { candidates: [{ address: "10 Sample St" }] } } });
  expect(request).toHaveBeenCalledTimes(2);
});
it("never moves a related property's detail into the main listing during partial recovery", async () => {
  request.mockResolvedValue(answer({ candidates: [
    { address: "10 Sample St", addressStartLine: 1, addressEndLine: 1, claims: [{ kind: "bedrooms", value: "5", startLine: 4, endLine: 4 }] },
    { address: "20 Other St", addressStartLine: 3, addressEndLine: 3, claims: [] },
  ] }));
  const result = await extractListing("10 Sample St\nBedrooms: 2\n20 Other St\nBedrooms: 5");
  expect(result.omittedClaims).toBe(1);
  expect(result.data.candidates[0].claims).toEqual([]);
});
it.each([
  ["tokens per minute (TPM)", "120"],
  ["tokens per day (TPD)", "1"],
  ["Request too large: tokens per minute (TPM)", "1"],
])("does not automatically retry %s outside the short minute policy", async (message, seconds) => {
  vi.stubEnv("GROQ_API_KEY", `fictional-limited-${message}`);
  request.mockResolvedValue(new Response(JSON.stringify({ error: { message } }), { status: 429, headers: { "retry-after": seconds } }));
  await expect(extractListing("10 Sample St")).rejects.toMatchObject({ category: "quota", attempts: 1 });
  expect(request).toHaveBeenCalledTimes(1);
});
it("stops after one short-limit retry even if the provider is still busy", async () => {
  vi.stubEnv("GROQ_API_KEY", "fictional-two-attempt-cap"); vi.useFakeTimers();
  request.mockImplementation(() => new Response(JSON.stringify({ error: { message: "tokens per minute (TPM)" } }), { status: 429, headers: { "retry-after": "1" } }));
  const pending = extractListing("10 Sample St").then(() => null, error => error);
  await vi.advanceTimersByTimeAsync(2000);
  expect(await pending).toMatchObject({ category: "quota", attempts: 2 });
  expect(request).toHaveBeenCalledTimes(2);
});

it("uses the fixed Groq endpoint with strict schema, one bounded request and exact quoted extraction", async () => {
  const data = { candidates: [{ address: "10 Sample St, Sample, NJ", addressSnippet: "10 Sample St, Sample, NJ", claims: [] }] };
  request.mockResolvedValue(answer({ candidates: [{ address: "10 Sample St, Sample, NJ", addressStartLine: 1, addressEndLine: 1, claims: [] }] }));
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
it("reconstructs quotes from source lines instead of letting the model rewrite the pasted page", async () => {
  const text = "Apartment for rent\n$2,375/mo\n\n10 Sample St, Sample, NJ\n2\nbeds\nTotal interior livable area: 1,200 sqft\nNearby apartments for rent\n20 Other St, Sample, NJ";
  request.mockResolvedValue(answer({ candidates: [{ address: "10 Sample St, Sample, NJ", addressStartLine: 3, addressEndLine: 3, claims: [
    { kind: "monthly_rent", value: "$2,375", startLine: 2, endLine: 2 },
    { kind: "bedrooms", value: "2", startLine: 4, endLine: 5 },
    { kind: "interior_area", value: "1200 sq ft", startLine: 6, endLine: 6 },
  ] }] }));
  const result = await extractListing(text);
  expect(result.data.candidates[0]).toMatchObject({ address: "10 Sample St, Sample, NJ", addressSnippet: "10 Sample St, Sample, NJ" });
  expect(result.data.candidates[0].claims.map(claim => [claim.value, claim.snippet])).toEqual([["$2,375", "$2,375/mo"], ["2", "2\nbeds"], ["1,200 sqft", "Total interior livable area: 1,200 sqft"]]);
  const sent = JSON.parse(request.mock.calls[0][1].body);
  expect(sent.messages[1].content).toContain("3|10 Sample St, Sample, NJ");
});
it("keeps numeric grounding checks after strict schema generation", async () => {
  request.mockResolvedValueOnce(answer(wire(analysis)));
  expect((await analyzeEvidence(new Map([["assessment", 100]]))).data).toEqual(analysis);
  const sent = JSON.parse(request.mock.calls[0][1].body);
  expect(sent.response_format.json_schema.schema.properties.findings.items.properties.evidenceIds.items.enum).toEqual(["assessment"]);
  request.mockResolvedValueOnce(answer(wire(analysis)));
  await expect(analyzeEvidence(new Map([["assessment", 200]]))).rejects.toMatchObject({ category: "invalid_output", validationFailure: "numeric", attempts: 1 });
});
it("allows numeric citations only to scalar numbers, never text bundles or unknowns", async () => {
  request.mockResolvedValueOnce(answer(wire(analysis)));
  await analyzeEvidence(new Map<string, string | number | null>([["assessment", 100], ["rent_assumptions", '{"annualTax":3600}'], ["rent_assumption_annualTax", 3600], ["missing", null]]));
  const schema = JSON.parse(request.mock.calls[0][1].body).response_format.json_schema.schema;
  expect(schema.properties.findings.items.properties.numericClaims.items.enum).toEqual(["assessment=100", "rent_assumption_annualTax=3600"]);
});
it("retains exact decimal values and rejects rounded reference tokens", async () => {
  const evidence = new Map([["assessment", 39499.99999999999]]);
  const precise = { ...analysis, findings: [{ ...analysis.findings[0], numericClaims: [{ evidenceId: "assessment", value: 39499.99999999999 }] }] };
  request.mockResolvedValueOnce(answer(wire(precise)));
  expect((await analyzeEvidence(evidence)).data.findings[0].numericClaims[0].value).toBe(39499.99999999999);
  request.mockResolvedValueOnce(answer({ ...wire(precise), findings: [{ ...wire(precise).findings[0], numericClaims: ["assessment=39500"] }] }));
  await expect(analyzeEvidence(evidence)).rejects.toMatchObject({ category: "invalid_output", validationFailure: "numeric" });
});
it("links a validated numeric reference without relying on a duplicated model citation", async () => {
  request.mockResolvedValueOnce(answer({ ...wire(analysis), findings: [{ ...wire(analysis).findings[0], evidenceIds: ["limits"] }] }));
  const result = await analyzeEvidence(new Map<string, string | number | null>([["assessment", 100], ["limits", "Check current records."]]));
  expect(result.data.findings[0].evidenceIds).toEqual(["limits", "assessment"]);
});
it("requires an empty numeric-citation list when there are no known numbers", async () => {
  request.mockResolvedValueOnce(answer({ ...analysis, findings: [{ explanation: "Records need checking.", evidenceIds: ["limits"], numericClaims: [] }] }));
  await analyzeEvidence(new Map([["limits", "No source numbers available."]]));
  const schema = JSON.parse(request.mock.calls[0][1].body).response_format.json_schema.schema;
  expect(schema.properties.findings.items.properties.numericClaims.maxItems).toBe(0);
});
it("rejects unsupported quotations and model-owned valuations", async () => {
  request.mockResolvedValueOnce(answer({ candidates: [{ address: "20 Other St", addressStartLine: 1, addressEndLine: 1, claims: [] }] }));
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
