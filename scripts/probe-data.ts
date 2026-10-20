import { mkdir, writeFile } from "node:fs/promises";
import { identify, parcelsAt, GEOCODER, PARCELS } from "../src/lib/providers/njgin";
import { floodAt, FLOOD } from "../src/lib/providers/njdep";

// Public civic controls establish service contracts, not residential suitability.
const inputs = process.argv.slice(2);
const addresses = inputs.length ? inputs : [
  "78 Bayard Street, New Brunswick, NJ",
  "920 Broad Street, Newark, NJ",
  "280 Grove Street, Jersey City, NJ",
];
if (addresses.length > 3) throw new Error("Probe accepts at most three addresses per run.");
const samples = [];
for (const address of addresses) {
  const retrievedAt = new Date().toISOString();
  try {
    const candidates = await identify(address);
    // Diagnostic only: never treats the top geocoder hit as user-confirmed identity.
    const diagnosticCandidate = candidates[0];
    const sources = diagnosticCandidate ? await Promise.allSettled([
      parcelsAt(diagnosticCandidate.location), floodAt(diagnosticCandidate.location),
    ]) : [];
    const statuses = sources.map((result, index) => ({
      source: index === 0 ? "parcels" : "flood",
      status: result.status === "fulfilled" ? "returned" : "unavailable",
      ...(result.status === "fulfilled" ? { data: result.value } : {}),
    }));
    samples.push({ input: address, retrievedAt, candidates, identityConfirmed: false, diagnosticOnly: true, sources: statuses });
    console.log(`${address}: ${candidates.length} candidate(s); ${statuses.map(s => `${s.source} ${s.status}`).join(", ")}`);
  } catch {
    samples.push({ input: address, retrievedAt, status: "unavailable" });
    console.log(`${address}: unavailable; no substitute data used`);
  }
}
await mkdir("docs/evidence", { recursive: true });
await writeFile("docs/evidence/public-data-probe.json", JSON.stringify({
  generatedAt: new Date().toISOString(), endpoints: { GEOCODER, PARCELS, FLOOD },
  note: "Diagnostic joins are unconfirmed, not a purchase recommendation. Default inputs are civic controls; custom inputs require source review. No owner data requested. Source rights review and a complete residential demo remain pending.",
  gemini: { extraction: "not_tested", analysis: "not_tested", urlContext: "not_tested" }, samples,
}, null, 2) + "\n");
if (samples.some(sample => "status" in sample || !sample.candidates?.length || sample.sources?.some(source => source.status !== "returned"))) process.exitCode = 1;
