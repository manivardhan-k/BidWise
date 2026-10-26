import { z } from "zod";
import { type FinanceInputs } from "./engines";
import type { ListingCandidate } from "../analysis/validate";
import type { PropertyRecords, SourceResult } from "../property/types";
import type { AreaBenchmarks } from "../providers/census";
export const estimateLabels = {
  "renovation.allowance": "Provisional renovation allowance", "renovation.contingency": "Renovation contingency", "renovation.reserve": "Unknown-condition reserve",
  "flip.purchase": "Proposed cash purchase price", "flip.buyerFraction": "Buyer closing costs", "flip.buyerFixed": "Fixed buyer costs", "flip.resale": "Assumed resale price", "flip.holdMonths": "Holding months", "flip.monthlyCarry": "Monthly holding cost", "flip.commissionFraction": "Selling commission", "flip.sellerFraction": "Other seller costs", "flip.sellerFixed": "Fixed seller costs", "flip.targetProfit": "Target one-time profit", "flip.resaleDrop": "Downside resale reduction", "flip.extraMonths": "Downside extra holding months", "flip.extraSellerFraction": "Downside extra seller percentage points",
  "rent.monthlyRent": "Expected monthly rent", "rent.vacancy": "Vacancy and lost rent", "rent.annualTax": "Annual property-tax assumption", "rent.annualInsurance": "Annual insurance", "rent.annualUtilities": "Annual owner-paid utilities", "rent.annualHoa": "Annual HOA or association cost", "rent.annualMaintenance": "Annual routine maintenance", "rent.management": "Management share of collected rent", "rent.annualCapitalReserve": "Annual capital-repair reserve",
} as const;
export type EstimateField = keyof typeof estimateLabels;
export type StartingEstimate = { field: EstimateField; value: number; low: number; high: number; kind: "historical_record" | "copied_claim" | "area_benchmark" | "illustrative" | "model_allowance"; confidence: "low"; rangeKind: "survey_moe" | "planning_range" | "none"; explanation: string; sourceUrl?: string; sourceLabel: string; sourceDate: string | null; checkedAt: string };
export type EstimateBundle = { estimates: StartingEstimate[]; gaps: string[] };
export type EstimateEvidence = { value: string | number | null; description: string };
const MODEL_FIELDS = ["renovation.allowance", "renovation.reserve", "rent.annualInsurance", "rent.annualUtilities", "rent.annualMaintenance", "rent.annualCapitalReserve", "flip.monthlyCarry"] as const;
export const modelEstimatesSchema = z.object({ estimates: z.array(z.object({ field: z.enum(MODEL_FIELDS), value: z.number().finite().nonnegative(), low: z.number().finite().nonnegative(), high: z.number().finite().nonnegative(), evidenceIds: z.array(z.string()).min(1).max(12), explanation: z.string().min(20).max(1200) })).max(MODEL_FIELDS.length) });
export function validateModelEstimates(body: unknown, evidence: ReadonlyMap<string, EstimateEvidence>) {
  const parsed = modelEstimatesSchema.parse(body);
  const seen = new Set<string>();
  for (const item of parsed.estimates) {
    const cap = item.field === "renovation.allowance" ? 1_000_000 : item.field === "renovation.reserve" ? 250_000 : 100_000;
    if (seen.has(item.field) || item.low > item.value || item.value > item.high || item.high > cap || item.low === item.high || item.evidenceIds.some(id => !evidence.has(id))) throw new Error("Unsupported estimate range, field or basis.");
    if (!item.evidenceIds.some(id => id.startsWith("property_") || id.startsWith("listing_") || id.startsWith("area_"))) throw new Error("Property context is missing.");
    seen.add(item.field);
  }
  return parsed;
}
export function modelEstimateEvidence(records: SourceResult<PropertyRecords>, area: SourceResult<AreaBenchmarks>, listing?: ListingCandidate) {
  const evidence = new Map<string, EstimateEvidence>();
  evidence.set("limits", { value: "No inspection, contractor/insurance quote, current tax bill, market comparables, lease terms or HOA evidence. Do not invent facts or a guaranteed return.", description: "Limits of the report" });
  if (records.status === "available") for (const fact of records.data.facts) if (fact.value !== null) evidence.set(`property_${fact.id}`, { value: fact.value, description: `${fact.label}. ${fact.caveat}` });
  if (area.status === "available") {
    evidence.set("area_home_value", { value: area.data.homeValue, description: `${area.data.name}; ACS ${area.data.period} owner-occupied median, not this property's value.` });
    evidence.set("area_contract_rent", { value: area.data.contractRent, description: `${area.data.name}; ACS ${area.data.period} median per rented unit, not a rent forecast.` });
  }
  listing?.claims.forEach((claim, index) => evidence.set(`listing_${index}`, { value: `${claim.kind}: ${claim.value}; quotation: ${claim.snippet}`, description: "User-supplied copied claim, not independently verified." }));
  return evidence;
}
export function modelStartingEstimates(body: z.infer<typeof modelEstimatesSchema>, checkedAt: string, model = "Gemini"): StartingEstimate[] {
  return body.estimates.map(item => ({ ...item, kind: "model_allowance", confidence: "low", rangeKind: "planning_range", sourceLabel: `${model} provisional planning allowance`, sourceDate: null, checkedAt, explanation: `${item.explanation} Model estimate, not a quote or established property condition. Basis: ${item.evidenceIds.join(", ")}.` }));
}
function dollars(text: string) { return /^\$?\d+(?:,\d{3})*(?:\.\d{1,2})?$/.test(text.trim()) ? Number(text.replace(/[$,]/g, "")) : null; }
export function baselineEstimates(records: SourceResult<PropertyRecords>, area: SourceResult<AreaBenchmarks>, listing?: ListingCandidate): EstimateBundle {
  const checkedAt = new Date().toISOString(), estimates: StartingEstimate[] = [], gaps: string[] = [];
  const facts = records.status === "available" ? records.data.facts : [];
  const fact = (id: string) => facts.find(item => item.id === id);
  const add = (field: EstimateField, value: number, low: number, high: number, explanation: string, extra: Partial<StartingEstimate> = {}) => estimates.push({ field, value, low, high, explanation, kind: "illustrative", confidence: "low", rangeKind: low === high ? "none" : "planning_range", sourceLabel: "BidWise editable planning assumption", sourceDate: null, checkedAt, ...extra });
  const asking = listing?.claims.filter(claim => claim.kind === "asking_price") ?? [];
  const askValues = [...new Set(asking.map(claim => dollars(claim.value)))];
  if (askValues.length === 1 && askValues[0] !== null && askValues[0] > 0) add("flip.purchase", askValues[0], askValues[0], askValues[0], `Copied asking price: “${asking[0].snippet}”. Starting purchase assumption only, not an agreed price or valuation.`, { kind: "copied_claim", sourceLabel: "Unverified copied page" });
  else if (asking.length) gaps.push("A single unambiguous asking price could not be read. Opening bids and judgments are never substituted for purchase price.");
  const units = fact("residential_units")?.value;
  const residential = fact("class")?.rawValue === "2" || /^(?:Residential \(class 2\)|2(?:\b|\s|—))/.test(String(fact("class")?.value ?? ""));
  if (area.status === "available" && units === 1 && residential) {
    const a = area.data;
    const benchmark = (field: EstimateField, value: number | null, moe: number | null, description: string) => {
      if (value === null || moe === null || moe > value * .5) { gaps.push(`${estimateLabels[field]}: survey estimate is missing or too imprecise for an automatic starting value.`); return; }
      add(field, value, Math.max(0, value - moe), value + moe, `${description} for ${a.name}, ACS ${a.period}. This is an older area median across different homes, not a property-specific appraisal, a current listing or an after-renovation forecast. The displayed ± range is survey margin of error for the area median, not a price/rent prediction range.`, { kind: "area_benchmark", rangeKind: "survey_moe", sourceUrl: a.sourceUrl, sourceLabel: "US Census ACS via independent Census Reporter", sourceDate: a.period, checkedAt: a.fetchedAt });
    };
    if (!estimates.some(item => item.field === "flip.purchase")) benchmark("flip.purchase", a.homeValue, a.homeValueMoe, "Owner-occupied home-value median used as an editable purchase placeholder");
    benchmark("flip.resale", a.homeValue, a.homeValueMoe, "Owner-occupied home-value median used without any assumed renovation uplift");
    benchmark("rent.monthlyRent", a.contractRent, a.contractRentMoe, "Contract-rent median per rented dwelling used as a starting rent; utilities coverage varies by lease");
  } else gaps.push(area.status === "unavailable" ? area.message : "Area medians were not applied: this parcel is not confirmed as one residential dwelling. Per-unit rent and whole-building values cannot be silently combined.");
  const tax = fact("historical_tax");
  if (tax && typeof tax.value === "number" && tax.value > 0) add("rent.annualTax", tax.value, tax.value, tax.value, `Historical reported tax used as a provisional annual assumption. ${tax.caveat} Verify the current bill and reassessment before relying on it.`, { kind: "historical_record", sourceUrl: tax.sourceUrl, sourceLabel: "NJGIN / MOD-IV historical tax", sourceDate: tax.sourceDate, checkedAt: tax.fetchedAt });
  else gaps.push("Annual property tax needs a current bill; missing/zero historical tax is not assumed to be zero future tax.");
  add("renovation.contingency", .15, .1, .25, "Illustrative 15% contingency on entered repair line costs. This is an editable stress allowance, not evidence of defects.");
  add("flip.buyerFraction", .03, .01, .05, "Illustrative cash-buyer closing-cost allowance of 3% of purchase, intended to include the fixed buyer costs below. Obtain an itemized local closing estimate.");
  add("flip.buyerFixed", 0, 0, 0, "No additional fixed buyer cost is modeled because the percentage allowance above is intended to include it. This does not establish that legal/title/closing services are free.");
  add("flip.holdMonths", 6, 3, 12, "Illustrative six-month cash project schedule; not an observed contractor, permit or possession timeline.");
  add("flip.commissionFraction", .05, 0, .06, "Illustrative combined selling commission allowance, negotiable and not a required or agreed fee. Verify a written agreement.");
  add("flip.sellerFraction", .02, .01, .05, "Illustrative additional seller-cost allowance, including modeled transfer/closing costs. Actual taxes and negotiated fees may differ materially.");
  add("flip.sellerFixed", 0, 0, 0, "No additional fixed seller cost modeled beyond the percentage allowances. Verify an itemized closing estimate to avoid omissions or double counting.");
  add("rent.vacancy", .08, .05, .2, "Illustrative 8% vacancy/lost-rent stress; not this property's vacancy rate or a local forecast.");
  add("rent.management", .1, .08, .15, "Illustrative 10% of effective collected rent for management; obtain actual contract terms, including leasing fees.");
  gaps.push("HOA dues and special assessments need property documents; no automatic zero is supplied.", "Target profit is your goal, not a property fact; enter the amount you want to test.");
  return { estimates, gaps };
}
export function applyStartingEstimates(input: FinanceInputs, estimates: StartingEstimate[], touched: ReadonlySet<string>, force = false): FinanceInputs {
  const next = structuredClone(input);
  for (const item of estimates) {
    const key = item.field === "renovation.allowance" ? "renovation.items" : item.field;
    if (!force && touched.has(key)) continue;
    if (item.field === "renovation.allowance") {
      next.renovation.items = [{ label: "Provisional allowance — property not inspected", quantity: 1, low: item.low, base: item.value, high: item.high }];
    } else {
      const [group, field] = item.field.split(".") as ["renovation" | "flip" | "rent", string];
      (next[group] as Record<string, unknown>)[field] = item.value;
    }
  }
  return next; // User-entered invalid fields stay visible; the calculation/server boundaries validate them.
}
export function changedFinanceFields(before: FinanceInputs, after: FinanceInputs) {
  const changed: string[] = [];
  for (const group of ["renovation", "flip", "rent"] as const) for (const key of Object.keys(after[group])) {
    if (JSON.stringify((before[group] as Record<string, unknown>)[key]) !== JSON.stringify((after[group] as Record<string, unknown>)[key])) changed.push(`${group}.${key}`);
  }
  return changed;
}

// Ignore retrieval-clock differences across route bundles, but bind proposals to
// the same substantive records, dates and caveats visible in the report.
export function recordEvidenceKey(records: SourceResult<PropertyRecords>) {
  return records.status === "available" ? JSON.stringify([records.status, records.data.pin, records.data.publicationDate, records.data.geometryDate, records.data.facts.map(fact => [fact.id, fact.value, fact.rawValue ?? null, fact.sourceDate, fact.caveat])]) : JSON.stringify([records.status, records.message]);
}
