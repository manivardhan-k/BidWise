import { z } from "zod";
import { analyzeEvidence, safeGeminiFailure } from "@/lib/providers/gemini";
import { verifyIdentity } from "@/lib/property/identity";
import { recordsFor, hazardsFor, snapshotId } from "@/lib/property/report";
import { inputFailure, json, readJson } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { token, revision } = await readJson(request, z.object({ token: z.string().max(4096), revision: z.number().int().min(0) }));
    const identity = verifyIdentity(token);
    const [records, flood] = await Promise.all([recordsFor(identity), hazardsFor(identity)]);
    const evidence = new Map<string, string | number | null>([["address", identity.address], ["parcel", identity.pin],
      ["limits", "No physical inspection, title/liens, complete history, occupancy, market valuation or financial scenario has been checked. Source-matched means retrieved from a record, not certified true."],
    ]);
    if (records.status === "available") for (const fact of records.data.facts) {
      evidence.set(fact.id, fact.value); evidence.set(`${fact.id}_caveat`, fact.caveat);
    } else evidence.set("records_status", records.message);
    evidence.set("flood", flood.status === "available" ? JSON.stringify(flood.data) : flood.message);
    try {
      const response = await analyzeEvidence(evidence);
      return json({ status: "available", ...response.data, model: response.model, generatedAt: new Date().toISOString(), snapshotId: snapshotId(identity, records, flood), revision, records, flood });
    } catch (error) {
      const failure = safeGeminiFailure(error);
      return json({ status: "unavailable", category: failure.category, revision, records, flood,
        message: "AI analysis is unavailable. The source records remain usable; no substitute AI explanation was generated." });
    }
  } catch (error) { return inputFailure(error); }
}
