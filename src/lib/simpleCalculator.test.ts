import { describe, expect, it } from "vitest";
import { defaultPlan, createState, parseState, validatePlan } from "./plan";
import { calculate } from "./calculations";
import {
  simpleInputs,
  calculateSimple,
  applySimpleInputs,
} from "./simpleCalculator";

describe("Simple annual utilization calculator", () => {
  it("defaults to nine paid days, 52 admin hours, and computes a full-year allowance", () => {
    const p = defaultPlan(2027),
      s = simpleInputs(p),
      r = calculateSimple(p);
    expect(s.holidayDays).toBe(9);
    expect(s.adminHours).toBe(52);
    expect(r.scheduledHours).toBe(2088);
    expect(r.holidayHours).toBe(72);
    expect(r.availableHours).toBeCloseTo(293.6);
  });
  it("subtracts vacation, anticipated sick, H&S and admin once from the annual non-billable allowance", () => {
    const p = defaultPlan();
    p.simpleInputs = {
      holidayDays: 9,
      vacationHours: 120,
      sickHours: 24,
      hsHours: 8,
      adminHours: 52,
    };
    expect(calculateSimple(p).availableHours).toBeCloseTo(141.6);
  });
  it("is independent of current utilization and date for an annual budget", () => {
    const p = defaultPlan();
    const before = calculateSimple(p);
    p.currentBillabilityPct = 90;
    p.calculationDate = "2027-10-14";
    expect(calculateSimple(p)).toEqual(before);
  });
  it("handles changed daily hours, 0/100% goals and deficits", () => {
    const p = defaultPlan();
    p.hoursPerDay = 4;
    expect(calculateSimple(p).holidayHours).toBe(36);
    p.billabilityGoalPct = 100;
    expect(calculateSimple(p).availableHours).toBe(0);
    expect(calculateSimple(p).deficitHours).toBe(88);
    p.billabilityGoalPct = 0;
    expect(calculateSimple(p).availableHours).toBe(956);
  });
  it("carries annual assumptions while retaining used hours and additional responsibilities", () => {
    const p = defaultPlan();
    p.calculationDate = "2027-06-01";
    p.vacation.taken = 40;
    p.commitments[0].taken = 4;
    p.commitments.push({ id: "dg", name: "DG meetings", taken: 4, future: 12 });
    p.simpleInputs = {
      holidayDays: 9,
      vacationHours: 120,
      sickHours: 24,
      hsHours: 8,
      adminHours: 52,
    };
    const next = applySimpleInputs(p);
    expect(next.vacation).toEqual({ taken: 40, future: 80 });
    expect(next.commitments[0]).toMatchObject({ taken: 4, future: 4 });
    expect(next.commitments[2]).toEqual(p.commitments[2]);
    expect(calculate(next).holidayHours).toBe(72);
  });
  it("refuses to erase used hours or under-reserve configured holidays", () => {
    const p = defaultPlan();
    p.vacation.taken = 80;
    p.simpleInputs = { ...simpleInputs(p), vacationHours: 40 };
    expect(() => applySimpleInputs(p)).toThrow("already used");
    p.simpleInputs.vacationHours = 80;
    p.simpleInputs.holidayDays = 0;
    expect(() => applySimpleInputs(p)).toThrow("holiday allowance");
  });
  it("deduplicates the nine-day allowance when observed dates fill the calendar gap", () => {
    const p = defaultPlan();
    expect(calculate(p).holidayHours).toBe(72);
    expect(
      calculate(p).holidays.find((h) => h.id === "holiday-allowance")!.hours,
    ).toBe(16);
    p.observation = "nearest_weekday";
    expect(calculate(p).holidayHours).toBe(72);
    expect(
      calculate(p).holidays.some((h) => h.id === "holiday-allowance"),
    ).toBe(false);
  });
  it("round trips optional assumptions and rejects malformed imported values", () => {
    const s = createState();
    s.plans[2027].simpleInputs = simpleInputs(s.plans[2027]);
    expect(parseState(JSON.stringify(s))).toEqual(s);
    s.plans[2027].simpleInputs!.adminHours = -1;
    expect(validatePlan(s.plans[2027]).length).toBeGreaterThan(0);
    expect(() => parseState(JSON.stringify(s))).toThrow();
  });
});
