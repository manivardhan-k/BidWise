import { afterEach, expect, it, vi } from "vitest";
const extract = vi.hoisted(() => vi.fn());
vi.mock("../../src/lib/providers/gemini", async importOriginal => ({ ...await importOriginal<object>(), extractListing: extract }));
import { POST } from "../../src/app/api/parse/route";
import { verifyListingReceipt } from "../../src/lib/analysis/listing-receipt";
afterEach(() => extract.mockReset());
const request = (text: string) => new Request("http://localhost/api/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
it("rejects URLs and excessive text without spending a model request", async () => {
  expect((await POST(request("https://example.invalid/house"))).status).toBe(400);
  expect((await POST(request("a".repeat(50_001)))).status).toBe(413);
  expect(extract).not.toHaveBeenCalled();
});
it("accepts the disclosed text limit with UTF-8 and returns authenticated claims", async () => {
  const candidate = { address: "10 Sample St, Sample, NJ", addressSnippet: "10 Sample St, Sample, NJ", claims: [] };
  extract.mockResolvedValue({ data: { candidates: [candidate] }, model: "test-model" });
  const response = await POST(request("字".repeat(50_000)));
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
