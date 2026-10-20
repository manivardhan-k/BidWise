import { test, expect } from "@playwright/test";
test("debounces suggestions, supports keyboard selection, and keeps confirmation separate", async ({ page }) => {
  let calls = 0, identifyCalls = 0;
  await page.route("**/api/suggest", route => { calls++; return route.fulfill({ json: { suggestions: ["10 Sample Street, Sample, NJ", "12 Sample Street, Sample, NJ"] } }); });
  await page.route("**/api/identify", route => { identifyCalls++; return route.fulfill({ json: { choices: [], sourceFailures: 0, addressMatches: 0 } }); });
  await page.goto("/"); const input = page.getByRole("combobox", { name: "NJ address", exact: true });
  await input.fill("10 S"); await input.fill("10 Sa"); await input.fill("10 Samp");
  await expect(page.getByRole("option")).toHaveCount(2); expect(calls).toBe(1);
  await input.press("ArrowDown"); await expect(input).toHaveAttribute("aria-activedescendant", "address-option-0");
  await input.press("Enter"); await expect(input).toHaveValue("10 Sample Street, Sample, NJ");
  await expect(page.getByRole("listbox")).toHaveCount(0); expect(identifyCalls).toBe(0);
  await page.getByRole("button", { name: "Find property" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "NJ’s address index" })).toContainText("This does not mean the property does not exist");
  expect(identifyCalls).toBe(1);
});
test("superseded suggestions cannot replace the current query and Escape dismisses", async ({ page }) => {
  let release: (() => Promise<void>) | undefined;
  await page.route("**/api/suggest", async route => {
    if (route.request().postDataJSON().text === "10 Samp") {
      await new Promise<void>(resolve => { release = async () => { await route.fulfill({ json: { suggestions: ["Old suggestion"] } }).catch(() => {}); resolve(); }; });
    } else await route.fulfill({ json: { suggestions: ["Current suggestion"] } });
  });
  await page.goto("/"); const input = page.getByRole("combobox"); await input.fill("10 Samp");
  await expect.poll(() => !!release).toBe(true);
  await input.fill("20 Other"); await expect(page.getByRole("option", { name: "Current suggestion" })).toBeVisible();
  await release?.(); await expect(page.getByRole("option", { name: "Old suggestion" })).toHaveCount(0);
  await input.press("Escape"); await expect(page.getByRole("listbox")).toHaveCount(0);
});
test.describe("touch input", () => {
 test.use({ hasTouch: true });
 test("suggestion failure preserves manual search and supports touch selection on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/suggest", route => route.fulfill({ status: 503, json: { error: "Unavailable" } }));
  await page.goto("/"); const input = page.getByRole("combobox"); await input.fill("10 Samp");
  await expect(page.getByText("Suggestions unavailable. Enter the full address and search.")).toBeVisible();
  await expect(input).toHaveValue("10 Samp");
  await page.route("**/api/suggest", route => route.fulfill({ json: { suggestions: ["20 Sample Street, Sample, NJ"] } }));
  await input.fill("20 Samp"); await page.getByRole("option").tap();
  await expect(input).toHaveValue("20 Sample Street, Sample, NJ");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

});
for (const width of [1440, 390]) {
  test(`suggestions sit below the textbox and scroll without blocking manual search at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const suggestions = [1, 2, 3, 4, 5].map(number => `${number} Sample Street, Sample, NJ`);
    await page.route("**/api/suggest", route => route.fulfill({ json: { suggestions } }));
    await page.route("**/api/identify", route => route.fulfill({ json: { choices: [], sourceFailures: 0, addressMatches: 0 } }));
    await page.goto("/"); const input = page.getByRole("combobox"); await input.fill("Sample");
    await expect(page.getByRole("option")).toHaveCount(5);
    const inputBox = await input.boundingBox();
    const dropdownBox = await page.locator(".address-dropdown").boundingBox();
    expect(inputBox).not.toBeNull(); expect(dropdownBox).not.toBeNull();
    expect(Math.abs(dropdownBox!.y - (inputBox!.y + inputBox!.height) - 6)).toBeLessThanOrEqual(1);
    expect(Math.abs(dropdownBox!.x - inputBox!.x)).toBeLessThanOrEqual(1);
    const list = page.getByRole("listbox");
    expect(await list.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
    await input.press("ArrowUp");
    await expect(input).toHaveAttribute("aria-activedescendant", "address-option-4");
    await expect.poll(() => list.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Find property" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "NJ’s address index" })).toBeVisible();
    await expect(list).toHaveCount(0);
  });
}
