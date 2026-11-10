import type { AnnualPlan, Denominator, SavedState } from "./types";
import { dateString, isObject, validatePlan } from "./validation";
import { calculate } from "./calculations";
export { dateString, validDate, validatePlan } from "./validation";
export const DEFAULT_YEAR = 2027;
export const MIN_SELECTABLE_YEAR = 2026;
export const MAX_SELECTABLE_YEAR = 2036;
export const STORAGE_KEY = "annual-pd-hours:v3";
export const PREVIOUS_STORAGE_KEY = "annual-pd-hours:v2";
export const LEGACY_STORAGE_KEY = "annual-pd-hours:v1";
export function defaultPlan(
  year = DEFAULT_YEAR,
  today = new Date(),
): AnnualPlan {
  const todayString = dateString(today);
  const calculationDate =
    todayString < `${year}-01-01`
      ? `${year}-01-01`
      : todayString > `${year}-12-31`
        ? `${year}-12-31`
        : todayString;
  return {
    year,
    hoursPerDay: 8,
    workingDays: [1, 2, 3, 4, 5],
    billabilityGoalPct: 80,
    currentBillabilityPct: 0,
    calculationDate,
    denominator: "scheduled",
    holidayAllowanceDays: 9,
    observation: "actual",
    holidayOverrides: {},
    floatingHolidays: [1, 2].map((n) => ({
      id: `floating-${n}`,
      status: "not_taken",
      date: "",
      hours: 8,
    })),
    vacation: { taken: 0, future: 0 },
    sick: { taken: 0, future: 0 },
    commitments: [
      { id: "hs", name: "H&S training", taken: 0, future: 0 },
      { id: "admin", name: "Administration", taken: 0, future: 52 },
    ],
  };
}
export function createState(today = new Date()): SavedState {
  const p = defaultPlan(DEFAULT_YEAR, today);
  return {
    version: 3,
    activeYear: p.year,
    theme: "system",
    plans: { [p.year]: p },
  };
}
export function parseState(json: string, openDefaultYear = false): SavedState {
  if (json.length > 1_000_000)
    throw new Error("Plan file exceeds the 1 MB limit.");
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (
    !isObject(value) ||
    ![1, 2, 3].includes(Number(value.version)) ||
    typeof value.version !== "number" ||
    !["light", "dark", "system"].includes(String(value.theme)) ||
    !Number.isInteger(value.activeYear) ||
    !isObject(value.plans)
  )
    throw new Error(
      "Unsupported plan format. Import an AnnualPDHours version 1, 2 or 3 backup.",
    );
  const version = value.version as 1 | 2 | 3,
    entries = Object.entries(value.plans);
  if (
    !entries.length ||
    entries.length > 201 ||
    !Object.hasOwn(value.plans, String(value.activeYear))
  )
    throw new Error("The active year must have a saved plan.");
  for (const [key, p] of entries) {
    const errors = validatePlan(p, version);
    if (errors.length) throw new Error("Plan " + key + ": " + errors[0]);
    if (key !== String((p as AnnualPlan).year))
      throw new Error("Plan year does not match its saved key.");
  }
  const plans = Object.fromEntries(
    entries.map(([key, input]) => {
      const p = input as Omit<AnnualPlan, "denominator" | "commitments"> & {
        completedBillableHours?: number;
        denominator: Denominator;
        commitments: {
          id: string;
          name: string;
          hours: number;
          taken: number;
          future: number;
        }[];
      };
      const plan: AnnualPlan = {
        year: p.year,
        hoursPerDay: p.hoursPerDay,
        workingDays: [...p.workingDays],
        billabilityGoalPct: p.billabilityGoalPct,
        currentBillabilityPct: version === 1 ? 0 : p.currentBillabilityPct,
        calculationDate: p.calculationDate,
        denominator: "scheduled",
        observation: p.observation,
        holidayOverrides: Object.fromEntries(
          Object.entries(p.holidayOverrides),
        ),
        floatingHolidays: p.floatingHolidays.map((h) => ({
          id: h.id,
          date: h.date,
          hours: h.hours,
          status: h.status,
        })),
        vacation: { taken: p.vacation.taken, future: p.vacation.future },
        sick: { taken: p.sick.taken, future: p.sick.future },
        commitments:
          version === 3
            ? p.commitments.map((c) => ({
                id: c.id,
                name: c.name.trim(),
                taken: c.taken,
                future: c.future,
              }))
            : [
                {
                  id: "hs",
                  name: "H&S training",
                  taken: 0,
                  future: p.commitments.find((c) => c.id === "hs")!.hours,
                },
                {
                  id: "admin",
                  name: "Admin / Other non-billable",
                  taken: 0,
                  future: p.commitments
                    .filter((c) =>
                      ["admin", "other", "meetings"].includes(c.id),
                    )
                    .reduce((s, c) => s + c.hours, 0),
                },
                ...p.commitments
                  .filter(
                    (c) => !["hs", "admin", "other", "meetings"].includes(c.id),
                  )
                  .map((c) => ({
                    id: c.id,
                    name: c.name.trim(),
                    taken: 0,
                    future: c.hours,
                  })),
              ],
      };
      if (version < 3) {
        const r = calculate(plan);
        const legacyBasis =
          p.denominator === "scheduled"
            ? r.elapsedScheduledHours
            : Math.max(
                0,
                r.elapsedScheduledHours -
                  r.takenHolidayHours -
                  (p.denominator === "available"
                    ? p.vacation.taken + p.sick.taken
                    : 0),
              );
        const oldCompleted =
          version === 1
            ? p.completedBillableHours!
            : (legacyBasis * p.currentBillabilityPct) / 100;
        plan.currentBillabilityPct =
          r.elapsedScheduledHours > 0
            ? Math.min(100, (oldCompleted / r.elapsedScheduledHours) * 100)
            : 0;
        if (version === 1) plan.legacyCompletedBillableHours = oldCompleted;
        else if (p.legacyCompletedBillableHours !== undefined)
          plan.legacyCompletedBillableHours = p.legacyCompletedBillableHours;
        plan.migrationNotice =
          "Updated to all scheduled hours: every non-billable hour now counts against the goal. Current utilization was converted to preserve estimated completed hours where possible. Older H&S/admin/category totals were placed in Planned because their used/planned split was unknown; review them.";
      } else {
        if (p.holidayAllowanceDays !== undefined)
          plan.holidayAllowanceDays = p.holidayAllowanceDays;
        if (p.simpleInputs)
          plan.simpleInputs = {
            holidayDays: p.simpleInputs.holidayDays,
            vacationHours: p.simpleInputs.vacationHours,
            sickHours: p.simpleInputs.sickHours,
            hsHours: p.simpleInputs.hsHours,
            adminHours: p.simpleInputs.adminHours,
          };
        if (p.legacyCompletedBillableHours !== undefined)
          plan.legacyCompletedBillableHours = p.legacyCompletedBillableHours;
        if (p.migrationNotice) plan.migrationNotice = p.migrationNotice;
      }
      return [key, plan];
    }),
  );
  const requestedActiveYear =
    openDefaultYear && version < 3
      ? DEFAULT_YEAR
      : (value.activeYear as number);
  const activeYear =
    requestedActiveYear >= MIN_SELECTABLE_YEAR &&
    requestedActiveYear <= MAX_SELECTABLE_YEAR
      ? requestedActiveYear
      : DEFAULT_YEAR;
  if (!plans[activeYear]) plans[activeYear] = defaultPlan(activeYear);
  return {
    version: 3,
    activeYear,
    theme: value.theme as SavedState["theme"],
    plans,
  };
}
