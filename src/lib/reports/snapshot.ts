import type { ListingCandidate } from "../analysis/validate";
import type { FinanceInputs } from "../finance/engines";
import type { StartingEstimate } from "../finance/starting-estimates";
import type { AnalysisResult, FloodScreen, PropertyIdentity, PropertyRecords, SourceResult } from "../property/types";

// Only report evidence and editable assumptions cross the export boundary.
// Confirmation tokens, pasted pages and server configuration are not included.
export type ReportSnapshot = {
  identity: PropertyIdentity;
  records: SourceResult<PropertyRecords> | null;
  flood: SourceResult<FloodScreen> | null;
  finance: FinanceInputs;
  listing: ListingCandidate | null;
  starting: {
    status: string;
    message?: string;
    data?: {
      estimates: StartingEstimate[];
      gaps: string[];
      checkedAt: string;
      modelStatus: string;
      message?: string;
      modelSnapshot?: { generatedAt: string; reused: boolean };
    };
  };
  touchedFields: readonly string[];
  analysis: AnalysisResult | { status: "idle" | "loading" | "unavailable"; message?: string };
  analysisOutdated: boolean;
  sourceStale: boolean;
};

export function reportFilename(identity: PropertyIdentity, exportedAt: string) {
  const address = identity.address.split(",")[0].normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return `BidWise-${address || "property"}-${exportedAt.slice(0, 10)}.pdf`;
}
