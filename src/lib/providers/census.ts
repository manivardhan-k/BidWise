import { z } from "zod";
import { publicJson } from "./http";
import type { PropertyIdentity, SourceResult } from "../property/types";
export type AreaBenchmarks = { geoid: string; name: string; period: string; homeValue: number | null; homeValueMoe: number | null; contractRent: number | null; contractRentMoe: number | null; fetchedAt: string; sourceUrl: string; geographyUrl: string };
const GEOGRAPHY = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";
const DATA = "https://api.censusreporter.org/1.0/data/show/acs2024_5yr";
const tractSchema = z.object({ GEOID: z.string().regex(/^34\d{9}$/), STATE: z.literal("34"), COUNTY: z.string().regex(/^\d{3}$/), TRACT: z.string().regex(/^\d{6}$/) });
const surveyNumber = z.number().finite().nullable();
const statisticSchema = z.object({ estimate: z.record(z.string(), surveyNumber), error: z.record(z.string(), surveyNumber) });
const responseSchema = z.object({ release: z.object({ id: z.literal("acs2024_5yr"), years: z.literal("2020-2024") }), geography: z.record(z.string(), z.object({ name: z.string().max(300) })), data: z.record(z.string(), z.object({ B25077: statisticSchema, B25058: statisticSchema })) });
const positive = (value: number | null | undefined) => value !== null && value !== undefined && value > 0 && value < 1e9 ? value : null;
const margin = (value: number | null | undefined) => value !== null && value !== undefined && value >= 0 && value < 1e9 ? value : null;
export async function areaBenchmarksFor(identity: PropertyIdentity): Promise<SourceResult<AreaBenchmarks>> {
  if (identity.precision !== "PointAddress" || identity.score < 95) return { status: "unavailable", message: "Area benchmarks were withheld because the confirmed location is too approximate for a tract match." };
  const params = { x: String(identity.location.x), y: String(identity.location.y), benchmark: "Public_AR_Current", vintage: "ACS2024_Current", layers: "8", format: "json" };
  try {
    const geography = z.object({ result: z.object({ geographies: z.object({ "Census Tracts": z.array(tractSchema).length(1) }) }) }).parse(await publicJson(GEOGRAPHY, params));
    const tract = geography.result.geographies["Census Tracts"][0];
    if (tract.GEOID !== `34${tract.COUNTY}${tract.TRACT}`) throw new Error("Geography mismatch");
    const id = `14000US${tract.GEOID}`;
    const sourceUrl = `${DATA}?${new URLSearchParams({ table_ids: "B25077,B25058", geo_ids: id })}`;
    const response = await fetch(sourceUrl, { headers: { "User-Agent": "BidWise/0.1 (public NJ property research; https://github.com/manivardhan-k/BidWise)" }, signal: AbortSignal.timeout(15_000), redirect: "error" });
    if (!response.ok) throw new Error("Survey source unavailable");
    const body = responseSchema.parse(await response.json());
    const values = body.data[id], name = body.geography[id]?.name;
    if (!values || !name) throw new Error("Survey geography missing");
    return { status: "available", data: { geoid: tract.GEOID, name, period: body.release.years, fetchedAt: new Date().toISOString(), sourceUrl, geographyUrl: `${GEOGRAPHY}?${new URLSearchParams(params)}`, homeValue: positive(values.B25077.estimate.B25077001), homeValueMoe: margin(values.B25077.error.B25077001), contractRent: positive(values.B25058.estimate.B25058001), contractRentMoe: margin(values.B25058.error.B25058001) } };
  } catch { return { status: "unavailable", message: "Local Census housing benchmarks could not be retrieved or uniquely matched. No substitute market price or rent was invented." }; }
}
// Only public geography/statistics are cached, bounded to 100 points for 1 hour.
const cache = new Map<string, { until: number; result: Promise<SourceResult<AreaBenchmarks>> }>();
export async function cachedAreaBenchmarksFor(identity: PropertyIdentity) {
  const key = JSON.stringify([identity.location, identity.precision, identity.score]);
  const hit = cache.get(key); if (hit && hit.until > Date.now()) return hit.result;
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  const result = areaBenchmarksFor(identity); cache.set(key, { until: Date.now() + 3_600_000, result });
  void result.then(value => { if (value.status === "unavailable") cache.delete(key); });
  return result;
}
