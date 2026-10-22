import { afterEach, describe, expect, it, vi } from "vitest";
const create = vi.hoisted(() => vi.fn());
vi.mock("@google/genai", () => ({ GoogleGenAI: class {
  interactions = { create };
} }));
import { extractListing, analyzeEvidence } from "../../src/lib/providers/gemini";

afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); vi.restoreAllMocks(); create.mockReset(); });
function configure() {
  vi.stubEnv("GEMINI_API_KEY", "test-key-not-real");
  vi.stubEnv("GEMINI_MODEL", "gemini-3.8-flash");
  vi.stubEnv("GEMINI_FALLBACK_MODEL", "");
}
describe("Interactions output contract", () => {
  it("reads the final SDK output instead of combining intermediate JSON", async () => {
    configure();
    const final = { candidates: [{ address: "123 Main St", addressSnippet: "123 Main St", claims: [] }] };
    create.mockResolvedValue({ output_text: JSON.stringify(final), steps: [
      { type: "model_output", content: [{ type: "text", text: "Intermediate response" }] },
      { type: "model_output", content: [{ type: "text", text: JSON.stringify(final) }] },
    ], usage: { total_input_tokens: 10 } });
    expect((await extractListing("123 Main St")).data).toEqual(final);
  });
  it("reports missing final JSON as invalid output, not network failure", async () => {
    configure(); create.mockResolvedValue({ steps: [], usage: null });
    await expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "invalid_output" });
  });
  it("does not retry or expose provider data after a quota error", async () => {
    configure(); create.mockRejectedValue(Object.assign(new Error("private-marker"), { status: 429 }));
    await expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "quota", httpStatus: 429 });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][1]).toMatchObject({ maxRetries: 0 });
  });
  it("waits after 503 then recovers with one retry", async () => {
    configure(); vi.useFakeTimers(); vi.spyOn(Math, "random").mockReturnValue(0.5);
    create.mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce({ output_text: '{"candidates":[]}' });
    const pending = extractListing("123 Main St");
    await vi.advanceTimersByTimeAsync(1000);
    expect(create).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(125);
    expect((await pending).attempts).toBe(2);
    expect(create).toHaveBeenCalledTimes(2);
  });
  it("stops after the second 503 and reports the actual attempt count", async () => {
    configure(); vi.useFakeTimers(); create.mockRejectedValue({ status: 503 });
    const checked = expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "provider", httpStatus: 503, attempts: 2 });
    await vi.runAllTimersAsync(); await checked;
    expect(create).toHaveBeenCalledTimes(2);
  });
  it("keeps the attempt count when a retried response fails validation", async () => {
    configure(); vi.useFakeTimers();
    create.mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce({ output_text: "malformed" });
    const checked = expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "invalid_output", attempts: 2 });
    await vi.runAllTimersAsync(); await checked;
    expect(create).toHaveBeenCalledTimes(2);
  });
  it("does not retry a timeout or malformed final output", async () => {
    configure(); create.mockRejectedValueOnce(Object.assign(new Error(), { name: "RequestTimeoutError" }));
    await expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "timeout", attempts: 1 });
    expect(create).toHaveBeenCalledTimes(1);
    create.mockReset(); create.mockResolvedValue({ output_text: "malformed" });
    await expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "invalid_output", attempts: 1 });
    expect(create).toHaveBeenCalledTimes(1);
  });
});

// Models the independently observed provider rejection. App-side limits must survive.
it("keeps extraction usable when the provider rejects nested maxItems constraints", async () => {
  configure();
  create.mockImplementation(async request => {
    const schema = request.response_format.schema;
    if (schema.properties.candidates.maxItems !== undefined || schema.properties.candidates.items.properties.claims.maxItems !== undefined) throw { status: 400 };
    return { output_text: '{"candidates":[{"address":"123 Main St","addressSnippet":"123 Main St","claims":[]}]}' };
  });
  expect((await extractListing("123 Main St")).data.candidates[0].address).toBe("123 Main St");
});
it("still rejects oversized extraction replies after provider schema adaptation", async () => {
  configure();
  create.mockResolvedValue({ output_text: JSON.stringify({ candidates: Array.from({length: 6}, () => ({ address: "123 Main St", addressSnippet: "123 Main St", claims: [] })) }) });
  await expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "invalid_output" });
});
it("adapts analysis array constraints without accepting unsupported evidence", async () => {
  configure();
  create.mockImplementation(async request => {
    if (JSON.stringify(request.response_format.schema).includes('"maxItems"')) throw { status: 400 };
    return { output_text: JSON.stringify({ summary: "Check title separately.", findings: [{ explanation: "A record is available.", evidenceIds: ["invented"], numericClaims: [] }], unansweredQuestions: [], consistencyFlags: [] }) };
  });
  await expect(analyzeEvidence(new Map([["assessment", 100]]))).rejects.toMatchObject({ category: "invalid_output" });
});

describe("503-only configured free fallback", () => {
  function fallback() { configure(); vi.stubEnv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash-lite"); }
  it("keeps 3.8 preferred and makes one fallback attempt after two 503s", async () => {
    fallback(); vi.useFakeTimers();
    create.mockRejectedValueOnce({ status: 503 }).mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce({ output_text: '{"candidates":[]}' });
    const pending = extractListing("123 Main St"); await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({ model: "gemini-3.5-flash-lite", fallbackFrom: "gemini-3.8-flash", attempts: 3 });
    expect(create.mock.calls.map(call => call[0].model)).toEqual(["gemini-3.8-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite"]);
    expect(create.mock.calls.every(call => call[0].store === false && call[1].maxRetries === 0)).toBe(true);
  });
  it("does not use fallback when the primary retry succeeds", async () => {
    fallback(); vi.useFakeTimers(); create.mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce({ output_text: '{"candidates":[]}' });
    const pending = extractListing("123 Main St"); await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({ model: "gemini-3.8-flash", attempts: 2 }); expect(create).toHaveBeenCalledTimes(2);
  });
  it("never falls back after quota, auth, bad request, timeout or malformed output", async () => {
    fallback();
    for (const error of [{ status: 429 }, { status: 401 }, { status: 403 }, { status: 400 }, { status: 404 }, Object.assign(new Error(), { name: "RequestTimeoutError" }), new Error("private-network-marker")]) {
      create.mockReset(); create.mockRejectedValue(error); await expect(extractListing("123 Main St")).rejects.toBeDefined(); expect(create).toHaveBeenCalledTimes(1);
    }
    create.mockReset(); create.mockResolvedValue({ output_text: "not JSON" });
    await expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "invalid_output" }); expect(create).toHaveBeenCalledTimes(1);
  });
  it("stops if the primary retry changes from 503 to a quota failure", async () => {
    fallback(); vi.useFakeTimers(); create.mockRejectedValueOnce({ status: 503 }).mockRejectedValueOnce({ status: 429 });
    const checked = expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "quota", attempts: 2 }); await vi.runAllTimersAsync(); await checked;
    expect(create).toHaveBeenCalledTimes(2);
  });
  it("caps a failed fallback at three total attempts", async () => {
    fallback(); vi.useFakeTimers(); create.mockRejectedValue({ status: 503 });
    const checked = expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "provider", httpStatus: 503, attempts: 3, model: "gemini-3.5-flash-lite" }); await vi.runAllTimersAsync(); await checked;
    expect(create).toHaveBeenCalledTimes(3);
  });
  it("keeps quotation and evidence validation after fallback", async () => {
    fallback(); vi.useFakeTimers(); create.mockRejectedValueOnce({ status: 503 }).mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce({ output_text: JSON.stringify({ candidates: [{ address: "20 Wrong Street", addressSnippet: "123 Main St", claims: [] }] }) });
    const checked = expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "invalid_output", attempts: 3 }); await vi.runAllTimersAsync(); await checked;
    expect(create).toHaveBeenCalledTimes(3);
  });
  it("rejects an unapproved fallback model before inference", async () => {
    configure(); vi.stubEnv("GEMINI_FALLBACK_MODEL", "unverified-paid-model");
    await expect(extractListing("123 Main St")).rejects.toMatchObject({ category: "configuration", attempts: 0 }); expect(create).not.toHaveBeenCalled();
  });
});
it("rejects invented numeric evidence from the fallback analysis", async () => {
  configure(); vi.stubEnv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash-lite"); vi.useFakeTimers();
  create.mockRejectedValueOnce({ status: 503 }).mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce({ output_text: JSON.stringify({ summary: "Fixture", findings: [{ explanation: "Unsupported amount", evidenceIds: ["assessment"], numericClaims: [{ evidenceId: "assessment", value: 999999 }] }], unansweredQuestions: [], consistencyFlags: [] }) });
  const checked = expect(analyzeEvidence(new Map([["assessment", 100]]))).rejects.toMatchObject({ category: "invalid_output", attempts: 3 }); await vi.runAllTimersAsync(); await checked;
  expect(create).toHaveBeenCalledTimes(3);
});
