# AnnualPDHours

A free, open-source, browser-only calculator for annual billability and available non-billable hours, including professional development. No backend, accounts, analytics, API keys or paid services.

## How it works

Start with the **Hours Calculator**, then select **Calculate my results** to see the dashboard. **Edit my hours** returns to your inputs. The second navigation entry is **PD Magic 8-Ball**, with fun Classic answers and deterministic Smart answers based on your remaining availability.

New plans default to **2027**. The year selector offers 2026–2036 inclusive, and you can use the calculator throughout the year. Enter:

- Work schedule, annual goal %, current year-to-date billability %, and calculation date.
- Vacation and sick leave already taken and still planned.
- H&S training and Admin/Other non-billable hours, split into taken and planned. Optional custom categories are supported.
- Automatically calculated holidays, configurable observed dates, and floating holiday status/date/hours.

### Every non-billable hour counts

```text
Annual billable target = annual scheduled hours × annual goal %
Annual non-billable allowance = scheduled hours − billable target
Available non-billable hours = remaining allowance − future non-billable plans
```

An 80% goal over 2,080 scheduled hours requires 1,664 billable hours and allows 416 non-billable hours. Vacation, sick leave, holidays, training, admin, other work and PD all use that same allowance. This makes the pie's billable target slice exactly 80%.

Current billability estimates billable completion over scheduled hours before the calculation date. The implied used non-billable total already includes your taken entries; these are not added twice. Any extra usage implied by the percentage is shown as estimated unitemized time. Conflicting inputs produce a review warning and conservative capacity figures.

Results show annual totals, the allowance remaining before plans, availability after future plans, the billable shortfall, and required weekly billable hours after all future reservations. Availability cannot exceed actual remaining scheduled time. Deficits and inconsistent charts are flagged instead of hidden.

### Assumptions

These are requested application planning rules, **not confirmed Terraphase policy**. Annual/current billability use all scheduled hours, including paid leave. Calendar weekdays determine scheduled hours rather than assuming 2,080 every year. The calculation date belongs to remaining time. Undated leave/commitments use aggregate estimates, so enter leave excluding holidays.

Seven fixed holidays plus two floating holidays are recognized. Nine nominal eight-hour days equal 72 hours only if all count under your schedule and observation choices. Default observation uses actual dates; nearest weekday, next Monday and individual dates are configurable. Dated overlaps count once, up to daily hours. Floating dates are optional; undated Not Taken/Planned holidays reserve future time, while Taken holidays do not reduce future capacity again.

Smart answers compare activity durations with remaining unallocated non-billable time, not the entire annual allowance. They do not grant company approval or reserve event dates.

## Local development

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Open the address Vite prints, including `/AnnualPDHours/`.

```sh
npm test
npm run test:watch
npm run lint
npm run build
npm run preview
```

React, TypeScript, Vite, Tailwind CSS, Recharts, date-fns, Lucide React and Motion power the client. Pure calculations live in `src/lib/calculations.ts`, validation in `src/lib/validation.ts`, and storage/defaults/migration in `src/lib/plan.ts`.

## Saving and backups

Inputs auto-save in this browser under `annual-pd-hours:v3`; plans are separate by year. Settings provides JSON export/import, light/dark/system themes, and a confirmed active-year reset. Export contains all years; imports validate the entire backup before replacing anything. Clearing browser data removes plans, so keep a JSON backup.

V1/v2 backups and older local storage migrate to v3. Previous net-working percentages convert to all-scheduled-hours percentages, preserving estimated completed hours where possible. Old annual-only H&S/admin/custom totals become planned hours with a review notice; adjust their taken/planned split. Prior Admin/Other/Meetings are combined. Original old keys remain intact, and impossible old completed-hour values are preserved for reference with warnings. Existing years remain accessible; browser migration initially opens 2027, while explicit imports respect the backup's active year.

No personal data is transmitted by the calculator. Static files come from the host; source links open only when clicked.

## GitHub Pages

Intended URL: <https://lukek980.github.io/AnnualPDHours/>. Vite uses `base: '/AnnualPDHours/'`; views switch locally without server routing.

After the owner approves publication, select **Settings → Pages → GitHub Actions** in the repository and push approved changes to `main` or manually run the workflow. `.github/workflows/deploy.yml` runs locked dependency installation, lint, tests, build, then deploys `dist/`. Pull requests validate only. No push or deployment has been performed by this implementation.

## Contributing

Read `AGENTS.md` and `docs/` before changing behavior. Preserve the calculator/results flow, local processing, accessibility and validated backups. Keep math in pure TypeScript, test changes to calculations/dates, document convention changes, and run lint/tests/build before opening a pull request. Do not invent company policy. See [calculation rules](docs/CALCULATION_RULES.md) for formulas and fixtures.

## License

MIT. See [LICENSE](LICENSE).

