import { expect, it, vi, afterEach } from "vitest";
import { areaBenchmarksFor } from "../../src/lib/providers/census";
const identity = { pin: "0000_1_1", address: "10 Sample St, Sample, NJ", municipality: "SAMPLE", block: "1", lot: "1", qualifier: "", location: { x: -74.4, y: 40.4 }, precision: "PointAddress", score: 100, checkedAt: "2026-10-23T00:00:00Z" };
const tract = { GEOID: "34023005602", STATE: "34", COUNTY: "023", TRACT: "005602" };
const data = { release: { id: "acs2024_5yr", years: "2020-2024" }, geography: { "14000US34023005602": { name: "Census Tract 56.02, Middlesex, NJ" } }, data: { "14000US34023005602": { B25077: { estimate: { B25077001: 346200 }, error: { B25077001: 26460 } }, B25058: { estimate: { B25058001: 1673 }, error: { B25058001: 175 } } } } };
afterEach(() => vi.unstubAllGlobals());
it("matches a precise confirmed NJ point to the explicit ACS vintage and preserves area scope/MOE", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ result: { geographies: { "Census Tracts": [tract] } } })).mockResolvedValueOnce(Response.json(data)); vi.stubGlobal("fetch", fetch);
  const result = await areaBenchmarksFor(identity);
  expect(result.status).toBe("available"); if (result.status !== "available") throw Error();
  expect(result.data).toMatchObject({ geoid: "34023005602", period: "2020-2024", homeValue: 346200, homeValueMoe: 26460, contractRent: 1673, contractRentMoe: 175 });
  expect(fetch.mock.calls[0][0].toString()).toContain("vintage=ACS2024_Current");
  expect(fetch.mock.calls[1][1].headers["User-Agent"]).toContain("BidWise");
});
it("withholds approximate points and rejects ambiguous or out-of-state geography", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  expect((await areaBenchmarksFor({ ...identity, precision: "StreetAddress" })).status).toBe("unavailable"); expect(fetch).not.toHaveBeenCalled();
  for (const choices of [[tract, tract], [{ ...tract, STATE: "36" }]]) {
    fetch.mockResolvedValueOnce(Response.json({ result: { geographies: { "Census Tracts": choices } } }));
    expect((await areaBenchmarksFor(identity)).status).toBe("unavailable");
  }
});
it("does not turn suppression/sentinels or a different release into a usable price", async () => {
  const fetch = vi.fn().mockImplementation(async (url: URL) => Response.json(url.hostname === "geocoding.geo.census.gov" ? { result: { geographies: { "Census Tracts": [tract] } } } : { ...data, data: { "14000US34023005602": { ...data.data["14000US34023005602"], B25077: { estimate: { B25077001: -666666666 }, error: { B25077001: null } } } } })); vi.stubGlobal("fetch", fetch);
  const result = await areaBenchmarksFor(identity); if (result.status !== "available") throw Error(); expect(result.data.homeValue).toBeNull();
  fetch.mockReset().mockResolvedValueOnce(Response.json({ result: { geographies: { "Census Tracts": [tract] } } })).mockResolvedValueOnce(Response.json({ ...data, release: { id: "acs2023_5yr", years: "2019-2023" } }));
  expect((await areaBenchmarksFor(identity)).status).toBe("unavailable");
});
