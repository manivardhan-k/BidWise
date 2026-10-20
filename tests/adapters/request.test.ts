import { expect, it } from "vitest";
import { z } from "zod";
import { readJson } from "../../src/lib/http";
it("rejects oversized and malformed request bodies with safe input errors", async () => {
  const request = (body: string) => new Request("http://localhost/api/identify", { method: "POST", headers: { "Content-Type": "application/json" }, body });
  await expect(readJson(request(JSON.stringify({ text: "a".repeat(9000) })), z.object({ text: z.string() }))).rejects.toMatchObject({ status: 413 });
  await expect(readJson(request("private malformed content"), z.object({ text: z.string() }))).rejects.toMatchObject({ message: "Input could not be read. Check its format." });
});
