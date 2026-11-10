import type { AnnualPlan, SimpleInputs } from "./types";
import { calculate, scheduledWorkdays } from "./calculations";
import { validatePlan } from "./validation";

export function simpleInputs(plan: AnnualPlan): SimpleInputs {
  if (plan.simpleInputs) return plan.simpleInputs;
  const annual = (id: string) => {
    const c = plan.commitments.find((c) => c.id === id);
    return c ? c.taken + c.future : 0;
  };
  return {
    holidayDays: plan.holidayAllowanceDays ?? 9,
    vacationHours: plan.vacation.taken + plan.vacation.future,
    sickHours: plan.sick.taken + plan.sick.future,
    hsHours: annual("hs"),
    adminHours: annual("admin") || 52,
  };
}

export function calculateSimple(plan: AnnualPlan) {
  const errors = validatePlan(plan);
  if (errors.length) throw new Error(errors.join(" "));
  const inputs = simpleInputs(plan);
  const workdays = scheduledWorkdays(plan).length,
    scheduledHours = workdays * plan.hoursPerDay;
  const utilizedHours = (scheduledHours * plan.billabilityGoalPct) / 100;
  const nonBillableAllowance = scheduledHours - utilizedHours;
  const holidayHours = inputs.holidayDays * plan.hoursPerDay;
  const reservedHours =
    holidayHours +
    inputs.vacationHours +
    inputs.sickHours +
    inputs.hsHours +
    inputs.adminHours;
  const availableRaw = nonBillableAllowance - reservedHours;
  return {
    workdays,
    scheduledHours,
    utilizedHours,
    nonBillableAllowance,
    holidayHours,
    reservedHours,
    availableRaw,
    availableHours: Math.max(0, availableRaw),
    deficitHours: Math.max(0, -availableRaw),
  };
}

/** Copy annual assumptions without erasing already-used hours or extra responsibilities. */
export function applySimpleInputs(plan: AnnualPlan): AnnualPlan {
  const result = calculateSimple(plan),
    inputs = simpleInputs(plan);
  const hs = plan.commitments.find((c) => c.id === "hs")!,
    admin = plan.commitments.find((c) => c.id === "admin")!;
  for (const [name, total, used] of [
    ["Vacation", inputs.vacationHours, plan.vacation.taken],
    ["Sick leave", inputs.sickHours, plan.sick.taken],
    ["H&S training", inputs.hsHours, hs.taken],
    ["Administration", inputs.adminHours, admin.taken],
  ] as const) {
    if (total < used)
      throw new Error(
        `${name}: the annual total is less than the ${used} hours already used in Refined Calculator. Increase the annual total or review the used entry there.`,
      );
  }
  const calendarOnly = calculate({ ...plan, holidayAllowanceDays: undefined });
  if (result.holidayHours < calendarOnly.holidayHours)
    throw new Error(
      `Refined Calculator already reserves ${calendarOnly.holidayHours} dated/floating holiday hours. Increase the Simple paid holiday allowance or review those dates first.`,
    );
  return {
    ...plan,
    simpleInputs: { ...inputs },
    holidayAllowanceDays: inputs.holidayDays,
    vacation: {
      taken: plan.vacation.taken,
      future: inputs.vacationHours - plan.vacation.taken,
    },
    sick: {
      taken: plan.sick.taken,
      future: inputs.sickHours - plan.sick.taken,
    },
    commitments: plan.commitments.map((c) =>
      c.id === "hs"
        ? { ...c, future: inputs.hsHours - c.taken }
        : c.id === "admin"
          ? { ...c, future: inputs.adminHours - c.taken }
          : c,
    ),
  };
}
