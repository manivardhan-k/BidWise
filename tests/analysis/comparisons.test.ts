import { expect, it } from "vitest";
import { compareListingClaims } from "../../src/lib/analysis/comparisons";
import { normalizeRecords } from "../../src/lib/property/evidence";
const records = { status: "available" as const, data: normalizeRecords({ PAMS_PIN: "0000_1_1", NET_VALUE: 170000, YR_CONSTR: 1900, DWELL: 2 }) };
it("never calls asking price versus assessment a discrepancy", () => {
  const result = compareListingClaims([{ kind: "asking_price", value: "$200,000", snippet: "Asking $200,000" }], records);
  expect(result[0].status).toBe("not_comparable");
});
it("compares an explicit construction year and keeps bed count separate from dwelling count", () => {
  const claims = [{ kind: "year_built" as const, value: "1900", snippet: "Built 1900" }, { kind: "year_built" as const, value: "2000", snippet: "Built 2000" }, { kind: "bedrooms" as const, value: "2", snippet: "2 bedrooms" }];
  expect(compareListingClaims(claims, records).map(c => c.status)).toEqual(["matches", "differs", "cannot_verify"]);
});
it("does not infer numbers from vague claims or unavailable records", () => {
  const claim = { kind: "year_built" as const, value: "about 1900", snippet: "Built about 1900" };
  expect(compareListingClaims([claim], records)[0].status).toBe("cannot_verify");
  expect(compareListingClaims([{ ...claim, value: "1900" }], { status: "unavailable", message: "Timeout" })[0].status).toBe("cannot_verify");
});
