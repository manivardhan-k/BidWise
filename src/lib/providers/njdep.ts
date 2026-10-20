import { z } from "zod";
import { publicJson } from "./http";
import { pointSchema, type Point } from "./njgin";
export const FLOOD = "https://mapsdep.nj.gov/arcgis/rest/services/Features/Hydrography/MapServer/43";
export function parseFlood(body: unknown) {
  const result = z.object({
    features: z.array(z.object({ attributes: z.object({
      FLD_ZONE: z.string().nullable(), ZONE_SUBTY: z.string().nullable(),
    }) })), exceededTransferLimit: z.boolean().optional(),
  }).parse(body);
  return { ...result, status: result.features.length ? "zones_returned" as const : "no_polygon_returned" as const,
    caveat: "Point screening only. No polygon returned does not establish no flood risk. Location precision and building coverage still require review." };
}
export async function floodAt(location: Point) {
  const { x, y } = pointSchema.parse(location);
  return parseFlood(await publicJson(`${FLOOD}/query`, {
    f: "json", geometry: `${x},${y}`, geometryType: "esriGeometryPoint", inSR: "4326",
    spatialRel: "esriSpatialRelIntersects", outFields: "FLD_ZONE,ZONE_SUBTY",
    returnGeometry: "false", resultRecordCount: "10",
  }));
}
