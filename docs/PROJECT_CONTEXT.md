# AnnualPDHours — Project Memory / Decision Log

> This file is the durable source of truth for future development sessions. It is **repository memory**, not a ChatGPT account memory feature. Update it when requirements or decisions change.

## Project goal

A fully open-source, zero-backend web app for understanding annual non-billable capacity, PD availability, and the weekly billable hours required to reach an annual **percentage-based** billability goal by year-end. Public GitHub repository: `https://github.com/LukeK980/AnnualPDHours`. Intended GitHub Pages URL: `https://lukek980.github.io/AnnualPDHours/` (once deployed).

## Non-negotiable decisions

- Three navigation entries: **Simple Calculator**, **Refined Calculator**, and **PD Magic 8-Ball**. Simple opens first and calculates a full-year non-billable budget. Refined retains the submitted dashboard/results flow for available PD and mid-year forecasting.
- Percentage-based billability goal (not a fixed number entered by the user).
- Dashboard: annual allocation donut, non-billable and PD capacity, completed vs required billable hours, remaining weekly billable target based on calculation date.
- Hours Calculator: default year **2027**, work schedule, annual goal % and current year-to-date billability % using **all scheduled hours**, taken/planned vacation and sick leave, taken/planned H&S and Admin/Other, optional custom categories, and holidays/floating plans. Completed billable hours and total used non-billable time are estimated from current billability; entered taken hours are reconciled without double-counting.
- PD Magic 8-Ball: Classic entertainment responses plus clearly labeled rule-based Smart responses; no AI API.
- Browser-only: React/TypeScript/Vite; client-side calculations and localStorage; GitHub Pages; responsive and accessible.
- No fourth tab. Settings can be a drawer or modal.

## Terraphase-recognized paid holidays (nine)

1. New Year's Day
2. Memorial Day (last Monday in May)
3. Independence Day
4. Labor Day (first Monday in September)
5. Thanksgiving Day (fourth Thursday in November)
6. Day after Thanksgiving (Friday)
7. Christmas Day
8. Floating Holiday 1
9. Floating Holiday 2

Seven named fixed holidays + two floating holidays. At 8 hours each, nominal annual paid holidays = **72 hours**. Observed-day rules for weekend holidays are **not yet confirmed**. Avoid counting a holiday twice if a floating date overlaps another leave day. Floating holidays must track status `not_taken | planned | taken`, optional date, and hours.

## Open business-rule decisions — do not invent an official policy

- The owner requests a fixed all-scheduled-hours planning denominator: every non-billable hour counts against the goal. This is the current app convention; **Terraphase's official denominator is unconfirmed**. Earlier leave-excluding calculations are superseded.
- Whether H&S training, admin, or other codes are excluded from official billability denominator is unconfirmed.
- Weekend holiday observation rule is unconfirmed; permit admin/user configuration.
- Handling of undated expected vacation/floating holidays for weekly forecasts needs a visible estimation assumption or a request for dates; do not pretend dates are known.
- Whether sick leave is forecast as budgeted time or only entered when used is user-dependent.
- H&S/Admin/Other now track taken and planned hours separately. Current-percentage-implied non-billable usage includes unitemized already-used time (potentially PD). Remaining availability is still a schedule-based estimate rather than a timesheet audit.

## UX guidance

Modern light/dark responsive SaaS dashboard (navy/teal accents). Emphasize comprehensible labels and avoid confusing 'non-billable hours' with 'available PD hours'. Use clear warnings for negative capacity and impossible weekly targets. Do not use negative slices in pie charts.

## Next implementation milestones

See `IMPLEMENTATION_PLAN.md`. Add dated entries below whenever a material decision is made.

## Decision log

- 2026-11-10: Implemented the annotated screenshot feedback as the latest UI direction: Simple Calculator is a new annual-budget tab, existing Hours Calculator becomes Refined Calculator, and Magic 8-Ball remains Classic by default. User-facing “billability” becomes “utilization,” “taken” becomes “used,” and future sick leave is “anticipated.” Paid holidays precede vacation/sick leave. The confusing usage note is replaced with: used hours are already reflected in current utilization; future responsibilities are reserved separately.
- 2026-11-10: Simple Calculator uses full scheduled annual hours × (1 − utilization goal), then subtracts nine paid days (including floating holidays), annual vacation, anticipated sick leave, required H&S and assumed admin. Nine days and 52 annual admin hours are editable user-requested planning assumptions, not confirmed company policy. Required H&S defaults to zero until entered. No current utilization/date is needed for the Simple annual result.
- 2026-11-10: New Refined plans default to a nine-day paid-holiday allowance and 52 planned administration hours. Calendar dates still determine timing and observation remains configurable. If scheduled dates reserve fewer hours than the annual allowance, the difference is reserved once as undated future holiday time; moving observed dates into the work schedule reduces that difference rather than adding hours twice. If calendar reservations exceed the allowance, reserve the larger calendar amount and warn. Existing saved plans without an allowance retain date-only holiday accounting.
- 2026-11-10: Optional per-year Simple inputs and holiday allowance extend the validated v3 backup format without dropping older plans. Existing annual totals initialize Simple inputs; administration starts at 52 if no admin amount exists. Simple and Refined share schedule/year/goal. Simple annual assumptions are carried to Refined through an explicit action, preserving already-used hours and extra responsibilities. Carrying inputs is blocked if annual totals are below used values or the allowance is below configured holiday reservations. Older Refined plans are not automatically overwritten. Zero is retained when explicitly saved as a Simple assumption.

- 2026-11-06: PD Magic 8-Ball opens in Classic Mode by default. Smart Mode remains selectable; calculator navigation and calculation rules are unchanged.

- 2026-11-06: Year selector is limited to 2026–2036 inclusive, with 2027 still the default. If a backup/browser plan selects a year outside that range, open 2027 and preserve the other saved plans for export rather than discarding them.

- 2026-11-06: Owner requires every non-billable hour to count against the billability goal. The annual target is now scheduled hours × goal%; leave and holidays never reduce that denominator. An 80% goal therefore occupies exactly 80% of the scheduled-hours pie (unless completed billable hours already exceed the target, explicitly labelled). Earlier leave-excluding denominator decisions below are historical and superseded.
- 2026-11-06: New default year is 2027. Default calculation date is today when in the selected year, otherwise its first/last day. Default H&S and Admin/Other hours are zero. H&S and Admin/Other have taken/planned splits; optional custom categories use the same model. Vacation, sick leave and configurable holidays/floating plans remain.
- 2026-11-06: Main result is remaining available non-billable time, usable for PD or other non-billable work. Show annual allowance, percentage-implied already-used non-billable time, remaining allowance before plans, and unallocated hours after future plans. Taken entries are part of the percentage-implied total and are never added twice; use the larger total conservatively and flag disagreements. Unknown already-used time inferred from current billability is included so prior PD cannot silently create extra remaining capacity.
- 2026-11-06: Remaining-year feasibility and equivalent workweeks subtract all future holidays/leave/training/admin/custom plans, not just leave. Already-taken entries do not reduce future capacity again. Cap available non-billable hours by actual remaining scheduled time, including when the billable goal is exceeded. Do not draw a normalized pie for conflicting or overallocated plans.
- 2026-11-06: Saved/export schema and key are v3. Import v1/v2 and convert their old percentage basis to all scheduled hours, preserving estimated billable completion where possible. Preserve original v1 hours. Older annual-only commitment totals become planned hours with an explicit review notice; combine old Admin/Other/Meetings totals and retain custom categories. Browser migration preserves old keys/plans and initially opens 2027; explicit imports honor the backup's active year, and v3 saves retain subsequent year selections. The original company-policy questions remain unconfirmed; observed dates remain editable.

- 2026-10-14: Owner requested removing separate Dashboard navigation and showing results after submitting inputs. Adopted a two-entry calculator/8-Ball navigation; the original three-tab rule is superseded. Calculator submissions use the validated current inputs; editing returns to the saved form. Invalid draft fields block submission.
- 2026-10-14: Current billability is now a year-to-date percentage, 0–100%. Estimated completed billable hours = current percentage × elapsed denominator / 100. Elapsed scheduled hours are strictly before the selected calculation date; remaining-year work still includes that date. The elapsed denominator applies the selected annual-denominator convention, with elapsed dated holidays, undated Taken floating holidays, and taken vacation/sick leave only; expected future leave is never treated as taken. Outputs explicitly label completed billable hours as estimates.
- 2026-10-14: Saved/export format v2 and localStorage key `annual-pd-hours:v2`. Version 1 backups and the old storage key are accepted and migrated. Legacy hours convert using the elapsed denominator; percentages are capped at 100, or zero if the denominator is zero. Original legacy hours remain in the migrated backup until the user enters a new percentage; unrepresentable hours trigger a warning. The old storage key is retained as a fallback/reference. Migration preserves all schedule, leave, categories, holiday configuration, years, and theme preferences.

- 2026-10-14: Owner requested a simpler hours calculator. Hours Planner is now the initial view, with plain labels and four compact input groups. Duplicate planner year entry and goal slider are removed; the header year selector and percentage input remain. Workweek changes, observed holiday dates, optional floating dates/hours, denominator settings, and calculation breakdown use expandable sections. Results emphasize annual PD, annual billable target, billable hours still needed, and required weekly hours. Calculation conventions, saved data, and defaults are unchanged.

- 2026-10-14: Three-tab scope; percent-based billability; nine Terraphase holidays; vacation split into taken and expected; free, public GitHub Pages hosting.
- 2026-10-14: Owner selected MIT license. Implemented React/TypeScript/Vite app with Tailwind, Recharts, Lucide, Motion, and date-fns; no backend or external AI.
- 2026-10-14: Calculation date is inclusive. Dates outside selected year are allowed for past/future-year forecasts. Year inputs are supported from 1900–2100, workdays are selected weekdays, and hours/day are positive up to 24. Completed hours do not reduce the annual billable target.
- 2026-10-14: Default weekend observation is actual dates (no assumed observation). Users can choose nearest weekday, next Monday, or individual dates. Observations outside the selected year count zero and generate a note; override them within the selected year if needed. No cross-year holiday entitlement is inferred.
- 2026-10-14: Each dated holiday contributes at most the remaining scheduled capacity for that date, with fixed holidays applied before floating holidays. Undated floating holidays reserve one workday (capped at hours/day); status Taken removes the future deduction only. Status/date conflicts generate notes.
- 2026-10-14: Vacation and sick leave are aggregate hours excluding paid holidays. No leave-date input is implemented, so their holiday overlaps cannot be detected. This limitation is explicit in the planner and forecast. Exact dated leave remains a future enhancement.
- 2026-10-14: Denominators: available working hours (default), all scheduled hours, or scheduled hours minus holidays. Annual non-billable summary includes holidays + leave + non-billable working budget. Forecast feasibility compares remaining billable target with working capacity after future leave, before unknown remaining other commitments.
- 2026-10-14: PD is total annual capacity throughout UI and Smart Mode; no precise remaining-PD claim because PD usage and commitment completion are not tracked. Overallocated donuts are replaced with a deficit state and textual amounts rather than normalized beyond scheduled capacity.
- 2026-10-14: Version 1 localStorage saves a separate plan per year and theme. JSON imports replace saved plans only after complete validation; corrupted stored data is preserved until import/reset. Export contains all saved years. Reset affects the active year only and requires confirmation.
- 2026-10-14: GitHub Actions workflow prepared; source is local only. No push, live deployment, or GitHub Pages settings changes are authorized yet.
