// Server-only: retain validated AI allowances, never request bodies, keys or raw pages.
import { createHash, randomUUID } from "node:crypto";
import { mkdir, lstat, readFile, writeFile, link, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";
import { modelEstimatesSchema, validateModelEstimates, type EstimateEvidence } from "./starting-estimates";

const snapshotSchema = z.object({
  version: z.literal(1), id: z.string().regex(/^[a-f0-9]{64}$/), generatedAt: z.iso.datetime(),
  provider: z.enum(["gemini", "groq"]), model: z.string().min(1).max(100), fallbackFrom: z.string().max(100).optional(),
  data: modelEstimatesSchema,
});
type Snapshot = z.infer<typeof snapshotSchema>;
type Generated = Pick<Snapshot, "provider" | "model" | "fallbackFrom" | "data">;
export class EstimateSnapshotError extends Error {
  constructor() { super("The saved estimate set could not be read or saved. No new AI cost values were substituted. Check local estimate storage, then retry."); }
}
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)]));
  return value;
}
export function estimateSnapshotId(context: unknown) {
  return createHash("sha256").update(JSON.stringify(stable(context))).digest("hex");
}
// Share in-flight work across route bundles in this process. Disk publication below
// uses first-writer-wins, so separate processes also return the same saved result.
const processState = globalThis as typeof globalThis & { bidwiseEstimateWork?: Map<string, Promise<Snapshot>> };
const pending = processState.bidwiseEstimateWork ??= new Map<string, Promise<Snapshot>>();
export function createEstimateSnapshotStore(directory = process.env.BIDWISE_ESTIMATE_CACHE_DIR || join(process.cwd(), ".bidwise-cache", "estimates")) {
  const root = resolve(directory);
  const file = (id: string) => {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new EstimateSnapshotError();
    return join(root, `${id}.json`);
  };
  async function read(id: string, evidence: ReadonlyMap<string, EstimateEvidence>): Promise<Snapshot | null> {
    try {
      const path = file(id), info = await lstat(path);
      if (!info.isFile() || info.size > 64_000) throw new EstimateSnapshotError();
      const snapshot = snapshotSchema.parse(JSON.parse(await readFile(path, "utf8")));
      if (snapshot.id !== id) throw new EstimateSnapshotError();
      validateModelEstimates(snapshot.data, evidence);
      return snapshot;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw new EstimateSnapshotError();
    }
  }
  async function getOrCreate(id: string, evidence: ReadonlyMap<string, EstimateEvidence>, generate: () => Promise<Generated>) {
    const stored = await read(id, evidence);
    if (stored) return { snapshot: stored, reused: true };
    const workKey = `${root}:${id}`, active = pending.get(workKey);
    if (active) return { snapshot: await active, reused: true };
    const work = (async () => {
      // Check storage before consuming a free provider request.
      try { await mkdir(root, { recursive: true, mode: 0o700 }); }
      catch { throw new EstimateSnapshotError(); }
      const result = await generate();
      const data = validateModelEstimates(result.data, evidence);
      const snapshot = snapshotSchema.parse({ version: 1, id, generatedAt: new Date().toISOString(), provider: result.provider, model: result.model, fallbackFrom: result.fallbackFrom, data });
      const path = file(id), temporary = join(root, `${id}.${randomUUID()}.tmp`);
      try {
        await writeFile(temporary, JSON.stringify(snapshot), { flag: "wx", mode: 0o600 });
        try { await link(temporary, path); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
        // Always return the published winner, including when another process won.
        const published = await read(id, evidence);
        if (!published) throw new EstimateSnapshotError();
        return published;
      } catch { throw new EstimateSnapshotError(); }
      finally { await unlink(temporary).catch(() => {}); }
    })();
    pending.set(workKey, work);
    try { return { snapshot: await work, reused: false }; }
    finally { if (pending.get(workKey) === work) pending.delete(workKey); }
  }
  return { read, getOrCreate };
}
