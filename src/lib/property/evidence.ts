import { PARCELS, PARCEL_FIELDS, type ParcelAttributes } from "../providers/njgin";
import type { FactEvidence, PropertyRecords } from "./types";
export const RECORD_METADATA = "https://njdep.maps.arcgis.com/sharing/rest/content/items/852937c223e94fcf8e167a23b500935d/info/metadata/metadata.xml?format=default&output=html";
export function sourceDate(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}
// NJGIN supplies YYMMDD. Interpret the year as the most recent matching year
// not after the retrieval year; the original value and century assumption stay visible.
export function readableDeedDate(raw: unknown, asOf = new Date().toISOString()): string | null {
  if (typeof raw !== "string" || !/^\d{6}$/.test(raw) || raw === "000000") return null;
  const reference = new Date(asOf);
  if (!Number.isFinite(reference.getTime())) return null;
  const yy = Number(raw.slice(0, 2)), month = Number(raw.slice(2, 4)), day = Number(raw.slice(4, 6));
  const referenceYear = reference.getUTCFullYear();
  let year = Math.floor(referenceYear / 100) * 100 + yy;
  if (year > referenceYear) year -= 100;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  const name = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(check);
  return `${name} ${day}, ${year}`;
}
const classNames: Record<string, string> = { "1": "Vacant land", "2": "Residential", "3A": "Farm (regular)", "3B": "Farm (qualified)", "4A": "Commercial", "4B": "Industrial", "4C": "Apartment", "15A": "Public school", "15B": "Other school", "15C": "Public property", "15D": "Church / charitable", "15E": "Cemetery / graveyard", "15F": "Other exempt" };
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const positive = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
const count = (value: unknown) => typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
export function normalizeRecords(attributes: ParcelAttributes, fetchedAt = new Date().toISOString()): PropertyRecords {
  const pin = String(attributes.PAMS_PIN);
  const publicationDate = sourceDate(attributes.PCL_PBDATE);
  const geometryDate = sourceDate(attributes.PCLLASTUPD);
  const sourceUrl = `${PARCELS}/query?${new URLSearchParams({ f: "pjson", where: `PAMS_PIN='${pin}'`, outFields: PARCEL_FIELDS.join(","), returnGeometry: "false" })}`;
  const make = (id: string, label: string, raw: unknown, caveat: string, format?: "money", rawValue?: string | null): FactEvidence => {
    const value = typeof raw === "number" ? (Number.isFinite(raw) ? raw : null) : text(raw);
    return { id, label, value, format, rawValue: rawValue ?? undefined, status: value === null ? "not_available" : "source_matched", sourceUrl, fetchedAt, sourceDate: publicationDate, caveat };
  };
  const propertyClass = text(attributes.PROP_CLASS);
  const deedRaw = text(attributes.DEED_DATE);
  const deedDate = readableDeedDate(deedRaw, fetchedAt);
  return { pin, fetchedAt, publicationDate, geometryDate, facts: [
    make("parcel", "Parcel ID", pin, "A source identifier, not a legal boundary determination."),
    make("property_address", "Address in tax record", attributes.PROP_LOC, "The parcel's property location, distinct from an owner's mailing address. Compare it with the confirmed address."),
    make("municipality", "Municipality", attributes.MUN_NAME, "Municipality as supplied by NJGIN."),
    make("county", "County", attributes.COUNTY, "County reported in the parcel record."),
    make("municipality_code", "Municipality code", attributes.PCL_MUN, "County / municipality identifier from the parcel dataset."),
    make("block", "Block", attributes.PCLBLOCK, "Check the block, lot and any unit qualifier together."),
    make("lot", "Lot", attributes.PCLLOT, "Check against the property's tax record or notice."),
    make("qualifier", "Unit / qualifier", text(attributes.PCLQCODE) ?? "None reported", "No reported qualifier is not a guarantee that there are no separate units."),
    make("class", "Property class", propertyClass && classNames[propertyClass] ? `${classNames[propertyClass]} (class ${propertyClass})` : propertyClass, "Tax-record classification; it does not establish approved use, rental permission or condition.", undefined, propertyClass),
    make("assessment", "Assessed value", attributes.NET_VALUE, "An assessment is not an asking price or market valuation. Assessment year is not supplied by this service.", "money"),
    make("land_assessment", "Land assessment", attributes.LAND_VAL, "Assessed land component, not the price of vacant land or a current market appraisal.", "money"),
    make("building_assessment", "Improvement assessment", attributes.IMPRVT_VAL, "Assessed improvements component, not a renovation estimate, insurance value or current market appraisal.", "money"),
    make("historical_tax", "Historical tax", attributes.LAST_YR_TX, "The tax year is not specified here. This is not a current bill, future tax forecast or proof of no balance due.", "money"),
    make("recorded_sale", "Recorded sale amount", positive(attributes.SALE_PRICE),
      typeof attributes.SALE_PRICE === "number" && attributes.SALE_PRICE > 0 && attributes.SALE_PRICE <= 100 ? "Nominal amount reported. Do not treat it as an arm's-length market sale or a valuation." : "A returned transaction amount; sale conditions and completeness of history are unverified.", "money"),
    make("deed_date", "Deed date", deedDate, deedDate ? `NJGIN uses YYMMDD and supplies only two year digits. Displayed year interpreted as the most recent matching year not after the retrieval year (${new Date(fetchedAt).getUTCFullYear()}). The century is inferred, not independently verified; check the recorded deed for historical transactions.` : "The source date is absent or is not a valid YYMMDD date. No calendar date was invented.", undefined, deedRaw),
    make("deed_book", "Deed book", attributes.DEED_BOOK, "Book reference supplied by the tax record. Use it with the page to locate the recorded instrument; the deed itself has not been reviewed."),
    make("deed_page", "Deed page", attributes.DEED_PAGE, "Page reference supplied by the tax record. It is not proof of clear title."),
    make("sale_code", "Sale investigation code", attributes.SALES_CODE, "Source code describing sale-price investigation for sales-ratio purposes. It does not establish that the sale was at market value; unverified codes are left untranslated."),
    make("year_built", "Year built", positive(attributes.YR_CONSTR), "Reported construction year does not establish the age or condition of every building component."),
    make("building_description", "Building description", attributes.BLDG_DESC, "Assessor's shorthand for stories, structure, style or garage. Preserved as reported; it is not a building survey or proof of permitted configuration."),
    make("land_description", "Land description", attributes.LAND_DESC, "Assessor's lot-size description, which may contain dimensions or acreage. It is not a survey."),
    make("acreage", "Lot area (acres)", positive(attributes.CALC_ACRE), "Acreage supplied or calculated from MOD-IV lot descriptions. It is not measured interior floor area or a surveyed legal boundary."),
    make("residential_units", "Residential units", count(attributes.DWELL), "Reported dwelling count. Confirm legal occupancy, rental licensing and permitted unit count with the municipality."),
    make("commercial_units", "Commercial units", count(attributes.COMM_DWELL), "Reported commercial unit count; a blank value stays unknown. This is not zoning or occupancy approval."),
    make("property_use", "Commercial use code", attributes.PROP_USE, "A three-character use code for commercial/class-4 property. Blank does not mean no restrictions."),
    make("building_class", "Building class code", attributes.BLDG_CLASS, "Assessor's building-quality classification code. No condition rating or inspection has been inferred."),
    make("additional_lots_1", "Additional lots — first entry", attributes.ADD_LOTS1, "Additional lots named in the tax record. The report does not establish that these lots are included in a sale."),
    make("additional_lots_2", "Additional lots — second entry", attributes.ADD_LOTS2, "Additional lots named in the tax record; check legal descriptions and transaction documents."),
    make("facility", "Exempt facility / property", attributes.FAC_NAME, "Reported type or name of an exempt facility/property. Blank may mean not applicable or not supplied."),
    make("old_property_id", "Previous property ID", attributes.OLD_PROPID, "Previous block/lot/qualifier after an identity change, if reported. Not a complete parcel lineage."),
  ] };
}
