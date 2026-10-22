import { z } from "zod";
const money = z.number().finite().nonnegative().nullable();
const fraction = z.number().finite().min(0).max(1).nullable();
export const renovationSchema = z.object({
  items: z.array(z.object({ label: z.string().max(120), quantity: money, low: money, base: money, high: money })).max(40),
  contingency: fraction, reserve: money,
});
export const flipSchema = z.object({ purchase: money, buyerFraction: fraction, buyerFixed: money, holdMonths: money, monthlyCarry: money, resale: money, commissionFraction: fraction, sellerFraction: fraction, sellerFixed: money, targetProfit: money, resaleDrop: fraction, extraMonths: money, extraSellerFraction: fraction });
export const rentSchema = z.object({ monthlyRent: money, vacancy: fraction, annualTax: money, annualInsurance: money, annualUtilities: money, annualHoa: money, annualMaintenance: money, management: fraction, annualCapitalReserve: money });
export const financeSchema = z.object({ renovation: renovationSchema, flip: flipSchema, rent: rentSchema });
export type FinanceInputs = z.infer<typeof financeSchema>;
export type RenovationInputs = FinanceInputs["renovation"];
export type FlipInputs = FinanceInputs["flip"];
export type RentInputs = FinanceInputs["rent"];
export type Result<T> = { status: "available"; data: T } | { status: "incomplete" | "invalid"; issues: string[] };
export type RenovationTotals = { low: number; base: number; high: number };
export type FlipCase = { projectCost: number; sellingCosts: number; profit: number; roi: number | null; breakEven: number; maxBid: number | null; bidDifference: number | null; resale: number; holdMonths: number; renovation: number; sellerFees: number };
export type FlipResults = { base: FlipCase; downside: FlipCase; sensitivity: { resale: number; profit: number }[] };
export type RentResults = { effectiveAnnualRent: number; managementExpense: number; operatingExpenses: number; annualOperatingIncome: number; annualCapitalReserve: number; annualCash: number; monthlyCash: number };
export function emptyFinance(): FinanceInputs {
  return { renovation: { items: [{ label: "Repairs", quantity: null, low: null, base: null, high: null }], contingency: null, reserve: null },
    flip: { purchase: null, buyerFraction: null, buyerFixed: null, holdMonths: null, monthlyCarry: null, resale: null, commissionFraction: null, sellerFraction: null, sellerFixed: null, targetProfit: null, resaleDrop: .1, extraMonths: 3, extraSellerFraction: .01 },
    rent: { monthlyRent: null, vacancy: null, annualTax: null, annualInsurance: null, annualUtilities: null, annualHoa: null, annualMaintenance: null, management: null, annualCapitalReserve: null } };
}
const invalid = (issues: string[]): { status: "invalid"; issues: string[] } => ({ status: "invalid", issues });
const labels: Record<string, string> = { purchase: "Proposed purchase price", buyerFraction: "Buyer closing percentage", buyerFixed: "Fixed buyer costs", holdMonths: "Holding months", monthlyCarry: "Monthly holding cost", resale: "Assumed resale price", commissionFraction: "Selling commission", sellerFraction: "Other seller percentage", sellerFixed: "Fixed seller costs", targetProfit: "Target profit", resaleDrop: "Downside resale reduction", extraMonths: "Extra holding months", extraSellerFraction: "Extra seller percentage", monthlyRent: "Expected monthly rent", vacancy: "Vacancy and lost rent", annualTax: "Annual property tax", annualInsurance: "Annual insurance", annualUtilities: "Annual utilities", annualHoa: "Annual HOA", annualMaintenance: "Annual routine maintenance", management: "Management percentage", annualCapitalReserve: "Annual capital reserve", contingency: "Contingency", reserve: "Unknown-condition reserve", quantity: "Quantity", low: "Low unit cost", base: "Base unit cost", high: "High unit cost" };
const fieldLabel = (key: string) => labels[key] ?? key;
function schemaIssues(error: z.ZodError) { return error.issues.map(issue => `${issue.path.map(part => fieldLabel(String(part))).join(" / ") || "Inputs"}: ${issue.message}`); }
export function calculateRenovation(input: unknown): Result<RenovationTotals> {
  const parsed = renovationSchema.safeParse(input); if (!parsed.success) return invalid(schemaIssues(parsed.error));
  const { items, contingency, reserve } = parsed.data;
  const missing: string[] = [];
  if (contingency === null) missing.push("Contingency"); if (reserve === null) missing.push("Unknown-condition reserve");
  items.forEach((item, index) => { for (const key of ["quantity", "low", "base", "high"] as const) if (item[key] === null) missing.push(`${item.label || `Repair ${index + 1}`}: ${key}`); });
  if (missing.length) return { status: "incomplete", issues: missing };
  if (items.some(item => item.low! > item.base! || item.base! > item.high!)) return invalid(["Repair unit costs must be ordered low ≤ base ≤ high."]);
  const total = (key: "low" | "base" | "high") => items.reduce((sum, item) => sum + item.quantity! * item[key]!, 0) * (1 + contingency!) + reserve!;
  const data = { low: total("low"), base: total("base"), high: total("high") };
  return Object.values(data).every(Number.isFinite) ? { status: "available", data } : invalid(["Repair totals are too large to calculate safely."]);
}
export function calculateFlip(input: unknown, renovation: Result<RenovationTotals>): Result<FlipResults> {
  const parsed = flipSchema.safeParse(input); if (!parsed.success) return invalid(schemaIssues(parsed.error));
  const values = parsed.data;
  const missing = Object.entries(values).filter(([, value]) => value === null).map(([key]) => fieldLabel(key));
  if (renovation.status !== "available") return { status: renovation.status, issues: [...renovation.issues, ...missing] };
  if (missing.length) return { status: "incomplete", issues: missing };
  const v = values as { [K in keyof FlipInputs]: number };
  if (v.commissionFraction + v.sellerFraction + v.extraSellerFraction >= 1) return invalid(["Combined seller percentages, including Downside stress, must total less than 100%."]);
  const run = (purchase: number, resale: number, holdMonths: number, rehab: number, sellerFraction: number): FlipCase => {
    const projectCost = purchase * (1 + v.buyerFraction) + v.buyerFixed + rehab + holdMonths * v.monthlyCarry;
    const sellerFees = v.commissionFraction + sellerFraction;
    const sellingCosts = resale * sellerFees + v.sellerFixed;
    const profit = resale - sellingCosts - projectCost;
    const numerator = resale * (1 - sellerFees) - v.sellerFixed - v.buyerFixed - rehab - holdMonths * v.monthlyCarry - v.targetProfit;
    const maxBid = numerator < 0 ? null : numerator / (1 + v.buyerFraction);
    return { projectCost, sellingCosts, profit, roi: projectCost > 0 ? profit / projectCost : null, breakEven: (projectCost + v.sellerFixed) / (1 - sellerFees), maxBid, bidDifference: maxBid === null ? null : maxBid - purchase, resale, holdMonths, renovation: rehab, sellerFees };
  };
  const base = run(v.purchase, v.resale, v.holdMonths, renovation.data.base, v.sellerFraction);
  const downside = run(v.purchase, v.resale * (1 - v.resaleDrop), v.holdMonths + v.extraMonths, renovation.data.high, v.sellerFraction + v.extraSellerFraction);
  const sensitivity = [.8, .9, 1, 1.1, 1.2].map(multiplier => { const result = run(v.purchase, v.resale * multiplier, v.holdMonths, renovation.data.base, v.sellerFraction); return { resale: result.resale, profit: result.profit }; });
  const numeric = [...Object.values(base), ...Object.values(downside), ...sensitivity.flatMap(row => [row.resale, row.profit])].filter(value => value !== null);
  return numeric.every(Number.isFinite) ? { status: "available", data: { base, downside, sensitivity } } : invalid(["Resale results are too large to calculate safely."]);
}
export function calculateRent(input: unknown): Result<RentResults> {
  const parsed = rentSchema.safeParse(input); if (!parsed.success) return invalid(schemaIssues(parsed.error));
  const missing = Object.entries(parsed.data).filter(([, value]) => value === null).map(([key]) => fieldLabel(key));
  if (missing.length) return { status: "incomplete", issues: missing };
  const v = parsed.data as { [K in keyof RentInputs]: number };
  const effectiveAnnualRent = 12 * v.monthlyRent * (1 - v.vacancy);
  const managementExpense = effectiveAnnualRent * v.management;
  const operatingExpenses = v.annualTax + v.annualInsurance + v.annualUtilities + v.annualHoa + v.annualMaintenance + managementExpense;
  const annualOperatingIncome = effectiveAnnualRent - operatingExpenses;
  const annualCash = annualOperatingIncome - v.annualCapitalReserve;
  const data = { effectiveAnnualRent, managementExpense, operatingExpenses, annualOperatingIncome, annualCapitalReserve: v.annualCapitalReserve, annualCash, monthlyCash: annualCash / 12 };
  return Object.values(data).every(Number.isFinite) ? { status: "available", data } : invalid(["Rental results are too large to calculate safely."]);
}
export function evaluateFinance(input: FinanceInputs) {
  const renovation = calculateRenovation(input.renovation);
  return { renovation, flip: calculateFlip(input.flip, renovation), rent: calculateRent(input.rent) };
}
export const financeInputKey = (input: FinanceInputs) => JSON.stringify(financeSchema.parse(input));
