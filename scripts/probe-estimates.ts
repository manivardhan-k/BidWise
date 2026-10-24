import { mkdir, writeFile } from "node:fs/promises";
import { findPropertyChoices } from "../src/lib/property/identity";
import { recordsFor } from "../src/lib/property/report";
import { areaBenchmarksFor } from "../src/lib/providers/census";
import { baselineEstimates, modelEstimateEvidence, validateModelEstimates } from "../src/lib/finance/starting-estimates";
import { estimateStartingAssumptions, safeGeminiFailure } from "../src/lib/providers/gemini";
// Explicit public-source probe. No map request and no Gemini unless --model.
const modelEnabled = process.argv.includes("--model");
const address = "75 Richardson St, New Brunswick, NJ";
const choices = await findPropertyChoices(address);
if (choices.choices.length !== 1) throw new Error("Public example is not a unique parcel; inspect choices before continuing.");
const identity = choices.choices[0].identity;
const [records, area] = await Promise.all([recordsFor(identity), areaBenchmarksFor(identity)]);
const baseline = baselineEstimates(records, area);
const result: Record<string, unknown> = { checkedAt: new Date().toISOString(), pin: identity.pin, address: identity.address, area, baseline };
console.log(JSON.stringify({ address: identity.address, areaStatus: area.status, geography: area.status === "available" ? area.data.name : undefined, seeds: baseline.estimates.map(item => ({ field: item.field, value: item.value, kind: item.kind })), modelCalls: modelEnabled ? "explicitly enabled" : 0 }));
if (modelEnabled) {
  process.loadEnvFile(".env.local");
  const evidence = modelEstimateEvidence(records, area);
  try {
    const response = await estimateStartingAssumptions(evidence); validateModelEstimates(response.data, evidence);
    result.model = response;
    console.log(JSON.stringify({ model: response.model, fallbackFrom: response.fallbackFrom, attempts: response.attempts, locallyValidatedAllowances: response.data.estimates.length }));
  } catch (error) {
    const failure = safeGeminiFailure(error); result.model = { status: "unavailable", category: failure.category, model: failure.model, attempts: failure.attempts };
    console.log(JSON.stringify(result.model));
  }
}
await mkdir("docs/evidence", { recursive: true });
await writeFile("docs/evidence/starting-estimates-probe-2026-10-23.json", JSON.stringify(result, null, 2) + "\n");
