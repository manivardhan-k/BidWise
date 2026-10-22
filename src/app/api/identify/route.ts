import { z } from "zod";
import { findPropertyChoices } from "@/lib/property/identity";
import { InputError, inputFailure, json, readJson } from "@/lib/http";
import { parsedPropertySchema, verifyListingReceipt, listingFingerprint } from "@/lib/analysis/listing-receipt";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { address, listing } = await readJson(request, z.object({ address: z.string().trim().min(5).max(200), listing: parsedPropertySchema.optional() }), 320_000);
    if (/https?:\/\//i.test(address)) throw new InputError("Direct URL import is unavailable. Enter the NJ address from that page.");
    let listingHash: string | undefined;
    if (listing) {
      try {
        const candidate = verifyListingReceipt(listing);
        if (candidate.address.trim() !== address) throw new Error();
        listingHash = listingFingerprint(candidate);
      } catch { throw new InputError("The copied-page result changed or expired. Paste the page again."); }
    }
    try {
      const result = await findPropertyChoices(address, listingHash);
      return json(result, !result.choices.length && result.sourceFailures ? 503 : 200);
    } catch { return json({ error: "NJ address matching is unavailable. Try again later; no guessed match was used." }, 503); }
  } catch (error) { return inputFailure(error); }
}
