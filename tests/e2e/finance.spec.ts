import { test, expect, type Page } from "@playwright/test";
const identity = { pin: "0000_1_1", address: "10 Finance St, Sample, New Jersey", municipality: "SAMPLE", block: "1", lot: "1", qualifier: "", location: { x: -74.4, y: 40.4 }, precision: "PointAddress", score: 100, checkedAt: "2026-10-22T00:00:00Z" };
const records = { status: "available", data: { pin: identity.pin, facts: [], fetchedAt: identity.checkedAt, publicationDate: null, geometryDate: null } };
const flood = { status: "unavailable", message: "No flood fixture" };
async function openReport(page: Page) {
  await page.route("**/api/suggest", route => route.fulfill({ json: { suggestions: [] } }));
  await page.route("**/api/identify", route => route.fulfill({ json: { choices: [{ identity, token: "fictional-finance-token", note: "Fictional fixture only" }], sourceFailures: 0 } }));
  await page.route("**/api/records", route => route.fulfill({ json: records }));
  await page.route("**/api/hazards", route => route.fulfill({ json: flood }));
  await page.route("**/api/map-config", route => route.fulfill({ status: 503, json: { error: "No map credits in tests" } }));
  await page.goto("/"); await page.getByLabel("NJ address", { exact: true }).fill("10 Finance St, Sample, NJ");
  await page.getByRole("button", { name: "Find property" }).click(); await page.getByRole("button", { name: "Confirm this property" }).click();
  await expect(page.getByRole("heading", { name: "Explore the numbers." })).toBeVisible();
}
const rentInputs: Record<string, string> = { "Expected monthly rent": "2000", "Vacancy and lost rent (%)": "5", "Annual property-tax assumption": "3600", "Annual insurance": "1200", "Annual owner-paid utilities": "0", "Annual HOA or association cost": "0", "Annual routine maintenance": "1200", "Management share of collected rent (%)": "10", "Annual capital-repair reserve": "1800" };
const flipInputs: Record<string, string> = { "Quantity 1": "1", "Low unit cost 1": "15000", "Base unit cost 1": "20000", "High unit cost 1": "30000", "Renovation contingency (%)": "0", "Unknown-condition reserve": "5000", "Proposed cash purchase price": "100000", "Buyer closing costs (%)": "0", "Fixed buyer costs": "5000", "Assumed resale price": "200000", "Holding months": "6", "Monthly holding cost": "1000", "Selling commission (%)": "5", "Other seller costs (%)": "2", "Fixed seller costs": "2000", "Target one-time profit": "30000" };
async function fill(page: Page, values: Record<string, string>) { for (const [label, value] of Object.entries(values)) await page.getByLabel(label, { exact: true }).fill(value); }
const result = (page: Page, label: string) => page.locator(".result-list > div").filter({ has: page.locator("dt", { hasText: label }) }).locator("dd");
test("recalculates the resale/rental fixtures, chart table and shared costs; marks AI outdated and refreshes the current inputs", async ({ page }) => {
  const inputs: unknown[] = [];
  await page.route("**/api/analysis", route => {
    const body = route.request().postDataJSON(); inputs.push(body.finance);
    return route.fulfill({ json: { status: "available", summary: inputs.length === 1 ? "Initial property review" : "Current scenario review", findings: [], unansweredQuestions: [], consistencyFlags: [], model: "fictional-test-model", generatedAt: new Date().toISOString(), snapshotId: "fictional-snapshot", revision: body.revision, financeInputKey: JSON.stringify(body.finance), records, flood } });
  });
  await openReport(page); await expect(page.getByText("Initial property review", { exact: true })).toBeVisible();
  await fill(page, flipInputs); await fill(page, rentInputs);
  await page.getByLabel("Other seller costs (%)", { exact: true }).fill("7");
  await expect(page.getByLabel("Other seller costs (%)", { exact: true })).toHaveValue("7");
  await page.getByLabel("Other seller costs (%)", { exact: true }).fill("2");
  const base = page.getByRole("region", { name: "Base resale results", exact: true });
  await expect(base.getByText("$48,000", { exact: true })).toBeVisible(); await expect(base.getByText("$118,000", { exact: true })).toBeVisible();
  await expect(result(page, "Monthly cash after modeled expenses and reserve")).toHaveText("$1,060");
  const table = page.getByRole("table", { name: "Base resale sensitivity — assumed prices and one-time profit" });
  await expect(table.getByRole("row").filter({ hasText: "$200,000" })).toContainText("$48,000");
  await expect(page.getByText("AI analysis is outdated.", { exact: false })).toBeVisible(); expect(inputs.length).toBe(1);
  await page.getByRole("button", { name: "Refresh AI analysis" }).click(); await expect(page.getByText("Current scenario review", { exact: true })).toBeVisible();
  await expect(page.getByText("AI analysis is outdated.", { exact: false })).toHaveCount(0); expect(inputs.length).toBe(2);
  await page.getByRole("button", { name: "Refresh AI analysis" }).click(); expect(inputs.length).toBe(2);
  await page.getByLabel("Assumed resale price", { exact: true }).fill("250000");
  await expect(base.getByText("$94,500", { exact: true })).toBeVisible(); await expect(page.getByText("AI analysis is outdated.", { exact: false })).toBeVisible();
  await page.getByLabel("Base unit cost 1", { exact: true }).fill("25000");
  await expect(base.getByText("$89,500", { exact: true })).toBeVisible();
  await expect(page.locator(".rental-context")).toContainText("Base renovation: $30,000");
  await page.locator("#scenarios").screenshot({ path: "/private/tmp/bidwise-finance-desktop-test.png" });
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#scenarios").screenshot({ path: "/private/tmp/bidwise-finance-mobile-test.png" });
});
test("rental completeness is independent, blanks stay unknown and negative cash remains visible", async ({ page }) => {
  await page.route("**/api/analysis", route => route.fulfill({ status: 503, json: { error: "No live AI in tests" } }));
  await openReport(page); await fill(page, rentInputs);
  await expect(result(page, "Monthly cash after modeled expenses and reserve")).toHaveText("$1,060");
  await expect(page.getByRole("region", { name: "Cash resale scenario", exact: true })).toContainText("Scenario incomplete");
  await page.getByLabel("Vacancy and lost rent (%)", { exact: true }).fill("100");
  await expect(result(page, "Annual cash after modeled expenses and reserve")).toHaveText("-$7,800");
  await page.getByLabel("Annual insurance", { exact: true }).fill("");
  await expect(page.getByRole("region", { name: "Basic cash rental scenario", exact: true })).toContainText("Scenario incomplete");
  await expect(result(page, "Monthly cash after modeled expenses and reserve")).toHaveCount(0);
});
test("rejects an analysis response when financial assumptions change in flight", async ({ page }) => {
  let release: (() => Promise<void>) | undefined;
  await page.route("**/api/analysis", async route => {
    const body = route.request().postDataJSON();
    await new Promise<void>(resolve => { release = async () => { await route.fulfill({ json: { status: "available", summary: "Superseded financial commentary", findings: [], unansweredQuestions: [], consistencyFlags: [], model: "fixture", generatedAt: new Date().toISOString(), snapshotId: "old-snapshot", revision: body.revision, financeInputKey: JSON.stringify(body.finance), records, flood } }).catch(() => {}); resolve(); }; });
  });
  await openReport(page); await expect.poll(() => Boolean(release)).toBe(true);
  await page.getByLabel("Expected monthly rent", { exact: true }).fill("2000"); await release?.();
  await expect(page.getByText("Superseded financial commentary", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Assumptions changed while AI was reviewing.", { exact: false })).toBeVisible();
});
test("makes a mismatched scenario response explicitly unavailable", async ({ page }) => {
  await page.route("**/api/analysis", route => route.fulfill({ json: { status: "unavailable", message: "Wrong assumptions fixture", revision: route.request().postDataJSON().revision, financeInputKey: "different-inputs", records, flood } }));
  await openReport(page);
  await expect(page.getByText("The analysis response did not match the current assumptions.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh AI analysis" })).toBeEnabled();
});
