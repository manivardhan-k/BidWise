import { beforeEach, expect, it, vi } from "vitest";
const calls = vi.hoisted(() => ({ records: vi.fn(), area: vi.fn(), model: vi.fn() }));
vi.mock("../../src/lib/property/report", async original => ({ ...await original<object>(), recordsFor: calls.records }));
vi.mock("../../src/lib/providers/census", async original => ({ ...await original<object>(), cachedAreaBenchmarksFor: calls.area }));
vi.mock("../../src/lib/providers/gemini", async original => ({ ...await original<object>(), estimateStartingAssumptions: calls.model }));
import { POST } from "../../src/app/api/estimates/route";
import { signIdentity } from "../../src/lib/property/identity";
import { normalizeRecords } from "../../src/lib/property/evidence";
import { issueListingReceipt, listingFingerprint } from "../../src/lib/analysis/listing-receipt";
const identity = { pin: "0000_1_1", address: "10 Sample St, Sample, NJ", municipality: "SAMPLE", block: "1", lot: "1", qualifier: "", location: { x: -74.4, y: 40.4 }, precision: "PointAddress", score: 100, checkedAt: "2026-10-23T00:00:00Z" };
const request = (body: unknown) => new Request("http://localhost/api/estimates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => {
  Object.values(calls).forEach(call => call.mockReset());
  calls.records.mockResolvedValue({ status: "available", data: normalizeRecords({ PAMS_PIN: identity.pin, PROP_CLASS: "2", DWELL: 1, NET_VALUE: 999999, LAST_YR_TX: 6000 }) });
  calls.area.mockResolvedValue({ status: "unavailable", message: "No area fixture" });
  calls.model.mockRejectedValue({ status: 503 });
});
it("builds source-backed starting values without accepting browser-owned facts or invoking AI in the source phase", async () => {
  const response = await POST(request({ token: signIdentity(identity), revision: 7, stage: "sources", records: { historical_tax: 1 } }));
  expect(response.status).toBe(200); const body = await response.json();
  expect(body).toMatchObject({ revision: 7, pin: identity.pin, modelStatus: "not_requested" });
  expect(body.estimates.find((x: { field: string }) => x.field === "rent.annualTax").value).toBe(6000);
  expect(calls.model).not.toHaveBeenCalled(); expect(body.estimates.some((x: { value: number }) => x.value === 999999)).toBe(false);
});
it("preserves baseline estimates when AI is unavailable and binds the response to the property revision", async () => {
  const body = await (await POST(request({ token: signIdentity(identity), revision: 8, stage: "model" }))).json();
  expect(body).toMatchObject({ revision: 8, pin: identity.pin, modelStatus: "unavailable" }); expect(body.estimates.length).toBeGreaterThan(3);
});
it("withholds parcel-based prefills and model allowances while identifiers disagree", async () => {
  const token = signIdentity({ ...identity, matchReview: { addressBlock: "1.05", parcelBlock: "1" } });
  for (const stage of ["sources", "model"]) {
    const body = await (await POST(request({ token, revision: 8, stage }))).json();
    expect(body.gaps.join(" ")).toContain("Sources disagree on the block");
    expect(body.estimates.some((x: { kind: string }) => ["historical_record", "area_benchmark", "model_allowance"].includes(x.kind))).toBe(false);
    expect(body.recordKey).toBeDefined();
  }
  expect(calls.area).not.toHaveBeenCalled();
  expect(calls.model).not.toHaveBeenCalled();
});
it("rejects missing/changed listing binding before source or model requests", async () => {
  const candidate = { address: identity.address, addressSnippet: identity.address, claims: [{ kind: "asking_price" as const, value: "$200,000", snippet: "Asking $200,000" }] };
  const listing = issueListingReceipt(candidate), token = signIdentity({ ...identity, listingHash: listingFingerprint(candidate) });
  for (const attached of [undefined, issueListingReceipt({ ...candidate, address: "20 Other St", addressSnippet: "20 Other St" })]) expect((await POST(request({ token, revision: 1, stage: "sources", listing: attached }))).status).toBe(400);
  expect(calls.records).not.toHaveBeenCalled(); expect(calls.model).not.toHaveBeenCalled();
  const body = await (await POST(request({ token, revision: 1, stage: "sources", listing }))).json();
  expect(body.estimates.find((x: { field: string }) => x.field === "flip.purchase")).toMatchObject({ value: 200000, kind: "copied_claim" });
});
it("returns only validated model ranges and shows actual fallback provenance", async () => {
  calls.model.mockResolvedValue({ data: { estimates: [{ field: "renovation.allowance", value: 25000, low: 10000, high: 60000, evidenceIds: ["property_class"], explanation: "Provisional uninspected residential allowance, not physical findings." }] }, model: "gemini-3.5-flash-lite", fallbackFrom: "gemini-3.8-flash" });
  const body = await (await POST(request({ token: signIdentity(identity), revision: 9, stage: "model" }))).json();
  expect(body).toMatchObject({ modelStatus: "available", model: "gemini-3.5-flash-lite", fallbackFrom: "gemini-3.8-flash" });
  expect(body.estimates.find((x: { field: string }) => x.field === "renovation.allowance")).toMatchObject({ value: 25000, kind: "model_allowance" });
});
