import { afterEach, expect, it, vi } from "vitest";
import { issueListingReceipt, verifyListingReceipt, listingFingerprint } from "../../src/lib/analysis/listing-receipt";
const candidate = { address: "10 Sample St, Sample, NJ", addressSnippet: "10 Sample St, Sample, NJ", claims: [{ kind: "asking_price" as const, value: "$200,000", snippet: "Asking $200,000" }] };
afterEach(() => vi.useRealTimers());
it("binds a parsed candidate and quoted claims without retaining the full pasted page", () => {
  const parsed = issueListingReceipt(candidate);
  expect(verifyListingReceipt(parsed)).toEqual(candidate);
  expect(parsed.receipt).not.toContain("$200,000");
  expect(() => verifyListingReceipt({ ...parsed, candidate: { ...candidate, claims: [{ ...candidate.claims[0], value: "$1" }] } })).toThrow();
});
it("rejects expired receipts and edited addresses", () => {
  vi.useFakeTimers(); const parsed = issueListingReceipt(candidate);
  expect(() => verifyListingReceipt({ ...parsed, candidate: { ...candidate, address: "20 Other St" } })).toThrow();
  vi.advanceTimersByTime(15 * 60_000 + 1);
  expect(() => verifyListingReceipt(parsed)).toThrow();
});
it("fingerprints all claim content for binding to the confirmed identity", () => {
  expect(listingFingerprint(candidate)).not.toBe(listingFingerprint({ ...candidate, claims: [] }));
});
it("rejects attaching valid claims to a different confirmed identity", () => {
  const parsed = issueListingReceipt(candidate);
  expect(() => verifyListingReceipt(parsed, "0".repeat(64))).toThrow();
});
