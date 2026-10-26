"use client";
import { useEffect, useId, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { ArrowUpRight, Calculator, House, Plus, Wrench } from "lucide-react";
import { estimateKindLabel } from "./StartingEstimates";
import { FieldInfo } from "./FieldInfo";
import type { StartingEstimate } from "@/lib/finance/starting-estimates";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { evaluateFinance, type FinanceInputs, type FlipCase, type Result } from "@/lib/finance/engines";
const dollars = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const scenarioTabs = [
  { id: "renovation", label: "Renovation", title: "renovation-title", Icon: Wrench },
  { id: "rental", label: "Rental", title: "rent-title", Icon: House },
  { id: "resale", label: "Resale", title: "resale-title", Icon: ArrowUpRight },
] as const;
type ScenarioTab = typeof scenarioTabs[number]["id"];
const scenarioFromHash = (hash: string) => scenarioTabs.find(tab => `#${tab.title}` === hash || (tab.id === "resale" && hash === "#flip-title"));
const subscribeToPrint = (notify: () => void) => {
  const media = window.matchMedia("print");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
function NumberField({ label, value, onChange, percent = false, help, estimate, edited }: { estimate?: StartingEstimate; edited?: boolean; label: string; value: number | null; onChange: (value: number | null) => void; percent?: boolean; help?: string }) {
  const id = useId();
  const error = value !== null && (!Number.isFinite(value) || value < 0 || (percent && value > 1))
    ? percent ? "Use a percentage from 0 to 100." : "Use zero or a positive amount." : null;
  const describedBy = [estimate && `${id}-origin`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return <div className="scenario-field"><div className="scenario-field-heading"><label htmlFor={id}>{label}{percent ? " (%)" : ""}</label>{(help || estimate) && <FieldInfo label={label} help={help} estimate={estimate} edited={edited} />}</div><input id={id} type="number" inputMode="decimal" min="0" max={percent ? "100" : undefined} step="any" value={value === null ? "" : percent ? Number((value * 100).toPrecision(15)) : value} onChange={event => onChange(event.target.value === "" ? null : Number(event.target.value) / (percent ? 100 : 1))} aria-invalid={Boolean(error)} aria-describedby={describedBy} placeholder="Unknown" />{error && <small className="field-error" id={`${id}-error`}>{error}</small>}{estimate && <small className="estimate-field-note" id={`${id}-origin`}>{edited ? "Edited by you · " : ""}{estimateKindLabel(estimate)}</small>}</div>;
}
function Status({ result }: { result: Result<unknown> }) {
  if (result.status === "available") return null;
  return <div className={`notice ${result.status === "invalid" ? "notice-error" : ""}`} role="status"><strong>{result.status === "invalid" ? "Correct these assumptions" : "Scenario incomplete"}</strong><p>{result.status === "incomplete" ? "Fill every required field, or enter 0 when you explicitly assume no cost. " : ""}{result.issues.join(" · ")}</p></div>;
}
function CaseResults({ title, result }: { title: string; result: FlipCase }) {
  return <section className="case-result" aria-label={`${title} resale results`}><h4>{title}</h4><p className="case-caption">Assumed sale {dollars(result.resale)} · {result.holdMonths} holding months · renovation {dollars(result.renovation)}</p><dl className="result-list"><div className={result.profit < 0 ? "negative-result" : ""}><dt>One-time profit before income tax</dt><dd>{dollars(result.profit)}</dd></div><div><dt>Project cost before selling</dt><dd>{dollars(result.projectCost)}</dd></div><div><dt>Selling costs</dt><dd>{dollars(result.sellingCosts)}</dd></div><div><dt>ROI on project cost</dt><dd>{result.roi === null ? "Unavailable: zero project cost" : `${(result.roi * 100).toFixed(1)}%`}</dd></div><div><dt>Break-even sale price</dt><dd>{dollars(result.breakEven)}</dd></div><div><dt>Scenario maximum bid</dt><dd>{result.maxBid === null ? "No nonnegative bid meets the target" : dollars(result.maxBid)}</dd></div><div><dt>Maximum bid minus proposed purchase</dt><dd>{result.bidDifference === null ? "Not applicable" : dollars(result.bidDifference)}</dd></div></dl><small>Scenario bid only; not a market value or bidding recommendation.</small></section>;
}
export function FinanceWorkspace({ value, onChange, estimates = [], touched = new Set<string>(), startingPanel }: { startingPanel?: ReactNode; value: FinanceInputs; onChange: (value: FinanceInputs) => void; estimates?: StartingEstimate[]; touched?: ReadonlySet<string> }) {
  const [activeTab, setActiveTab] = useState<ScenarioTab>(() => typeof window === "undefined" ? "renovation" : scenarioFromHash(window.location.hash)?.id ?? "renovation");
  const isPrinting = useSyncExternalStore(subscribeToPrint, () => window.matchMedia("print").matches, () => false);
  useEffect(() => {
    let frame = 0;
    const scrollToScenario = () => {
      const tab = scenarioFromHash(window.location.hash);
      if (!tab) return;
      const heading = document.getElementById(tab.title);
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "start" });
    };
    const revealScenario = () => {
      const tab = scenarioFromHash(window.location.hash);
      if (!tab) return;
      setActiveTab(tab.id);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scrollToScenario);
    };
    if (scenarioFromHash(window.location.hash)) frame = requestAnimationFrame(scrollToScenario);
    window.addEventListener("hashchange", revealScenario);
    return () => { window.removeEventListener("hashchange", revealScenario); cancelAnimationFrame(frame); };
  }, []);
  const selectTab = (tab: typeof scenarioTabs[number]) => {
    setActiveTab(tab.id);
    window.history.replaceState(window.history.state, "", `#${tab.title}`);
  };
  const navigateTabs = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === "ArrowRight" ? (index + 1) % scenarioTabs.length
      : event.key === "ArrowLeft" ? (index + scenarioTabs.length - 1) % scenarioTabs.length
      : event.key === "Home" ? 0 : event.key === "End" ? scenarioTabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    selectTab(scenarioTabs[next]);
    document.getElementById(`${scenarioTabs[next].id}-tab`)?.focus();
  };
  const results = evaluateFinance(value);
  const origin = (field: string) => ({ estimate: estimates.find(item => item.field === field), edited: touched.has(field) });
  const patchFlip = (key: keyof FinanceInputs["flip"], next: number | null) => onChange({ ...value, flip: { ...value.flip, [key]: next } });
  const patchRent = (key: keyof FinanceInputs["rent"], next: number | null) => onChange({ ...value, rent: { ...value.rent, [key]: next } });
  const flipFields: { key: keyof FinanceInputs["flip"]; label: string; percent?: boolean; help: string }[] = [
    { key: "purchase", label: "Proposed cash purchase price", help: "Your proposed price, not an assessment, opening bid or judgment." },
    { key: "buyerFraction", label: "Buyer closing costs", percent: true, help: "Percentage of purchase; exclude costs entered as fixed amounts." },
    { key: "buyerFixed", label: "Fixed buyer costs", help: "Additional dollar costs, counted once." },
    { key: "resale", label: "Assumed resale price", help: "Editable scenario price. An area-benchmark prefill is not a current valuation or a renovation-uplift forecast." },
    { key: "holdMonths", label: "Holding months", help: "Purchase through resale; fractional months are allowed." },
    { key: "monthlyCarry", label: "Monthly holding cost", help: "Include modeled tax, insurance, utilities and other carry; no debt service." },
    { key: "commissionFraction", label: "Selling commission", percent: true, help: "Assumed percentage of the resale price." },
    { key: "sellerFraction", label: "Other seller costs", percent: true, help: "Additional percentage of resale; exclude commission." },
    { key: "sellerFixed", label: "Fixed seller costs", help: "Additional dollar costs at sale." },
    { key: "targetProfit", label: "Target one-time profit", help: "Used to solve the scenario maximum bid; not a promised return." },
  ];
  const rentFields: { key: keyof FinanceInputs["rent"]; label: string; percent?: boolean; help: string }[] = [
    { key: "monthlyRent", label: "Expected monthly rent", help: "Editable rent assumption. An area-benchmark prefill is a dated median per dwelling, not a current rent forecast." },
    { key: "vacancy", label: "Vacancy and lost rent", percent: true, help: "Share of potential rent lost to vacancy or nonpayment." },
    { key: "annualTax", label: "Annual property-tax assumption", help: "Verify the current bill; historical recorded tax is not a forecast." },
    { key: "annualInsurance", label: "Annual insurance", help: "Use a property-specific quote when available." },
    { key: "annualUtilities", label: "Annual owner-paid utilities", help: "Only costs paid by the owner; enter 0 explicitly if none." },
    { key: "annualHoa", label: "Annual HOA or association cost", help: "Enter 0 explicitly if not applicable." },
    { key: "annualMaintenance", label: "Annual routine maintenance", help: "Routine upkeep, separate from major capital repairs." },
    { key: "management", label: "Management share of collected rent", percent: true, help: "Applied to effective rent after vacancy, not scheduled rent." },
    { key: "annualCapitalReserve", label: "Annual capital-repair reserve", help: "Separate allowance for major future repairs, deducted once after operating income." },
  ];
  return <section className="finance-workspace" aria-labelledby="finance-title" id="scenarios"><div className="report-heading"><h2 id="finance-title" className="section-title"><Calculator size={26} aria-hidden="true" />Explore the numbers.</h2></div><p className="finance-intro">Cash only · USD · Before income tax. Blank means unknown; enter 0 only for no cost.</p>
    <details className="scenario-guide"><summary>How these scenarios work</summary><p>Your edits stay on this page until reload and are sent to the AI provider for analysis. Changing an input marks earlier AI commentary outdated.</p><p>Renovation totals include quantity × unit cost, contingency and the separate reserve, each counted once. Purchase and renovation are upfront costs, not annual rental expenses.</p><p>Prices, rent and maximum bids are scenarios based on your inputs, not valuations or recommendations. Closing costs, initial vacancy, possession costs and other missing expenses still need review.</p></details>
    {startingPanel}
    <div className="scenario-tabs" role="tablist" aria-label="Scenarios">{scenarioTabs.map((tab, index) => <button key={tab.id} type="button" role="tab" id={`${tab.id}-tab`} aria-controls={`${tab.id}-panel`} aria-selected={activeTab === tab.id} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => selectTab(tab)} onKeyDown={event => navigateTabs(event, index)}><tab.Icon size={18} aria-hidden="true" />{tab.label}</button>)}</div>
    <section className="finance-section" role="tabpanel" id="renovation-panel" aria-labelledby="renovation-tab" hidden={!isPrinting && activeTab !== "renovation"} tabIndex={0}><div className="section-heading"><h3 id="renovation-title" className="section-title" tabIndex={-1}><Wrench size={20} aria-hidden="true" />Renovation budget</h3></div><p className="muted">Condition and repair needs are unverified. Use contractor quotes when available.</p>
      <div className="repair-rows">{value.renovation.items.map((item, index) => <fieldset className="repair-row" key={index}><legend>Repair {index + 1}</legend><div className="repair-fields"><div className="scenario-field"><label htmlFor={`repair-name-${index}`}>Repair description {index + 1}</label><input id={`repair-name-${index}`} value={item.label} maxLength={120} onChange={event => onChange({ ...value, renovation: { ...value.renovation, items: value.renovation.items.map((row, i) => i === index ? { ...row, label: event.target.value } : row) } })} /></div>{([['quantity', 'Quantity', 'Number of units for this repair line.'], ['low', 'Low unit cost', 'Lowest assumed cost per unit for this repair.'], ['base', 'Base unit cost', 'Expected planning cost per unit for this repair.'], ['high', 'High unit cost', 'Highest assumed cost per unit for this repair.']] as const).map(([key, label, help]) => <NumberField key={key} label={`${label} ${index + 1}`} help={help} {...(index === 0 ? { estimate: estimates.find(item => item.field === "renovation.allowance"), edited: touched.has("renovation.items") } : {})} value={item[key]} onChange={next => onChange({ ...value, renovation: { ...value.renovation, items: value.renovation.items.map((row, i) => i === index ? { ...row, [key]: next } : row) } })} />)}<button type="button" className="text-button" aria-label={`Remove repair ${index + 1}`} onClick={() => onChange({ ...value, renovation: { ...value.renovation, items: value.renovation.items.filter((_, i) => i !== index) } })}>Remove</button></div></fieldset>)}</div>
      <button type="button" className="secondary-button" disabled={value.renovation.items.length >= 40} onClick={() => onChange({ ...value, renovation: { ...value.renovation, items: [...value.renovation.items, { label: "", quantity: null, low: null, base: null, high: null }] } })}><Plus size={16} aria-hidden="true" />Add repair line</button>
      <div className="scenario-fields allowances"><NumberField label="Renovation contingency" percent {...origin("renovation.contingency")} value={value.renovation.contingency} onChange={next => onChange({ ...value, renovation: { ...value.renovation, contingency: next } })} help="Added to line-item totals for overruns." /><NumberField label="Unknown-condition reserve" {...origin("renovation.reserve")} value={value.renovation.reserve} onChange={next => onChange({ ...value, renovation: { ...value.renovation, reserve: next } })} help="Separate dollar allowance, added once after contingency." /></div>
      <Status result={results.renovation} />{results.renovation.status === "available" && <dl className="renovation-totals">{(["low", "base", "high"] as const).map(key => <div key={key}><dt>{key[0].toUpperCase() + key.slice(1)} renovation total</dt><dd>{dollars(results.renovation.status === "available" ? results.renovation.data[key] : 0)}</dd></div>)}</dl>}
    </section>
    <section className="finance-section" role="tabpanel" id="rental-panel" aria-labelledby="rental-tab" hidden={!isPrinting && activeTab !== "rental"} tabIndex={0}><div className="section-heading"><h3 id="rent-title" className="section-title" tabIndex={-1}><House size={20} aria-hidden="true" />Basic cash rental scenario</h3></div><div className="scenario-fields">{rentFields.map(field => <NumberField key={field.key} label={field.label} percent={field.percent} help={field.help} {...origin(`rent.${field.key}`)} value={value.rent[field.key]} onChange={next => patchRent(field.key, next)} />)}</div><Status result={results.rent} />{results.rent.status === "available" && <dl className="result-list rental-results"><div><dt>Effective annual rent after vacancy</dt><dd>{dollars(results.rent.data.effectiveAnnualRent)}</dd></div><div><dt>Management expense included below</dt><dd>{dollars(results.rent.data.managementExpense)}</dd></div><div><dt>Annual operating expenses</dt><dd>{dollars(results.rent.data.operatingExpenses)}</dd></div><div><dt>Annual operating income before capital reserve</dt><dd>{dollars(results.rent.data.annualOperatingIncome)}</dd></div><div><dt>Separate annual capital reserve</dt><dd>{dollars(results.rent.data.annualCapitalReserve)}</dd></div><div className={results.rent.data.annualCash < 0 ? "negative-result" : ""}><dt>Annual cash after modeled expenses and reserve</dt><dd>{dollars(results.rent.data.annualCash)}</dd></div><div className={results.rent.data.monthlyCash < 0 ? "negative-result" : ""}><dt>Monthly cash after modeled expenses and reserve</dt><dd>{dollars(results.rent.data.monthlyCash)}</dd></div></dl>}
      <div className="rental-context"><h4>Shared acquisition context</h4><p>Proposed purchase: {value.flip.purchase === null ? "not entered" : dollars(value.flip.purchase)} · Base renovation: {results.renovation.status === "available" ? dollars(results.renovation.data.base) : "incomplete"}</p><small>Upfront costs are separate from annual cash flow; other acquisition costs may apply.</small><a href="#resale-title">Edit purchase assumptions</a></div>
    </section>
    <section className="finance-section" role="tabpanel" id="resale-panel" aria-labelledby="resale-tab" hidden={!isPrinting && activeTab !== "resale"} tabIndex={0}><div className="section-heading"><h3 id="resale-title" className="section-title" tabIndex={-1}><ArrowUpRight size={20} aria-hidden="true" />Cash resale scenario</h3></div><div className="scenario-fields">{flipFields.map(field => <NumberField key={field.key} label={field.label} percent={field.percent} help={field.help} {...origin(`flip.${field.key}`)} value={value.flip[field.key]} onChange={next => patchFlip(field.key, next)} />)}</div>
      <details className="downside-inputs"><summary>Edit Downside stress assumptions</summary><p>Starts with high renovation costs. Defaults below are illustrative stresses, not regional forecasts.</p><div className="scenario-fields"><NumberField label="Downside resale reduction" percent value={value.flip.resaleDrop} onChange={next => patchFlip("resaleDrop", next)} /><NumberField label="Downside extra holding months" value={value.flip.extraMonths} onChange={next => patchFlip("extraMonths", next)} /><NumberField label="Downside extra seller percentage points" percent value={value.flip.extraSellerFraction} onChange={next => patchFlip("extraSellerFraction", next)} /></div></details>
      <Status result={results.flip} />{results.flip.status === "available" && <><div className="case-grid"><CaseResults title="Base" result={results.flip.data.base} /><CaseResults title="Downside" result={results.flip.data.downside} /></div><section className="sensitivity" aria-labelledby="sensitivity-title"><h4 id="sensitivity-title">Profit as your resale assumption changes</h4><p>Scenario prices, not predictions. Base costs stay fixed.</p>{activeTab === "resale" && !isPrinting && <div className="sensitivity-chart"><ResponsiveContainer width="100%" height={260} minWidth={0}><LineChart data={results.flip.data.sensitivity} accessibilityLayer aria-label="Base resale profit sensitivity chart"><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="resale" tickFormatter={value => `$${Math.round(Number(value) / 1000)}k`} /><YAxis tickFormatter={value => `$${Math.round(Number(value) / 1000)}k`} width={75} /><Tooltip formatter={value => dollars(Number(value))} labelFormatter={value => `Assumed resale ${dollars(Number(value))}`} /><ReferenceLine y={0} stroke="#dc462f" /><Line type="linear" dataKey="profit" name="One-time profit" stroke="#6944ce" strokeWidth={3} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>}<table><caption>Base resale sensitivity — assumed prices and one-time profit</caption><thead><tr><th scope="col">Assumed resale price</th><th scope="col">Profit before income tax</th></tr></thead><tbody>{results.flip.data.sensitivity.map((row, i) => <tr key={i}><td>{dollars(row.resale)}</td><td>{dollars(row.profit)}</td></tr>)}</tbody></table></section></>}
    </section>
  </section>;
}
