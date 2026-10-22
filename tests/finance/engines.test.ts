import { expect, it } from "vitest";
import { calculateRenovation, calculateFlip, calculateRent, evaluateFinance, emptyFinance } from "../../src/lib/finance/engines";
const rehab = { items: [{ label: "Repairs", quantity: 1, low: 15000, base: 20000, high: 30000 }], contingency: 0, reserve: 5000 };
const flip = { purchase: 100000, buyerFraction: 0, buyerFixed: 5000, holdMonths: 6, monthlyCarry: 1000, resale: 200000, commissionFraction: .05, sellerFraction: .02, sellerFixed: 2000, targetProfit: 30000, resaleDrop: .1, extraMonths: 3, extraSellerFraction: .01 };
const rent = { monthlyRent: 2000, vacancy: .05, annualTax: 3600, annualInsurance: 1200, annualUtilities: 0, annualHoa: 0, annualMaintenance: 1200, management: .1, annualCapitalReserve: 1800 };
it("matches the approved hand fixture, counts allowances once and round-trips max bid", () => {
  const renovation = calculateRenovation(rehab); expect(renovation.status).toBe("available");
  if (renovation.status !== "available") throw Error();
  expect(renovation.data.base).toBe(25000);
  const result = calculateFlip(flip, renovation); expect(result.status).toBe("available");
  if (result.status !== "available") throw Error();
  expect(result.data.base).toMatchObject({ projectCost: 136000, profit: 48000, maxBid: 118000, bidDifference: 18000 });
  expect(result.data.base.sellingCosts).toBeCloseTo(16000);
  expect(result.data.base.breakEven).toBeCloseTo(138000 / .93);
  expect(result.data.downside.projectCost).toBe(149000);
  const roundTrip = calculateFlip({ ...flip, purchase: result.data.base.maxBid }, renovation);
  if (roundTrip.status !== "available") throw Error();
  expect(roundTrip.data.base.profit).toBeCloseTo(30000);
});
it("keeps unknown separate from explicit zero and does not hide losses or impossible bids", () => {
  expect(calculateRenovation({ ...rehab, contingency: null }).status).toBe("incomplete");
  const zero = calculateRenovation({ items: [], contingency: 0, reserve: 0 });
  expect(zero).toEqual({ status: "available", data: { low: 0, base: 0, high: 0 } });
  const loss = calculateFlip({ ...flip, resale: 10000 }, zero);
  if (loss.status !== "available") throw Error();
  expect(loss.data.base.profit).toBeLessThan(0); expect(loss.data.base.maxBid).toBeNull();
  const noCost = calculateFlip({ ...flip, purchase: 0, buyerFixed: 0, holdMonths: 0 }, zero);
  if (noCost.status !== "available") throw Error(); expect(noCost.data.base.roi).toBeNull();
});
it("rejects invalid money, ranges, fee sums and arithmetic overflow", () => {
  for (const value of [-1, NaN, Infinity]) expect(calculateRenovation({ ...rehab, reserve: value }).status).toBe("invalid");
  expect(calculateRenovation({ ...rehab, items: [{ label: "Repair", quantity: 1, low: 20, base: 10, high: 30 }] }).status).toBe("invalid");
  const renovation = calculateRenovation(rehab);
  expect(calculateFlip({ ...flip, commissionFraction: .7, sellerFraction: .3 }, renovation).status).toBe("invalid");
  expect(calculateFlip({ ...flip, extraSellerFraction: .95 }, renovation).status).toBe("invalid");
  expect(calculateRenovation({ ...rehab, items: [{ label: "Overflow", quantity: 1e308, low: 1e308, base: 1e308, high: 1e308 }] }).status).toBe("invalid");
});
it("matches rental fixture with capital reserve separate and preserves negative cash", () => {
  const result = calculateRent(rent);
  expect(result.status).toBe("available"); if (result.status !== "available") throw Error();
  expect(result.data).toEqual({ effectiveAnnualRent: 22800, managementExpense: 2280, operatingExpenses: 8280, annualOperatingIncome: 14520, annualCapitalReserve: 1800, annualCash: 12720, monthlyCash: 1060 });
  const vacant = calculateRent({ ...rent, vacancy: 1 });
  if (vacant.status !== "available") throw Error(); expect(vacant.data.annualCash).toBe(-7800);
  expect(calculateRent({ ...rent, monthlyRent: 0 }).status).toBe("available");
  expect(calculateRent({ ...rent, annualInsurance: null }).status).toBe("incomplete");
  for (const value of [-.1, 1.1, Infinity]) expect(calculateRent({ ...rent, management: value }).status).toBe("invalid");
});
it("keeps the scenarios independently complete and shared renovation visible", () => {
  const assumptions = { ...emptyFinance(), rent };
  expect(evaluateFinance(assumptions).rent.status).toBe("available");
  expect(evaluateFinance(assumptions).flip.status).toBe("incomplete");
  expect(evaluateFinance({ ...assumptions, renovation: rehab }).renovation.status).toBe("available");
});
it("applies nonzero contingency before the separate reserve and retains the same allowance in resale", () => {
  const renovation = calculateRenovation({ ...rehab, contingency: .1 });
  if (renovation.status !== "available") throw Error();
  expect(renovation.data.base).toBeCloseTo(27000);
  const result = calculateFlip(flip, renovation); if (result.status !== "available") throw Error();
  expect(result.data.base.projectCost).toBeCloseTo(138000);
  expect(result.data.base.profit).toBeCloseTo(46000);
});
it("round-trips maximum bid with purchase-proportional fees and changes snapshot outcomes with assumptions", () => {
  const renovation = calculateRenovation(rehab);
  const input = { ...flip, buyerFraction: .03 };
  const result = calculateFlip(input, renovation); if (result.status !== "available" || result.data.base.maxBid === null) throw Error();
  const solved = calculateFlip({ ...input, purchase: result.data.base.maxBid }, renovation); if (solved.status !== "available") throw Error();
  expect(solved.data.base.profit).toBeCloseTo(flip.targetProfit);
  expect(result.data.sensitivity[2].profit).toBe(result.data.base.profit);
});
