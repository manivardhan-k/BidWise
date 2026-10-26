import { z } from "zod";
import { extractListing, safeAiFailure, aiFailureMessage, allowancePolicy } from "@/lib/providers/ai";
import { cachedExtraction } from "@/lib/analysis/extraction-cache";
import { LINE_EXTRACTION_INSTRUCTION } from "@/lib/providers/model-instructions";
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
      const result = await cachedExtraction(text, { policy: allowancePolicy(), instruction: LINE_EXTRACTION_INSTRUCTION }, () => extractListing(text));
      return json({ candidates: result.data.candidates.map(issueListingReceipt), model: result.model, provider: result.provider, fallbackFrom: result.fallbackFrom, omittedClaims: result.omittedClaims ?? 0, extractedAt: result.extractedAt, reused: result.reused });
    } catch (error) {
      const failure = safeAiFailure(error);
      const message = failure.category === "invalid_output" ? "Some extracted details could not be matched to the pasted page. No property was confirmed. Retry processing or research its NJ address directly." : aiFailureMessage(failure);
      return json({ error: `${message} Your text is still in the form.`, category: failure.category, provider: failure.provider, validationFailure: failure.validationFailure, attempts: failure.attempts, failedModel: failure.model, quota: failure.quota }, 503);
    }
  } catch (error) { return inputFailure(error); }
}
