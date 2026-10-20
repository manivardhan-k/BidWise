import { afterEach, describe, expect, it, vi } from "vitest";
const create = vi.hoisted(() => vi.fn());
vi.mock("@google/genai", () => ({ GoogleGenAI: class {
  interactions = { create };
} }));
import { extractListing } from "../../src/lib/providers/gemini";

afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); vi.restoreAllMocks(); create.mockReset(); });
function configure() {
  vi.stubEnv("GEMINI_API_KEY", "test-key-not-real");
  vi.stubEnv("GEMINI_MODEL", "gemini-3.8-flash");
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
