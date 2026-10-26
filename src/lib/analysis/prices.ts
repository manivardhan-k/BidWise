// Explicit rental wording must never seed a purchase-price assumption.
export const isRentalPrice = (snippet: string) => /\b(?:rent|rental|lease|monthly)\b|\/\s*(?:mo|month)\b|\bper\s+month\b/i.test(snippet);
