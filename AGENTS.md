# AnnualPDHours — Agent Instructions

Read `docs/PROJECT_CONTEXT.md`, `docs/FRONTEND_SPEC.md`, and `docs/CALCULATION_RULES.md` before changing application behavior. For sequencing, use `docs/IMPLEMENTATION_PLAN.md`.

## Mission

Build an open-source, browser-only professional development hours calculator hosted on GitHub Pages. The latest owner feedback defines three tabs: **Simple Calculator**, **Refined Calculator**, and **PD Magic 8-Ball**. Simple Calculator estimates annual non-billable availability; Refined Calculator adds used/future responsibilities and mid-year utilization to estimate available PD. The dashboard is the Refined Calculator's submitted results, with an edit action. Use “utilization,” “used,” and “anticipated sick leave” in the interface. Do not add authentication, a database, a backend, or paid services without explicit approval.

## Stack

React + TypeScript + Vite, Tailwind CSS, Recharts, date-fns, Lucide React; optional Motion for animation. Use pure TypeScript functions for all calculation logic. Publish via GitHub Actions to GitHub Pages with Vite `base: '/AnnualPDHours/'`.

## Work method

1. State which acceptance criteria a change implements.
2. Update types and pure calculations before UI, and add tests for math/date changes.
3. Preserve accessibility, responsive layout, local-only processing, and auto-save.
4. Test `npm run build` and relevant tests before considering work complete.
5. Never claim Terraphase-specific billability or observed-holiday rules are confirmed; display configurable assumptions clearly.
6. Do not silently change a financial/time calculation convention. Record decisions in `docs/PROJECT_CONTEXT.md`.

## Data practices

Persist non-sensitive plan inputs in `localStorage` with a versioned storage key; support export/import JSON and reset. No analytics or outbound personal-data requests. Validate imported data. Keep the user-visible source and README aligned with app behavior.
