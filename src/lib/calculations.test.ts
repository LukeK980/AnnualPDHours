import { describe, expect, it } from "vitest";
import {
  annualCapacity,
  calculate,
  fixedHolidays,
  observedDate,
} from "./calculations";
import { defaultPlan as createDefaultPlan, dateString } from "./plan";

function defaultPlan(year = 2027, today?: Date) {
  const p = createDefaultPlan(year, today);
  delete p.holidayAllowanceDays;
  p.commitments.find((c) => c.id === "admin")!.future = 0;
  return p;
}

describe("every non-billable hour counts against the goal", () => {
  it("uses the full 2080-hour fixture: 80% = 1664 billable and 416 non-billable", () => {
    const r = annualCapacity(2080, 72, 120, 24, 80, 144);
    expect(r.billableTargetHours).toBe(1664);
    expect(r.annualNonBillableBudget).toBe(416);
    expect(r.annualCommittedNonBillableHours).toBe(360);
    expect(r.availableNonBillableHours).toBe(56);
  });
  it("subtracts holidays, vacation, sick leave and commitments from the same allowance", () => {
    for (const exclusions of [
      [8, 0, 0, 0],
      [0, 8, 0, 0],
      [0, 0, 8, 0],
      [0, 0, 0, 8],
    ]) {
      const [h, v, s, c] = exclusions;
      expect(
        annualCapacity(100, h, v, s, 80, c).availableNonBillableHours,
      ).toBe(12);
    }
  });
  it("reports overallocated plans instead of negative available slices", () => {
    expect(annualCapacity(100, 20, 100, 10, 80, 24)).toMatchObject({
      availableWorkingHours: 0,
      leaveOverallocation: 30,
      overallocationHours: 134,
      availableNonBillableHours: 0,
    });
    expect(annualCapacity(100, 0, 0, 0, 100, 20).overallocationHours).toBe(20);
    expect(annualCapacity(100, 10, 10, 0, 0, 0).availableNonBillableHours).toBe(
      80,
    );
  });
  it("makes an 80% billable slice exactly 80% of scheduled hours", () => {
    const p = defaultPlan();
    p.vacation.future = 120;
    p.sick.future = 24;
    p.commitments[0].future = 24;
    p.commitments[1].future = 80;
    const r = calculate(p);
    expect(r.overallocationHours).toBe(0);
    expect((r.allocations[0].hours / r.scheduledHours) * 100).toBe(80);
    expect(r.allocations.reduce((s, a) => s + a.hours, 0)).toBeCloseTo(
      r.scheduledHours,
    );
  });
});
describe("calendar and holidays", () => {
  it.each([
    [2024, "2024-05-27", "2024-09-02", "2024-11-28"],
    [2025, "2025-05-26", "2025-09-01", "2025-11-27"],
    [2026, "2026-05-25", "2026-09-07", "2026-11-26"],
    [2027, "2027-05-31", "2027-09-06", "2027-11-25"],
  ])("calculates holidays in %i", (year, m, l, t) => {
    const h = fixedHolidays(year);
    expect(dateString(h[1].date)).toBe(m);
    expect(dateString(h[3].date)).toBe(l);
    expect(dateString(h[4].date)).toBe(t);
  });
  it("handles leap years and custom workweeks", () => {
    const p = defaultPlan(2024);
    p.workingDays = [0, 1, 2, 3, 4, 5, 6];
    expect(calculate(p).scheduledHours).toBe(366 * 8);
    p.year = 2025;
    expect(calculate(p).scheduledHours).toBe(365 * 8);
    p.workingDays = [1, 2, 3, 4, 5];
    expect(calculate(p).workingDays).toBe(261);
  });
  it("does not assume weekend observation", () => {
    const p = defaultPlan(2027);
    expect(calculate(p).holidayHours).toBe(56);
    p.observation = "nearest_weekday";
    expect(calculate(p).holidayHours).toBe(72);
    expect(dateString(observedDate(new Date(2026, 6, 4), "next_monday"))).toBe(
      "2026-07-06",
    );
    p.year = 2022;
    expect(calculate(p).holidays[0].hours).toBe(0);
  });
  it("deduplicates floating dates overlapping fixed holidays", () => {
    const p = defaultPlan(2026);
    p.floatingHolidays.forEach((h) => {
      h.date = "2026-12-25";
      h.status = "planned";
    });
    const r = calculate(p);
    expect(r.holidayHours).toBe(48);
    expect(r.holidays.slice(7).map((h) => h.hours)).toEqual([0, 0]);
    expect(r.warnings.some((w) => w.includes("overlapping"))).toBe(true);
  });
  it("never subtracts taken floating holidays from future capacity", () => {
    const p = defaultPlan(2026);
    p.calculationDate = "2026-10-14";
    p.floatingHolidays[0].status = "taken";
    expect(calculate(p).futureHolidayHours).toBe(32);
    expect(calculate(p).takenHolidayHours).toBe(32);
  });
});
describe("midyear remaining budget", () => {
  function midyear() {
    const p = defaultPlan(2026);
    p.calculationDate = "2026-10-14";
    p.currentBillabilityPct = 85;
    p.vacation = { taken: 64, future: 56 };
    p.sick = { taken: 24, future: 8 };
    p.commitments[0] = { ...p.commitments[0], taken: 24, future: 8 };
    p.commitments[1] = { ...p.commitments[1], taken: 80, future: 16 };
    return p;
  }
  it("reconciles percentage-implied usage with itemized taken hours without double counting", () => {
    const r = calculate(midyear());
    expect(r.elapsedScheduledHours).toBe(1632);
    expect(r.estimatedCompletedBillableHours).toBeCloseTo(1387.2);
    expect(r.estimatedUsedNonBillableHours).toBeCloseTo(244.8);
    expect(r.knownTakenNonBillableHours).toBe(216);
    expect(r.usedNonBillableHours).toBeCloseTo(244.8);
    expect(r.unitemizedTakenNonBillableHours).toBeCloseTo(28.8);
    expect(r.plannedNonBillableHours).toBe(128);
    expect(r.remainingNonBillableAllowance).toBeCloseTo(172.8);
    expect(r.availableNonBillableHours).toBeCloseTo(44.8);
    expect(r.remainingAvailableHours).toBe(328);
    expect(r.billableHoursRemaining).toBeCloseTo(283.2);
    expect(r.requiredWeeklyBillable).toBeCloseTo(283.2 / (328 / 40));
    expect(r.allocations.reduce((s, a) => s + a.hours, 0)).toBeCloseTo(
      r.scheduledHours,
    );
  });
  it("only future plans reduce future capacity; taken training/admin are not deducted again", () => {
    const p = midyear(),
      r = calculate(p);
    p.commitments[0].taken += 8;
    expect(calculate(p).remainingAvailableHours).toBe(
      r.remainingAvailableHours,
    );
    expect(calculate(p).usedNonBillableHours).toBeCloseTo(
      r.usedNonBillableHours,
    );
    p.commitments[0].future += 8;
    expect(calculate(p).remainingAvailableHours).toBe(
      r.remainingAvailableHours - 8,
    );
    expect(calculate(p).availableNonBillableHours).toBeCloseTo(
      r.availableNonBillableHours - 8,
    );
  });
  it("future leave never reduces estimated completed billable hours", () => {
    const p = midyear(),
      r = calculate(p);
    p.vacation.future += 40;
    expect(calculate(p).estimatedCompletedBillableHours).toBe(
      r.estimatedCompletedBillableHours,
    );
    expect(calculate(p).availableNonBillableHours).toBeCloseTo(
      r.availableNonBillableHours - 40,
    );
  });
  it("flags contradictory inputs and reserves the larger actual taken total conservatively", () => {
    const p = midyear();
    p.currentBillabilityPct = 100;
    const r = calculate(p);
    expect(r.inputConflictHours).toBe(216);
    expect(r.usedNonBillableHours).toBe(216);
    expect(r.feasible).toBe(false);
    expect(r.warnings.some((w) => w.includes("Check your percentage"))).toBe(
      true,
    );
  });
  it("counts only dates before the calculation day as elapsed", () => {
    const p = defaultPlan(2026);
    p.calculationDate = "2026-01-02";
    p.currentBillabilityPct = 50;
    expect(calculate(p).estimatedCompletedBillableHours).toBe(4);
  });
  it("handles partial weeks, no remaining time and exceeded goals without creating extra hours", () => {
    const p = defaultPlan(2026);
    p.calculationDate = "2026-12-31";
    p.currentBillabilityPct = 80;
    p.floatingHolidays.forEach((h) => (h.status = "taken"));
    expect(calculate(p).remainingEffectiveWeeks).toBe(0.2);
    p.calculationDate = "2027-01-01";
    p.currentBillabilityPct = 0;
    expect(calculate(p).requiredWeeklyBillable).toBeNull();
    expect(calculate(p).availableNonBillableHours).toBe(0);
    p.currentBillabilityPct = 90;
    expect(calculate(p).billableHoursRemaining).toBe(0);
    expect(calculate(p).requiredWeeklyBillable).toBe(0);
    expect(calculate(p).availableNonBillableHours).toBe(0);
    p.calculationDate = "2026-10-14";
    p.billabilityGoalPct = 10;
    expect(calculate(p).availableNonBillableHours).toBeLessThanOrEqual(
      calculate(p).remainingScheduledHours,
    );
  });
  it("keeps custom labels unique by ID and validates bad inputs", () => {
    const p = defaultPlan();
    p.commitments.push({
      id: "custom",
      name: "Vacation",
      taken: 0,
      future: 16,
    });
    const r = calculate(p);
    expect(new Set(r.allocations.map((a) => a.id)).size).toBe(
      r.allocations.length,
    );
    expect(() => calculate({ ...p, billabilityGoalPct: 101 })).toThrow();
    expect(() => calculate({ ...p, calculationDate: "2027-02-30" })).toThrow();
    expect(() => calculate({ ...p, workingDays: [] })).toThrow();
  });
});
