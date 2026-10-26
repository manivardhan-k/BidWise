import { createHash } from "node:crypto";
import { validateExtraction } from "./validate";
type Extraction = { data: ReturnType<typeof validateExtraction>; model: string; provider: string; fallbackFrom?: string; omittedClaims?: number };
type Saved = { result: Extraction; extractedAt: string; until: number };
function createCache() {
  const saved = new Map<string, Saved>(), pending = new Map<string, Promise<Saved>>();
  return async (text: string, policy: unknown, generate: () => Promise<Extraction>) => {
    const id = createHash("sha256").update(JSON.stringify({ text, policy, version: 1 })).digest("hex");
    const entry = saved.get(id);
    if (entry && entry.until > Date.now()) return { ...entry.result, data: validateExtraction(entry.result.data, text), extractedAt: entry.extractedAt, reused: true };
    if (entry) saved.delete(id);
    const active = pending.get(id);
    if (active) { const shared = await active; return { ...shared.result, data: validateExtraction(shared.result.data, text), extractedAt: shared.extractedAt, reused: true }; }
    const work = (async () => {
      const result = await generate();
      const next = { result: { ...result, data: validateExtraction(result.data, text) }, extractedAt: new Date().toISOString(), until: Date.now() + 10 * 60_000 };
      if (saved.size >= 20) saved.delete(saved.keys().next().value!);
      saved.set(id, next);
      const expiry = setTimeout(() => { if (saved.get(id) === next) saved.delete(id); }, 10 * 60_000);
      expiry.unref();
      return next;
    })();
    pending.set(id, work);
    try { const created = await work; return { ...created.result, data: validateExtraction(created.result.data, text), extractedAt: created.extractedAt, reused: false }; }
    finally { if (pending.get(id) === work) pending.delete(id); }
  };
}
// Private process memory holds only digests and verified output; no raw-page store.
const state = globalThis as typeof globalThis & { bidwiseExtractions?: ReturnType<typeof createCache> };
export const cachedExtraction = state.bidwiseExtractions ??= createCache();
