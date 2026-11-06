# AnnualPDHours — Build Order and Acceptance Criteria

## Current increment — 2026-11-06

Owner-requested acceptance criteria implemented: default new year 2027; full scheduled-hours billability denominator; exact goal percentage in the annual pie; taken/planned H&S and Admin/Other alongside vacation, sick leave, holidays and visible floating plans; annual non-billable allowance and remaining availability after used time/future reservations; remaining-year billable shortfall and weekly requirement after all planned non-billable hours. V3 migration preserves older plans and provides review notices for converted percentages and previously unsplit category totals. This supersedes earlier net-working-hours, annual-PD-only and v2 model references below.

Files: `src/lib/types.ts`, `validation.ts`, `plan.ts`, `calculations.ts`, calculation/migration/validation/Smart tests, `src/App.tsx`, calculator/results/8-Ball components, styles, README and current calculation/frontend/decision documentation. Pure math and migration tests were updated before UI changes. Validation passed: all 36 tests, npm lint, and the TypeScript/production build. Production-browser checks verified the 2027 default, exact 80% goal slice, taken/planned splits, floating plans, the annual and midyear fixtures, conflict/deficit states, v3 persistence/import/export, v2 migration preserving original data, and light/dark input/results layouts at 768/375/320px. Screenshots were visually reviewed. The local preview was opened with 2027 selected. No push or deployment was performed.

## Previous implementation — 2026-10-14

Latest change: replaced independent Dashboard navigation with a submitted calculator/results flow. There are now two navigation entries, Hours Calculator and PD Magic 8-Ball. Current billability percentage replaces manually entered completed hours, with a documented elapsed-denominator estimate and v1-to-v2 backup/storage migration. Earlier three-tab and completed-hours milestones below describe the original implementation and are superseded.

Latest validation: all 32 tests passed, including current-percentage conversion, denominator variants, elapsed-date boundaries, future-leave separation, and legacy migration. Lint and the production build passed. Production browser checks passed for two-entry navigation, percentage-only entry, invalid-draft submission blocking, submit/results/edit flow, estimated billable hours, chart rendering, input reload, v2 export, v1 browser migration preserving the original key, Smart weekly answers, and input/results layouts at 768/375/320px. The existing preview was refreshed. No push or deployment was performed.

Follow-up: simplified Hours Planner to prioritize entering hours and reading results. It is the initial view, has plain input groups, and puts detailed controls and calculations in expandable sections. No calculation or storage convention changed. Follow-up validation: lint and production build passed; all 26 calculation/import tests passed. Focused production-browser checks passed for calculator-first entry, live results, input validation, custom categories, holiday controls, keyboard expansion, denominator options, year-specific persistence, dashboard navigation, dark mode, and the mobile input/results flow at 768/375/320px. No uncaught browser errors were detected. The existing in-app preview was refreshed.

The owner's latest seven-phase sequence was used for this implementation. The original roadmap below uses phase numbers 0–5; this table maps the work to the current sequence.

| Phase                            | Implemented acceptance criteria                                                                                                              | Main files                                                                                             | Verification                                                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 — Initialize and shell         | React/TypeScript/Vite/Tailwind; exactly three navigation tabs; responsive shell                                                              | `package.json`, `index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`        | TypeScript and production build; browser navigation count                                                                                                                |
| 2 — Calculations                 | Typed model; calendar workdays; configurable holiday observation and denominators; annual capacity and remaining-year forecasts              | `src/lib/types.ts`, `src/lib/plan.ts`, `src/lib/calculations.ts`, `src/lib/*.test.ts`                  | Automated fixtures, four holiday years, leap years, custom schedules, taken/future leave, floating overlaps, partial weeks, zero time, invalid inputs, negative capacity |
| 3 — Planner                      | Validated work schedule; taken/future leave; observed dates; floating status/date/hours; custom categories; live results; auto-save per year | `src/components/Planner.tsx`, `src/components/Fields.tsx`, `src/App.tsx`                               | Browser edits and validation; add/edit/delete category; stored inputs and reload                                                                                         |
| 4 — Dashboard                    | Four metrics; interactive donut and textual legend; progress; weekly requirement and feasibility warnings; deficit state                     | `src/components/Dashboard.tsx`, `src/lib/format.ts`                                                    | Browser render; real SVG sector paths; responsive desktop/tablet/mobile; pure calculation tests                                                                          |
| 5 — 8-Ball                       | Motion animation; Classic entertainment; deterministic Smart capacity/duration/weekly answers; live announcements; reduced motion            | `src/components/EightBall.tsx`, `src/lib/eightBall.ts`                                                 | Smart/Classic browser responses; reduced-motion run; deterministic response tests                                                                                        |
| 6 — Settings and polish          | Light/dark/system themes; modal; validated JSON export/import; confirmed active-year reset; storage recovery; visible focus and labels       | `src/components/Settings.tsx`, `src/App.tsx`, `src/styles.css`                                         | JSON download and re-import; invalid file rejection; reset; modal Escape/focus restoration; 320/375/768 widths; corrupted saved plan preserved                           |
| 7 — Deployment and documentation | MIT license approved by owner; locked npm dependencies; GitHub Pages base and Actions; README and decision log                               | `LICENSE`, `package-lock.json`, `.github/workflows/deploy.yml`, `README.md`, `docs/PROJECT_CONTEXT.md` | npm lint/test/build; dependency audit; production asset paths                                                                                                            |

All implementation is local. No changes have been pushed and no deployment has been triggered. Publishing source, configuring Pages on GitHub, and verifying the hosted URL remain pending the owner's explicit approval.

Final verification: `npm run lint` and `npm run build` passed; `npm test` passed all 26 tests. The locked dependency audit reported zero vulnerabilities. Both development and production builds passed the Edge browser checks listed above, with no uncaught browser errors, horizontal overflow at tested widths, or outbound external requests. Production asset URLs use `/AnnualPDHours/assets/`. Visual screenshots were inspected in light/dark modes and at 320px.

### Remaining assumptions and optional enhancements

- Confirm company billability denominator and weekend observation policy. The app exposes configurable assumptions and does not claim either is official.
- Forecasts use aggregate future leave, with leave entered excluding holidays; exact dated vacation/sick leave and automatic leave/holiday overlap detection are optional future improvements.
- Annual PD capacity is implemented. Precise remaining PD needs prior PD usage and remaining other commitments; these are not currently tracked.
- Keyboard interactions, focus restoration, labels, reduced motion, and responsive rendering have been checked in Edge. A formal assistive-technology audit and broader device/browser testing can follow.

Next release step: review the local application and authorize the push/deployment when ready.

## Phase 0 — Setup

- Initialize Vite React+TypeScript project in existing repo; configure Tailwind, Recharts, date-fns, Lucide.
- GitHub Pages build uses `base: '/AnnualPDHours/'` and Actions workflow.
- Create MIT `LICENSE` after confirming license choice with repository owner.

## Phase 1 — Data model and calculation engine

- Define typed `AnnualPlan`, `TimeOff`, `HolidayRecord`, `CalculationResult`.
- Pure helpers for working-day calendar and fixed/floating holiday calculations.
- Compute annual scheduled hours, denominator, target, annual non-billable budget, PD capacity, year-to-date progress, effective remaining workweeks, weekly target.
- Automated tests for fixtures in `CALCULATION_RULES.md` including leap years and edge cases.

## Phase 2 — Hours Planner

- Forms grouped into work schedule, time off, holidays, other non-billable.
- Immediate recalculation, inline validation, browser-local auto-save and year-specific plans.
- Live PD result and clear explanation of assumptions.

## Phase 3 — Dashboard

- Four metric cards, accessible donut with legend, progress bar, weekly billable requirement.
- Handle impossible target and overallocated plans without misleading charts.

## Phase 4 — 8-Ball

- Classic randomized responses; Smart rule-based answers with known math only.
- Keyboard operation, reduced-motion alternative.

## Phase 5 — Polish and publish

- Dark mode, 320px responsive layout, import/export JSON, reset confirmation, privacy text.
- Test, lint, build; write GitHub Pages deployment docs.
- Publish public source and verify Pages asset paths and routing.

## Definition of done

- Two top-level navigation entries; dashboard results follow calculator submission.
- Changing planner values updates dashboard and Smart 8-Ball without refreshing.
- Reopening same browser restores plan correctly; other browser/device does not inherit it.
- Build succeeds without secrets, paid services, remote APIs, or backend.
- Calculation assumptions visible; business rules still unconfirmed are not presented as official.

