// Retain only fixed categories and numeric metadata, never provider error text.
export type GroqQuota = {
  kind: "tokens_per_day" | "requests_per_day" | "tokens_per_minute" | "requests_per_minute" | "request_too_large" | "unknown";
  limit?: number; used?: number; requested?: number; retryAfterSeconds?: number; retryAt?: number;
};
export async function readGroqQuota(response: Response): Promise<GroqQuota> {
  const body = await response.json().catch(() => null);
  const message = typeof body?.error?.message === "string" ? body.error.message : "";
  const kind = /request too large/i.test(message) ? "request_too_large"
    : /tokens per day|\bTPD\b/i.test(message) ? "tokens_per_day"
    : /requests per day|\bRPD\b/i.test(message) ? "requests_per_day"
    : /tokens per minute|\bTPM\b/i.test(message) ? "tokens_per_minute"
    : /requests per minute|\bRPM\b/i.test(message) ? "requests_per_minute" : "unknown";
  const quota: GroqQuota = { kind };
  for (const name of ["limit", "used", "requested"] as const) {
    const match = message.match(new RegExp(`\\b${name}\\s*[:=]?\\s*(\\d[\\d,]*(?:\\.\\d+)?)`, "i"));
    const value = match ? Number(match[1].replaceAll(",", "")) : NaN;
    if (Number.isFinite(value) && value >= 0 && value <= 1e12) quota[name] = value;
  }
  const header = response.headers.get("retry-after");
  const seconds = header && /^\d+(?:\.\d+)?$/.test(header.trim()) ? Number(header) : NaN;
  if (Number.isFinite(seconds) && seconds > 0 && seconds <= 86_400) {
    quota.retryAfterSeconds = Math.ceil(seconds); quota.retryAt = Date.now() + Math.ceil(seconds * 1000);
  }
  return quota;
}
export function groqQuotaMessage(quota?: GroqQuota) {
  if (quota?.kind === "request_too_large") return "This AI request is too large for the selected free model. For copied pages, use the main listing details or research the NJ address directly.";
  const subject = quota?.kind === "tokens_per_day" ? "Groq's daily token allowance does not have enough capacity for this request."
    : quota?.kind === "requests_per_day" ? "Groq's daily request allowance has been reached."
    : quota?.kind === "tokens_per_minute" ? "Groq's per-minute token allowance is temporarily busy."
    : quota?.kind === "requests_per_minute" ? "Groq's per-minute request allowance is temporarily busy."
    : "Groq is rate-limiting this request; the daily allowance may still be available.";
  const seconds = quota?.retryAt ? Math.max(0, Math.ceil((quota.retryAt - Date.now()) / 1000)) : null;
  return `${subject} ${seconds === null ? "Wait before trying again." : seconds === 0 ? "You can try again now." : seconds < 60 ? `Try again in about ${seconds} seconds.` : `Try again in about ${Math.ceil(seconds / 60)} minutes.`}`;
}
