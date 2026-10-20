import { afterEach, describe, expect, it, vi } from "vitest";
import { matchesParcelIdentifiers, signIdentity, verifyIdentity } from "../../src/lib/property/identity";
import { pinSchema } from "../../src/lib/providers/njgin";
const identity = { pin: "1213_89_16", address: "Test address, NJ", municipality: "TEST", block: "89", lot: "16", qualifier: "", location: { x: -74.4, y: 40.4 }, precision: "PointAddress", score: 100, checkedAt: "2026-10-20T00:00:00.000Z" };
afterEach(() => vi.useRealTimers());
describe("confirmed source identity", () => {
  it("does not let a caller change a signed parcel or location", () => {
    const token = signIdentity(identity);
    expect(verifyIdentity(token)).toEqual(identity);
    const [body, signature] = token.split(".");
    const forged = JSON.parse(Buffer.from(body, "base64url").toString());
    forged.identity.pin = "1213_89_40"; forged.identity.location.x = -74.5;
    expect(() => verifyIdentity(`${Buffer.from(JSON.stringify(forged)).toString("base64url")}.${signature}`)).toThrow();
    expect(() => verifyIdentity("not-a-token")).toThrow();
  });
  it("expires confirmation instead of indefinitely trusting an old match", () => {
    vi.useFakeTimers(); const token = signIdentity(identity);
    vi.advanceTimersByTime(15 * 60_000 + 1);
    expect(() => verifyIdentity(token)).toThrow("expired");
  });
  it("rejects mismatched block, lot and qualifiers", () => {
    expect(matchesParcelIdentifiers({ PCLBLOCK: "89", PCLLOT: "16", PCLQCODE: " C01 " }, { Addr_Block: "89", Addr_Lot: "16", Addr_Qualifier: "C01" })).toBe(true);
    expect(matchesParcelIdentifiers({ PCLBLOCK: "90", PCLLOT: "16" }, { Addr_Block: "89", Addr_Lot: "16" })).toBe(false);
    expect(matchesParcelIdentifiers({ PCLBLOCK: "89", PCLLOT: "16", PCLQCODE: "C02" }, { Addr_Qualifier: "C01" })).toBe(false);
    expect(() => pinSchema.parse("1213_89_16' OR '1'='1")).toThrow();
  });
});
