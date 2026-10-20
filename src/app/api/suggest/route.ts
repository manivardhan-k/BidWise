import { z } from "zod";
import { InputError, inputFailure, json, readJson } from "@/lib/http";
import { suggestAddresses } from "@/lib/providers/njgin";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { text } = await readJson(request, z.object({ text: z.string().trim().min(4).max(200) }));
    if (/https?:\/\/|[\r\n]/i.test(text)) throw new InputError("Enter a single NJ address for suggestions.");
    try { return json({ suggestions: await suggestAddresses(text) }); }
    catch { return json({ error: "Address suggestions are unavailable. You can still enter an address and search." }, 503); }
  } catch (error) { return inputFailure(error); }
}
