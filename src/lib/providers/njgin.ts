import { z } from "zod";
import { publicJson } from "./http";

export const GEOCODER = "https://geo.nj.gov/arcgis/rest/services/Tasks/NJ_Geocode/GeocodeServer";
export const PARCELS = "https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_Composite_NJ_WM/FeatureServer/0";
export const pointSchema = z.object({ x: z.number().min(-76).max(-73), y: z.number().min(38).max(42) });
export type Point = z.infer<typeof pointSchema>;
export const candidateSchema = z.object({
  address: z.string(), score: z.number(), location: pointSchema,
  attributes: z.object({
    Addr_type: z.string().optional(), Match_addr: z.string().optional(),
    Addr_Block: z.string().optional(), Addr_Lot: z.string().optional(), Addr_Qualifier: z.string().optional(),
  }),
});
const geocodeSchema = z.object({ candidates: z.array(candidateSchema).max(10) });
export async function suggestAddresses(text: string) {
  const input = z.string().trim().min(4).max(200).parse(text);
  const body = z.object({ suggestions: z.array(z.object({
    text: z.string().min(1).max(300), isCollection: z.boolean(),
  })).max(20) }).parse(await publicJson(`${GEOCODER}/suggest`, {
    f: "json", text: input, maxSuggestions: "5",
  }));
  return [...new Set(body.suggestions.filter(item => !item.isCollection).map(item => item.text))].slice(0, 5);
}
export async function identify(address: string) {
  const input = z.string().trim().min(5).max(200).parse(address);
  return geocodeSchema.parse(await publicJson(`${GEOCODER}/findAddressCandidates`, {
    f: "json", SingleLine: input, outSR: "4326", maxLocations: "5",
    outFields: "Addr_type,Match_addr,Addr_Block,Addr_Lot,Addr_Qualifier",
  })).candidates;
}

// Explicit allowlist intentionally omits OWNER_NAME and owner mailing addresses.
export const PARCEL_FIELDS = ["PAMS_PIN", "PCL_MUN", "PCLBLOCK", "PCLLOT", "PCLQCODE", "PCLLASTUPD", "MUN_NAME", "COUNTY", "PROP_LOC", "PROP_CLASS", "LAND_VAL", "IMPRVT_VAL", "NET_VALUE", "LAST_YR_TX", "BLDG_DESC", "LAND_DESC", "CALC_ACRE", "ADD_LOTS1", "ADD_LOTS2", "FAC_NAME", "PROP_USE", "BLDG_CLASS", "DEED_BOOK", "DEED_PAGE", "DEED_DATE", "SALES_CODE", "SALE_PRICE", "YR_CONSTR", "DWELL", "COMM_DWELL", "OLD_PROPID", "PCL_PBDATE"] as const;
const value = z.union([z.string(), z.number(), z.null()]);
const parcelAttributes = z.object(Object.fromEntries(PARCEL_FIELDS.map(key => [key, value.optional()])));
export const pinSchema = z.string().min(6).max(80).regex(/^\d{4}_[A-Z0-9./-]+_[A-Z0-9./-]+(?:_[A-Z0-9./-]+)?$/i);
export type ParcelAttributes = z.infer<typeof parcelAttributes>;
export function parseParcels(body: unknown) {
  return z.object({
    features: z.array(z.object({ attributes: parcelAttributes })),
    exceededTransferLimit: z.boolean().optional(),
  }).parse(body);
}
export async function parcelsAt(location: Point) {
  const { x, y } = pointSchema.parse(location);
  return parseParcels(await publicJson(`${PARCELS}/query`, {
    f: "json", geometry: `${x},${y}`, geometryType: "esriGeometryPoint", inSR: "4326",
    spatialRel: "esriSpatialRelIntersects", outFields: PARCEL_FIELDS.join(","),
    returnGeometry: "false", resultRecordCount: "10",
  }));
}

export async function parcelByPin(pin: string) {
  const validated = pinSchema.parse(pin);
  const result = parseParcels(await publicJson(`${PARCELS}/query`, {
    f: "json", where: `PAMS_PIN='${validated}'`, outFields: PARCEL_FIELDS.join(","),
    returnGeometry: "false", resultRecordCount: "2",
  }));
  if (result.exceededTransferLimit || result.features.length !== 1 || result.features[0].attributes.PAMS_PIN !== validated) {
    throw new Error("Parcel identity could not be resolved uniquely.");
  }
  return result.features[0].attributes;
}
