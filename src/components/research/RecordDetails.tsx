import { Building2, Database, Files, House, Map } from "lucide-react";
import { Fact } from "./Fact";
import type { FactEvidence } from "@/lib/property/types";
const groups = [
  { title: "Address & parcel", icon: House, ids: ["property_address", "county", "municipality", "municipality_code", "parcel", "block", "lot", "qualifier", "old_property_id"] },
  { title: "Building & use", icon: Building2, ids: ["class", "year_built", "building_description", "residential_units", "commercial_units", "building_class", "property_use", "facility"] },
  { title: "Land", icon: Map, ids: ["acreage", "land_description", "additional_lots_1", "additional_lots_2"] },
  { title: "Assessment & tax", icon: Database, ids: ["land_assessment", "building_assessment", "assessment", "historical_tax"] },
];
export function RecordDetails({ facts }: { facts: FactEvidence[] }) {
  const available = facts.filter(fact => fact.value !== null).length;
  return <section id="property-records" className="record-details" aria-labelledby="record-details-title"><div className="section-heading"><h3 id="record-details-title" className="section-title"><Files size={26} aria-hidden="true" />Property records</h3><span className="small-label">{available} of {facts.length} record fields available</span></div>
    <div className="record-groups">{groups.map(({ title, icon: Icon, ids }) => <section className="record-group" aria-label={title} key={title}><div className="record-group-heading"><span className="record-group-icon"><Icon size={27} strokeWidth={1.75} aria-hidden="true" /></span><h4>{title}</h4></div><div className="record-facts">{ids.map(id => { const fact = facts.find(item => item.id === id); return fact ? <Fact key={id} fact={fact} /> : null; })}</div></section>)}</div>
    <a className="source-link" href="https://njdep.maps.arcgis.com/sharing/rest/content/items/852937c223e94fcf8e167a23b500935d/info/metadata/metadata.xml?format=default&output=html" target="_blank" rel="noopener noreferrer">How NJGIN defines these record fields</a>
  </section>;
}
