import { test, expect, type Page } from "@playwright/test";
const identity = { pin: "0000_1_1", address: "10 Estimate St, Sample, New Jersey", municipality: "SAMPLE", block: "1", lot: "1", qualifier: "", location: { x: -74.4, y: 40.4 }, precision: "PointAddress", score: 100, checkedAt: "2026-10-23T00:00:00Z" };
const records = { status: "available", data: { pin: identity.pin, facts: [], fetchedAt: identity.checkedAt, publicationDate: null, geometryDate: null } };
const flood = { status: "unavailable", message: "No flood fixture" };
const item = (field: string, value: number, kind = "illustrative", low = value, high = value) => ({ field, value, low, high, kind, confidence: "low", rangeKind: low === high ? "none" : "planning_range", explanation: "Fictional starting value for browser verification only. Check all estimates.", sourceLabel: "Fictional source", sourceDate: "2020-2024", checkedAt: identity.checkedAt });
const seeds = [item("flip.purchase", 350000, "area_benchmark", 320000, 380000), item("flip.resale", 350000, "area_benchmark", 320000, 380000), item("rent.monthlyRent", 1700, "area_benchmark", 1500, 1900), item("rent.annualTax", 6000, "historical_record"), item("flip.buyerFraction", .03)];
const response = (body: { revision: number }, estimates = seeds) => ({ pin: identity.pin, revision: body.revision, recordKey: JSON.stringify(["available", identity.pin, null, null, []]), checkedAt: identity.checkedAt, area: { status: "unavailable", message: "No area fixture" }, estimates, gaps: ["HOA dues need documents."], modelStatus: "not_requested" });
async function setup(page: Page) {
  await page.route("**/api/suggest", route => route.fulfill({ json: { suggestions: [] } }));
  await page.route("**/api/identify", route => route.fulfill({ json: { choices: [{ identity, token: "fictional-confirmed-token", note: "Fictional fixture" }], sourceFailures: 0 } }));
  await page.route("**/api/records", route => route.fulfill({ json: records }));
  await page.route("**/api/hazards", route => route.fulfill({ json: flood }));
  await page.route("**/api/map-config", route => route.fulfill({ status: 503, json: { error: "Map intercepted" } }));
  await page.route("**/api/analysis", route => { const body = route.request().postDataJSON(); return route.fulfill({ json: { status: "unavailable", message: "AI fixture unavailable", revision: body.revision, financeInputKey: JSON.stringify(body.finance), records, flood } }); });
  await page.goto("/");
}
async function confirm(page: Page) {
  await page.getByLabel("NJ address", { exact: true }).fill("10 Estimate St, Sample, NJ"); await page.getByRole("button", { name: "Find property" }).click(); await page.getByRole("button", { name: "Confirm this property" }).click();
}
test("fills source values first, preserves edited and cleared fields through AI and refresh, and explicitly restores defaults", async ({ page }) => {
  let release: (() => Promise<void>) | undefined;
  let modelCalls = 0, analyzed: unknown;
  await setup(page);
  await page.route("**/api/analysis", route => { const body = route.request().postDataJSON(); analyzed = body.finance; return route.fulfill({ json: { status: "unavailable", message: "AI fixture unavailable", revision: body.revision, financeInputKey: JSON.stringify(body.finance), records, flood } }); });
  await page.route("**/api/estimates", async route => {
    const body = route.request().postDataJSON();
    if (body.stage === "sources") return route.fulfill({ json: response(body) });
    modelCalls++;
    const model = { ...response(body, [...seeds, item("renovation.allowance", 30000, "model_allowance", 10000, 65000)]), modelStatus: "available", model: "gemini-3.5-flash-lite", fallbackFrom: "gemini-3.8-flash" };
    if (modelCalls > 1) return route.fulfill({ json: model });
    await new Promise<void>(resolve => { release = async () => { await route.fulfill({ json: model }); resolve(); }; });
  });
  await confirm(page);
  await expect(page.getByLabel("Proposed cash purchase price", { exact: true })).toHaveValue("350000");
  await expect(page.getByLabel("Expected monthly rent", { exact: true })).toHaveValue("1700");
  await page.getByLabel("Proposed cash purchase price", { exact: true }).fill("400000");
  await page.getByLabel("Annual property-tax assumption", { exact: true }).fill("");
  await expect.poll(() => Boolean(release)).toBe(true); await release?.();
  await expect(page.getByLabel("Base unit cost 1", { exact: true })).toHaveValue("30000");
  await expect(page.getByLabel("Proposed cash purchase price", { exact: true })).toHaveValue("400000");
  await expect(page.getByLabel("Annual property-tax assumption", { exact: true })).toHaveValue("");
  await expect.poll(() => analyzed).toMatchObject({ flip: { purchase: 400000 }, rent: { annualTax: null } });
  await page.getByText("Review starting values, sources and uncertainty", { exact: true }).click();
  await expect(page.locator(".estimate-basis")).toContainText("not prediction intervals");
  await expect(page.locator(".estimate-basis")).toContainText("You edited this field");
  await page.getByRole("button", { name: "Refresh starting values", exact: true }).click();
  await expect(page.getByRole("button", { name: "Refresh starting values", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Proposed cash purchase price", { exact: true })).toHaveValue("400000");
  await expect(page.getByLabel("Annual property-tax assumption", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Restore supplied starting values" }).click();
  await expect(page.getByLabel("Proposed cash purchase price", { exact: true })).toHaveValue("350000");
  await expect(page.getByLabel("Annual property-tax assumption", { exact: true })).toHaveValue("6000");
  await page.locator(".starting-estimates").screenshot({ path: "/private/tmp/bidwise-starting-estimates-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".starting-estimates").screenshot({ path: "/private/tmp/bidwise-starting-estimates-mobile.png" });
});
test("keeps sourced starting values when the model fails and never labels them AI-generated", async ({ page }) => {
  await setup(page);
  await page.route("**/api/estimates", route => { const body = route.request().postDataJSON(); return route.fulfill({ json: { ...response(body), modelStatus: body.stage === "model" ? "unavailable" : "not_requested", message: "Cost allowances unavailable in fixture" } }); });
  await confirm(page);
  await expect(page.locator(".starting-estimates")).toContainText("Cost allowances unavailable in fixture");
  await expect(page.getByLabel("Expected monthly rent", { exact: true })).toHaveValue("1700");
  await expect(page.getByLabel("Base unit cost 1", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Annual HOA or association cost", { exact: true })).toHaveValue("");
  await expect(page.locator(".starting-estimates")).not.toContainText("Cost allowances prepared by");
});
test("reuses a saved estimate set on refresh and reload while preserving human edits", async ({ page }) => {
  await setup(page); let modelCalls = 0;
  const snapshot = { id: "a".repeat(64), generatedAt: "2026-10-23T12:00:00Z", reused: true };
  const saved = [...seeds, item("renovation.allowance", 30000, "model_allowance", 10000, 65000)];
  await page.route("**/api/estimates", route => {
    const body = route.request().postDataJSON();
    if (body.stage === "model") modelCalls++;
    return route.fulfill({ json: { ...response(body, saved), modelStatus: "available", model: "fixture", modelSnapshot: snapshot } });
  });
  await confirm(page);
  await expect(page.getByLabel("Base unit cost 1", { exact: true })).toHaveValue("30000");
  await expect(page.getByText("Reusing saved AI estimates.", { exact: false })).toBeVisible();
  await expect(page.locator(".starting-estimates")).toContainText("Generated");
  await page.getByLabel("Base unit cost 1", { exact: true }).fill("32000");
  await page.getByRole("button", { name: "Refresh starting values", exact: true }).click();
  await expect(page.getByRole("button", { name: "Refresh starting values", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Base unit cost 1", { exact: true })).toHaveValue("32000");
  await page.reload(); await confirm(page);
  await expect(page.getByLabel("Base unit cost 1", { exact: true })).toHaveValue("30000");
  expect(modelCalls).toBe(0);
});
test("rejects starting values for an old property or a mismatched confirmed parcel", async ({ page }) => {
  await setup(page); let release: (() => Promise<void>) | undefined;
  await page.route("**/api/estimates", async route => { const body = route.request().postDataJSON(); if (body.token === "fictional-second-token") return route.fulfill({ json: { ...response(body), pin: "wrong-pin" } }); await new Promise<void>(resolve => { release = async () => { await route.fulfill({ json: response(body) }).catch(() => {}); resolve(); }; }); });
  await confirm(page); await expect.poll(() => Boolean(release)).toBe(true);
  await page.route("**/api/identify", route => route.fulfill({ json: { choices: [{ identity: { ...identity, pin: "0000_2_2", address: "20 Other St, Sample, New Jersey" }, token: "fictional-second-token", note: "Second fixture" }], sourceFailures: 0 } }));
  await page.getByLabel("NJ address", { exact: true }).fill("20 Other St, Sample, NJ"); await page.getByRole("button", { name: "Find property" }).click(); await page.getByRole("button", { name: "Confirm this property" }).click(); await release?.();
  await expect(page.getByText("The starting-value response did not match the confirmed property.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Proposed cash purchase price", { exact: true })).toHaveValue("");
  await expect(page.getByRole("heading", { name: "20 Other St", exact: true })).toBeVisible();
});
test("rejects late allowances when a canonical record refresh changes their source evidence", async ({ page }) => {
  await setup(page); let release: (() => Promise<void>) | undefined;
  await page.route("**/api/estimates", async route => { const body = route.request().postDataJSON(); if (body.stage === "sources") return route.fulfill({ json: response(body) }); await new Promise<void>(resolve => { release = async () => { await route.fulfill({ json: { ...response(body, [...seeds, item("renovation.allowance", 30000, "model_allowance", 10000, 65000)]), modelStatus: "available", model: "fixture" } }); resolve(); }; }); });
  await confirm(page); await expect.poll(() => Boolean(release)).toBe(true);
  await page.route("**/api/analysis", route => { const body = route.request().postDataJSON(); return route.fulfill({ json: { status: "unavailable", message: "Current records refreshed", revision: body.revision, financeInputKey: JSON.stringify(body.finance), records: { ...records, data: { ...records.data, publicationDate: "2026-01-01" } }, flood } }); });
  await page.getByRole("button", { name: "Refresh AI analysis", exact: true }).click(); await expect(page.getByText("Current records refreshed", { exact: true })).toBeVisible();
  await release?.();
  await expect(page.getByText("Source records changed while starting values were prepared.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Base unit cost 1", { exact: true })).toHaveValue("");
});
