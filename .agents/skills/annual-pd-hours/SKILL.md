---
name: annual-pd-hours
description: Build, extend, test, and review the AnnualPDHours React/TypeScript browser app, especially its three-tab frontend, percentage-based billability calculations, Terraphase holidays, time-off planning, PD capacity, GitHub Pages deployment, and PD Magic 8-Ball. Use for any implementation task in the AnnualPDHours repository.
---

# AnnualPDHours development workflow

1. Read `AGENTS.md` and the repository docs: `docs/PROJECT_CONTEXT.md`, `docs/FRONTEND_SPEC.md`, and `docs/CALCULATION_RULES.md`. Use `docs/IMPLEMENTATION_PLAN.md` to choose the next increment.
2. Keep exactly three tabs: Dashboard, Hours Planner, PD Magic 8-Ball. Implement only client-side functionality hosted through GitHub Pages.
3. For math/date changes, implement pure TypeScript functions with deterministic tests **before** changing UI. Check vacation taken versus future, floating holiday status, and billability denominator assumptions.
4. For UI changes, preserve desktop/mobile readability, labels, keyboard access, reduced motion, error states, and chart alternatives.
5. Use versioned localStorage for persistent inputs. Never add secrets, personal-data API calls, auth, backend storage, or a fourth tab without permission.
6. Run tests and `npm run build` before marking implementation complete. Summarize files edited, behavior, tests, and unresolved policy questions.

## Source of truth
- `docs/PROJECT_CONTEXT.md`: decisions and outstanding policy questions.
- `docs/FRONTEND_SPEC.md`: UI components and interaction contract.
- `docs/CALCULATION_RULES.md`: equations, date conventions, and fixtures.
- `docs/IMPLEMENTATION_PLAN.md`: build order and definition of done.

## Important caution
Terraphase's precise billability denominator and weekend-observed holiday policy are not confirmed. Make these editable assumptions and never label a proposed calculation official.
