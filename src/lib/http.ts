import { z } from "zod";
export class InputError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}
export async function readJson<T>(request: Request, schema: z.ZodType<T>, maxBytes = 8192): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new InputError("Send JSON input.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new InputError("Input is missing.");
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      length += value.length;
      if (length > maxBytes) { await reader.cancel(); throw new InputError("Input is too large.", 413); }
      chunks.push(value);
    }
    const parsed = schema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!parsed.success) throw new InputError("Check the supplied address or property confirmation.");
    return parsed.data;
  } catch (error) { if (error instanceof InputError) throw error; throw new InputError("Input could not be read. Check its format."); }
  finally { reader.releaseLock(); }
}
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "no-store" } }); }
export function inputFailure(error: unknown) { return json({ error: error instanceof InputError ? error.message : "Property confirmation is invalid or expired. Search again." }, error instanceof InputError ? error.status : 400); }
export const tokenBody = z.object({ token: z.string().min(10).max(4096) });
