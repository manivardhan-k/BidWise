import { beforeEach, expect, it, vi } from "vitest";
const calls = vi.hoisted(() => ({ identify: vi.fn(), parcelsAt: vi.fn(), recordsFor: vi.fn(), hazardsFor: vi.fn(), analyzeEvidence: vi.fn() }));
vi.mock("../../src/lib/providers/njgin", async original => ({ ...await original<object>(), identify: calls.identify, parcelsAt: calls.parcelsAt }));
vi.mock("../../src/lib/property/report", async original => ({ ...await original<object>(), recordsFor: calls.recordsFor, hazardsFor: calls.hazardsFor }));
vi.mock("../../src/lib/providers/gemini", async original => ({ ...await original<object>(), analyzeEvidence: calls.analyzeEvidence }));
import { POST as identify } from "../../src/app/api/identify/route";
import { POST as analyze } from "../../src/app/api/analysis/route";
import { issueListingReceipt } from "../../src/lib/analysis/listing-receipt";
import { normalizeRecords } from "../../src/lib/property/evidence";
const address = "10 Sample St, Sample, NJ";
const candidate = { address, addressSnippet: address, claims: [{ kind: "year_built" as const, value: "2000", snippet: "Built 2000" }] };
const request = (body: unknown) => new Request("http://localhost/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => {
  Object.values(calls).forEach(call => call.mockReset());
  calls.identify.mockResolvedValue([{ address, score: 100, location: { x: -74.4, y: 40.4 }, attributes: { Addr_type: "PointAddress", Addr_Block: "1", Addr_Lot: "1" } }]);
  calls.parcelsAt.mockResolvedValue({ features: [{ attributes: { PAMS_PIN: "0000_1_1", MUN_NAME: "SAMPLE", PCLBLOCK: "1", PCLLOT: "1" } }] });
  calls.recordsFor.mockResolvedValue({ status: "available", data: normalizeRecords({ PAMS_PIN: "0000_1_1", YR_CONSTR: 1900 }) });
  calls.hazardsFor.mockResolvedValue({ status: "unavailable", message: "No flood fixture" });
  calls.analyzeEvidence.mockRejectedValue({ status: 503 });
});
it("binds extraction to the signed parcel and returns comparisons even when AI fails", async () => {
  const listing = issueListingReceipt(candidate);
  const found = await (await identify(request({ address, listing }))).json();
  const response = await analyze(request({ token: found.choices[0].token, revision: 1, listing }));
  expect(response.status).toBe(200); const body = await response.json();
  expect(body.status).toBe("unavailable"); expect(body.listingEvidence.comparisons[0].status).toBe("differs");
  const evidence = calls.analyzeEvidence.mock.calls[0][0] as Map<string, unknown>;
  expect(evidence.get("listing_claim_0")).toBe("year_built: 2000");
  expect(evidence.get("year_built")).toBe(1900);
});
it("rejects a different authentic listing and missing bound claims before any source/model request", async () => {
  const listing = issueListingReceipt(candidate);
  const found = await (await identify(request({ address, listing }))).json();
  const other = issueListingReceipt({ ...candidate, address: "20 Other St", addressSnippet: "20 Other St" });
  for (const attached of [other, undefined]) expect((await analyze(request({ token: found.choices[0].token, revision: 1, listing: attached }))).status).toBe(400);
  expect(calls.recordsFor).not.toHaveBeenCalled(); expect(calls.analyzeEvidence).not.toHaveBeenCalled();
});
it("rejects changing a pasted address before geocoding or adding claims to an address-only confirmation", async () => {
  const listing = issueListingReceipt(candidate);
  expect((await identify(request({ address: "20 Other St", listing }))).status).toBe(400);
  expect(calls.identify).not.toHaveBeenCalled();
  const found = await (await identify(request({ address }))).json();
  expect((await analyze(request({ token: found.choices[0].token, revision: 1, listing }))).status).toBe(400);
  expect(calls.analyzeEvidence).not.toHaveBeenCalled();
});
