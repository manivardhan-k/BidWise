import { expect, it } from "vitest";
import { baselineEstimates, validateModelEstimates, applyStartingEstimates, type EstimateEvidence } from "../../src/lib/finance/starting-estimates";
import { emptyFinance } from "../../src/lib/finance/engines";
const records = { status: "available" as const, data: { pin: "0000_1_1", fetchedAt: "2026-10-23T00:00:00Z", publicationDate: "2025-01-01", geometryDate: null, facts: [
  { id: "class", label: "Class", value: "2 — Residential", status: "source_matched" as const, sourceUrl: "https://example.invalid/record", fetchedAt: "2026-10-23T00:00:00Z", sourceDate: null, caveat: "Residential tax class." },
  { id: "residential_units", label: "Units", value: 1, status: "source_matched" as const, sourceUrl: "https://example.invalid/record", fetchedAt: "2026-10-23T00:00:00Z", sourceDate: null, caveat: "Record." },
  { id: "historical_tax", label: "Historical tax", value: 6000, status: "source_matched" as const, sourceUrl: "https://example.invalid/record", fetchedAt: "2026-10-23T00:00:00Z", sourceDate: null, caveat: "Not a current bill." },
  { id: "assessment", label: "Assessment", value: 900000, status: "source_matched" as const, sourceUrl: "https://example.invalid/record", fetchedAt: "2026-10-23T00:00:00Z", sourceDate: null, caveat: "Not market value." },
] } };
const area = { status: "available" as const, data: { geoid: "34023005602", name: "Test tract", period: "2020-2024", homeValue: 350000, homeValueMoe: 25000, contractRent: 1700, contractRentMoe: 150, fetchedAt: "2026-10-23T00:00:00Z", sourceUrl: "https://example.invalid/area", geographyUrl: "https://example.invalid/geography" } };
it("prefills dated area benchmarks and historical tax without pretending to know a property's price", () => {
  const bundle = baselineEstimates(records, area);
  expect(bundle.estimates.find(x => x.field === "flip.purchase")).toMatchObject({ value: 350000, kind: "area_benchmark", confidence: "low", rangeKind: "survey_moe" });
  expect(bundle.estimates.find(x => x.field === "rent.annualTax")).toMatchObject({ value: 6000, kind: "historical_record" });
  expect(bundle.estimates.find(x => x.field === "rent.monthlyRent")).toMatchObject({ value: 1700, kind: "area_benchmark" });
  expect(bundle.estimates.some(x => x.value === 900000)).toBe(false);
  expect(bundle.estimates.some(x => x.field === "rent.annualHoa")).toBe(false);
});
it("uses a quoted monthly rental advertisement for rent, never as a purchase price", () => {
  const listing = { address: "10 Sample St", addressSnippet: "10 Sample St", claims: [{ kind: "monthly_rent" as const, value: "$2,375", snippet: "Rent $2,375/mo" }] };
  const bundle = baselineEstimates(records, area, listing);
  expect(bundle.estimates.filter(item => item.field === "rent.monthlyRent")).toHaveLength(1);
  expect(bundle.estimates.find(item => item.field === "rent.monthlyRent")).toMatchObject({ value: 2375, kind: "copied_claim" });
  expect(bundle.estimates.find(item => item.field === "flip.purchase")?.value).not.toBe(2375);
  expect(baselineEstimates(records, area, { ...listing, claims: [{ ...listing.claims[0], kind: "asking_price" as const }] }).estimates.some(item => item.field === "flip.purchase" && item.value === 2375)).toBe(false);
});
it("withholds copied amounts that overflow instead of placing infinity into an input", () => {
  const amount = "9".repeat(400);
  const listing = { address: "10 Sample St", addressSnippet: "10 Sample St", claims: [{ kind: "asking_price" as const, value: amount, snippet: `Asking ${amount}` }] };
  expect(baselineEstimates(records, { status: "unavailable", message: "No area" }, listing).estimates.some(item => !Number.isFinite(item.value))).toBe(false);
});
it("uses one unambiguous asking claim but never an opening bid, judgment, conflicting asking prices or nominal recorded sale", () => {
  const claim = { kind: "asking_price" as const, value: "$420,000", snippet: "Asking $420,000" };
  const listing = { address: "10 Sample St", addressSnippet: "10 Sample St", claims: [claim] };
  expect(baselineEstimates(records, area, listing).estimates.find(x => x.field === "flip.purchase")).toMatchObject({ value: 420000, kind: "copied_claim" });
  const none = { status: "unavailable" as const, message: "No market data" };
  expect(baselineEstimates(records, none, { ...listing, claims: [{ ...claim, kind: "opening_bid" }] }).estimates.some(x => x.field === "flip.purchase")).toBe(false);
  expect(baselineEstimates(records, none, { ...listing, claims: [claim, { ...claim, value: "$500,000" }] }).estimates.some(x => x.field === "flip.purchase")).toBe(false);
});
it("withholds area-price/rent prefills for multiple units or unreliable survey estimates", () => {
  const multi = { ...records, data: { ...records.data, facts: records.data.facts.map(x => x.id === "residential_units" ? { ...x, value: 2 } : x) } };
  expect(baselineEstimates(multi, area).estimates.some(x => ["flip.purchase", "flip.resale", "rent.monthlyRent"].includes(x.field))).toBe(false);
  expect(baselineEstimates(records, { ...area, data: { ...area.data, homeValueMoe: 200000 } }).estimates.some(x => x.field === "flip.resale")).toBe(false);
});
it("model allowances require allowed numeric fields, bounds, genuine references and ordered uncertainty", () => {
  const evidence = new Map<string, EstimateEvidence>([["property_year", { value: 1900, description: "Tax record construction year" }]]);
  const proposal = { estimates: [{ field: "renovation.allowance", value: 35000, low: 15000, high: 65000, evidenceIds: ["property_year"], explanation: "Provisional uninspected budget, not established repair needs." }] };
  expect(validateModelEstimates(proposal, evidence).estimates).toHaveLength(1);
  for (const changes of [{ field: "flip.resale" }, { value: Infinity }, { low: 50000 }, { evidenceIds: ["invented"] }, { value: -1 }]) expect(() => validateModelEstimates({ estimates: [{ ...proposal.estimates[0], ...changes }] }, evidence)).toThrow();
});
it("fills untouched fields once and preserves edited, cleared and changed-back fields and repair lists", () => {
  const bundle = baselineEstimates(records, area);
  const touched = new Set(["flip.purchase", "rent.annualTax", "renovation.items"]);
  const current = emptyFinance(); current.flip.purchase = 123456;
  const result = applyStartingEstimates(current, bundle.estimates, touched);
  expect(result.flip.purchase).toBe(123456); expect(result.rent.annualTax).toBeNull(); expect(result.rent.monthlyRent).toBe(1700);
  expect(result.renovation.items).toEqual(current.renovation.items);
  expect(applyStartingEstimates(result, bundle.estimates, touched)).toEqual(result);
});
it("recognizes the canonical NJ residential class and preserves invalid human inputs for correction", async () => {
  const { normalizeRecords } = await import("../../src/lib/property/evidence");
  const normalized = { status: "available" as const, data: normalizeRecords({ PAMS_PIN: "0000_1_1", PROP_CLASS: "2", DWELL: 1 }) };
  expect(baselineEstimates(normalized, area).estimates.find(x => x.field === "flip.resale")?.value).toBe(350000);
  const current = emptyFinance(); current.rent.vacancy = 2;
  const applied = applyStartingEstimates(current, baselineEstimates(normalized, area).estimates, new Set(["rent.vacancy"]));
  expect(applied.rent.vacancy).toBe(2); expect(applied.rent.monthlyRent).toBe(1700);
});
it("rejects duplicate model fields and an answer with no actual property/area basis", () => {
  const evidence = new Map<string, EstimateEvidence>([["limits", { value: "Unknown", description: "Limits" }], ["property_year", { value: 1900, description: "Year" }]]);
  const row = { field: "rent.annualInsurance", value: 2000, low: 1000, high: 5000, explanation: "Rough budget, not evidence of insurability or a quote.", evidenceIds: ["property_year"] };
  expect(() => validateModelEstimates({ estimates: [row, row] }, evidence)).toThrow();
  expect(() => validateModelEstimates({ estimates: [{ ...row, evidenceIds: ["limits"] }] }, evidence)).toThrow();
});
it("binds estimates to substantive source evidence without treating a retrieval-clock change as a new record", async () => {
  const { recordEvidenceKey } = await import("../../src/lib/finance/starting-estimates");
  expect(recordEvidenceKey(records)).toBe(recordEvidenceKey({ ...records, data: { ...records.data, fetchedAt: "2026-10-23T10:00:00Z", facts: records.data.facts.map(x => ({ ...x, fetchedAt: "2026-10-23T10:00:00Z" })) } }));
  expect(recordEvidenceKey(records)).not.toBe(recordEvidenceKey({ ...records, data: { ...records.data, facts: records.data.facts.map(x => x.id === "historical_tax" ? { ...x, value: 8000 } : x) } }));
});
