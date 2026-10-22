export type PropertyIdentity = {
  pin: string; address: string; municipality: string; block: string; lot: string; qualifier: string;
  location: { x: number; y: number }; precision: string; score: number; checkedAt: string; listingHash?: string;
};
export type PropertyChoice = { identity: PropertyIdentity; token: string; note: string };
export type FactEvidence = {
  id: string; label: string; value: string | number | null; format?: "money"; rawValue?: string;
  status: "source_matched" | "not_available"; sourceUrl: string; fetchedAt: string;
  sourceDate: string | null; caveat: string;
};
export type PropertyRecords = { pin: string; facts: FactEvidence[]; fetchedAt: string; publicationDate: string | null; geometryDate: string | null };
export type FloodScreen = {
  status: "zones_returned" | "no_polygon_returned" | "location_uncertain";
  zones: { zone: string; subtype: string; sourceMatches: number }[];
  sourceUrl: string; fetchedAt: string; caveat: string;
};
export type SourceResult<T> = { status: "available"; data: T } | { status: "unavailable"; message: string };
export type AnalysisResult = {
  status: "available"; snapshotId: string; generatedAt: string; model: string; revision: number;
  summary: string; findings: { explanation: string; evidenceIds: string[]; numericClaims: { evidenceId: string; value: number }[] }[];
  unansweredQuestions: string[]; consistencyFlags: string[];
  records: SourceResult<PropertyRecords>; flood: SourceResult<FloodScreen>;
};
