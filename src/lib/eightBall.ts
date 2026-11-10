import type { CalculationResult } from "./types";
export const classicAnswers = [
  "The outlook is bright. So is that unopened course tab.",
  "Signs point to yes. Your spreadsheet can wait.",
  "Ask again after coffee.",
  "Without a doubt. Bring a notebook, leave with ideas.",
  "Reply hazy. Try a shorter webinar.",
  "The universe recommends learning something new.",
  "Outlook good. Your future self has already thanked you.",
  "Concentrate and ask again. Preferably off mute.",
];
export function smartAnswer(
  question: string,
  result: CalculationResult,
): string {
  const duration = question.match(
    /(?:^|[^\w.,])(-?\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:-\s*)?(hours?|hrs?|h)\b/i,
  );
  if (duration) {
    const hours = Number(duration[1].replaceAll(",", ""));
    if (hours <= 0)
      return "Enter an activity duration greater than zero hours.";
    if (
      result.overallocationHours > 0 ||
      result.leaveOverallocation > 0 ||
      result.inputConflictHours > 0.01
    )
      return `Review the non-billable deficit or conflicting used entries before budgeting a ${hours}-hour activity.`;
    return hours <= result.availableNonBillableHours
      ? `A ${hours}-hour activity fits your remaining non-billable budget of ${result.availableNonBillableHours.toFixed(1)} hours, leaving ${(result.availableNonBillableHours - hours).toFixed(1)} hours. This estimate accounts for used non-billable hours and future reservations. It does not grant company approval or reserve an event date.`
      : `A ${hours}-hour activity exceeds your remaining non-billable budget of ${result.availableNonBillableHours.toFixed(1)} hours by ${(hours - result.availableNonBillableHours).toFixed(1)} hours. Try a shorter activity or adjust your plan.`;
  }
  if (/weekly|per week|each week/i.test(question))
    return result.requiredWeeklyBillable === null
      ? "No working time remains to complete your billable target."
      : `Your required average is ${result.requiredWeeklyBillable.toFixed(1)} billable hours per equivalent available workweek, after all future reservations. ${result.feasible ? "The target fits the planned schedule." : "Review the capacity shortfall or conflicting inputs."}`;
  if (
    /how (many|much).*(pd|development)|pd (hours|budget)|capacity/i.test(
      question,
    )
  )
    return `Your available non-billable time is ${result.availableNonBillableHours.toFixed(1)} hours.${result.overallocationHours ? ` The plan is overallocated by ${result.overallocationHours.toFixed(1)} hours.` : ""} This is available after estimated used non-billable time and future plans; PD can use part of it.`;
  return "I can compare an activity duration with your remaining non-billable budget, or calculate your weekly billable requirement. Try “Can I attend a 24-hour conference?” These answers use your plan, not an AI service.";
}
