import { z } from "zod";
import { extractListing, safeGeminiFailure } from "@/lib/providers/gemini";
import { issueListingReceipt } from "@/lib/analysis/listing-receipt";
import { InputError, inputFailure, json, readJson } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { text } = await readJson(request, z.object({ text: z.string().min(1) }), 320_000);
    if (text.length > 50_000) throw new InputError("Copied text exceeds the 50,000-character limit. Shorten it and try again.", 413);
    if (!text.trim()) throw new InputError("Paste the visible property-page text.");
    if (/^https?:\/\/\S+\s*$/i.test(text.trim())) throw new InputError("Direct URL import is unavailable. Copy the visible page text or enter its NJ address.");
    try {
      const result = await extractListing(text);
      return json({ candidates: result.data.candidates.map(issueListingReceipt), model: result.model, fallbackFrom: result.fallbackFrom, extractedAt: new Date().toISOString() });
    } catch (error) {
      const failure = safeGeminiFailure(error);
      return json({ error: "Gemini could not extract supported property claims. Your text is still in the form. Try again later or research the NJ address directly.", category: failure.category, attempts: failure.attempts, failedModel: failure.model }, 503);
    }
  } catch (error) { return inputFailure(error); }
}
