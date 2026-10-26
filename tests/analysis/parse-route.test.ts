import { afterEach, expect, it, vi } from "vitest";
const extract = vi.hoisted(() => vi.fn());
vi.mock("../../src/lib/providers/gemini", async importOriginal => ({ ...await importOriginal<object>(), extractListing: extract }));
import { POST } from "../../src/app/api/parse/route";
import { verifyListingReceipt } from "../../src/lib/analysis/listing-receipt";
afterEach(() => { extract.mockReset(); vi.useRealTimers(); });
const request = (text: string) => new Request("http://localhost/api/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
it("rejects URLs and excessive text without spending a model request", async () => {
  expect((await POST(request("https://example.invalid/house"))).status).toBe(400);
  expect((await POST(request("a".repeat(50_001)))).status).toBe(413);
  expect(extract).not.toHaveBeenCalled();
});
it("accepts the disclosed text limit with UTF-8 and returns authenticated claims", async () => {
  const candidate = { address: "10 Sample St, Sample, NJ", addressSnippet: "10 Sample St, Sample, NJ", claims: [] };
  extract.mockResolvedValue({ data: { candidates: [candidate] }, model: "test-model" });
  const response = await POST(request(`${candidate.address}\n${"字".repeat(50_000 - candidate.address.length - 1)}`));
  expect(response.status).toBe(200);
  const body = await response.json(); expect(verifyListingReceipt(body.candidates[0])).toEqual(candidate);
  expect(JSON.stringify(body)).not.toContain("字");
});
it("keeps provider failures separate from successful extraction", async () => {
  extract.mockRejectedValue({ status: 503, message: "private provider payload" });
  const response = await POST(request("10 Sample St, Sample, NJ"));
  expect(response.status).toBe(503);
  expect(JSON.stringify(await response.json())).not.toContain("private provider payload");
});
it("returns safe model/attempt diagnostics without raw provider messages", async () => {
  const { GeminiFailure } = await import("../../src/lib/providers/gemini");
  extract.mockRejectedValue(new GeminiFailure("provider", 503, 3, "gemini-3.5-flash-lite"));
  const body = await (await POST(request("10 Sample St, Sample, NJ"))).json();
  expect(body).toMatchObject({ category: "provider", attempts: 3, failedModel: "gemini-3.5-flash-lite" });
});
it("reuses a verified identical paste and issues a usable receipt without another model call", async () => {
  const candidate = { address: "10 Sample St", addressSnippet: "10 Sample St", claims: [] };
  extract.mockResolvedValue({ data: { candidates: [candidate] }, model: "fixture-cache-model" });
  const text = "Repeated listing fixture\n10 Sample St";
  const first = await (await POST(request(text))).json();
  const second = await (await POST(request(text))).json();
  expect(verifyListingReceipt(second.candidates[0])).toEqual(candidate);
  expect(second.extractedAt).toBe(first.extractedAt);
  expect(second.reused).toBe(true);
  expect(extract).toHaveBeenCalledTimes(1);
});
it("shares concurrent identical processing and does not cache a failed extraction", async () => {
  const candidate = { address: "20 Other St", addressSnippet: "20 Other St", claims: [] };
  extract.mockRejectedValueOnce({ status: 503 });
  const text = "Concurrent listing fixture\n20 Other St";
  expect((await POST(request(text))).status).toBe(503);
  let finish!: (value: unknown) => void;
  extract.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const first = POST(request(text)), second = POST(request(text));
  await vi.waitFor(() => expect(typeof finish).toBe("function"));
  finish({ data: { candidates: [candidate] }, model: "fixture-cache-model" });
  const responses = await Promise.all([first, second]);
  for (const response of responses) expect(verifyListingReceipt((await response.json()).candidates[0])).toEqual(candidate);
  expect(extract).toHaveBeenCalledTimes(2);
});
it("refreshes an expired result and processes a changed paste independently", async () => {
  vi.useFakeTimers();
  const candidate = { address: "30 Third St", addressSnippet: "30 Third St", claims: [] };
  extract.mockResolvedValue({ data: { candidates: [candidate] }, model: "fixture-cache-model" });
  const text = "Expiry fixture\n30 Third St";
  expect((await POST(request(text))).status).toBe(200);
  expect((await POST(request(`${text}\nNew property detail`))).status).toBe(200);
  await vi.advanceTimersByTimeAsync(10 * 60_000 + 1);
  expect((await POST(request(text))).status).toBe(200);
  expect(extract).toHaveBeenCalledTimes(3);
});
