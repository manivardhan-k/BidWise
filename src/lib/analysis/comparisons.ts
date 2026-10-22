import type { ListingClaim } from "./validate";
import type { PropertyRecords, SourceResult } from "../property/types";
export type ClaimComparison = { claim: ListingClaim; status: "matches" | "differs" | "cannot_verify" | "not_comparable"; explanation: string; officialFactId?: string };
export function compareListingClaims(claims: ListingClaim[], records: SourceResult<PropertyRecords>): ClaimComparison[] {
  return claims.map(claim => {
    const result = (status: ClaimComparison["status"], explanation: string, officialFactId?: string): ClaimComparison => ({ claim, status, explanation, officialFactId });
    if (["asking_price", "opening_bid", "judgment"].includes(claim.kind)) return result("not_comparable", "This is a different price type from assessed value or a historical recorded sale. Different amounts are not a verified conflict.");
    if (claim.kind === "interior_area") return result("not_comparable", "Interior floor area is different from parcel acreage. This source does not supply interior floor area.");
    const officialFactId = claim.kind === "year_built" ? "year_built" : claim.kind === "residential_units" ? "residential_units" : undefined;
    if (!officialFactId) return result("cannot_verify", "This claim needs listing evidence, an inspection or another source. Bedrooms, bathrooms and condition are not established by this parcel record.");
    const fact = records.status === "available" ? records.data.facts.find(item => item.id === officialFactId) : undefined;
    if (!fact || typeof fact.value !== "number" || !/^\d+$/.test(claim.value.trim())) return result("cannot_verify", "A directly comparable numeric record or an exact numeric claim is missing.", officialFactId);
    const same = Number(claim.value.trim()) === fact.value;
    return result(same ? "matches" : "differs", same ? "The copied claim agrees with the returned tax-record value. Agreement is not independent certification." : "The copied claim differs from the returned tax record. Check the dates, record and seller evidence; neither is automatically established as correct.", officialFactId);
  });
}
