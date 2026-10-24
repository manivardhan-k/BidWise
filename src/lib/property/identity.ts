import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { identify, parcelsAt, pinSchema, pointSchema } from "../providers/njgin";
import type { PropertyChoice, PropertyIdentity } from "./types";
import { matchReviewMessage } from "./match-review";

// Server-process secret. Tokens expire on restart or after 15 minutes; no DB.
const processState = globalThis as typeof globalThis & { bidwiseIdentitySecret?: Buffer };
const secret = processState.bidwiseIdentitySecret ??= randomBytes(32);
const identitySchema = z.object({
  pin: pinSchema, address: z.string().max(300), municipality: z.string().max(100),
  block: z.string().max(40), lot: z.string().max(40), qualifier: z.string().max(40),
  location: pointSchema, precision: z.string().max(40), score: z.number().min(0).max(100),
  checkedAt: z.iso.datetime(),
  matchReview: z.object({ addressBlock: z.string().min(1).max(40), parcelBlock: z.string().min(1).max(40) }).optional(),
  listingHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});
function signature(body: string) { return createHmac("sha256", secret).update(body).digest(); }
export function signIdentity(identity: PropertyIdentity) {
  const body = Buffer.from(JSON.stringify({ identity: identitySchema.parse(identity), expires: Date.now() + 15 * 60_000 })).toString("base64url");
  return `${body}.${signature(body).toString("base64url")}`;
}
export function verifyIdentity(token: string): PropertyIdentity {
  if (token.length > 4096) throw new Error("Invalid property confirmation.");
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid property confirmation.");
  const received = Buffer.from(parts[1], "base64url");
  const expected = signature(parts[0]);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new Error("Invalid property confirmation.");
  const parsed = z.object({ identity: identitySchema, expires: z.number() }).parse(JSON.parse(Buffer.from(parts[0], "base64url").toString()));
  if (parsed.expires <= Date.now()) throw new Error("Property confirmation expired. Search again.");
  return parsed.identity;
}
const field = (value: unknown) => String(value ?? "").trim().toUpperCase();
export function matchesParcelIdentifiers(attributes: Record<string, unknown>, candidate: { Addr_Block?: string; Addr_Lot?: string; Addr_Qualifier?: string }) {
  return (!candidate.Addr_Block || field(attributes.PCLBLOCK) === field(candidate.Addr_Block))
    && (!candidate.Addr_Lot || field(attributes.PCLLOT) === field(candidate.Addr_Lot))
    && (!candidate.Addr_Qualifier || field(attributes.PCLQCODE) === field(candidate.Addr_Qualifier));
}
export async function findPropertyChoices(address: string, listingHash?: string) {
  const candidates = await identify(address);
  const choices: PropertyChoice[] = [];
  let sourceFailures = 0;
  let identifierConflicts = 0;
  const seen = new Set<string>();
  for (const candidate of candidates.slice(0, 5)) {
    if (candidate.score < 80) continue;
    try {
      const parcels = await parcelsAt(candidate.location);
      if (parcels.exceededTransferLimit) { sourceFailures += 1; continue; }
      for (const { attributes } of parcels.features) {
        const pin = pinSchema.safeParse(attributes.PAMS_PIN);
        if (!pin.success || seen.has(pin.data)) continue;
        const agrees = matchesParcelIdentifiers(attributes, candidate.attributes);
        if (!agrees) identifierConflicts += 1;
        const addressBlock = field(candidate.attributes.Addr_Block), parcelBlock = field(attributes.PCLBLOCK);
        // A source conflict can be offered for explicit review, never converted to
        // identifier agreement. Require a unique, precise intersection and an exact
        // nonempty lot AND unit; never broaden this to a nearby/unqualified parcel.
        const reviewable = !agrees && parcels.features.length === 1 && candidate.score >= 95
          && candidate.attributes.Addr_type === "PointAddress"
          && addressBlock && parcelBlock && addressBlock !== parcelBlock
          && field(candidate.attributes.Addr_Lot) && field(candidate.attributes.Addr_Qualifier)
          && field(candidate.attributes.Addr_Lot) === field(attributes.PCLLOT)
          && field(candidate.attributes.Addr_Qualifier) === field(attributes.PCLQCODE)
          && pin.data === [field(attributes.PCL_MUN) || pin.data.slice(0, 4), parcelBlock, field(attributes.PCLLOT), field(attributes.PCLQCODE)].join("_");
        if (!agrees && !reviewable) continue;
        seen.add(pin.data);
        const identity: PropertyIdentity = {
          pin: pin.data, address: candidate.address, municipality: field(attributes.MUN_NAME),
          block: field(attributes.PCLBLOCK), lot: field(attributes.PCLLOT), qualifier: field(attributes.PCLQCODE),
          location: candidate.location, score: candidate.score, precision: candidate.attributes.Addr_type ?? "Unknown",
          checkedAt: new Date().toISOString(),
          ...(reviewable ? { matchReview: { addressBlock, parcelBlock } } : {}),
          ...(listingHash ? { listingHash } : {}),
        };
        choices.push({ identity, token: signIdentity(identity), note: matchReviewMessage(identity) ?? (candidate.attributes.Addr_Block && candidate.attributes.Addr_Lot
          ? "Address and parcel identifiers agree. Confirm the block, lot and any unit qualifier."
          : "Located by coordinate intersection. Verify the parcel identifiers before confirming.") });
      }
    } catch { sourceFailures += 1; }
  }
  return { choices, sourceFailures, addressMatches: candidates.length, identifierConflicts };
}
