import { compareListingClaims } from "@/lib/analysis/comparisons";
import type { ListingCandidate } from "@/lib/analysis/validate";
import type { PropertyRecords, SourceResult } from "@/lib/property/types";
const labels: Record<string, string> = { asking_price: "Purchase asking price", monthly_rent: "Advertised monthly rent", opening_bid: "Opening bid", judgment: "Judgment amount", bedrooms: "Bedrooms", bathrooms: "Bathrooms", interior_area: "Interior floor area", condition: "Condition claim", year_built: "Year built", residential_units: "Residential units" };
const statuses = { matches: "Agrees with record", differs: "Differs from record", cannot_verify: "Cannot verify", not_comparable: "Different kind of information" };
export function ListingClaims({ candidate, records }: { candidate: ListingCandidate; records: SourceResult<PropertyRecords> | null }) {
  const comparisons = compareListingClaims(candidate.claims, records ?? { status: "unavailable", message: "Records pending" });
  return <section className="listing-section" aria-labelledby="listing-title"><div className="section-heading"><h3 id="listing-title">What the page says.</h3><span className="small-label">{candidate.claims.length} supported text {candidate.claims.length === 1 ? "claim" : "claims"}</span></div>
    <p className="muted listing-intro">Quoted claims, not verified records. No website was fetched.</p>
    <blockquote className="address-quote">{candidate.addressSnippet}</blockquote>
    {comparisons.length ? comparisons.map((comparison, index) => <article className="claim-row" key={index}><div className="claim-value"><span className="small-label">{labels[comparison.claim.kind]}</span><strong>{comparison.claim.value}</strong><span className={`comparison-label comparison-${comparison.status}`}>{statuses[comparison.status]}</span></div><div><blockquote>{comparison.claim.snippet}</blockquote><p>{comparison.explanation}</p>{comparison.officialFactId && records?.status === "available" && records.data.facts.find(fact => fact.id === comparison.officialFactId) && <a className="source-link" target="_blank" rel="noopener noreferrer" href={records.data.facts.find(fact => fact.id === comparison.officialFactId)!.sourceUrl}>Open comparison record</a>}</div></article>) : <p>No supported property claims were extracted beyond the address.</p>}
  </section>;
}
