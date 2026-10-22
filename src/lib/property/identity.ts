import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { identify, parcelsAt, pinSchema, pointSchema } from "../providers/njgin";
import type { PropertyChoice, PropertyIdentity } from "./types";

// Server-process secret. Tokens expire on restart or after 15 minutes; no DB.
const processState = globalThis as typeof globalThis & { bidwiseIdentitySecret?: Buffer };
const secret = processState.bidwiseIdentitySecret ??= randomBytes(32);
const identitySchema = z.object({
  pin: pinSchema, address: z.string().max(300), municipality: z.string().max(100),
  block: z.string().max(40), lot: z.string().max(40), qualifier: z.string().max(40),
  location: pointSchema, precision: z.string().max(40), score: z.number().min(0).max(100),
  checkedAt: z.iso.datetime(),
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
  const seen = new Set<string>();
  for (const candidate of candidates.slice(0, 5)) {
    if (candidate.score < 80) continue;
    try {
      const parcels = await parcelsAt(candidate.location);
      if (parcels.exceededTransferLimit) { sourceFailures += 1; continue; }
      for (const { attributes } of parcels.features) {
        const pin = pinSchema.safeParse(attributes.PAMS_PIN);
        if (!pin.success || seen.has(pin.data) || !matchesParcelIdentifiers(attributes, candidate.attributes)) continue;
        seen.add(pin.data);
        const identity: PropertyIdentity = {
          pin: pin.data, address: candidate.address, municipality: field(attributes.MUN_NAME),
          block: field(attributes.PCLBLOCK), lot: field(attributes.PCLLOT), qualifier: field(attributes.PCLQCODE),
          location: candidate.location, score: candidate.score, precision: candidate.attributes.Addr_type ?? "Unknown",
          checkedAt: new Date().toISOString(),
          ...(listingHash ? { listingHash } : {}),
        };
        choices.push({ identity, token: signIdentity(identity), note: candidate.attributes.Addr_Block && candidate.attributes.Addr_Lot
          ? "Address and parcel identifiers agree. Confirm the block, lot and any unit qualifier."
          : "Located by coordinate intersection. Verify the parcel identifiers before confirming." });
      }
    } catch { sourceFailures += 1; }
  }
  return { choices, sourceFailures, addressMatches: candidates.length };
}
