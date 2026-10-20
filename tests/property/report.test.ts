import { describe, expect, it, vi } from "vitest";
const floodAt = vi.hoisted(() => vi.fn());
vi.mock("../../src/lib/providers/njdep", () => ({ FLOOD: "https://mapsdep.nj.gov/arcgis/rest/services/Features/Hydrography/MapServer/43", floodAt }));
import { hazardsFor } from "../../src/lib/property/report";
const identity = { pin: "1213_89_16", address: "Test address, NJ", municipality: "TEST", block: "89", lot: "16", qualifier: "", location: { x: -74.4, y: 40.4 }, precision: "PointAddress", score: 100, checkedAt: "2026-10-20T00:00:00.000Z" };
describe("flood screening boundaries", () => {
  it("withholds uncertain locations without making a hazard request", async () => {
    floodAt.mockClear();
    const result = await hazardsFor({ ...identity, precision: "StreetAddress" });
    expect(result.status === "available" && result.data.status).toBe("location_uncertain");
    expect(floodAt).not.toHaveBeenCalled();
  });
  it("groups exact duplicates but retains different X subtypes and counts", async () => {
    floodAt.mockResolvedValueOnce({ status: "zones_returned", caveat: "Not a safety guarantee", features: [
      { attributes: { FLD_ZONE: "X", ZONE_SUBTY: "MINIMAL" } }, { attributes: { FLD_ZONE: "X", ZONE_SUBTY: "MINIMAL" } },
      { attributes: { FLD_ZONE: "X", ZONE_SUBTY: "0.2 PCT" } },
    ] });
    const result = await hazardsFor(identity);
    expect(result.status).toBe("available");
    if (result.status === "available") expect(result.data.zones).toEqual([{ zone: "X", subtype: "MINIMAL", sourceMatches: 2 }, { zone: "X", subtype: "0.2 PCT", sourceMatches: 1 }]);
  });
});
