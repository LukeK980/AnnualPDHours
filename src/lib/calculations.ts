import {
  addDays,
  eachDayOfInterval,
  endOfYear,
  getDay,
  parseISO,
  startOfYear,
} from "date-fns";
import { dateString, validatePlan } from "./validation";
import type {
  AnnualPlan,
  CalculationResult,
  HolidayRecord,
  Observation,
} from "./types";

export function fixedHolidays(year: number) {
  const nth = (month: number, weekday: number, occurrence: number) => {
    const first = new Date(year, month, 1);
    return new Date(
      year,
      month,
      1 + ((weekday - getDay(first) + 7) % 7) + 7 * (occurrence - 1),
    );
  };
  const mayLast = new Date(year, 4, 31);
  const thanksgiving = nth(10, 4, 4);
  return [
    { id: "new-year", name: "New Year's Day", date: new Date(year, 0, 1) },
    {
      id: "memorial",
      name: "Memorial Day",
      date: addDays(mayLast, -(getDay(mayLast) - 1 + 7) % 7),
    },
    {
      id: "independence",
      name: "Independence Day",
      date: new Date(year, 6, 4),
    },
    { id: "labor", name: "Labor Day", date: nth(8, 1, 1) },
    { id: "thanksgiving", name: "Thanksgiving Day", date: thanksgiving },
    {
      id: "thanksgiving-friday",
      name: "Day after Thanksgiving",
      date: addDays(thanksgiving, 1),
    },
    { id: "christmas", name: "Christmas Day", date: new Date(year, 11, 25) },
  ];
}
export function observedDate(date: Date, policy: Observation) {
  const day = getDay(date);
  if (policy === "nearest_weekday")
    return addDays(date, day === 6 ? -1 : day === 0 ? 1 : 0);
  if (policy === "next_monday")
    return addDays(date, day === 6 ? 2 : day === 0 ? 1 : 0);
  return date;
}
/** Every non-billable hour consumes the full scheduled-hours allowance. */
export function annualCapacity(
  scheduled: number,
  holidays: number,
  vacation: number,
  sick: number,
  goal: number,
  commitments: number,
) {
  const billableTargetHours = (scheduled * goal) / 100;
  const annualNonBillableBudget = scheduled - billableTargetHours;
  const annualCommittedNonBillableHours =
    holidays + vacation + sick + commitments;
  const availableNonBillableRaw =
    annualNonBillableBudget - annualCommittedNonBillableHours;
  return {
    availableWorkingHours: Math.max(0, scheduled - holidays - vacation - sick),
    denominatorHours: scheduled,
    billableTargetHours,
    annualNonBillableBudget,
    annualCommittedNonBillableHours,
    availableNonBillableRaw,
    availableNonBillableHours: Math.max(0, availableNonBillableRaw),
    overallocationHours: Math.max(0, -availableNonBillableRaw),
    leaveOverallocation: Math.max(0, holidays + vacation + sick - scheduled),
  };
}
export function calculate(plan: AnnualPlan): CalculationResult {
  const errors = validatePlan(plan);
  if (errors.length) throw new Error(errors.join(" "));
  const yearDate = new Date(plan.year, 0, 1);
  const workdays = eachDayOfInterval({
    start: startOfYear(yearDate),
    end: endOfYear(yearDate),
  }).filter((d) => plan.workingDays.includes(getDay(d)));
  const scheduledHours = workdays.length * plan.hoursPerDay;
  const remainingWorkdays = workdays.filter(
    (d) => dateString(d) >= plan.calculationDate,
  ).length;
  const warnings: string[] = [];
  const booked = new Map<string, number>();
  const book = (date: string, hours: number, name: string): number => {
    if (
      Number(date.slice(0, 4)) !== plan.year ||
      !plan.workingDays.includes(getDay(parseISO(date)))
    ) {
      warnings.push(
        `${name}: ${date} is outside this year's work schedule; no hours deducted. Choose an observed date if needed.`,
      );
      return 0;
    }
    const prior = booked.get(date) ?? 0;
    const counted = Math.min(hours, Math.max(0, plan.hoursPerDay - prior));
    if (counted < hours)
      warnings.push(
        `${name}: overlapping holiday hours or hours above the daily schedule were not counted twice on ${date}.`,
      );
    booked.set(date, prior + counted);
    return counted;
  };
  const holidays: HolidayRecord[] = fixedHolidays(plan.year).map((h) => {
    const date =
      plan.holidayOverrides[h.id] ??
      dateString(observedDate(h.date, plan.observation));
    const hours = book(date, plan.hoursPerDay, h.name);
    return {
      id: h.id,
      name: h.name,
      date,
      hours,
      futureHours: date >= plan.calculationDate ? hours : 0,
    };
  });
  for (const [index, h] of plan.floatingHolidays.entries()) {
    const name = `Floating Holiday #${index + 1}`;
    const hours = h.date
      ? book(h.date, h.hours, name)
      : Math.min(h.hours, plan.hoursPerDay);
    if (!h.date && h.hours > plan.hoursPerDay)
      warnings.push(`${name}: reserved hours were capped at one workday.`);
    const futureHours =
      h.status === "taken" || plan.calculationDate > `${plan.year}-12-31`
        ? 0
        : !h.date || h.date >= plan.calculationDate
          ? hours
          : 0;
    if (
      h.date &&
      ((h.status === "taken" && h.date >= plan.calculationDate) ||
        (h.status !== "taken" && h.date < plan.calculationDate))
    )
      warnings.push(
        `${name}: status and date conflict. Taken holidays are never deducted from future hours; dated holidays before the calculation date are excluded from the forecast.`,
      );
    holidays.push({
      id: h.id,
      name,
      date: h.date,
      hours,
      futureHours,
      status: h.status,
    });
  }
  const holidayHours = holidays.reduce((sum, h) => sum + h.hours, 0);
  const futureHolidayHours = holidays.reduce(
    (sum, h) => sum + h.futureHours,
    0,
  );
  const vacationHours = plan.vacation.taken + plan.vacation.future;
  const sickHours = plan.sick.taken + plan.sick.future;
  const takenHolidayHours = holidays.reduce(
    (sum, h) =>
      sum +
      (h.date
        ? h.date < plan.calculationDate
          ? h.hours
          : 0
        : h.status === "taken"
          ? h.hours
          : 0),
    0,
  );
  const futureCommitmentHours = plan.commitments.reduce(
    (sum, c) => sum + c.future,
    0,
  );
  const takenCommitmentHours = plan.commitments.reduce(
    (sum, c) => sum + c.taken,
    0,
  );
  const requiredOtherNonBillable = takenCommitmentHours + futureCommitmentHours;
  const annual = annualCapacity(
    scheduledHours,
    holidayHours,
    vacationHours,
    sickHours,
    plan.billabilityGoalPct,
    requiredOtherNonBillable,
  );
  const remainingScheduledHours = remainingWorkdays * plan.hoursPerDay;
  const elapsedScheduledHours = scheduledHours - remainingScheduledHours;
  const elapsedHolidayHours = takenHolidayHours;
  const elapsedDenominatorHours = elapsedScheduledHours;
  const estimatedCompletedBillableHours =
    (elapsedScheduledHours * plan.currentBillabilityPct) / 100;
  const estimatedUsedNonBillableHours =
    elapsedScheduledHours - estimatedCompletedBillableHours;
  const knownTakenNonBillableHours =
    takenHolidayHours +
    plan.vacation.taken +
    plan.sick.taken +
    takenCommitmentHours;
  const inputConflictHours = Math.max(
    0,
    knownTakenNonBillableHours - estimatedUsedNonBillableHours,
  );
  const unitemizedTakenNonBillableHours = Math.max(
    0,
    estimatedUsedNonBillableHours - knownTakenNonBillableHours,
  );
  // Known taken entries are part of the percentage-implied total, never added to it twice.
  const usedNonBillableHours = Math.max(
    estimatedUsedNonBillableHours,
    knownTakenNonBillableHours,
  );
  const plannedNonBillableHours =
    futureHolidayHours +
    plan.vacation.future +
    plan.sick.future +
    futureCommitmentHours;
  const billableHoursRemaining = Math.max(
    0,
    annual.billableTargetHours - estimatedCompletedBillableHours,
  );
  const remainingNonBillableAllowanceRaw = Math.min(
    annual.annualNonBillableBudget - usedNonBillableHours,
    remainingScheduledHours,
  );
  const remainingNonBillableAllowance = Math.max(
    0,
    remainingNonBillableAllowanceRaw,
  );
  const availableNonBillableRaw =
    remainingNonBillableAllowanceRaw - plannedNonBillableHours;
  const availableNonBillableHours = Math.max(0, availableNonBillableRaw);
  const overallocationHours = Math.max(0, -availableNonBillableRaw);
  const remainingAvailableHours = Math.max(
    0,
    remainingScheduledHours - plannedNonBillableHours,
  );
  const standardWeeklyHours = plan.workingDays.length * plan.hoursPerDay;
  const remainingEffectiveWeeks = remainingAvailableHours / standardWeeklyHours;
  const requiredWeeklyBillable =
    remainingEffectiveWeeks > 0
      ? billableHoursRemaining / remainingEffectiveWeeks
      : billableHoursRemaining === 0
        ? 0
        : null;
  const feasible =
    billableHoursRemaining <= remainingAvailableHours + 1e-9 &&
    inputConflictHours < 0.01;
  if (inputConflictHours > 0.01)
    warnings.push(
      "Taken non-billable entries exceed the total implied by current billability by " +
        inputConflictHours.toFixed(1) +
        " hours. Check your percentage, date, and taken entries. Available hours use the larger taken amount conservatively.",
    );
  if (plannedNonBillableHours > remainingScheduledHours)
    warnings.push(
      "Planned leave, holidays, training and admin exceed remaining scheduled time.",
    );
  if (elapsedScheduledHours === 0 && plan.currentBillabilityPct > 0)
    warnings.push(
      "No working hours have passed in this year before the calculation date; estimated completed billable hours are zero.",
    );
  if (
    plan.legacyCompletedBillableHours !== undefined &&
    Math.abs(
      plan.legacyCompletedBillableHours - estimatedCompletedBillableHours,
    ) > 0.01
  )
    warnings.push(
      "The original saved completed-hours value differs from this schedule-based estimate. Review current billability; original hours remain in your backup.",
    );
  const unitemizedChartHours = Math.max(
    0,
    usedNonBillableHours -
      (holidayHours -
        futureHolidayHours +
        plan.vacation.taken +
        plan.sick.taken +
        takenCommitmentHours),
  );
  const colors = ["#6366f1", "#64748b", "#a78bfa", "#f59e0b"];
  const allocations = [
    {
      id: "billable",
      name:
        estimatedCompletedBillableHours > annual.billableTargetHours
          ? "Billable work (completed above goal)"
          : "Billable work (annual goal)",
      hours: Math.max(
        annual.billableTargetHours,
        estimatedCompletedBillableHours,
      ),
      color: "#163a63",
    },
    {
      id: "vacation",
      name: "Vacation",
      hours: vacationHours,
      color: "#38bdf8",
    },
    { id: "sick", name: "Sick leave", hours: sickHours, color: "#fb7185" },
    {
      id: "holidays",
      name: "Paid holidays",
      hours: holidayHours,
      color: "#fbbf24",
    },
    ...plan.commitments.map((c, i) => ({
      id: "commitment:" + c.id,
      name: c.name,
      hours: c.taken + c.future,
      color: colors[i % colors.length],
    })),
    {
      id: "unitemized",
      name: "Other already-used non-billable (estimated)",
      hours: unitemizedChartHours,
      color: "#c084fc",
    },
    {
      id: "available",
      name: "Available non-billable hours",
      hours: availableNonBillableHours,
      color: "#0d9488",
    },
  ];
  const allocationHours = allocations.reduce((sum, a) => sum + a.hours, 0);
  if (
    Math.abs(allocationHours - scheduledHours) > 0.01 &&
    overallocationHours < 0.01 &&
    inputConflictHours < 0.01
  )
    warnings.push(
      "Annual entries and the calculation date do not reconcile to scheduled hours. Check taken/planned status, especially for past years.",
    );
  return {
    ...annual,
    scheduledHours,
    workingDays: workdays.length,
    holidayHours,
    futureHolidayHours,
    takenHolidayHours,
    vacationHours,
    sickHours,
    requiredOtherNonBillable,
    knownTakenNonBillableHours,
    estimatedUsedNonBillableHours,
    usedNonBillableHours,
    unitemizedTakenNonBillableHours,
    plannedNonBillableHours,
    futureCommitmentHours,
    inputConflictHours,
    remainingNonBillableAllowanceRaw,
    remainingNonBillableAllowance,
    availableNonBillableRaw,
    availableNonBillableHours,
    overallocationHours,
    billableHoursRemaining,
    elapsedDenominatorHours,
    elapsedScheduledHours,
    elapsedHolidayHours,
    estimatedCompletedBillableHours,
    progressPct:
      annual.billableTargetHours > 0
        ? (estimatedCompletedBillableHours / annual.billableTargetHours) * 100
        : 100,
    remainingWorkdays,
    remainingScheduledHours,
    remainingAvailableHours,
    standardWeeklyHours,
    remainingEffectiveWeeks,
    requiredWeeklyBillable,
    feasible,
    holidays,
    allocations,
    warnings,
  };
}
