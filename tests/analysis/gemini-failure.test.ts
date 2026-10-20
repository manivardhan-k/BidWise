import { describe, expect, it } from "vitest";
import { z } from "zod";
import { GeminiFailure, safeGeminiFailure } from "../../src/lib/providers/gemini";

describe("sanitized Gemini diagnosis", () => {
  it.each([
    [401, "authentication"], [403, "authentication"], [429, "quota"],
    [404, "not_found"], [400, "bad_request"], [503, "provider"],
  ])("classifies HTTP %s without retaining sensitive provider data", (status, category) => {
    const error = Object.assign(new Error("private-request-marker"), {
      statusCode: status, body: "private-body-marker", headers: { authorization: "private-key-marker" },
    });
    const result = safeGeminiFailure(error);
    expect(result.category).toBe(category);
    expect(result.httpStatus).toBe(status);
    expect(JSON.stringify(result)).not.toContain("private-");
    expect(result.message).not.toContain("private-");
    expect(result).not.toHaveProperty("cause");
  });
  it("separates malformed output, timeout and unknown network errors", () => {
    expect(safeGeminiFailure(new SyntaxError()).category).toBe("invalid_output");
    expect(safeGeminiFailure(new z.ZodError([])).category).toBe("invalid_output");
    expect(safeGeminiFailure(Object.assign(new Error(), { name: "RequestTimeoutError" })).category).toBe("timeout");
    expect(safeGeminiFailure(new Error("unknown private payload")).category).toBe("network");
    const classified = new GeminiFailure("configuration");
    expect(safeGeminiFailure(classified)).toBe(classified);
  });
});
