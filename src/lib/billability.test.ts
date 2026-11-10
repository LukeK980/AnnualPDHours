import { describe, expect, it } from "vitest";
import { calculate } from "./calculations";
import { createState, defaultPlan, parseState, validatePlan } from "./plan";
function oldState(version: 1 | 2 = 2, hours = 1100) {
  return {
    version,
    activeYear: 2026,
    theme: "dark",
    plans: {
      2026: {
        ...defaultPlan(2026),
        calculationDate: "2026-10-14",
        denominator: "available",
        currentBillabilityPct: 80,
        completedBillableHours: hours,
        commitments: [
          { id: "hs", name: "H&S training", hours: 24 },
          { id: "admin", name: "Admin", hours: 80 },
          { id: "meetings", name: "Meetings", hours: 24 },
          { id: "other", name: "Other", hours: 16 },
        ],
      },
    },
  };
}
describe("default year and whole-year current billability", () => {
  it("defaults to 2027 with a sensible forecast start date while retaining other selectable years", () => {
    const s = createState(new Date(2026, 10, 6));
    expect(s.activeYear).toBe(2027);
    expect(s.plans[2027].calculationDate).toBe("2027-01-01");
    expect(defaultPlan(2027, new Date(2027, 5, 14)).calculationDate).toBe(
      "2027-06-14",
    );
    expect(s.plans[2027].denominator).toBe("scheduled");
    expect(
      s.plans[2027].commitments.find((c) => c.id === "admin")!.future,
    ).toBe(52);
    expect(s.plans[2027].commitments.every((c) => c.taken === 0)).toBe(true);
  });
  it("does not remove holidays or leave from the current percentage basis", () => {
    const p = defaultPlan(2026);
    p.calculationDate = "2026-10-14";
    p.currentBillabilityPct = 75;
    const before = calculate(p);
    p.vacation.taken = 64;
    p.sick.taken = 24;
    expect(calculate(p).estimatedCompletedBillableHours).toBe(1224);
    expect(calculate(p).estimatedCompletedBillableHours).toBe(
      before.estimatedCompletedBillableHours,
    );
    expect(
      validatePlan({ ...p, currentBillabilityPct: 101 }).length,
    ).toBeGreaterThan(0);
  });
});
describe("backward-compatible v3 migration", () => {
  it("converts a v2 net-working percentage to scheduled-hours percentage preserving completed-hour estimate", () => {
    const s = oldState(),
      p = s.plans[2026];
    p.vacation = { taken: 64, future: 56 };
    p.sick = { taken: 24, future: 8 };
    const m = parseState(JSON.stringify(s)),
      r = calculate(m.plans[2026]);
    expect(m.version).toBe(3);
    expect(r.estimatedCompletedBillableHours).toBeCloseTo(
      (1632 - 24 - 64 - 24) * 0.8,
    );
    expect(m.plans[2026].denominator).toBe("scheduled");
    expect(
      m.plans[2026].commitments.find((c) => c.id === "admin")!.future,
    ).toBe(120);
    expect(m.plans[2026].commitments.every((c) => c.taken === 0)).toBe(true);
    expect(m.plans[2026].migrationNotice).toContain("Planned");
    expect(parseState(JSON.stringify(m))).toEqual(m);
  });
  it("converts v1 hours, retaining original reference and all saved years", () => {
    const s = oldState(1);
    const m = parseState(JSON.stringify(s), true);
    expect(m.activeYear).toBe(2027);
    expect(m.plans[2026].legacyCompletedBillableHours).toBe(1100);
    expect(
      calculate(m.plans[2026]).estimatedCompletedBillableHours,
    ).toBeCloseTo(1100);
    expect(m.plans[2027]).toBeDefined();
    expect(parseState(JSON.stringify(s)).activeYear).toBe(2026);
  });
  it("handles unrepresentable old completed hours and zero elapsed time", () => {
    const s = oldState(1, 9999);
    const m = parseState(JSON.stringify(s));
    expect(m.plans[2026].currentBillabilityPct).toBe(100);
    expect(m.plans[2026].legacyCompletedBillableHours).toBe(9999);
    expect(
      calculate(m.plans[2026]).warnings.some((w) =>
        w.includes("original saved"),
      ),
    ).toBe(true);
    s.plans[2026].calculationDate = "2026-01-01";
    expect(
      parseState(JSON.stringify(s)).plans[2026].currentBillabilityPct,
    ).toBe(0);
  });
  it("preserves v3 user-selected active years rather than forcing 2027 on every reload", () => {
    const s = createState();
    s.plans[2026] = defaultPlan(2026);
    s.activeYear = 2026;
    expect(parseState(JSON.stringify(s), true).activeYear).toBe(2026);
  });
});
