import { z } from "zod";
import { findPropertyChoices } from "@/lib/property/identity";
import { InputError, inputFailure, json, readJson } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { address } = await readJson(request, z.object({ address: z.string().trim().min(5).max(200) }));
    if (/https?:\/\//i.test(address)) throw new InputError("Direct URL import is unavailable. Enter the NJ address from that page.");
    try {
      const result = await findPropertyChoices(address);
      return json(result, !result.choices.length && result.sourceFailures ? 503 : 200);
    } catch { return json({ error: "NJ address matching is unavailable. Try again later; no guessed match was used." }, 503); }
  } catch (error) { return inputFailure(error); }
}
