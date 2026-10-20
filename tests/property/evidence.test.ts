import { describe, expect, it } from "vitest";
import { normalizeRecords, readableDeedDate } from "../../src/lib/property/evidence";
describe("record meaning", () => {
  it("keeps unknown years and zero sales distinct from reported zero tax", () => {
    const result = normalizeRecords({ PAMS_PIN: "1213_89_40", YR_CONSTR: 0, SALE_PRICE: 0, LAST_YR_TX: 0 });
    expect(result.facts.find(f => f.id === "year_built")?.value).toBeNull();
    expect(result.facts.find(f => f.id === "recorded_sale")?.value).toBeNull();
    expect(result.facts.find(f => f.id === "historical_tax")?.value).toBe(0);
    expect(result.publicationDate).toBeNull();
  });
  it("qualifies nominal sales and formats full years and discloses the century interpretation", () => {
    const result = normalizeRecords({ PAMS_PIN: "1213_89_40", SALE_PRICE: 1, DEED_DATE: "131029", PCL_PBDATE: Date.UTC(2026, 4, 18), PCLLASTUPD: Date.UTC(2015, 7, 17) });
    expect(result.facts.find(f => f.id === "recorded_sale")?.caveat).toContain("Nominal");
    expect(result.facts.find(f => f.id === "deed_date")?.value).toBe("October 29, 2013");
    expect(result.facts.find(f => f.id === "deed_date")?.rawValue).toBe("131029");
    expect(result.facts.find(f => f.id === "deed_date")?.caveat).toContain("century is inferred");
    expect(result.publicationDate).toBe("2026-05-18"); expect(result.geometryDate).toBe("2015-08-17");
    expect(JSON.stringify(result)).not.toContain("OWNER_NAME");
  });
});

it("validates source dates without normalizing impossible dates into different days", () => {
  expect(readableDeedDate("181010")).toBe("October 10, 2018");
  expect(readableDeedDate("000229")).toBe("February 29, 2000");
  for (const raw of ["000000", "180230", "181301", "190229", "18", "2018-10-10", null]) expect(readableDeedDate(raw)).toBeNull();
});
it("exposes useful extended fields without mistaking mailing information for property facts", () => {
  const records = normalizeRecords({ PAMS_PIN: "0000_1_1", COUNTY: "SAMPLE", PROP_LOC: "10 SAMPLE ST", PROP_CLASS: "2", LAND_VAL: 120000, IMPRVT_VAL: 50000, CALC_ACRE: 0.1, DWELL: 1, COMM_DWELL: null, BLDG_DESC: "1S F", DEED_BOOK: "00123", DEED_PAGE: "00045", ZIP5: "99999", ST_ADDRESS: "PRIVATE MAILING ADDRESS" });
  const facts = new Map(records.facts.map(f => [f.id, f]));
  expect(facts.get("class")?.value).toBe("Residential (class 2)");
  expect(facts.get("land_assessment")?.value).toBe(120000);
  expect(facts.get("residential_units")?.value).toBe(1);
  expect(facts.get("commercial_units")?.value).toBeNull();
  expect(facts.get("deed_page")?.value).toBe("00045");
  expect(facts.get("acreage")?.caveat).toContain("not measured interior floor area");
  expect(JSON.stringify(records)).not.toContain("99999");
  expect(JSON.stringify(records)).not.toContain("PRIVATE MAILING ADDRESS");
});

it("uses a documented retrieval-year pivot and validates dates in the interpreted century", () => {
  expect(readableDeedDate("991231", "2026-10-20T00:00:00Z")).toBe("December 31, 1999");
  expect(readableDeedDate("181010", "1999-10-20T00:00:00Z")).toBe("October 10, 1918");
  expect(readableDeedDate("270101", "2026-10-20T00:00:00Z")).toBe("January 1, 1927");
  expect(readableDeedDate("000229", "1999-10-20T00:00:00Z")).toBeNull();
  expect(readableDeedDate("181010", "invalid")).toBeNull();
  const date = normalizeRecords({ PAMS_PIN: "0000_1_1", DEED_DATE: "181010" }, "1999-10-20T00:00:00Z").facts.find(f => f.id === "deed_date");
  expect(date?.value).toBe("October 10, 1918");
  expect(date?.caveat).toContain("retrieval year (1999)");
  expect(date?.rawValue).toBe("181010");
});
