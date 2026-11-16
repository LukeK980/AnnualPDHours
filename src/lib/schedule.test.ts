import { describe, expect, it } from "vitest";
import { defaultPlan, createState, parseState, validatePlan } from "./plan";
import { calculate } from "./calculations";
import {
  calculateSimple,
  applySimpleInputs,
  simpleInputs,
} from "./simpleCalculator";
import { updateSchedule } from "./schedule";

describe("52-week schedule and part-time allowances", () => {
  it.each([2026, 2027, 2028, 2032, 2036])(
    "uses 2080 annual hours in %i, including leap years",
    (year) => {
      const p = defaultPlan(year);
      expect(calculate(p).scheduledHours).toBe(2080);
      expect(calculateSimple(p).scheduledHours).toBe(2080);
      expect(calculate(p).billableTargetHours).toBe(1664);
    },
  );
  it.each([25, 32, 40])(
    "prorates holidays and annual vacation at %i hours/week",
    (weekly) => {
      const p = updateSchedule(defaultPlan(), weekly);
      p.simpleInputs = { ...simpleInputs(p), vacationHours: 120 };
      const s = calculateSimple(p),
        next = applySimpleInputs(p),
        r = calculate(next);
      expect(s.scheduledHours).toBe(weekly * 52);
      expect(s.holidayHours).toBe((72 * weekly) / 40);
      expect(s.vacationHours).toBe((120 * weekly) / 40);
      expect(r.holidayHours).toBe(s.holidayHours);
      expect(r.vacationHours).toBe(s.vacationHours);
      expect(r.holidays.find((h) => h.id === "floating-1")!.hours).toBe(
        (8 * weekly) / 40,
      );
    },
  );
  it("keeps weekly/annual allowances identical across compressed workweeks", () => {
    const p = updateSchedule(defaultPlan(), 25, [1, 2, 3]);
    expect(calculate(p).scheduledHours).toBe(1300);
    expect(calculate(p).holidayHours).toBe(45);
    expect(calculateSimple(p).holidayHours).toBe(45);
    expect(calculate(p).standardWeeklyHours).toBe(25);
    expect(validatePlan(updateSchedule(defaultPlan(), 40, [1]))).toEqual([]);
    p.holidayOverrides["christmas"] = "2027-01-04";
    p.holidayOverrides["new-year"] = "2027-01-04";
    p.floatingHolidays[0].date = "2027-01-04";
    p.floatingHolidays[0].status = "planned";
    // Choose a scheduled date to verify a compressed schedule cannot book a holiday twice.
    const overlap = calculate(p).holidays.filter(
      (h) => h.date === "2027-01-04",
    );
    expect(overlap.reduce((sum, h) => sum + h.hours, 0)).toBe(5);
  });
  it("never prorates used vacation again and transfers only the remaining actual allowance", () => {
    const p = updateSchedule(defaultPlan(), 25);
    p.vacation.taken = 20;
    p.simpleInputs = { ...simpleInputs(p), vacationHours: 120 };
    const next = applySimpleInputs(p);
    expect(next.vacation.taken).toBe(20);
    expect(next.vacation.future).toBe(88);
    expect(calculate(next).vacationHours).toBe(75);
    p.simpleInputs.vacationHours = 20;
    expect(() => applySimpleInputs(p)).toThrow("already used");
  });
  it("partitions the normalized annual budget at date boundaries and partial weeks", () => {
    const p = updateSchedule(defaultPlan(2028), 32);
    for (const date of [
      "2027-12-31",
      "2028-01-01",
      "2028-02-29",
      "2028-06-07",
      "2029-01-01",
    ]) {
      const r = calculate({ ...p, calculationDate: date });
      expect(r.elapsedScheduledHours + r.remainingScheduledHours).toBeCloseTo(
        1664,
      );
      expect(r.remainingScheduledHours).toBeGreaterThanOrEqual(0);
    }
    expect(
      calculate({ ...p, calculationDate: "2029-01-01" })
        .remainingScheduledHours,
    ).toBe(0);
    expect(
      calculate({ ...p, calculationDate: "2028-01-01" }).elapsedScheduledHours,
    ).toBe(0);
  });
  it("reserves floating holidays once and does not reserve used holidays in the future", () => {
    const p = updateSchedule(defaultPlan(), 25);
    p.floatingHolidays[0].status = "taken";
    const r = calculate(p);
    expect(r.holidayHours).toBe(45);
    expect(r.futureHolidayHours).toBe(40);
    p.observation = "nearest_weekday";
    expect(calculate(p).holidayHours).toBe(45);
  });
  it("migrates old actual vacation without loss, round trips new plans and validates weekly hours", () => {
    const s = createState(),
      p = updateSchedule(defaultPlan(), 25);
    s.plans[2027] = p;
    expect(parseState(JSON.stringify(s))).toEqual(s);
    delete p.weeklyHours;
    p.vacation = { taken: 10, future: 40 };
    const next = parseState(JSON.stringify({ ...s, version: 3 })).plans[2027];
    expect(next.weeklyHours).toBe(25);
    expect(calculate(next).vacationHours).toBe(50);
    expect(next.vacation.taken).toBe(10);
    expect(next.migrationNotice).toContain("weekly hours");
    expect(() => parseState(JSON.stringify(s))).toThrow("Weekly hours");
    for (const invalid of [0, -1, NaN, Infinity, 169])
      expect(
        validatePlan({ ...next, weeklyHours: invalid }).length,
      ).toBeGreaterThan(0);
  });
});
