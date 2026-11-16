import type { AnnualPlan } from "./types";

export const weeklyHours = (p: AnnualPlan) =>
  p.weeklyHours ?? p.hoursPerDay * p.workingDays.length;
export const proration = (p: AnnualPlan) =>
  p.weeklyHours === undefined ? 1 : Math.min(1, weeklyHours(p) / 40);
export const dailyHours = (p: AnnualPlan) =>
  weeklyHours(p) / p.workingDays.length;
export const holidayDayHours = (p: AnnualPlan) =>
  p.weeklyHours === undefined ? p.hoursPerDay : 8 * proration(p);
/** Weekdays affect forecast timing, never the 52-week annual budget. */
export function updateSchedule(
  p: AnnualPlan,
  weekly: number,
  days = p.workingDays,
): AnnualPlan {
  return {
    ...p,
    weeklyHours: weekly,
    workingDays: days,
    hoursPerDay: weekly / days.length,
  };
}
