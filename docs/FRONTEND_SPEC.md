# AnnualPDHours — Frontend Specification

## Navigation and persistence

Three primary entries: **Simple Calculator**, **Refined Calculator**, and **PD Magic 8-Ball**. Simple opens first with a live annual result. Refined submits to a PD/mid-year results dashboard, with **Edit my hours** returning to its saved inputs. Settings is a modal. New plans default to 2027; the header year control offers 2026–2036 inclusive and restores year-specific plans. Store only local data, with validated JSON import/export and confirmed reset. Show save/storage errors clearly.

## Simple Calculator

Show annual schedule/ utilization goal, paid holiday allowance (default nine days), annual vacation, anticipated annual sick leave, required H&S and assumed admin (default 52 hours/year). Show live annual non-billable availability with a transparent breakdown. All annual totals include used time. Clearly mark defaults as editable assumptions. An explicit carry action opens Refined with those annual totals, preserving used amounts and extra responsibilities; show errors if the transfer would erase used hours or conflict with configured holiday hours.

## Refined Calculator

Use a compact, labelled form with four groups:

1. Work schedule: hours/day, **Utilization goal (%)**, **Current utilization (%)**, calculation date. Weekdays are expandable. Explain that current and target percentages use all scheduled hours, including leave and holidays.
2. Paid holidays: annual allowance and calendar timing; floating status and optional dates visible, with editable floating hours and observed dates in an expandable section. State observation assumptions visibly.
3. Vacation and sick leave: **Already used**, planned vacation, and **Anticipated for the rest of the year** for sick leave, in hours, with annual totals.
4. **H&S training & Administration**: used/planned splits. H&S starts at zero; new administration assumptions start at 52 annual hours. Permit extra responsibilities, editing and deletion.

Every non-billable hour counts against the annual goal. Do not expose a leave-excluding denominator choice. Keep the application rule visible and distinguish it from confirmed company policy. Leave is entered excluding paid holidays, with aggregate undated estimates.

Inputs auto-save. Invalid draft fields block submission, open their enclosing details section, and receive focus. Migrations show an explicit review notice when old annual-only commitments become planned hours or a current percentage is converted.

## Results

Heading **Your refined results**, year/date, current and goal percentages, and an edit action.

Four cards:

- **Available PD hours** after already-used time, annual assumptions and future responsibilities.
- **Annual non-billable allowance**: all scheduled hours × (1 − annual goal).
- **Billable hours still needed** to meet the annual target.
- **Required weekly billable hours** per equivalent available workweek.

Annual allocation donut and keyboard-accessible textual legend use scheduled hours as the denominator. An 80% annual goal must show an 80% billable target slice. Completed hours above target may increase that slice, explicitly labelled. Overallocated, conflicting, or non-reconciling plans pause the chart and retain textual values rather than normalizing excess totals.

Billable progress shows estimated completed hours, annual target, and remaining target. Explain that current utilization and percent of annual goal completed are different numbers.

A non-billable budget breakdown shows annual allowance − already-used total − future reservations = available hours, plus the allowance remaining before plans. Expandable details show used/planned totals per category. Explain that current-percentage-implied used time already includes entered used hours; use the larger total, never their sum. Clearly flag contradictions.

The remaining-year forecast deducts all future holidays, leave, training and admin/custom reservations from remaining scheduled capacity. Show equivalent workweeks, required weekly billable average, and any capacity shortfall. Include the calculation day only in future time. Cap availability by remaining scheduled time; show deficits separately.

## PD Magic 8-Ball

Open in **Classic Mode** by default. Smart Mode remains available through the mode switch.

Keep the animated Classic / Smart modes, suggestions and live responses. Smart Mode compares durations with **remaining unallocated non-billable availability**, which may be used for PD. It must not call the full annual allowance remaining or grant company approval. Weekly answers use the same centralized calculations as the results page. Respect reduced motion.

## Accessibility and appearance

Navy/teal, light/dark themes, clear focus, readable native dropdown options, explicit labels/units, and no horizontal overflow at 320px. Stack inputs/results clearly on mobile; accessible chart text and tables must remain available. Do not sacrifice calculation explanations or conflict warnings for a compact layout.

In Refined, paid holidays precede vacation/sick leave. Future sick leave is labelled anticipated rather than planned. Remove the separate-paid-holidays note under leave. Explain usage simply: used hours are already reflected in current utilization; future responsibilities are reserved separately. The optional nine-day annual allowance is visible and editable, with calendar gaps reserved as undated future time. Old plans retain their original assumptions until explicitly updated.
