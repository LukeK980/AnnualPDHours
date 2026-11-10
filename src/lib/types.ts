export type FloatingStatus = "not_taken" | "planned" | "taken";
/** Legacy denominator values are accepted only while importing older backups. */
export type Denominator = "available" | "scheduled" | "after_holidays";
export type Observation = "actual" | "nearest_weekday" | "next_monday";
export type Theme = "light" | "dark" | "system";
export interface TimeOff {
  taken: number;
  future: number;
}
export interface Commitment extends TimeOff {
  id: string;
  name: string;
}
export interface FloatingHoliday {
  id: string;
  status: FloatingStatus;
  date: string;
  hours: number;
}
export interface SimpleInputs {
  holidayDays: number;
  vacationHours: number;
  sickHours: number;
  hsHours: number;
  adminHours: number;
}
export interface AnnualPlan {
  year: number;
  hoursPerDay: number;
  workingDays: number[];
  billabilityGoalPct: number;
  currentBillabilityPct: number;
  legacyCompletedBillableHours?: number;
  migrationNotice?: string;
  simpleInputs?: SimpleInputs;
  holidayAllowanceDays?: number;
  calculationDate: string;
  denominator: "scheduled";
  observation: Observation;
  holidayOverrides: Record<string, string>;
  floatingHolidays: FloatingHoliday[];
  vacation: TimeOff;
  sick: TimeOff;
  commitments: Commitment[];
}
export interface HolidayRecord {
  id: string;
  name: string;
  date: string;
  hours: number;
  futureHours: number;
  status?: FloatingStatus;
}
export interface Allocation {
  id: string;
  name: string;
  hours: number;
  color: string;
}
export interface CalculationResult {
  scheduledHours: number;
  workingDays: number;
  holidayHours: number;
  futureHolidayHours: number;
  takenHolidayHours: number;
  vacationHours: number;
  sickHours: number;
  availableWorkingHours: number;
  denominatorHours: number;
  billableTargetHours: number;
  annualNonBillableBudget: number;
  annualCommittedNonBillableHours: number;
  requiredOtherNonBillable: number;
  knownTakenNonBillableHours: number;
  estimatedUsedNonBillableHours: number;
  usedNonBillableHours: number;
  unitemizedTakenNonBillableHours: number;
  plannedNonBillableHours: number;
  futureCommitmentHours: number;
  inputConflictHours: number;
  remainingNonBillableAllowanceRaw: number;
  remainingNonBillableAllowance: number;
  availableNonBillableRaw: number;
  availableNonBillableHours: number;
  overallocationHours: number;
  leaveOverallocation: number;
  billableHoursRemaining: number;
  progressPct: number;
  elapsedDenominatorHours: number;
  elapsedScheduledHours: number;
  elapsedHolidayHours: number;
  estimatedCompletedBillableHours: number;
  remainingWorkdays: number;
  remainingScheduledHours: number;
  remainingAvailableHours: number;
  standardWeeklyHours: number;
  remainingEffectiveWeeks: number;
  requiredWeeklyBillable: number | null;
  feasible: boolean;
  holidays: HolidayRecord[];
  allocations: Allocation[];
  warnings: string[];
}
export interface SavedState {
  version: 3;
  activeYear: number;
  theme: Theme;
  plans: Record<string, AnnualPlan>;
}
