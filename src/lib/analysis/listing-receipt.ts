import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { listingCandidateSchema, type ListingCandidate, type ParsedProperty } from "./validate";
export const parsedPropertySchema = z.object({ candidate: listingCandidateSchema, receipt: z.string().min(10).max(1000) });
// Process-local authenticated receipts; no pasted page or claims cache/database.
const state = globalThis as typeof globalThis & { bidwiseListingSecret?: Buffer };
const secret = state.bidwiseListingSecret ??= randomBytes(32);
const signature = (body: string) => createHmac("sha256", secret).update(`listing:${body}`).digest();
export function listingFingerprint(candidate: ListingCandidate) {
  return createHash("sha256").update(JSON.stringify(listingCandidateSchema.parse(candidate))).digest("hex");
}
export function issueListingReceipt(candidate: ListingCandidate): ParsedProperty {
  const parsed = listingCandidateSchema.parse(candidate);
  const body = Buffer.from(JSON.stringify({ digest: listingFingerprint(parsed), expires: Date.now() + 15 * 60_000 })).toString("base64url");
  return { candidate: parsed, receipt: `${body}.${signature(body).toString("base64url")}` };
}
export function verifyListingReceipt(input: unknown, expectedFingerprint?: string): ListingCandidate {
  const parsed = parsedPropertySchema.parse(input);
  const parts = parsed.receipt.split(".");
  if (parts.length !== 2) throw new Error("Invalid listing receipt.");
  const expected = signature(parts[0]), received = Buffer.from(parts[1], "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new Error("Invalid listing receipt.");
  const body = z.object({ digest: z.string().length(64), expires: z.number() }).parse(JSON.parse(Buffer.from(parts[0], "base64url").toString()));
  if (body.expires <= Date.now() || body.digest !== listingFingerprint(parsed.candidate)) throw new Error("Listing receipt is changed or expired. Paste the page again.");
  if (expectedFingerprint && expectedFingerprint !== body.digest) throw new Error("Claims do not belong to this confirmed property.");
  return parsed.candidate;
}
