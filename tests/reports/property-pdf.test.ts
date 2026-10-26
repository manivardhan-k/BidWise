import { describe, expect, it } from "vitest";
import { generatePropertyPdf } from "../../src/lib/reports/property-pdf";
import { reportFilename } from "../../src/lib/reports/snapshot";
import { emptyFinance } from "../../src/lib/finance/engines";
import { exportedAt, reportFixture } from "./fixture";
import { exportedPdfText } from "./pdf-text";

describe("dedicated property PDF", () => {
  it("exports the current scenario calculations, source caveats, raw dates and edited estimate basis", async () => {
    const report = reportFixture();
    const blob = await generatePropertyPdf(report, exportedAt);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const text = exportedPdfText(buffer);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(blob.type).toBe("application/pdf");
    for (const value of ["$48,000", "$1,060", "$25,000", "$3,600", "Original source value: 010505", "century is inferred", "Nominal amount reported", "Edited / E", "Different kind of information", "Fictional asking price: $100,000."]) expect(text).toContain(value);
    expect(buffer.toString("latin1")).toContain("https://example.invalid/fictional-parcel");
    expect(text).not.toContain("Big decisions.");
    expect(text).toMatch(/1 \/ \d+/);
    expect(report.finance.rent.annualTax).toBe(3600);
  }, 20_000);

  it("retains all forty long repair lines and negative cash results across pages", async () => {
    const report = reportFixture();
    report.finance.renovation.items = Array.from({ length: 40 }, (_, i) => ({ label: `Repair ${i + 1}: interior plaster and paint, kitchen fixtures, and preparation before contractor inspection`, quantity: 1, low: 100, base: 200, high: 300 }));
    report.finance.rent.vacancy = 1;
    report.finance.flip.resale = 100000;
    const text = exportedPdfText(Buffer.from(await (await generatePropertyPdf(report, exportedAt)).arrayBuffer()));
    for (let i = 1; i <= 40; i++) expect(text).toContain(`Repair ${i}: interior plaster`);
    expect(text).toContain("-$7,800");
    expect(text).toContain("-$33,000");
    expect(text.match(/Repair \/ unit costs/g)!.length).toBeGreaterThan(1);
  }, 20_000);

  it("preserves pending, unavailable, conflicted and invalid states without inventing zero costs", async () => {
    const report = reportFixture();
    report.identity.matchReview = { addressBlock: "1", parcelBlock: "1.05" };
    report.finance = emptyFinance(); report.finance.rent.vacancy = 1.2;
    report.flood = { status: "unavailable", message: "Flood fixture is unavailable; no safety conclusion." };
    report.records = null; report.starting = { status: "sources" };
    report.sourceStale = true; report.analysisOutdated = true;
    const text = exportedPdfText(Buffer.from(await (await generatePropertyPdf(report, exportedAt)).arrayBuffer()));
    for (const value of ["Property match needs review", "Sources disagree on the block", "Some checks are still running", "Earlier source results retained", "AI analysis is outdated", "Correct invalid assumptions", "Invalid input", "Unknown", "Flood fixture is unavailable"]) expect(text).toContain(value);
    expect(text).not.toContain("$48,000");
    expect(text).not.toContain("$1,060");
  }, 20_000);

  it("builds a portable address-based filename", () => {
    const identity = reportFixture().identity;
    expect(reportFilename(identity, exportedAt)).toBe("BidWise-10-Example-Street-2026-10-26.pdf");
    expect(reportFilename({ ...identity, address: "../../bad:name? , NJ" }, exportedAt)).toBe("BidWise-bad-name-2026-10-26.pdf");
  });
});
