import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { normalizeRecords } from "../../src/lib/property/evidence";
import { recordEvidenceKey } from "../../src/lib/finance/starting-estimates";
const identity = { pin: "0000_1_1", address: "10 Sample St, Sample, New Jersey", municipality: "SAMPLE", block: "1", lot: "1", qualifier: "", location: { x: -74.4, y: 40.4 }, precision: "PointAddress", score: 100, checkedAt: "2026-10-26T00:00:00Z" };
const records = { status: "available" as const, data: normalizeRecords({ PAMS_PIN: identity.pin, NET_VALUE: 170000, LAST_YR_TX: 6000, PROP_CLASS: "2" }, identity.checkedAt) };
const flood = { status: "available", data: { status: "no_polygon_returned", zones: [], fetchedAt: identity.checkedAt, sourceUrl: "https://example.invalid/flood", caveat: "An empty map query does not establish no risk." } };
async function setup(page: Page) {
  await page.route("**/api/suggest", r => r.fulfill({ json: { suggestions: [] } }));
  await page.route("**/api/identify", r => r.fulfill({ json: { choices: [{ identity, token: "fictional-token", note: "Check fixture identifiers" }], sourceFailures: 0 } }));
  await page.route("**/api/records", r => r.fulfill({ json: records }));
  await page.route("**/api/hazards", r => r.fulfill({ json: flood }));
  await page.route("**/api/map-config", r => r.fulfill({ status: 503, json: { error: "No fixture map" } }));
  await page.route("**/api/estimates", r => r.fulfill({ json: { pin: identity.pin, revision: r.request().postDataJSON().revision, recordKey: recordEvidenceKey(records), estimates: [], gaps: [], checkedAt: identity.checkedAt, area: { status: "unavailable", message: "No fixture area" }, modelStatus: "unavailable" } }));
  await page.route("**/api/analysis", r => r.fulfill({ json: { status: "available", model: "fixture-model", provider: "groq", generatedAt: identity.checkedAt, revision: r.request().postDataJSON().revision, financeInputKey: JSON.stringify(r.request().postDataJSON().finance), snapshotId: "fixture-snapshot", records, flood, summary: "Review the source record and obtain independent checks.", findings: [{ explanation: "The assessment is a recorded tax value, not market value.", evidenceIds: ["assessment"], numericClaims: [{ evidenceId: "assessment", value: 170000 }] }, { explanation: "Review flood mapping and the recorded deed before relying on them.", evidenceIds: ["flood", "deed_date_caveat"], numericClaims: [] }], unansweredQuestions: [], consistencyFlags: [] } }));
}
async function find(page: Page) {
  await page.getByLabel("NJ address", { exact: true }).fill("10 Sample St, Sample, NJ");
  await page.getByRole("button", { name: "Find property", exact: true }).click();
  await page.getByRole("button", { name: "Confirm this property", exact: true }).click();
  await expect(page.getByText("fixture-model", { exact: false })).toBeVisible();
}
test("locks the active address while matching and cancellation preserves it", async ({ page }) => {
  await setup(page); let release: (() => void) | undefined;
  await page.route("**/api/identify", async r => { await new Promise<void>(resolve => { release = resolve; }); await r.fulfill({ json: { choices: [] } }).catch(() => {}); });
  await page.goto("/"); await page.getByLabel("NJ address", { exact: true }).fill("10 Sample St, Sample, NJ");
  await page.getByRole("button", { name: "Find property", exact: true }).click();
  await expect(page.getByLabel("NJ address", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel research" }).click(); release?.();
  await expect(page.getByLabel("NJ address", { exact: true })).toBeEnabled();
  await expect(page.getByLabel("NJ address", { exact: true })).toHaveValue("10 Sample St, Sample, NJ");
});
test("keeps copied text and gives a useful recovery message after a network failure", async ({ page }) => {
  await page.route("**/api/parse", r => r.abort("failed")); await page.goto("/");
  await page.getByRole("button", { name: "Copied page text", exact: true }).click();
  await page.getByLabel("Copied property page", { exact: true }).fill("10 Sample St, Sample, NJ. Asking $200,000.");
  await page.getByRole("button", { name: "Process copied text", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "connection" })).toBeVisible();
  await expect(page.getByLabel("Copied property page", { exact: true })).toHaveValue("10 Sample St, Sample, NJ. Asking $200,000.");
});
test("keeps section text unboxed after clicks while preserving keyboard control focus", async ({ page }) => {
  await setup(page); await page.goto("/");
  await page.getByLabel("NJ address", { exact: true }).fill("10 Sample St, Sample, NJ");
  await page.getByRole("button", { name: "Find property", exact: true }).click();
  const confirmation = page.getByRole("heading", { name: "Confirm the property", exact: true });
  await expect(confirmation).toBeFocused();
  await expect(confirmation).toHaveCSS("outline-style", "none");
  await page.getByRole("button", { name: "Confirm this property", exact: true }).click();
  const summary = page.getByRole("heading", { name: "10 Sample St", exact: true });
  await expect(summary).toBeFocused();
  await expect(summary).toHaveCSS("outline-style", "none");
  await page.keyboard.press("Tab");
  await expect(page.locator("button:focus")).toHaveCSS("outline-style", "solid");
});
test("restores edited and cleared scenario values only for the same confirmed parcel", async ({ page }) => {
  await setup(page); await page.goto("/"); await find(page);
  await page.getByLabel("Annual property-tax assumption", { exact: true }).fill("7777");
  await page.getByLabel("Expected monthly rent", { exact: true }).fill("2500");
  await page.getByLabel("Expected monthly rent", { exact: true }).fill("");
  await find(page);
  await expect(page.getByLabel("Annual property-tax assumption", { exact: true })).toHaveValue("7777");
  await expect(page.getByLabel("Expected monthly rent", { exact: true })).toHaveValue("");
  await expect(page.getByText("Your scenario edits for this parcel were restored.", { exact: false })).toBeVisible();
  await page.route("**/api/identify", r => r.fulfill({ json: { choices: [{ identity: { ...identity, pin: "0000_2_2", address: "20 Other St, Sample, NJ" }, token: "fictional-other-token", note: "Other fixture" }], sourceFailures: 0 } }));
  await page.getByRole("button", { name: "Find property", exact: true }).click();
  await page.getByRole("button", { name: "Confirm this property", exact: true }).click();
  await expect(page.getByLabel("Annual property-tax assumption", { exact: true })).toHaveValue("");
});
test("offers readable AI source links, section navigation and a scoped map retry", async ({ page }) => {
  await setup(page); let maps = 0;
  await page.route("**/api/map-config", r => { maps++; return r.fulfill({ status: 503, json: { error: "No map" } }); });
  await page.goto("/"); await find(page);
  await expect(page.getByRole("navigation", { name: "Report sections" })).toBeVisible();
  const ai = page.getByRole("region", { name: "AI property analysis", exact: true });
  await expect(ai.getByRole("link", { name: "Assessed value: $170,000", exact: true })).toBeVisible();
  await expect(ai.getByText("Evidence: assessment", { exact: true })).toHaveCount(0);
  const missingTargets = await page.locator(".report-navigation a, .analysis-evidence a").evaluateAll(links => links.map(link => link.getAttribute("href")!).filter(href => href.startsWith("#") && !document.getElementById(href.slice(1))));
  expect(missingTargets).toEqual([]);
  await expect(ai.getByRole("link", { name: "Deed date: limitations", exact: true })).toHaveAttribute("href", "#recorded-history");
  await page.getByRole("button", { name: "Retry map", exact: true }).click();
  await expect.poll(() => maps).toBe(2);
  await expect(page.locator("#research").getByText("$170,000", { exact: true })).toBeVisible();
  await page.locator(".analysis-section").screenshot({ path: "/private/tmp/bidwise-usability-ai.png" });
  await page.locator(".report-tools").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/private/tmp/bidwise-usability-desktop.png" });
});
test("presents a consolidated take with recommended next steps", async ({ page }) => {
  await setup(page);
  await page.route("**/api/analysis", route => route.fulfill({ json: { status: "available", model: "fixture-model", provider: "groq", generatedAt: identity.checkedAt, revision: route.request().postDataJSON().revision, financeInputKey: JSON.stringify(route.request().postDataJSON().finance), snapshotId: "fixture", records, flood,
    summary: "Resolve current pricing and condition gaps before judging the opportunity.", findings: [{ explanation: "The assessment cannot establish resale upside; current comparable sales are missing.", evidenceIds: ["assessment"], numericClaims: [] }], unansweredQuestions: ["Obtain current comparable sales and contractor quotes before setting a purchase budget."], consistencyFlags: [] } }));
  await page.goto("/"); await find(page);
  const section = page.getByRole("region", { name: "AI property analysis", exact: true });
  await expect(section.getByRole("heading", { name: "BidWise’s take", exact: true })).toBeVisible();
  await expect(section.locator(".analysis-summary")).toContainText("Resolve current pricing and condition gaps");
  await expect(section.getByRole("heading", { name: "Recommended next steps", exact: true })).toBeVisible();
  await expect(section.getByRole("listitem")).toContainText("Obtain current comparable sales and contractor quotes");
});
test("identifies invalid assumptions inline and keeps mobile controls usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await setup(page); await page.goto("/"); await find(page);
  const vacancy = page.getByLabel("Vacancy and lost rent (%)", { exact: true });
  await vacancy.fill("120"); await expect(vacancy).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Use a percentage from 0 to 100.", { exact: true })).toBeVisible();
  await expect(vacancy).toHaveValue("120");
  const targets = await page.locator(".source-button, .input-modes button, .example-button").evaluateAll(elements => elements.map(el => { const r = el.getBoundingClientRect(); return { width: r.width, height: r.height }; }));
  expect(targets.every(r => r.width >= 44 && r.height >= 44)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await vacancy.evaluate(element => element.scrollIntoView({ block: "center" }));
  await page.screenshot({ path: "/private/tmp/bidwise-usability-mobile.png" });
});
test("has no automated WCAG A or AA violations in the empty and populated mobile report", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await setup(page); await page.goto("/");
  const scan = async () => {
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }))).toEqual([]);
  };
  await scan(); await find(page); await scan();
});
test("keeps report content printable and reflows at narrow widths", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 }); await setup(page); await page.goto("/"); await find(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "10 Sample St", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Report sections" })).toBeHidden();
  await expect(page.getByRole("region", { name: "AI property analysis", exact: true })).toBeVisible();
  const printedSource = page.locator(".property-summary .fact").filter({ hasText: "Assessed value" }).locator(".print-source");
  await expect(printedSource).toBeVisible();
  await expect(printedSource).toContainText("An assessment is not an asking price or market valuation.");
  await expect(printedSource).toContainText("Record published: Not supplied");
  await expect(printedSource.getByRole("link")).toHaveAttribute("href", /PAMS_PIN/);
  await page.emulateMedia({ media: "screen" });
  await expect(printedSource).toBeHidden();
});
