import type { ReactNode } from "react";
import { Document, Font, Link, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { compareListingClaims } from "../analysis/comparisons";
import { evaluateFinance, type Result } from "../finance/engines";
import { estimateLabels, type StartingEstimate } from "../finance/starting-estimates";
import { matchReviewMessage } from "../property/match-review";
import type { FactEvidence } from "../property/types";
import type { ReportSnapshot } from "./snapshot";

const ink = "#252438", muted = "#62616c", coral = "#c83c29", violet = "#6944ce", line = "#dfdde4";
const styles = StyleSheet.create({
  page: { paddingTop: 68, paddingBottom: 56, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 9.5, lineHeight: 1.35, color: ink },
  header: { position: "absolute", top: 24, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: line, paddingBottom: 9 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: coral },
  headerLabel: { fontSize: 8, color: muted, maxWidth: 335, textAlign: "right" },
  footer: { position: "absolute", top: 748, left: 44, right: 44, height: 23, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: line, paddingTop: 9, fontSize: 8, lineHeight: 1.2, color: muted },
  pageNumber: { position: "absolute", top: 757, right: 44, width: 65, fontSize: 8, lineHeight: 1.2, color: muted, textAlign: "right" },
  kicker: { fontSize: 8, color: coral, letterSpacing: 1.2, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  title: { fontFamily: "Helvetica-Bold", fontSize: 24, lineHeight: 1.18, marginBottom: 10 },
  address: { fontFamily: "Helvetica-Bold", fontSize: 30, lineHeight: 1.15, marginBottom: 6 },
  subtitle: { color: muted, fontSize: 11, marginBottom: 14 },
  heading: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 15, marginBottom: 7 },
  paragraph: { marginBottom: 7, orphans: 2, widows: 2 },
  small: { color: muted, fontSize: 8, lineHeight: 1.3, marginBottom: 5 },
  notice: { borderLeftWidth: 3, borderLeftColor: coral, backgroundColor: "#fff3ee", padding: 11, marginVertical: 10 },
  noteTitle: { fontFamily: "Helvetica-Bold", marginBottom: 4 },
  grid: { flexDirection: "row", gap: 20 },
  column: { flex: 1, minWidth: 0 },
  overview: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderTopColor: line, marginTop: 18, marginBottom: 12 },
  metric: { width: "50%", paddingTop: 10, paddingBottom: 10, paddingRight: 16, borderBottomWidth: 1, borderBottomColor: line },
  metricLabel: { fontSize: 9, color: muted, marginBottom: 4 },
  metricValue: { fontSize: 17, fontFamily: "Helvetica-Bold", lineHeight: 1.15, marginBottom: 4 },
  metricNote: { fontSize: 8, color: muted },
  numbers: { flexDirection: "row", gap: 12, marginVertical: 12 },
  number: { flex: 1, backgroundColor: "#f5f3fa", padding: 12 },
  numberValue: { fontFamily: "Helvetica-Bold", fontSize: 16, marginVertical: 4 },
  table: { marginBottom: 12 },
  tableHead: { flexDirection: "row", backgroundColor: "#f2f0f5", borderBottomWidth: 1, borderBottomColor: line },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: line },
  cell: { paddingVertical: 5, paddingHorizontal: 7, fontSize: 9, lineHeight: 1.25 },
  headCell: { fontFamily: "Helvetica-Bold", fontSize: 8, color: muted },
  rowLabel: { flex: 1, paddingVertical: 6, paddingRight: 9, fontSize: 9, lineHeight: 1.25 },
  rowValue: { width: "44%", paddingVertical: 6, textAlign: "right", fontSize: 9, lineHeight: 1.25, fontFamily: "Helvetica-Bold" },
  link: { color: violet, textDecoration: "none" },
  ref: { color: violet, fontSize: 7.5 },
  contentsGrid: { flexDirection: "row", flexWrap: "wrap", columnGap: 20 },
  contents: { width: 252, flexDirection: "row", gap: 8, borderBottomWidth: 0.5, borderBottomColor: line, paddingVertical: 6 },
  listItem: { flexDirection: "row", gap: 8, marginBottom: 8 },
  listNumber: { width: 18, color: coral, fontFamily: "Helvetica-Bold" },
  listText: { flex: 1 },
  sourceNote: { paddingBottom: 7, marginBottom: 7, borderBottomWidth: 0.5, borderBottomColor: line },
  sourceLabel: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 4 },
  quote: { borderLeftWidth: 2, borderLeftColor: line, paddingLeft: 10, marginVertical: 7, color: muted },
});

// Keep complete words together in identifiers, addresses and source quotations.
Font.registerHyphenationCallback(word => [word]);
const clean = (value: string) => value.replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\u00a0|\u202f/g, " ").replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/≠/g, "!=");
const dollars = (value: number) => Number.isFinite(value) ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value) : "Invalid input";
const percent = (value: number) => `${Number((value * 100).toFixed(2))}%`;
const date = (value: string | null | undefined) => {
  if (!value) return "Not supplied";
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(parsed) + " ET" : "Not supplied";
};
function factValue(fact?: FactEvidence) {
  if (!fact || fact.value === null) return "Not available";
  return fact.format === "money" && typeof fact.value === "number" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(fact.value) : String(fact.value);
}
function amount(value: number | null, kind: "money" | "percent" | "number" = "money") {
  if (value === null) return "Unknown";
  if (!Number.isFinite(value) || value < 0 || (kind === "percent" && value > 1)) return "Invalid input";
  return kind === "percent" ? percent(value) : kind === "number" ? String(value) : dollars(value);
}
function Paragraph({ children, small = false }: { children: string; small?: boolean }) {
  return <Text style={small ? styles.small : styles.paragraph}>{clean(children)}</Text>;
}
function Heading({ children }: { children: string }) {
  return <Text style={styles.heading} minPresenceAhead={55}>{clean(children)}</Text>;
}
function Notice({ title, children }: { title: string; children: string }) {
  return <View style={styles.notice}><Text style={styles.noteTitle} minPresenceAhead={24}>{clean(title)}</Text><Text orphans={2} widows={2}>{clean(children)}</Text></View>;
}
function ReportPage({ report, exportedAt, section, title, id, children }: { report: ReportSnapshot; exportedAt: string; section: string; title: string; id: string; children: ReactNode }) {
  return <Page size="LETTER" style={styles.page} bookmark={title} wrap>
    <View fixed style={styles.header}><Text style={styles.brand}>BidWise.</Text><Text style={styles.headerLabel}>{clean(report.identity.address.split(",")[0])} / {section}</Text></View>
    <View fixed style={styles.footer}><Text>Property research / {date(exportedAt)}</Text></View>
    <Text fixed style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    <Text style={styles.kicker}>{section.toUpperCase()}</Text>
    <Text id={id} style={styles.title} minPresenceAhead={65}>{title}</Text>
    {children}
  </Page>;
}
type TableRow = (string | number)[];
function Table({ headings, widths, rows }: { headings: string[]; widths: number[]; rows: TableRow[] }) {
  // Bounded blocks move intact and repeat their headings. The longest table
  // (40 repair rows, each description limited to 120 characters) can span pages.
  const blocks = Array.from({ length: Math.max(1, Math.ceil(rows.length / 12)) }, (_, i) => rows.slice(i * 12, (i + 1) * 12));
  return <>{blocks.map((block, blockIndex) => <View key={blockIndex} style={styles.table} wrap={false}>
    <View style={styles.tableHead}>{headings.map((heading, i) => <Text key={i} style={[styles.cell, styles.headCell, { width: `${widths[i]}%`, textAlign: i ? "right" : "left" }]}>{heading}</Text>)}</View>
    {block.map((row, i) => <View key={i} style={styles.row}>{row.map((cell, j) => {
      const estimateRef = headings[j] === "Basis" ? String(cell).match(/E\d{2}$/)?.[0] : undefined;
      return <Text key={j} style={[styles.cell, { width: `${widths[j]}%`, textAlign: j ? "right" : "left", color: String(cell).startsWith("-$") ? coral : ink }]}>{estimateRef ? <Link src={`#estimate-${estimateRef}`} style={styles.link}>{clean(String(cell))}</Link> : clean(String(cell))}</Text>;
    })}</View>)}
  </View>)}</>;
}
function ResultStatus({ result }: { result: Result<unknown> }) {
  return result.status === "available" ? null : <Notice title={result.status === "invalid" ? "Correct invalid assumptions" : "Scenario incomplete"}>{`${result.status === "incomplete" ? "Missing required inputs: " : ""}${result.issues.join("; ")}. Unknown inputs have not been treated as zero.`}</Notice>;
}
const recordGroups = [
  { title: "Address & parcel", ids: ["property_address", "county", "municipality", "municipality_code", "parcel", "block", "lot", "qualifier", "old_property_id"] },
  { title: "Building & use", ids: ["class", "year_built", "building_description", "residential_units", "commercial_units", "building_class", "property_use", "facility"] },
  { title: "Land", ids: ["acreage", "land_description", "additional_lots_1", "additional_lots_2"] },
  { title: "Assessment & tax", ids: ["land_assessment", "building_assessment", "assessment", "historical_tax"] },
];
const historyIds = ["recorded_sale", "deed_date", "deed_book", "deed_page", "sale_code"];
const fractionFields = new Set(["renovation.contingency", "flip.buyerFraction", "flip.commissionFraction", "flip.sellerFraction", "flip.resaleDrop", "flip.extraSellerFraction", "rent.vacancy", "rent.management"]);
function estimateAmount(item: StartingEstimate, value = item.value) {
  return amount(value, fractionFields.has(item.field) ? "percent" : item.field.endsWith("Months") ? "number" : "money");
}
const kinds: Record<StartingEstimate["kind"], string> = { historical_record: "Historical record", copied_claim: "Copied claim", area_benchmark: "Older area benchmark", illustrative: "Illustrative assumption", model_allowance: "Provisional AI allowance" };
const claimLabels: Record<string, string> = { asking_price: "Purchase asking price", monthly_rent: "Advertised monthly rent", opening_bid: "Opening bid", judgment: "Judgment amount", bedrooms: "Bedrooms", bathrooms: "Bathrooms", interior_area: "Interior floor area", condition: "Condition claim", year_built: "Year built", residential_units: "Residential units" };
const comparisonLabels = { matches: "Agrees with record", differs: "Differs from record", cannot_verify: "Cannot verify", not_comparable: "Different kind of information" };
const recordRef = (facts: FactEvidence[], id: string) => `R${String(facts.findIndex(item => item.id === id) + 1).padStart(2, "0")}`;
function RecordGroup({ title, ids, facts }: { title: string; ids: string[]; facts: FactEvidence[] }) {
  const entries = ids.map(id => facts.find(item => item.id === id)).filter((item): item is FactEvidence => Boolean(item));
  if (!entries.length) return null;
  return <View><Heading>{title}</Heading>{entries.map(item => <View key={item.id} style={styles.row} wrap={false}><Text style={styles.rowLabel}>{clean(item.label)}</Text><Text style={styles.rowValue}>{clean(factValue(item))} <Link src={`#note-${item.id}`} style={styles.ref}>{recordRef(facts, item.id)}</Link></Text></View>)}</View>;
}

export function PropertyReportDocument({ report, exportedAt }: { report: ReportSnapshot; exportedAt: string }) {
  const { identity, records, flood, finance, analysis, starting } = report;
  const facts = records?.status === "available" ? records.data.facts : [];
  const fact = (id: string) => facts.find(item => item.id === id);
  const results = evaluateFinance(finance);
  const scenarioTotal = (result: Result<unknown>, value: string) => result.status === "available" ? value : result.status === "invalid" ? "Invalid inputs" : "Incomplete";
  const estimates = starting.data?.estimates ?? [];
  const touched = new Set(report.touchedFields);
  const ref = (id: string) => recordRef(facts, id);
  const basis = (field: string) => {
    const index = estimates.findIndex(item => item.field === field);
    const edited = touched.has(field === "renovation.allowance" ? "renovation.items" : field);
    return index < 0 ? edited ? "Your input" : "Entered / default" : `${edited ? "Edited / " : ""}E${String(index + 1).padStart(2, "0")}`;
  };
  const assumptionRows = (group: "rent" | "flip") => Object.entries(finance[group]).map(([key, value]) => {
    const field = `${group}.${key}` as keyof typeof estimateLabels;
    return [estimateLabels[field], amount(value, fractionFields.has(field) ? "percent" : key.endsWith("Months") ? "number" : "money"), basis(field)];
  });
  const pageProps = { report, exportedAt };
  const availableCount = facts.filter(item => item.value !== null).length;
  return <Document title={`BidWise property report - ${identity.address}`} author="BidWise" subject="Property records, editable cash scenarios and research limitations" language="en-US" creationDate={new Date(exportedAt)}>
    <ReportPage {...pageProps} section="01 / Overview" title="Property research report" id="overview">
      <Text style={styles.address}>{clean(identity.address.split(",")[0])}</Text>
      <Text style={styles.subtitle}>{clean(identity.address.split(",").slice(1).join(",").trim())}</Text>
      <Paragraph>{`Parcel ${identity.pin} | Block ${identity.block} | Lot ${identity.lot}${identity.qualifier ? ` | Unit ${identity.qualifier}` : ""}`}</Paragraph>
      <Paragraph small>{`Property selected for research: ${date(identity.checkedAt)}. A parcel match does not establish that the property is for sale.`}</Paragraph>
      {identity.matchReview && <Notice title="Property match needs review">{matchReviewMessage(identity)!}</Notice>}
      {report.sourceStale && <Notice title="Earlier source results retained">A refresh failed. Original records and retrieval times are included; these are not refreshed results.</Notice>}
      {(!records || !flood || starting.status === "sources" || starting.status === "model") && <Notice title="Some checks are still running">This PDF captures the report at download time. Pending source checks, starting values or analysis are not completed by exporting. Download again after they finish for an updated report.</Notice>}
      <View style={styles.overview}>{[
        ["Assessed value", factValue(fact("assessment")), "Tax assessment; not market value."],
        ["Historical property tax", factValue(fact("historical_tax")), "Tax year unverified; not a current bill."],
        ["Year built", factValue(fact("year_built")), "Reported construction year; condition unverified."],
        ["Property class", factValue(fact("class")), "Tax classification; approved use unverified."],
      ].map(([label, value, note]) => <View style={styles.metric} key={label} wrap={false}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{clean(value)}</Text><Text style={styles.metricNote}>{note}</Text></View>)}</View>
      <Heading>Your current scenarios</Heading>
      <View style={styles.numbers}>{[
        ["Base renovation", scenarioTotal(results.renovation, results.renovation.status === "available" ? dollars(results.renovation.data.base) : "")],
        ["Monthly rental cash", scenarioTotal(results.rent, results.rent.status === "available" ? dollars(results.rent.data.monthlyCash) : "")],
        ["Base resale profit", scenarioTotal(results.flip, results.flip.status === "available" ? dollars(results.flip.data.base.profit) : "")],
      ].map(([label, value]) => <View style={styles.number} key={label} wrap={false}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.numberValue, { color: value.startsWith("-$") ? coral : ink }]}>{value}</Text><Text style={styles.metricNote}>Cash assumptions / before income tax</Text></View>)}</View>
      <Paragraph small>Scenario outputs depend on entered assumptions. They are not a valuation, rent forecast or promised return. Blank inputs remain unknown; an entered zero is an explicit assumption.</Paragraph>
      <Heading>Report sections</Heading>
      <View style={styles.contentsGrid}>{[["02", "Property records", "records"], ["03", "Flood, history & copied claims", "screening"], ["04", "Renovation budget", "renovation"], ["05", "Cash rental scenario", "rental"], ["06", "Cash resale scenario", "resale"], ["07", "AI review & next checks", "analysis"], ["08", "Source notes & estimate basis", "sources"]].map(([n, label, target]) => <View key={n} style={styles.contents} wrap={false}><Text style={styles.ref}>{n}</Text><Link style={styles.link} src={`#${target}`}>{label}</Link></View>)}</View>
    </ReportPage>

    <ReportPage {...pageProps} section="02 / Public records" title="Property records" id="records">
      <Paragraph>{records?.status === "available" ? `${availableCount} of ${facts.length} record fields supplied by NJGIN / MOD-IV. Missing fields are shown explicitly. References R01 onward link to the record notes.` : records?.message ?? "Parcel records were still pending when this report was exported."}</Paragraph>
      {records?.status === "available" && <>
        <Paragraph small>{`Record publication: ${records.data.publicationDate ?? "Not supplied"} | Geometry updated: ${records.data.geometryDate ?? "Not supplied"} | Retrieved: ${date(records.data.fetchedAt)}. Publication does not establish the assessment or tax year.`}</Paragraph>
        <View style={styles.grid}><View style={styles.column}><RecordGroup {...recordGroups[0]} facts={facts} /><RecordGroup {...recordGroups[2]} facts={facts} /></View><View style={styles.column}><RecordGroup {...recordGroups[1]} facts={facts} /><RecordGroup {...recordGroups[3]} facts={facts} /></View></View>
        {facts.some(item => ![...recordGroups.flatMap(group => group.ids), ...historyIds].includes(item.id)) && <RecordGroup title="Additional returned fields" ids={facts.filter(item => ![...recordGroups.flatMap(group => group.ids), ...historyIds].includes(item.id)).map(item => item.id)} facts={facts} />}
      </>}
      <Notice title="Coverage limits">This source does not establish interior floor area, bedrooms, bathrooms, physical condition, current value, zoning permission, clear title or a complete transaction history.</Notice>
    </ReportPage>

    <ReportPage {...pageProps} section="03 / Evidence checks" title="Flood & recorded history" id="screening">
      <Heading>Flood screening / NJDEP & FEMA</Heading>
      {!flood ? <Paragraph>Flood screening was still pending at export.</Paragraph> : flood.status === "unavailable" ? <Notice title="Source unavailable">{flood.message}</Notice> : <>
        <Paragraph>{flood.data.status === "zones_returned" ? "Mapped flood zones returned at the address point:" : flood.data.status === "location_uncertain" ? "Location too approximate: flood screening withheld." : "No flood polygon was returned."}</Paragraph>
        {flood.data.zones.length > 0 && <Table headings={["Zone", "Source description", "Polygons"]} widths={[16, 68, 16]} rows={flood.data.zones.map(zone => [zone.zone, zone.subtype, zone.sourceMatches])} />}
        <Paragraph>{flood.data.caveat}</Paragraph>
        <Paragraph small>{`Retrieved: ${date(flood.data.fetchedAt)}. Mapping does not establish actual flood risk or insurance requirements.`}</Paragraph>
        <Link src={flood.data.sourceUrl} style={styles.link}>Open flood source</Link>
      </>}
      <RecordGroup title="Recorded transaction references" ids={historyIds} facts={facts} />
      <Paragraph small>Returned transaction records only; complete history, sale conditions and title have not been verified. Any interpreted deed year and its original source value are retained in the record notes.</Paragraph>
      {report.listing && <>
        <Heading>Copied-page claims / supplied by you</Heading>
        <Paragraph>Quoted claims are not independently verified records. No website was fetched.</Paragraph>
        <Text style={styles.quote}>{clean(report.listing.addressSnippet)}</Text>
        {compareListingClaims(report.listing.claims, records ?? { status: "unavailable", message: "Records pending" }).map((comparison, i) => <View key={i} style={styles.sourceNote}>
          <Text style={styles.sourceLabel} minPresenceAhead={35}>{claimLabels[comparison.claim.kind]}: {clean(comparison.claim.value)} / {comparisonLabels[comparison.status]}</Text>
          <Text style={styles.quote} orphans={2} widows={2}>{clean(comparison.claim.snippet)}</Text>
          <Paragraph>{comparison.explanation}</Paragraph>
          {comparison.officialFactId && fact(comparison.officialFactId) && <Link src={`#note-${comparison.officialFactId}`} style={styles.ref}>Comparison source: {ref(comparison.officialFactId)}</Link>}
        </View>)}
      </>}
    </ReportPage>

    <ReportPage {...pageProps} section="04 / Renovation" title="Renovation budget" id="renovation">
      <Paragraph>Quantity x unit cost, plus contingency and a separate reserve, each counted once. Condition and repair needs are unverified; obtain an inspection and contractor quotes.</Paragraph>
      <Table headings={["Repair / unit costs", "Quantity", "Low", "Base", "High"]} widths={[36, 13, 17, 17, 17]} rows={finance.renovation.items.map((item, i) => [item.label || `Repair ${i + 1}`, amount(item.quantity, "number"), amount(item.low), amount(item.base), amount(item.high)])} />
      <Table headings={["Additional allowance", "Current input", "Basis"]} widths={[56, 24, 20]} rows={[["Contingency on repair line totals", amount(finance.renovation.contingency, "percent"), basis("renovation.contingency")], ["Separate unknown-condition reserve", amount(finance.renovation.reserve), basis("renovation.reserve")]]} />
      <Paragraph small>{`Repair line basis: ${basis("renovation.allowance")}. Table entries are unit costs; totals below apply quantity, contingency and reserve.`}</Paragraph>
      <ResultStatus result={results.renovation} />
      {results.renovation.status === "available" && <><Heading>Total renovation budget</Heading><Table headings={["Low total", "Base total", "High total"]} widths={[34, 33, 33]} rows={[[dollars(results.renovation.data.low), dollars(results.renovation.data.base), dollars(results.renovation.data.high)]]} /></>}
    </ReportPage>

    <ReportPage {...pageProps} section="05 / Rental" title="Cash rental scenario" id="rental">
      <Paragraph>Recurring cash before income tax, without financing. Capital reserve is deducted after operating income. Purchase and renovation are separate upfront costs.</Paragraph>
      <ResultStatus result={results.rent} />
      {results.rent.status === "available" && <><Heading>Annual and monthly results</Heading><Table headings={["Measure", "Current result"]} widths={[74, 26]} rows={[
        ["Effective annual rent after vacancy", dollars(results.rent.data.effectiveAnnualRent)], ["Management expense (included in operating expenses)", dollars(results.rent.data.managementExpense)], ["Annual operating expenses", dollars(results.rent.data.operatingExpenses)], ["Annual operating income before capital reserve", dollars(results.rent.data.annualOperatingIncome)], ["Separate annual capital reserve", dollars(results.rent.data.annualCapitalReserve)], ["Annual cash after modeled expenses and reserve", dollars(results.rent.data.annualCash)], ["Monthly cash after modeled expenses and reserve", dollars(results.rent.data.monthlyCash)],
      ]} /></>}
      <Heading>Current rental assumptions</Heading>
      <Table headings={["Assumption", "Current input", "Basis"]} widths={[56, 24, 20]} rows={assumptionRows("rent")} />
      <Paragraph small>{`Shared acquisition context: proposed purchase ${amount(finance.flip.purchase)}; base renovation ${results.renovation.status === "available" ? dollars(results.renovation.data.base) : "Incomplete"}. Other acquisition costs may apply.`}</Paragraph>
      <Paragraph small>E references identify original starting values in the estimate notes. Edited inputs above are the current scenario amounts; the earlier starting values are preserved only as their basis.</Paragraph>
    </ReportPage>

    <ReportPage {...pageProps} section="06 / Resale" title="Cash resale scenario" id="resale">
      <Paragraph>One-time cash project before income tax. Downside uses high renovation, reduced resale, extra holding months and additional seller costs. Scenario maximum bids are not valuations or bidding recommendations.</Paragraph>
      <ResultStatus result={results.flip} />
      {results.flip.status === "available" && <>
        <Heading>Base and Downside comparison</Heading>
        <Table headings={["Measure", "Base", "Downside"]} widths={[48, 26, 26]} rows={[
          ["Assumed sale price", dollars(results.flip.data.base.resale), dollars(results.flip.data.downside.resale)],
          ["Holding months", String(results.flip.data.base.holdMonths), String(results.flip.data.downside.holdMonths)],
          ["Renovation used", dollars(results.flip.data.base.renovation), dollars(results.flip.data.downside.renovation)],
          ["Project cost before selling", dollars(results.flip.data.base.projectCost), dollars(results.flip.data.downside.projectCost)],
          ["Selling costs", dollars(results.flip.data.base.sellingCosts), dollars(results.flip.data.downside.sellingCosts)],
          ["One-time profit before income tax", dollars(results.flip.data.base.profit), dollars(results.flip.data.downside.profit)],
          ["ROI on project cost", ...[results.flip.data.base, results.flip.data.downside].map(item => item.roi === null ? "Unavailable: zero cost" : percent(item.roi))],
          ["Break-even sale price", dollars(results.flip.data.base.breakEven), dollars(results.flip.data.downside.breakEven)],
          ["Scenario maximum bid", ...[results.flip.data.base, results.flip.data.downside].map(item => item.maxBid === null ? "No nonnegative bid meets target" : dollars(item.maxBid))],
          ["Maximum bid minus proposed purchase", ...[results.flip.data.base, results.flip.data.downside].map(item => item.bidDifference === null ? "Not applicable" : dollars(item.bidDifference))],
        ]} />
      </>}
      {results.flip.status === "available" && <><Heading>Profit sensitivity to assumed resale</Heading><Paragraph small>Scenario prices, not predictions. Base costs stay fixed.</Paragraph><Table headings={["Assumed resale price", "Profit before income tax"]} widths={[55, 45]} rows={results.flip.data.sensitivity.map(row => [dollars(row.resale), dollars(row.profit)])} /></>}
    </ReportPage>

    <ReportPage {...pageProps} section="06 / Resale assumptions" title="Resale inputs & stress test" id="resale-inputs">
      <Paragraph>These current inputs feed the Base and Downside results. E references link to the original starting-value basis; edited inputs remain your current scenario assumptions.</Paragraph>
      <Heading>Current resale assumptions</Heading>
      <Table headings={["Assumption", "Current input", "Basis"]} widths={[56, 24, 20]} rows={assumptionRows("flip").filter((_, i) => i < 10)} />
      <Heading>Downside stress assumptions</Heading>
      <Paragraph small>Downside starts with the high renovation total, then applies these additional stresses. These are editable assumptions, not regional forecasts.</Paragraph>
      <Table headings={["Additional stress", "Current input", "Basis"]} widths={[56, 24, 20]} rows={assumptionRows("flip").filter((_, i) => i >= 10)} />
      <Notice title="Scenario maximum bid">The maximum bid solves for your target profit under these assumptions. It does not establish market value, funding availability, legal eligibility or an amount you should bid.</Notice>
    </ReportPage>

    <ReportPage {...pageProps} section="07 / Interpretation & next checks" title="AI review & next checks" id="analysis">
      <Paragraph>AI interpretation can be wrong. Review the linked record notes and scenario inputs. It does not establish condition, clear title, current value or a promised return.</Paragraph>
      {analysis.status === "available" ? <>
        {report.analysisOutdated && <Notice title="AI analysis is outdated">Financial assumptions changed after this explanation was generated. The scenarios in this PDF use current inputs; this earlier interpretation requires a refresh before relying on its numbers.</Notice>}
        <Paragraph small>{`${analysis.provider ? `${analysis.provider} / ` : ""}${analysis.model}${analysis.fallbackFrom ? ` / Fallback after ${analysis.fallbackFrom} service failures` : ""} | Generated: ${date(analysis.generatedAt)}`}</Paragraph>
        <Heading>{"BidWise's take"}</Heading><Paragraph>{analysis.summary}</Paragraph>
        {analysis.findings.length > 0 && <Heading>What drives this view</Heading>}
        {analysis.findings.map((finding, i) => <View key={i} style={styles.sourceNote}><Paragraph>{finding.explanation}</Paragraph><Text style={styles.small}>Evidence: {finding.evidenceIds.map((id, j) => {
          const factId = id.replace(/_caveat$/, "");
          if (fact(factId)) return <Link key={j} src={`#note-${factId}`} style={styles.ref}>{`${j ? "; " : ""}${fact(factId)!.label} (${ref(factId)})`}</Link>;
          const target = id.startsWith("rent_") ? "rental" : id.startsWith("flip_") ? "resale" : id.startsWith("renovation") ? "renovation" : id.startsWith("listing_") || id === "flood" ? "screening" : "sources";
          const label = target === "sources" ? "Source context and limits" : target === "screening" ? "Flood / copied claims" : `${target[0].toUpperCase()}${target.slice(1)} assumptions and results`;
          return <Link key={j} src={`#${target}`} style={styles.ref}>{`${j ? "; " : ""}${label}`}</Link>;
        })}</Text></View>)}
        {analysis.unansweredQuestions.length > 0 && <><Heading>Recommended next steps</Heading>{analysis.unansweredQuestions.map((question, i) => <View key={i} style={styles.listItem}><Text style={styles.listNumber}>{i + 1}.</Text><Text style={styles.listText} orphans={2} widows={2}>{clean(question)}</Text></View>)}</>}
        {analysis.consistencyFlags.length > 0 && <Notice title="Needs review">{analysis.consistencyFlags.join("\n")}</Notice>}
      </> : <Notice title={analysis.status === "loading" ? "AI review pending" : "AI review unavailable"}>{analysis.message ?? "No completed AI interpretation was available when this report was exported. The source evidence and current scenario inputs remain included."}</Notice>}
      <Heading>Before you buy / not checked by BidWise</Heading>
      {[
        ["Physical condition", "Obtain an inspection, access and contractor quotes."],
        ["Title, liens and ownership", "Have a qualified professional review title, liens and the recorded deed."],
        ["Occupancy and possession", "Verify occupancy, legal access, possession timing and costs."],
        ["Current taxes and insurance", "Obtain the current bill, reassessment information and property-specific coverage quotes."],
        ["Sale or auction terms", "Review deposits, deadlines, legal obligations and the complete transaction documents."],
        ["Use, permits and other hazards", "Check zoning, open permits, rental licensing, environmental and structural risks."],
      ].map(([title, detail], i) => <View key={title} style={styles.listItem} wrap={false}><Text style={styles.listNumber}>{i + 1}.</Text><View style={styles.listText}><Text style={styles.sourceLabel}>{title}</Text><Text>{detail}</Text></View></View>)}
    </ReportPage>

    <ReportPage {...pageProps} section="08 / Source notes" title="Record notes & sources" id="sources">
      <Paragraph>R references preserve the source caveat, any original raw value, publication date and retrieval time for every returned field, including missing fields. Source links open the underlying record query.</Paragraph>
      {facts.length ? facts.map(item => <View key={item.id} style={styles.sourceNote} wrap={false}>
        <Text id={`note-${item.id}`} style={styles.sourceLabel} minPresenceAhead={40}>{ref(item.id)} / {clean(item.label)} / {clean(factValue(item))}</Text>
        <Paragraph>{item.caveat}</Paragraph>
        {item.rawValue !== undefined && <Paragraph small>{`Original source value: ${item.rawValue}`}</Paragraph>}
        <Text style={styles.small}>Published: {item.sourceDate ?? "Not supplied"} | Retrieved: {date(item.fetchedAt)} | <Link src={item.sourceUrl} style={styles.link}>NJGIN / MOD-IV source record</Link></Text>
      </View>) : <Paragraph>{records?.status === "unavailable" ? records.message : "No parcel record fields were available at export."}</Paragraph>}
    </ReportPage>

    <ReportPage {...pageProps} section="08 / Estimate notes" title="Starting-value basis" id="estimate-notes">
      <Paragraph>E references describe the original starting values, not a replacement for your current edited inputs. All starting values have low confidence. Survey margins describe area medians; planning ranges are provisional assumptions, not property prediction intervals.</Paragraph>
      {starting.data?.modelSnapshot && <Paragraph small>{`AI estimate set generated: ${date(starting.data.modelSnapshot.generatedAt)}. ${starting.data.modelSnapshot.reused ? "Reused saved estimate set." : "Saved estimate set."}`}</Paragraph>}
      {starting.message && <Notice title="Starting-value status">{starting.message}</Notice>}
      {starting.data?.message && <Notice title="Estimate coverage">{starting.data.message}</Notice>}
      {!estimates.length && <Paragraph>No starting estimates were available at export. Current entered values appear in the scenario tables; missing inputs remain unknown.</Paragraph>}
      {estimates.map((item, i) => <View key={item.field} style={styles.sourceNote} wrap={false}>
        <Text id={`estimate-E${String(i + 1).padStart(2, "0")}`} style={styles.sourceLabel} minPresenceAhead={40}>{`E${String(i + 1).padStart(2, "0")} / ${estimateLabels[item.field]} / ${estimateAmount(item)}`}</Text>
        <Paragraph small>{`${kinds[item.kind]} / Low confidence${touched.has(item.field === "renovation.allowance" ? "renovation.items" : item.field) ? " / Edited by you: see current scenario table" : ""}${item.rangeKind === "none" ? "" : ` / ${item.rangeKind === "survey_moe" ? "Area median margin of error" : "Planning range"}: ${estimateAmount(item, item.low)} to ${estimateAmount(item, item.high)}`}`}</Paragraph>
        <Paragraph>{item.explanation}</Paragraph>
        <Text style={styles.small}>{clean(item.sourceLabel)} | Data date: {item.sourceDate ?? "Not supplied"} | Checked: {date(item.checkedAt)}{item.sourceUrl && <> | <Link src={item.sourceUrl} style={styles.link}>Open estimate source</Link></>}</Text>
      </View>)}
      {Boolean(starting.data?.gaps.length) && <><Heading>Still needs evidence or your choice</Heading>{starting.data!.gaps.map((gap, i) => <Paragraph key={i}>{`${i + 1}. ${gap}`}</Paragraph>)}</>}
      <Heading>About this snapshot</Heading>
      <Paragraph>This report reflects the evidence and editable inputs available at download time. Exporting does not retrieve new data, run another AI analysis or verify copied claims. Environmental, structural, zoning, licensing, title, occupancy and current tax checks require separate evidence. A deed reference is not proof of clear title.</Paragraph>
    </ReportPage>
  </Document>;
}

export async function generatePropertyPdf(report: ReportSnapshot, exportedAt: string): Promise<Blob> {
  return pdf(<PropertyReportDocument report={report} exportedAt={exportedAt} />).toBlob();
}
