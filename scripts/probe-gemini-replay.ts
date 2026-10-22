import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parseEnv } from "node:util";
import { z } from "zod";

// Opt-in diagnostic. Every generation case sends only the public arithmetic
// prompt below, with one attempt. Never print the key or raw error objects.
const option = (name: string) => process.argv.slice(2).find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const testCase = z.enum(["metadata", "logged", "minimal", "stable", "legacy"]).parse(option("case") ?? "metadata");
const local = parseEnv(await readFile(".env.local", "utf8"));
const model = z.enum(["gemini-3.8-flash", "gemini-3.5-flash-lite"]).parse(option("model") ?? local.GEMINI_MODEL);
const key = local.GEMINI_API_KEY;
if (!key) throw new Error("Configure GEMINI_API_KEY locally before this explicit diagnostic.");
const prompt = "What is 2 + 2? Reply with one short sentence.";
const generation = { max_output_tokens: 65536, thinking_level: "medium" };
let path = `${testCase === "stable" ? "v1" : "v1beta"}/interactions`;
let body: unknown = { model, input: prompt, store: false };
if (testCase === "logged") body = { store: true, steps_enabled: true, object: "interaction", input: [{ type: "user_input", content: [{ text: prompt, type: "text" }] }], model: `models/${model}`, generation_config: generation };
if (testCase === "legacy") {
  path = `v1beta/models/${model}:generateContent`;
  body = { contents: [{ role: "user", parts: [{ text: prompt }] }], store: false, generationConfig: { maxOutputTokens: 65536, thinkingConfig: { thinkingLevel: "MEDIUM" } } };
}
if (testCase === "metadata") path = `v1beta/models/${model}`;
const checkedAt = new Date().toISOString();
const start = Date.now();
let result: Record<string, unknown>;
try {
  const response = await fetch(`https://generativelanguage.googleapis.com/${path}`, {
    method: testCase === "metadata" ? "GET" : "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    ...(testCase === "metadata" ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(45_000),
  });
  const data = await response.json();
  const output = testCase === "legacy"
    ? (data.candidates?.[0]?.content?.parts ?? []).filter((part: { text?: string; thought?: boolean }) => part.text && !part.thought).map((part: { text: string }) => part.text).join("")
    : (data.steps ?? []).filter((step: { type: string }) => step.type === "model_output").flatMap((step: { content?: { type: string; text?: string }[] }) => step.content ?? []).filter((part: { type: string }) => part.type === "text").map((part: { text?: string }) => part.text ?? "").join("");
  result = { checkedAt, testCase, model, httpStatus: response.status, elapsedMs: Date.now() - start,
    ...(testCase === "metadata" ? { listedName: data.name, supportedMethods: data.supportedGenerationMethods } : { output: output.slice(0, 300), completed: data.status === "completed" || data.candidates?.[0]?.finishReason === "STOP" }),
    providerCode: data.error?.code ?? data.error?.status,
    providerMessage: typeof data.error?.message === "string" ? data.error.message.replaceAll(key, "[REDACTED]").slice(0, 800) : undefined,
  };
  if (!response.ok) process.exitCode = 1;
} catch (error) {
  result = { checkedAt, testCase, model, elapsedMs: Date.now() - start, category: /timeout|abort/i.test((error as Error).name) ? "timeout" : "network" };
  process.exitCode = 1;
}
await mkdir("docs/evidence", { recursive: true });
await writeFile(`docs/evidence/gemini-replay-${testCase}-${Date.now()}.json`, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result));
