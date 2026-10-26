import { baselineEstimates } from "../../src/lib/finance/starting-estimates";
import { financeInputKey } from "../../src/lib/finance/engines";
import { normalizeRecords } from "../../src/lib/property/evidence";
import type { ReportSnapshot } from "../../src/lib/reports/snapshot";

// Fictional data for PDF and browser verification; never imported by the app.
export const exportedAt = "2026-10-26T16:00:00.000Z";
export function reportFixture(): ReportSnapshot {
  const identity = { pin: "0000_1_1", address: "10 Example Street, Sample, New Jersey", municipality: "SAMPLE", block: "1", lot: "1", qualifier: "", location: { x: -74.4, y: 40.4 }, precision: "PointAddress", score: 100, checkedAt: exportedAt };
  const records = { status: "available" as const, data: normalizeRecords({ PAMS_PIN: identity.pin, PROP_LOC: "10 EXAMPLE STREET", MUN_NAME: "SAMPLE", COUNTY: "SAMPLE COUNTY", PCLBLOCK: "1", PCLLOT: "1", PCL_MUN: "0000", PROP_CLASS: "2", NET_VALUE: 170000, LAND_VAL: 70000, IMPRVT_VAL: 100000, LAST_YR_TX: 6000, YR_CONSTR: 1950, DWELL: 1, COMM_DWELL: 0, CALC_ACRE: .12, DEED_DATE: "010505", SALE_PRICE: 100, DEED_BOOK: "100", DEED_PAGE: "20" }, exportedAt) };
  // Use a clearly fictional URL in every exported source link.
  records.data.facts.forEach(fact => { fact.sourceUrl = "https://example.invalid/fictional-parcel"; });
  const flood = { status: "available" as const, data: { status: "no_polygon_returned" as const, zones: [], fetchedAt: exportedAt, sourceUrl: "https://example.invalid/fictional-flood", caveat: "No flood polygon returned. This does not establish no flood risk." } };
  const finance = {
    renovation: { items: [{ label: "Fictional repair allowance", quantity: 1, low: 15000, base: 20000, high: 30000 }], contingency: 0, reserve: 5000 },
    rent: { monthlyRent: 2000, vacancy: .05, annualTax: 3600, annualInsurance: 1200, annualUtilities: 0, annualHoa: 0, annualMaintenance: 1200, management: .1, annualCapitalReserve: 1800 },
    flip: { purchase: 100000, buyerFraction: 0, buyerFixed: 5000, resale: 200000, holdMonths: 6, monthlyCarry: 1000, commissionFraction: .05, sellerFraction: .02, sellerFixed: 2000, targetProfit: 30000, resaleDrop: .1, extraMonths: 3, extraSellerFraction: .01 },
  };
  const baseline = baselineEstimates(records, { status: "unavailable", message: "No area benchmark supplied for this fictional example." });
  baseline.estimates.forEach(estimate => { estimate.checkedAt = exportedAt; });
  return {
    identity, records, flood, finance, listing: { address: identity.address, addressSnippet: `${identity.address} - fictional test property`, claims: [{ kind: "asking_price", value: "$100,000", snippet: "Fictional asking price: $100,000." }] },
    starting: { status: "done", data: { ...baseline, checkedAt: exportedAt, modelStatus: "unavailable", message: "Fictional example; no AI cost allowances requested." } },
    touchedFields: Object.entries(finance).flatMap(([group, values]) => Object.keys(values).map(key => `${group}.${key}`)),
    analysisOutdated: false, sourceStale: false,
    analysis: { status: "available", revision: 1, financeInputKey: financeInputKey(finance), snapshotId: "fictional-report", generatedAt: exportedAt, model: "fictional-test-model", records, flood, summary: "Fictional example for layout review. Obtain current comparable sales and an inspection before relying on the scenario.", findings: [{ explanation: "The recorded assessment is a tax value, not a market valuation.", evidenceIds: ["assessment"], numericClaims: [{ evidenceId: "assessment", value: 170000 }] }], unansweredQuestions: ["Verify the current property-tax bill and obtain contractor quotes."], consistencyFlags: [] },
  };
}
