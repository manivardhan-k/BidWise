import { Fact } from "./Fact";
import type { FactEvidence } from "@/lib/property/types";
const groups = [
  { title: "Address and parcel identity", ids: ["property_address", "county", "municipality", "municipality_code", "parcel", "block", "lot", "qualifier", "old_property_id"] },
  { title: "Building and recorded use", ids: ["class", "year_built", "building_description", "residential_units", "commercial_units", "building_class", "property_use", "facility"] },
  { title: "Land and additional lots", ids: ["acreage", "land_description", "additional_lots_1", "additional_lots_2"] },
  { title: "Assessment and historical tax", ids: ["land_assessment", "building_assessment", "assessment", "historical_tax"] },
];
export function RecordDetails({ facts }: { facts: FactEvidence[] }) {
  const available = facts.filter(fact => fact.value !== null).length;
  return <section className="record-details" aria-labelledby="record-details-title"><div className="section-heading"><div><p className="section-kicker">The full available property record</p><h3 id="record-details-title">Look beyond the headline.</h3></div><span className="small-label">{available} of {facts.length} record fields available</span></div>
    <p className="muted record-intro">Every useful property field from this source is shown here or in Recorded history. Missing entries may be unknown or not applicable. Field availability measures coverage, not accuracy.</p>
    {groups.map(group => <div className="record-group" key={group.title}><h4>{group.title}</h4><div className="record-facts">{group.ids.map(id => { const fact = facts.find(item => item.id === id); return fact ? <Fact key={id} fact={fact} /> : null; })}</div></div>)}
    <a className="source-link" href="https://njdep.maps.arcgis.com/sharing/rest/content/items/852937c223e94fcf8e167a23b500935d/info/metadata/metadata.xml?format=default&output=html" target="_blank" rel="noopener noreferrer">How NJGIN defines these record fields</a>
  </section>;
}
