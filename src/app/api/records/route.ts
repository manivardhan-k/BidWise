import { verifyIdentity } from "@/lib/property/identity";
import { recordsFor } from "@/lib/property/report";
import { inputFailure, json, readJson, tokenBody } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { const { token } = await readJson(request, tokenBody); return json(await recordsFor(verifyIdentity(token))); }
  catch (error) { return inputFailure(error); }
}
