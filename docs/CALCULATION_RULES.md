# AnnualPDHours — Calculation Rules

These are the owner's requested planning rules, not confirmed Terraphase policy. Observed holiday dates remain configurable. The 2026-11-06 full-schedule convention supersedes the earlier leave-excluding denominator.

## Simple and Refined calculators — 2026-11-10

User-facing terminology is **utilization goal**, **current utilization**, **used**, and **anticipated sick leave**. Legacy TypeScript/JSON field names remain compatible with older backups.

Simple Calculator is independent of date and current utilization. It computes scheduled annual hours with the existing calendar helper, then:

`availableAnnualNonBillable = scheduledHours × (1 − utilizationGoal / 100) − holidayDays × hoursPerDay − annualVacation − anticipatedAnnualSick − annualHs − annualAdmin`.

Defaults are nine paid days (including floating holidays), 52 administration hours for timesheets/expense reports, and zero H&S until entered. Inputs are editable assumptions, not company policy. Clamp the displayed result to zero and separately report any deficit. Example for 2027 Mon–Fri, 8 h/day and 80% goal: scheduled 2,088, non-billable allowance 417.6; holidays 72 and admin 52 leave 293.6 before other inputs. Vacation 120, anticipated sick 24 and H&S 8 leave 141.6.

Refined Calculator retains the mid-year engine below and estimates available **PD** after annual assumptions and other responsibilities. Used entries already reflected in current utilization are not deducted twice; future custom responsibilities (DG/staffing meetings, BD/PD events, etc.) reserve additional time. The explicit Simple→Refined action copies annual assumptions, subtracting preserved used amounts to determine future amounts. It preserves custom responsibilities and refuses transfers that would erase used hours or under-reserve configured holidays.

New Refined plans have an editable annual paid-holiday allowance of nine days and planned admin 52. Calendar/floating dates still book eligible hours once. Add an undated reservation only for `max(0, annualHolidayAllowance − calendarHolidayHours)`, so updating observation dates never double-counts the allowance. Undated allowance remains future during the selected year; after it ends, no future holiday time is inferred. A calendar total above the allowance generates a warning and is not silently reduced. Older backups lacking the optional allowance retain calendar-only behavior. The midyear fixture below explicitly uses that calendar-only behavior.

Optional `simpleInputs` and `holidayAllowanceDays` are validated/sanitized and included in v3 backups. Existing stored plans remain intact until the user explicitly carries new annual assumptions into Refined. Annual goal and work schedule are shared by both calculators.

## Annual goal: all non-billable time counts

- `scheduledHours`: calendar workdays × configured hours/day. Never assume every year has 2,080 hours.
- `billableTargetHours = scheduledHours × billabilityGoalPct / 100`.
- `annualNonBillableBudget = scheduledHours - billableTargetHours`.
- Vacation, sick leave, paid holidays (including floating holidays), H&S training, admin/other, custom categories and PD all consume this same non-billable allowance. None reduces the billability denominator.
- Annual category total = used hours + future planned hours. New-plan H&S starts at zero and administration at 52 future hours; all assumptions are editable.
- Example: 2,080 scheduled hours and an 80% goal = 1,664 required billable hours and 416 non-billable hours. Holidays 72 + vacation 120 + sick 24 + training/admin 144 consume 360, leaving 56 available, before any additional already-used non-billable time implied by current billability.

## Midyear usage and remaining availability

The selected calculation date is the first day of the remaining forecast, included through December 31. Elapsed hours are strictly before it.

- `elapsedScheduledHours = scheduledHours - remainingScheduledHours`.
- `estimatedCompletedBillableHours = elapsedScheduledHours × currentBillabilityPct / 100`.
- `estimatedUsedNonBillableHours = elapsedScheduledHours - estimatedCompletedBillableHours`.
- `knownTakenNonBillableHours` = past counted dated holidays + undated Taken floating holidays + vacation taken + sick taken + H&S/admin/custom taken.
- Taken entries are already inside the percentage-implied non-billable total. Do **not** add both totals together.
- `usedNonBillableHours = max(estimatedUsedNonBillableHours, knownTakenNonBillableHours)`.
- `unitemizedTakenNonBillableHours = max(0, estimatedUsedNonBillableHours - knownTakenNonBillableHours)`. This covers already-used non-billable time not itemized, potentially including prior PD.
- If known taken hours exceed the percentage-implied total, flag the conflict, reserve the larger used amount conservatively, and pause the pie until inputs reconcile. Do not silently change the entered percentage or pretend inconsistent inputs are exact.
- `plannedNonBillableHours` = future holiday reservations + future vacation/sick leave + planned H&S/admin/custom hours.
- `remainingNonBillableAllowanceRaw = min(annualNonBillableBudget - usedNonBillableHours, remainingScheduledHours)`.
- `availableNonBillableRaw = remainingNonBillableAllowanceRaw - plannedNonBillableHours`.
- Display available hours as `max(0, availableNonBillableRaw)` and any deficit separately. The remaining allowance before plans is also shown, separately from availability after plans.
- Cap remaining availability by physical scheduled time, including when billable completion already exceeds the annual target.

Current billability is a schedule-based estimate using **all scheduled time**, including paid leave. It is not an exact timesheet reconstruction. Changing the date, schedule or entered current percentage changes estimates. Dates before the selected year yield zero elapsed hours; dates after it yield no remaining time. Never subtract taken leave/training/admin again from future capacity.

## Remaining billable requirement

- `billableHoursRemaining = max(0, billableTargetHours - estimatedCompletedBillableHours)`.
- `remainingAvailableHours = max(0, remainingScheduledHours - plannedNonBillableHours)`.
- `remainingEffectiveWeeks = remainingAvailableHours / standardScheduledWeeklyHours`.
- `requiredWeeklyBillable = billableHoursRemaining / remainingEffectiveWeeks` when weeks > 0.
- If no weeks remain, show no working time left when the target is outstanding, or zero when the target is met.
- Feasibility requires the remaining billable target to fit future available hours **after all future non-billable reservations**, with no conflicting taken inputs.
- Undated plans are aggregate estimates. Leave must exclude holidays because vacation/sick dates are not tracked.

## Holidays

Seven fixed rules: Jan 1; last Monday of May; July 4; first Monday of September; fourth Thursday of November; following Friday; Dec 25. Two floating holidays have status Not Taken / Planned / Taken, optional date and hours.

- Only scheduled dates in the selected year count. Actual dates are the default; nearest weekday, next Monday, and individual observed dates are configurable. No official weekend policy is asserted.
- Dated overlaps count once up to scheduled daily hours. Fixed holidays are booked before floating holidays.
- Undated floating holidays reserve up to one workday annually. Unless Taken, they reserve future time while work remains in that year. A Taken holiday is never deducted again from future time.
- Flag conflicting status/date combinations and off-schedule dates. Outside-year observations count zero until overridden.
- Nine nominal 8-hour days = 72 hours only if all are counted under the schedule/observation choices. For 2027 Mon–Fri, actual dates count 56 hours; nearest-weekday observation counts 72.

## Chart and rounding

The pie represents the whole scheduled year. Billable target is therefore exactly the entered goal percentage. If completed billable hours already exceed the target, show the higher completed amount and label it. Use no padding angle that changes perceived proportions. Clamp negative available slices to zero, but pause the chart for overallocated/conflicting/non-reconciling data instead of normalizing excess allocations into misleading percentages.

Show annual leave/category totals, percentage-implied unitemized used time without counting already-reserved holiday amounts twice, and available non-billable time. Round only for display. Preserve precise values for subsequent calculations. Never label a plan “on track” merely because it has a certain goal-completion percentage.

## Midyear regression fixture

2026 Mon–Fri, 8 h/day; calculation date October 14; actual holiday dates; current billability 85%, annual goal 80%. Vacation taken 64/planned 56; sick taken 24/planned 8; H&S taken 24/planned 8; admin taken 80/planned 16; both floating holidays undated Not Taken.

- Scheduled 2,088; elapsed 1,632; estimated completed billable 1,387.2.
- Annual target 1,670.4; annual non-billable allowance 417.6.
- Known taken 216; percentage-implied used 244.8 (includes known taken); unitemized used 28.8.
- Planned non-billable 128; allowance remaining before plans 172.8; available after plans 44.8.
- Remaining scheduled 456; available after future reservations 328; remaining billable target 283.2; required average ≈34.5 billable hours per equivalent available workweek.

## Storage and migration

Version 3 stores taken/future hours per commitment and fixes the denominator to scheduled hours. Default new year is 2027; dates default to today within the selected year, otherwise clamp to its first/last day. Existing year plans remain selectable.

Import v1/v2: preserve schedules, leave, holiday overrides, custom categories and theme. Convert older current percentages using their previous elapsed denominator to preserve estimated completed billable hours when possible; convert v1 absolute hours directly. Retain original v1 hours for reference, cap percentages at 100 (zero if elapsed hours are zero), and warn for impossible conversions. Combine prior Admin/Other/Meetings totals into Admin/Other; assign old annual-only commitment totals to Planned because the taken/planned split was unknown, with a visible review notice. Browser migration initially opens 2027, preserving other plans and old keys; explicit imports respect the backup's active year. V3 saves remember later year choices.
