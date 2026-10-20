import { describe, expect, it, vi, afterEach } from "vitest";
import { parseFlood } from "../../src/lib/providers/njdep";
import { parseParcels, pointSchema, suggestAddresses, PARCEL_FIELDS } from "../../src/lib/providers/njgin";
import { publicJson } from "../../src/lib/providers/http";
afterEach(() => vi.unstubAllGlobals());
describe("public-data boundaries", () => {
  it("keeps an empty flood response distinct from no risk", () => {
    expect(parseFlood({ features: [] }).status).toBe("no_polygon_returned");
    expect(() => parseFlood({ error: { message: "unavailable" } })).toThrow();
  });
  it("drops owner fields and preserves ambiguous parcel matches", () => {
    const result = parseParcels({ features: [
      { attributes: { PAMS_PIN: "A", OWNER_NAME: "must not survive" } },
      { attributes: { PAMS_PIN: "B" } },
    ] });
    expect(result.features).toHaveLength(2);
    expect(result.features[0].attributes).not.toHaveProperty("OWNER_NAME");
  });
  it("rejects unusable coordinates", () => {
    expect(() => pointSchema.parse({ x: Number.NaN, y: 40 })).toThrow();
    expect(() => pointSchema.parse({ x: 0, y: 0 })).toThrow();
  });
  it("treats ArcGIS errors inside HTTP 200 as failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 400 } }))));
    await expect(publicJson("https://example.invalid/query", {})).rejects.toMatchObject({ kind: "invalid" });
  });
});

it("uses bounded no-key NJ suggestions and omits collection matches and duplicates", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ suggestions: [
    { text: "10 Sample Street, Sample, NJ", isCollection: false, magicKey: "source-only" },
    { text: "10 Sample Street, Sample, NJ", isCollection: false },
    { text: "Sample", isCollection: true },
  ] })));
  vi.stubGlobal("fetch", fetch);
  expect(await suggestAddresses("10 Samp")).toEqual(["10 Sample Street, Sample, NJ"]);
  const url = new URL(fetch.mock.calls[0][0]);
  expect(url.hostname).toBe("geo.nj.gov");
  expect(url.searchParams.get("maxSuggestions")).toBe("5");
  expect(url.searchParams.has("token")).toBe(false);
  expect(PARCEL_FIELDS).not.toContain("ZIP5");
  expect(PARCEL_FIELDS).not.toContain("ST_ADDRESS");
});
