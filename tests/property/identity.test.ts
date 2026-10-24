import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const sources = vi.hoisted(() => ({ identify: vi.fn(), parcelsAt: vi.fn() }));
vi.mock("../../src/lib/providers/njgin", async original => ({ ...await original<object>(), ...sources }));
import { findPropertyChoices, matchesParcelIdentifiers, signIdentity, verifyIdentity } from "../../src/lib/property/identity";
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

describe("address and parcel source disagreements", () => {
  // Fictional counterpart of the observed condo: only the block differs.
  const candidate = { address: "10 Test Court, Sample, NJ", score: 100, location: identity.location, attributes: { Addr_type: "PointAddress", Addr_Block: "528", Addr_Lot: "43", Addr_Qualifier: "C0010" } };
  const attributes = { PAMS_PIN: "0000_528.05_43_C0010", PCL_MUN: "0000", PCLBLOCK: "528.05", PCLLOT: "43", PCLQCODE: "C0010" };
  beforeEach(() => {
    vi.resetAllMocks();
    sources.identify.mockResolvedValue([candidate]);
    sources.parcelsAt.mockResolvedValue({ features: [{ attributes }] });
  });
  it("offers one precise unit for review while retaining the signed block conflict", async () => {
    const result = await findPropertyChoices(candidate.address);
    expect(result.choices).toHaveLength(1);
    const choice = result.choices[0];
    expect(choice.identity).toMatchObject({ pin: attributes.PAMS_PIN, block: "528.05", matchReview: { addressBlock: "528", parcelBlock: "528.05" } });
    expect(choice.note).toContain("disagree");
    expect(choice.note).not.toContain("identifiers agree");
    expect(verifyIdentity(choice.token)).toEqual(choice.identity);
  });
  it("retains the ordinary exact-match path without a source-conflict flag", async () => {
    sources.identify.mockResolvedValue([{ ...candidate, attributes: { ...candidate.attributes, Addr_Block: "528.05" } }]);
    const { choices } = await findPropertyChoices(candidate.address);
    expect(choices).toHaveLength(1);
    expect(choices[0].identity).not.toHaveProperty("matchReview");
    expect(choices[0].note).toContain("identifiers agree");
  });
  it.each([
    ["different unit", { Addr_Qualifier: "C0020" }],
    ["different lot", { Addr_Lot: "44" }],
    ["no unit", { Addr_Qualifier: "" }],
    ["no lot", { Addr_Lot: "" }],
  ])("does not turn %s into a review match", async (_, changed) => {
    sources.identify.mockResolvedValue([{ ...candidate, attributes: { ...candidate.attributes, ...changed } }]);
    expect((await findPropertyChoices(candidate.address)).choices).toHaveLength(0);
  });
  it.each([
    ["approximate address", { ...candidate, attributes: { ...candidate.attributes, Addr_type: "StreetAddress" } }],
    ["low match score", { ...candidate, score: 94 }],
  ])("withholds block-conflict candidates for a %s", async (_, value) => {
    sources.identify.mockResolvedValue([value]);
    const result = await findPropertyChoices(candidate.address);
    expect(result.choices).toHaveLength(0);
    expect(result.identifierConflicts).toBe(1);
  });
  it("rejects ambiguous spatial results and internally inconsistent parcel IDs", async () => {
    sources.parcelsAt.mockResolvedValue({ features: [{ attributes }, { attributes: { ...attributes, PAMS_PIN: "0000_529_43_C0010", PCLBLOCK: "529" } }] });
    expect((await findPropertyChoices(candidate.address)).choices).toHaveLength(0);
    sources.parcelsAt.mockResolvedValue({ features: [{ attributes: { ...attributes, PAMS_PIN: "0000_999_43_C0010" } }] });
    expect((await findPropertyChoices(candidate.address)).choices).toHaveLength(0);
  });
});
