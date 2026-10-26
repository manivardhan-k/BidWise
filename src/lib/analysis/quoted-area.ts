// Formatting repair only: return a literal value from an already verified quote.
// Never calculate, round, convert units or fill in an absent area.
const unit = String.raw`(?:sqft|sq\.?\s*ft\.?|square\s+(?:feet|foot))`;
const amount = String.raw`\d+(?:,\d{3})*(?:\.\d+)?`;
const canonicalAmount = (text: string) => {
  const [whole, fraction = ""] = text.replaceAll(",", "").split(".");
  return `${whole.replace(/^0+(?=\d)/, "")}.${fraction.replace(/0+$/, "")}`;
};
export function originalQuotedArea(value: string, snippet: string): string | null {
  const supplied = value.trim().match(new RegExp(`^(${amount})(?:\\s*${unit})?$`, "i"));
  if (!supplied) return null;
  const matches = [...snippet.matchAll(new RegExp(`(?<![\\d.,])(${amount})\\s*${unit}\\b`, "gi"))]
    .filter(match => canonicalAmount(match[1]) === canonicalAmount(supplied[1]));
  return matches.length === 1 ? matches[0][0] : null;
}
