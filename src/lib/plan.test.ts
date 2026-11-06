import { describe, expect, it } from "vitest";
import { createState, defaultPlan, parseState, validatePlan } from "./plan";
describe("v3 backup validation", () => {
  it("opens 2027 for an out-of-range active year while preserving its saved plan", () => {
    const state = createState();
    state.plans[2040] = defaultPlan(2040);
    state.activeYear = 2040;
    const restored = parseState(JSON.stringify(state));
    expect(restored.activeYear).toBe(2027);
    expect(restored.plans[2040]).toEqual(state.plans[2040]);
  });
  it("round trips multiple years and taken/planned custom categories", () => {
    const s = createState();
    s.plans[2026] = defaultPlan(2026);
    s.plans[2027].commitments.push({
      id: "custom",
      name: "Mentoring",
      taken: 8,
      future: 16,
    });
    expect(parseState(JSON.stringify(s))).toEqual(s);
  });
  it.each([
    "{}",
    "{",
    '{"version":4}',
    '{"version":3,"activeYear":2027,"theme":"light","plans":{}}',
  ])("rejects malformed backups %s", (raw) =>
    expect(() => parseState(raw)).toThrow(),
  );
  it("rejects invalid hours, current percentage, duplicate categories and out-of-year dates", () => {
    const s = createState();
    s.plans[2027].commitments[0].taken = -1;
    expect(() => parseState(JSON.stringify(s))).toThrow();
    s.plans[2027].commitments[0].taken = Infinity;
    expect(validatePlan(s.plans[2027]).length).toBeGreaterThan(0);
    s.plans[2027].commitments[0].taken = 0;
    s.plans[2027].floatingHolidays[0].date = "2026-01-01";
    expect(() => parseState(JSON.stringify(s))).toThrow();
    s.plans[2027].floatingHolidays[0].date = "";
    s.plans[2027].commitments.push({ ...s.plans[2027].commitments[0] });
    expect(() => parseState(JSON.stringify(s))).toThrow();
  });
  it("rejects null nested data, mismatched year keys and oversized files", () => {
    const s = JSON.parse(JSON.stringify(createState()));
    s.plans[2027].floatingHolidays[0] = null;
    expect(() => parseState(JSON.stringify(s))).toThrow();
    s.plans[2027] = defaultPlan(2026);
    expect(() => parseState(JSON.stringify(s))).toThrow("key");
    expect(() => parseState(" ".repeat(1_000_001))).toThrow("1 MB");
  });
});
