import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createEstimateSnapshotStore, estimateSnapshotId, EstimateSnapshotError } from "../../src/lib/finance/estimate-snapshots";
import type { EstimateEvidence } from "../../src/lib/finance/starting-estimates";

const evidence = new Map<string, EstimateEvidence>([["property_class", { value: "Residential", description: "Recorded use; condition unknown." }]]);
const id = estimateSnapshotId({ pin: "0000_1_1", policy: "fixture-v1", evidence: Object.fromEntries(evidence) });
const proposal = (value = 25000) => ({ provider: "groq" as const, model: "openai/gpt-oss-120b", data: { estimates: [{ field: "renovation.allowance" as const, value, low: 10000, high: 70000, evidenceIds: ["property_class"], explanation: "A provisional allowance; property not inspected or quoted." }] } });
let directory: string;
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), "bidwise-snapshot-")); });
afterEach(async () => { vi.useRealTimers(); await rm(directory, { recursive: true, force: true }); });

it("keeps identical inputs stable across a new store and a later date", async () => {
  const generate = vi.fn().mockResolvedValueOnce(proposal()).mockResolvedValue(proposal(50000));
  const first = await createEstimateSnapshotStore(directory).getOrCreate(id, evidence, generate);
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2027-10-26T12:00:00Z"));
  const second = await createEstimateSnapshotStore(directory).getOrCreate(id, evidence, generate);
  expect(second.snapshot).toEqual(first.snapshot);
  expect(second.reused).toBe(true);
  expect(generate).toHaveBeenCalledTimes(1);
  expect(await readdir(directory)).toEqual([`${id}.json`]);
});
it("reuses the saved set in a new Node process without invoking the generator", async () => {
  const { snapshot } = await createEstimateSnapshotStore(directory).getOrCreate(id, evidence, async () => proposal());
  const snapshotModule = new URL("../../src/lib/finance/estimate-snapshots.ts", import.meta.url).href;
  const script = `const {createEstimateSnapshotStore}=await import(${JSON.stringify(snapshotModule)});const result=await createEstimateSnapshotStore(${JSON.stringify(directory)}).getOrCreate(${JSON.stringify(id)},new Map(${JSON.stringify([...evidence])}),async()=>{throw new Error("Generator must not run after restart")});console.log(JSON.stringify(result));`;
  const { stdout } = await promisify(execFile)(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], { cwd: process.cwd() });
  expect(JSON.parse(stdout)).toEqual({ snapshot, reused: true });
});
it("coalesces concurrent requests across store instances", async () => {
  let release!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  const generate = vi.fn(async () => { await wait; return proposal(); });
  const first = createEstimateSnapshotStore(directory).getOrCreate(id, evidence, generate);
  const second = createEstimateSnapshotStore(directory).getOrCreate(id, evidence, generate);
  await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
  release();
  expect((await first).snapshot).toEqual((await second).snapshot);
  expect(generate).toHaveBeenCalledTimes(1);
});
it("does not save provider failures or invalid allowances and permits a later valid attempt", async () => {
  const store = createEstimateSnapshotStore(directory);
  await expect(store.getOrCreate(id, evidence, async () => { throw new Error("Temporary provider failure"); })).rejects.toThrow("Temporary provider failure");
  const bad = proposal(); bad.data.estimates[0].low = 90000;
  await expect(store.getOrCreate(id, evidence, async () => bad)).rejects.toThrow();
  expect(await readdir(directory)).toEqual([]);
  expect((await store.getOrCreate(id, evidence, async () => proposal())).reused).toBe(false);
});
it("fails closed on a corrupt saved file instead of replacing its values with a new draw", async () => {
  const store = createEstimateSnapshotStore(directory);
  await store.getOrCreate(id, evidence, async () => proposal());
  await writeFile(join(directory, `${id}.json`), "broken JSON");
  const generate = vi.fn(async () => proposal(50000));
  await expect(store.getOrCreate(id, evidence, generate)).rejects.toBeInstanceOf(EstimateSnapshotError);
  expect(generate).not.toHaveBeenCalled();
});
it("revalidates saved references against current evidence and rejects a wrong snapshot identity", async () => {
  const store = createEstimateSnapshotStore(directory);
  const { snapshot } = await store.getOrCreate(id, evidence, async () => proposal());
  await expect(store.read(id, new Map())).rejects.toBeInstanceOf(EstimateSnapshotError);
  await writeFile(join(directory, `${id}.json`), JSON.stringify({ ...snapshot, id: "0".repeat(64) }));
  await expect(store.read(id, evidence)).rejects.toBeInstanceOf(EstimateSnapshotError);
});
it("stores only the validated result and digest, excluding request bodies, usage and extra provider payloads", async () => {
  await createEstimateSnapshotStore(directory).getOrCreate(id, evidence, async () => ({ ...proposal(), request: "private pasted page", key: "fictional-secret", usage: { debug: "private" } }));
  const text = await readFile(join(directory, `${id}.json`), "utf8");
  expect(text).not.toMatch(/private|fictional-secret|0000_1_1/);
  expect(Object.keys(JSON.parse(text)).sort()).toEqual(["data", "generatedAt", "id", "model", "provider", "version"]);
});
it("does not call the provider when local storage cannot be initialized", async () => {
  const path = join(directory, "a-file"); await writeFile(path, "fixture");
  const generate = vi.fn(async () => proposal());
  await expect(createEstimateSnapshotStore(path).getOrCreate(id, evidence, generate)).rejects.toBeInstanceOf(EstimateSnapshotError);
  expect(generate).not.toHaveBeenCalled();
});
it("canonicalizes object order while separating property, evidence and policy versions", () => {
  const context = { pin: "0000_1_1", policy: "v1", evidence: { tax: 6000, year: 1900 } };
  expect(estimateSnapshotId(context)).toBe(estimateSnapshotId({ evidence: { year: 1900, tax: 6000 }, policy: "v1", pin: "0000_1_1" }));
  for (const change of [{ pin: "0000_1_2" }, { policy: "v2" }, { evidence: { tax: 7000, year: 1900 } }]) expect(estimateSnapshotId({ ...context, ...change })).not.toBe(estimateSnapshotId(context));
});
