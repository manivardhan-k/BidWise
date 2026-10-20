export class ProviderError extends Error {
  constructor(public readonly kind: "timeout" | "http" | "invalid" | "network") {
    super(`Public data source unavailable (${kind}).`);
  }
}

// Callers own the fixed destination. Neither pasted text nor a browser supplies it.
export async function publicJson(base: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: "error" });
  } catch (error) {
    throw new ProviderError(error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network");
  }
  if (!response.ok) throw new ProviderError("http");
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || "error" in body) throw new Error();
    return body;
  } catch { throw new ProviderError("invalid"); }
}
