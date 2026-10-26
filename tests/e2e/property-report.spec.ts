import { test, expect, type Page } from "@playwright/test";

// Fictional fixtures only; these never ship as application/demo property data.
const identity = { pin: "0000_1_1", address: "10 Test Street, Sample, New Jersey", municipality: "SAMPLE", block: "1", lot: "1", qualifier: "", location: { x: -74.4, y: 40.4 }, precision: "PointAddress", score: 100, checkedAt: "2026-10-20T00:00:00Z" };
const records = { status: "available", data: { pin: identity.pin, publicationDate: null, geometryDate: null, fetchedAt: identity.checkedAt, facts: [
  { id: "assessment", label: "Assessed value", value: 170000, format: "money", status: "source_matched", sourceUrl: "https://example.invalid/fixture", sourceDate: null, fetchedAt: identity.checkedAt, caveat: "Fixture assessment is not market value." },
  { id: "year_built", label: "Year built", value: null, status: "not_available", sourceUrl: "https://example.invalid/fixture", sourceDate: null, fetchedAt: identity.checkedAt, caveat: "Fixture construction year is missing." },
] } };
const availableFlood = { status: "available", data: { status: "no_polygon_returned", zones: [], sourceUrl: "https://example.invalid/flood", fetchedAt: identity.checkedAt, caveat: "No polygon returned does not establish no flood risk." } };
async function setup(page: Page, flood = availableFlood) {
  await page.route("**/api/estimates", route => route.fulfill({ status: 503, json: { error: "Estimates disabled in this unrelated fixture" } }));
  await page.route("**/api/suggest", route => route.fulfill({ json: { suggestions: [] } }));
  await page.route("**/api/identify", route => route.fulfill({ json: { choices: [{ identity, token: "fixture-confirmation-token", note: "Fictional fixture for verification only." }], sourceFailures: 0 } }));
  await page.route("**/api/records", route => route.fulfill({ json: records }));
  await page.route("**/api/hazards", route => route.fulfill({ json: flood }));
  await page.route("**/api/map-config", route => route.fulfill({ status: 503, json: { error: "Fixture map unavailable" } }));
  await page.route("**/api/analysis", route => route.fulfill({ status: 503, json: { error: "Fixture AI unavailable" } }));
}
async function confirm(page: Page) {
  await page.getByLabel("NJ address", { exact: true }).fill("10 Test Street, Sample, NJ");
  await page.getByRole("button", { name: "Find property" }).click();
  await expect(page.getByRole("heading", { name: "Confirm the property" })).toBeVisible();
  await expect(page.locator("#research").getByText("$170,000", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Confirm this property" }).click();
  await expect(page.locator("#research").getByText("$170,000", { exact: true })).toBeVisible();
}
test("keeps a source conflict visible before and after selecting a parcel with missing tax details", async ({ page }) => {
  await setup(page);
  const { normalizeRecords } = await import("../../src/lib/property/evidence");
  const { matchReviewMessage } = await import("../../src/lib/property/match-review");
  const reviewed = { ...identity, pin: "0000_1.05_1_C0010", block: "1.05", qualifier: "C0010", matchReview: { addressBlock: "1", parcelBlock: "1.05" } };
  await page.route("**/api/identify", route => route.fulfill({ json: { choices: [{ identity: reviewed, token: "fictional-review-token", note: matchReviewMessage(reviewed) }], sourceFailures: 0, identifierConflicts: 1 } }));
  await page.route("**/api/records", route => route.fulfill({ json: { status: "available", data: normalizeRecords({ PAMS_PIN: reviewed.pin, PCLBLOCK: "1.05", PCLLOT: "1", PCLQCODE: "C0010" }, identity.checkedAt) } }));
  await page.goto("/");
  await page.getByLabel("NJ address", { exact: true }).fill("10 Test Street, Sample, NJ");
  await page.getByRole("button", { name: "Find property" }).click();
  await expect(page.getByText("Sources disagree on the block:", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm this property" })).toHaveCount(0);
  await page.getByRole("button", { name: "Use this parcel for research" }).click();
  await expect(page.getByText("Match needs review", { exact: true })).toBeVisible();
  await expect(page.locator("#research").getByRole("note")).toContainText("does not resolve the block disagreement");
  await expect(page.getByText("The parcel was located, but its address", { exact: false })).toBeVisible();
  await expect(page.getByText("Parcel confirmed", { exact: true })).toHaveCount(0);
});
test("requires confirmation and preserves evidence during map and AI failures", async ({ page }) => {
  await setup(page); await page.goto("/"); await confirm(page);
  await expect(page.getByRole("heading", { name: "The map is unavailable." })).toBeVisible();
  await expect(page.getByText("AI analysis could not be completed. Your source records remain available.")).toBeVisible();
  await expect(page.getByText("No flood polygon was returned.", { exact: true })).toBeVisible();
  await expect(page.getByText("No polygon returned does not establish no flood risk.", { exact: true })).toBeVisible();
  await page.locator("#research").getByRole("button", { name: "Source for Assessed value" }).click();
  const source = page.getByRole("dialog", { name: "Assessed value source details" });
  await expect(source.getByText("Fixture assessment is not market value.")).toBeVisible();
  await expect(source.getByRole("link", { name: "Open official source" })).toHaveAttribute("href", "https://example.invalid/fixture");
  await page.keyboard.press("Escape");
  await expect(source).not.toBeVisible();
  await expect(page.locator("#research").getByRole("button", { name: "Source for Assessed value" })).toBeFocused();
});
test("keeps the report usable with unavailable flood data on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await setup(page);
  await page.route("**/api/hazards", route => route.fulfill({ json: { status: "unavailable", message: "Flood screening is unavailable. No safety conclusion was made." } }));
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/"); await confirm(page);
  await expect(page.getByText("Flood screening is unavailable. No safety conclusion was made.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#research").getByRole("button", { name: "Source for Assessed value" }).click();
  await expect(page.getByRole("link", { name: "Open official source" })).toBeVisible();
  await page.keyboard.press("Escape");
});
test("preserves a URL and asks for an address without fetching the source", async ({ page }) => {
  let identifyCalls = 0;
  await page.route("**/api/identify", route => { identifyCalls += 1; return route.fulfill({ json: { choices: [] } }); });
  await page.goto("/"); await page.getByLabel("NJ address", { exact: true }).fill("https://example.invalid/a-house");
  await page.getByRole("button", { name: "Find property" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Direct link import is unavailable" })).toBeVisible();
  await expect(page.getByLabel("NJ address", { exact: true })).toHaveValue("https://example.invalid/a-house");
  expect(identifyCalls).toBe(0);
});
test("retains last retrieved evidence and rejects analysis when a source refresh fails", async ({ page }) => {
  await setup(page); await page.goto("/"); await confirm(page);
  await expect(page.getByText("AI analysis could not be completed. Your source records remain available.")).toBeVisible();
  await page.route("**/api/analysis", route => route.fulfill({ json: {
    status: "unavailable", message: "Provider failed", revision: route.request().postDataJSON().revision, financeInputKey: JSON.stringify(route.request().postDataJSON().finance),
    records: { status: "unavailable", message: "Parcel source timed out" }, flood: availableFlood,
  } }));
  await page.getByRole("button", { name: "Refresh AI analysis" }).click();
  await expect(page.locator("#research").getByText("$170,000", { exact: true })).toBeVisible();
  await expect(page.getByText("Earlier source results are shown because a refresh failed. Check the original retrieval times in Source details.")).toBeVisible();
  await expect(page.getByText("A source refresh failed.", { exact: false })).toContainText("No refreshed AI explanation was accepted");
});
test("rejects old analysis after a different property is confirmed", async ({ page }) => {
  await setup(page);
  let firstRequested = false;
  let release: (() => Promise<void>) | undefined;
  await page.route("**/api/analysis", async route => {
    const request = route.request().postDataJSON();
    if (request.token === "fixture-confirmation-token") {
      firstRequested = true;
      await new Promise<void>(resolve => { release = async () => { await route.fulfill({ json: { status: "unavailable", message: "Old property analysis", revision: request.revision, financeInputKey: JSON.stringify(request.finance), records, flood: availableFlood } }).catch(() => {}); resolve(); }; });
    } else await route.fulfill({ json: { status: "unavailable", message: "Current property analysis unavailable", revision: request.revision, financeInputKey: JSON.stringify(request.finance), records: { ...records, data: { ...records.data, pin: "0000_2_2" } }, flood: availableFlood } });
  });
  await page.goto("/"); await confirm(page);
  await expect.poll(() => firstRequested).toBe(true);
  await page.route("**/api/identify", route => route.fulfill({ json: { choices: [{ identity: { ...identity, pin: "0000_2_2", address: "20 Other Street, Sample, New Jersey", block: "2", lot: "2" }, token: "fixture-second-confirmation", note: "Second fictional fixture" }], sourceFailures: 0 } }));
  await page.getByLabel("NJ address", { exact: true }).fill("20 Other Street, Sample, NJ");
  await page.getByRole("button", { name: "Find property" }).click();
  await page.getByRole("button", { name: "Confirm this property" }).click();
  await expect(page.getByText("Current property analysis unavailable")).toBeVisible();
  await release?.();
  await expect(page.getByText("Old property analysis", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "20 Other Street" })).toBeVisible();
});
test("shows the expanded record, readable deed date and explicit coverage gaps", async ({ page }) => {
  await setup(page);
  const { normalizeRecords } = await import("../../src/lib/property/evidence");
  const expanded = { status: "available", data: normalizeRecords({ PAMS_PIN: identity.pin, PROP_LOC: "10 TEST STREET", PROP_CLASS: "2", COUNTY: "SAMPLE", LAND_VAL: 120000, IMPRVT_VAL: 50000, NET_VALUE: 170000, DWELL: 1, CALC_ACRE: 0.1, BLDG_DESC: "1S F", DEED_DATE: "181010", DEED_BOOK: "00123", DEED_PAGE: "00045" }, identity.checkedAt) };
  await page.route("**/api/records", route => route.fulfill({ json: expanded }));
  await page.route("**/api/analysis", route => route.fulfill({ json: { status: "unavailable", message: "AI unavailable during verification", revision: route.request().postDataJSON().revision, financeInputKey: JSON.stringify(route.request().postDataJSON().finance), records: expanded, flood: availableFlood } }));
  await page.goto("/"); await confirm(page);
  await expect(page.getByText("October 10, 2018", { exact: true })).toBeVisible();
  await expect(page.getByText("Year interpreted from source")).toBeVisible();
  await expect(page.getByText("Land assessment", { exact: true })).toBeVisible();
  await expect(page.getByText("$120,000", { exact: true })).toBeVisible();
  await expect(page.getByText("Residential units", { exact: true })).toBeVisible();
  await expect(page.getByText("Lot area (acres)", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What this report covers" })).toBeVisible();
  await page.getByText("Sources, coverage & limitations", { exact: true }).click();
  await expect(page.getByText("Other hazards and local restrictions", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Source for Deed date", exact: true }).click();
  const source = page.getByRole("dialog", { name: "Deed date source details" });
  await expect(source.getByText("Original source value:")).toContainText("181010");
  await expect(source.getByText("NJGIN uses YYMMDD", { exact: false })).toContainText("century is inferred");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("shows the actual fallback model beside a successful AI explanation", async ({ page }) => {
  await setup(page);
  await page.route("**/api/analysis", route => route.fulfill({ json: { status: "available", summary: "Fictional fallback explanation for browser verification", findings: [], unansweredQuestions: [], consistencyFlags: [], model: "gemini-3.5-flash-lite", fallbackFrom: "gemini-3.8-flash", snapshotId: "fixture-snapshot", generatedAt: new Date().toISOString(), revision: route.request().postDataJSON().revision, financeInputKey: JSON.stringify(route.request().postDataJSON().finance), records, flood: availableFlood } }));
  await page.goto("/"); await confirm(page);
  await expect(page.locator(".analysis-section")).toContainText("AI interpretation · gemini-3.5-flash-lite · Free fallback after gemini-3.8-flash service failures");
});
