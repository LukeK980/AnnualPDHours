import { format, isValid, parseISO } from "date-fns";
export const dateString = (date: Date) => format(date, "yyyy-MM-dd");
export function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    isValid(parseISO(value)) &&
    dateString(parseISO(value)) === value
  );
}
export const isObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
export const finite = (v: unknown, max = 100000) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
const fixedIds = [
  "new-year",
  "memorial",
  "independence",
  "labor",
  "thanksgiving",
  "thanksgiving-friday",
  "christmas",
];
export function validatePlan(value: unknown, version: 1 | 2 | 3 = 3): string[] {
  if (!isObject(value)) return ["Plan must be an object."];
  const errors: string[] = [];
  if (
    !Number.isInteger(value.year) ||
    !finite(value.year, 2100) ||
    (value.year as number) < 1900
  )
    errors.push("Year must be between 1900 and 2100.");
  if (!finite(value.hoursPerDay, 24) || value.hoursPerDay === 0)
    errors.push("Hours per workday must be greater than 0 and at most 24.");
  if (
    !Array.isArray(value.workingDays) ||
    !value.workingDays.length ||
    value.workingDays.some((d) => !Number.isInteger(d) || d < 0 || d > 6) ||
    new Set(value.workingDays).size !== value.workingDays.length
  )
    errors.push("Choose at least one distinct working weekday.");
  if (!finite(value.billabilityGoalPct, 100))
    errors.push("Billability goal must be between 0% and 100%.");
  if (
    version === 1
      ? !finite(value.completedBillableHours)
      : !finite(value.currentBillabilityPct, 100)
  )
    errors.push(
      version === 1
        ? "Completed billable hours must be a nonnegative number."
        : "Current billability must be between 0% and 100%.",
    );
  if (
    value.legacyCompletedBillableHours !== undefined &&
    !finite(value.legacyCompletedBillableHours)
  )
    errors.push("Invalid previous billable-hours reference.");
  if (
    value.migrationNotice !== undefined &&
    (typeof value.migrationNotice !== "string" ||
      value.migrationNotice.length > 1000)
  )
    errors.push("Invalid migration notice.");
  if (!validDate(value.calculationDate))
    errors.push("Enter a valid calculation date.");
  if (
    !(
      version === 3
        ? ["scheduled"]
        : ["available", "scheduled", "after_holidays"]
    ).includes(String(value.denominator))
  )
    errors.push("Unknown denominator assumption.");
  if (
    !["actual", "nearest_weekday", "next_monday"].includes(
      String(value.observation),
    )
  )
    errors.push("Unknown holiday observation assumption.");
  for (const key of ["vacation", "sick"]) {
    const off = value[key];
    if (!isObject(off) || !finite(off.taken) || !finite(off.future))
      errors.push(`${key} hours must be nonnegative numbers.`);
  }
  const dateInYear = (v: unknown) =>
    validDate(v) && Number(v.slice(0, 4)) === value.year;
  if (
    !isObject(value.holidayOverrides) ||
    Object.entries(value.holidayOverrides).some(
      ([id, date]) => !fixedIds.includes(id) || !dateInYear(date),
    )
  )
    errors.push(
      "Observed holiday dates must be valid dates in the selected year.",
    );
  if (
    !Array.isArray(value.floatingHolidays) ||
    value.floatingHolidays.length !== 2 ||
    value.floatingHolidays.some(
      (h, index) =>
        !isObject(h) ||
        h.id !== `floating-${index + 1}` ||
        !["not_taken", "planned", "taken"].includes(String(h.status)) ||
        !finite(h.hours, 24) ||
        (h.date !== "" && !dateInYear(h.date)),
    )
  )
    errors.push(
      "Provide two valid floating holidays, each with 0–24 hours and an optional date in the selected year.",
    );
  if (
    !Array.isArray(value.commitments) ||
    value.commitments.length < (version === 3 ? 2 : 4) ||
    value.commitments.length > 50 ||
    value.commitments.some(
      (c) =>
        !isObject(c) ||
        typeof c.id !== "string" ||
        !c.id ||
        typeof c.name !== "string" ||
        !c.name.trim() ||
        c.name.length > 80 ||
        (version === 3
          ? !finite(c.taken) || !finite(c.future)
          : !finite(c.hours)),
    ) ||
    new Set(value.commitments.map((c) => (isObject(c) ? c.id : undefined)))
      .size !== value.commitments.length ||
    (version === 3
      ? ["hs", "admin"]
      : ["hs", "admin", "meetings", "other"]
    ).some(
      (id) =>
        !(value.commitments as unknown[]).some(
          (c) => isObject(c) && c.id === id,
        ),
    )
  )
    errors.push(
      "Provide H&S and Admin/Other plus valid unique categories, with nonnegative taken/planned hours (maximum 50).",
    );
  return errors;
}
