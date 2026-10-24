import type { PropertyIdentity } from "./types";

export function matchReviewMessage(identity: PropertyIdentity) {
  if (!identity.matchReview) return null;
  return `Sources disagree on the block: NJ's address index reports ${identity.matchReview.addressBlock}; the parcel layer reports ${identity.matchReview.parcelBlock}. Lot ${identity.lot} and unit ${identity.qualifier} agree at this location. This does not resolve the block disagreement. Verify the identifiers against the current municipal tax record or deed before relying on this parcel's report.`;
}
