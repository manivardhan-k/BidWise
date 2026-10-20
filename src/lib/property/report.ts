import { createHash } from "node:crypto";
import { parcelByPin } from "../providers/njgin";
import { floodAt, FLOOD } from "../providers/njdep";
import { normalizeRecords } from "./evidence";
import type { FloodScreen, PropertyIdentity, PropertyRecords, SourceResult } from "./types";

// Cache only public source responses, never pasted text, keys or user scenarios.
const cache = new Map<string, { until: number; result: Promise<unknown> }>();
async function cached<T>(key: string, run: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  if (entry && entry.until > Date.now()) return entry.result as Promise<T>;
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  const result = run(); cache.set(key, { until: Date.now() + 60_000, result });
  try { return await result; } catch (error) { cache.delete(key); throw error; }
}
export async function recordsFor(identity: PropertyIdentity): Promise<SourceResult<PropertyRecords>> {
  try { return { status: "available", data: await cached(`parcel:${identity.pin}`, async () => normalizeRecords(await parcelByPin(identity.pin))) }; }
  catch { return { status: "unavailable", message: "NJ parcel records could not be retrieved. Try the research again later; no substitute records were used." }; }
}
export async function hazardsFor(identity: PropertyIdentity): Promise<SourceResult<FloodScreen>> {
  const fetchedAt = new Date().toISOString();
  const sourceUrl = `${FLOOD}/query?${new URLSearchParams({ f: "pjson", geometry: `${identity.location.x},${identity.location.y}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects", outFields: "FLD_ZONE,ZONE_SUBTY", returnGeometry: "false" })}`;
  if (identity.precision !== "PointAddress" || identity.score < 95) return { status: "available", data: {
    status: "location_uncertain", zones: [], sourceUrl, fetchedAt, caveat: "The address location is too approximate for point-based flood screening. The flood check was withheld.",
  } };
  try {
    const data = await cached(`flood:${identity.pin}:${identity.location.x}:${identity.location.y}`, async () => {
      const raw = await floodAt(identity.location);
      if (raw.exceededTransferLimit) throw new Error("Incomplete flood results.");
      const groups = new Map<string, { zone: string; subtype: string; sourceMatches: number }>();
      for (const feature of raw.features) {
        const zone = feature.attributes.FLD_ZONE ?? "Not supplied";
        const subtype = feature.attributes.ZONE_SUBTY ?? "Subtype not supplied";
        const key = JSON.stringify([zone, subtype]);
        const existing = groups.get(key);
        if (existing) existing.sourceMatches += 1;
        else groups.set(key, { zone, subtype, sourceMatches: 1 });
      }
      return { status: raw.status, zones: [...groups.values()], sourceUrl, fetchedAt, caveat: raw.caveat };
    });
    return { status: "available", data };
  } catch { return { status: "unavailable", message: "Flood screening is unavailable. This does not establish that the property has no flood risk." }; }
}
export function snapshotId(identity: PropertyIdentity, records: SourceResult<PropertyRecords>, flood: SourceResult<FloodScreen>) {
  return createHash("sha256").update(JSON.stringify({ identity, records, flood })).digest("hex");
}
