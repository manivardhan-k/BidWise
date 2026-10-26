import { expect, it } from "vitest";
import { numberedSource, validateReferencedExtraction } from "../../src/lib/analysis/source-lines";
const text = "\r\n10 Sample St, Sample, NJ\r\n\r\nBedrooms: 2\r\nInterior area: 1,200 sqft\r\n20 Other St, Sample, NJ\r\nBedrooms: 5";
const main = { address: "10 Sample St, Sample, NJ", addressStartLine: 1, addressEndLine: 1, claims: [{ kind: "interior_area", value: "1200 sqft", startLine: 3, endLine: 3 }] };
it("numbers visible lines without changing source excerpts or CRLF/blank-line boundaries", () => {
  expect(numberedSource(text).input).toContain("2|Bedrooms: 2\n3|Interior area: 1,200 sqft");
  expect(validateReferencedExtraction({ candidates: [main] }, text).candidates[0].claims[0]).toMatchObject({ value: "1,200 sqft", snippet: "Interior area: 1,200 sqft" });
});
it("rejects nonexistent, reversed, overly broad or fabricated address references", () => {
  for (const change of [{ addressStartLine: 99, addressEndLine: 99 }, { addressStartLine: 2, addressEndLine: 1 }, { address: "30 Invented St, Sample, NJ" }]) expect(() => validateReferencedExtraction({ candidates: [{ ...main, ...change }] }, text)).toThrow();
  expect(() => validateReferencedExtraction({ candidates: [{ ...main, addressStartLine: 1, addressEndLine: 2, claims: [] }] }, `${main.address}\n${"x".repeat(501)}`)).toThrow("broad");
});
it("keeps another property's referenced claims outside the main target", () => {
  const other = { address: "20 Other St, Sample, NJ", addressStartLine: 4, addressEndLine: 4, claims: [] };
  expect(() => validateReferencedExtraction({ candidates: [{ ...main, claims: [{ kind: "bedrooms", value: "5", startLine: 5, endLine: 5 }] }, other] }, text)).toThrow("property context");
});
