import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  BriefcaseBusiness,
  GraduationCap,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useReducedMotion } from "motion/react";
import { format, parseISO } from "date-fns";
import type { AnnualPlan, CalculationResult } from "../lib/types";
import { hours } from "../lib/format";
import { Notice } from "./Fields";

export default function Dashboard({
  plan,
  result: r,
  onPlan,
}: {
  plan: AnnualPlan;
  result: CalculationResult;
  onPlan: () => void;
}) {
  const [highlight, setHighlight] = useState<string | null>(null),
    reduced = useReducedMotion();
  const slices = r.allocations.filter((a) => a.hours > 0),
    selected = r.allocations.find((a) => a.id === highlight);
  const chartMismatch =
    Math.abs(
      r.allocations.reduce((s, a) => s + a.hours, 0) - r.scheduledHours,
    ) > 0.01;
  const showChart =
    r.overallocationHours < 0.01 &&
    r.inputConflictHours < 0.01 &&
    !chartMismatch;
  const shortfall = Math.max(
    0,
    r.billableHoursRemaining - r.remainingAvailableHours,
  );
  const cards = [
    {
      label: "Available PD hours",
      value: hours(r.availableNonBillableHours),
      unit: "hours remaining",
      sub: "After used hours and future plans",
      icon: GraduationCap,
      featured: true,
    },
    {
      label: "Annual non-billable allowance",
      value: hours(r.annualNonBillableBudget),
      unit: "hours / year",
      sub: `${hours(100 - plan.billabilityGoalPct)}% of all scheduled hours`,
      icon: CalendarDays,
      featured: false,
    },
    {
      label: "Billable hours still needed",
      value: hours(r.billableHoursRemaining),
      unit: "hours",
      sub: `Toward ${hours(r.billableTargetHours)} annual billable hours`,
      icon: BriefcaseBusiness,
      featured: false,
    },
    {
      label: "Required weekly billable hours",
      value:
        r.requiredWeeklyBillable === null
          ? "—"
          : hours(r.requiredWeeklyBillable),
      unit: "hours / workweek",
      sub:
        r.requiredWeeklyBillable === null
          ? "No available work time left"
          : "After all planned non-billable time",
      icon: Clock3,
      featured: false,
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Your refined results</h1>
          <p>
            Your PD availability after annual assumptions, used time, and
            additional responsibilities.
          </p>
        </div>
        <button className="button secondary" onClick={onPlan}>
          <ArrowLeft size={17} /> Edit my hours
        </button>
      </div>
      <div className="context-row">
        <span className="year-pill">{plan.year} plan</span>
        <span>
          As of {format(parseISO(plan.calculationDate), "MMM d, yyyy")}
        </span>
        <span className="context-assumption">
          {hours(plan.currentBillabilityPct)}% current ·{" "}
          {hours(plan.billabilityGoalPct)}% utilization goal
        </span>
      </div>
      <div className="metrics">
        {cards.map(({ label, value, unit, sub, icon: Icon, featured }) => (
          <article
            key={label}
            className={"metric card " + (featured ? "featured" : "")}
          >
            <div className="metric-top">
              <span>{label}</span>
              <span className="icon-tile">
                <Icon size={20} />
              </span>
            </div>
            <div className="metric-value">
              {value}
              <small>{unit}</small>
            </div>
            <p>{sub}</p>
          </article>
        ))}
      </div>
      {r.overallocationHours > 0.01 && (
        <Notice tone="warning">
          <strong>
            Your plan exceeds the remaining non-billable allowance by{" "}
            {hours(r.overallocationHours)} hours.
          </strong>{" "}
          Used time and future reservations both count. Reduce planned
          non-billable hours or revise the goal. Available hours are shown as
          zero.
        </Notice>
      )}
      {r.inputConflictHours > 0.01 && (
        <Notice tone="warning">
          <strong>Your used entries and current utilization disagree.</strong>{" "}
          The entries are {hours(r.inputConflictHours)} hours higher than the
          non-billable time implied by your percentage. Check your percentage,
          date, and used hours. The larger used total is reserved
          conservatively; the chart is paused until these reconcile.
        </Notice>
      )}
      <div className="dashboard-grid">
        <section className="card allocation-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ANNUAL STATS</p>
              <h2>Where your annual hours go</h2>
            </div>
            <span className="subtle-pill">
              {hours(r.scheduledHours)} scheduled hours
            </span>
          </div>
          <p className="section-description">
            Your {hours(plan.billabilityGoalPct)}% goal requires{" "}
            {hours(r.billableTargetHours)} billable hours. Everything else uses
            the {hours(100 - plan.billabilityGoalPct)}% non-billable allowance.
          </p>
          <div className="allocation-layout">
            <div className="donut-wrap">
              {showChart ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart accessibilityLayer>
                      <Pie
                        data={slices}
                        dataKey="hours"
                        nameKey="name"
                        innerRadius={80}
                        outerRadius={112}
                        paddingAngle={0}
                        stroke="none"
                        isAnimationActive={!reduced}
                        onMouseEnter={(_, i) => setHighlight(slices[i].id)}
                        onMouseLeave={() => setHighlight(null)}
                      >
                        {slices.map((a) => (
                          <Cell
                            key={a.id}
                            fill={a.color}
                            opacity={highlight && highlight !== a.id ? 0.45 : 1}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [
                          `${hours(Number(v))} hours`,
                          "Allocation",
                        ]}
                        contentStyle={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          color: "var(--text)",
                        }}
                        itemStyle={{ color: "var(--text)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center" aria-hidden="true">
                    <strong>
                      {hours(selected?.hours ?? r.availableNonBillableHours)}
                    </strong>
                    <span>{selected ? "selected hours" : "available PD"}</span>
                  </div>
                </>
              ) : (
                <div className="deficit-ring">
                  <strong>Review the plan</strong>
                  <span>
                    {r.inputConflictHours > 0.01
                      ? "Used hours conflict with utilization"
                      : r.overallocationHours > 0.01
                        ? "Non-billable allowance exceeded"
                        : "Annual entries need to reconcile"}
                  </span>
                </div>
              )}
            </div>
            <div className="legend" aria-label="Annual hour allocation">
              {r.allocations.map((a) => (
                <button
                  key={a.id}
                  className={
                    "legend-row " + (highlight === a.id ? "highlight" : "")
                  }
                  onMouseEnter={() => setHighlight(a.id)}
                  onMouseLeave={() => setHighlight(null)}
                  onFocus={() => setHighlight(a.id)}
                  onBlur={() => setHighlight(null)}
                  onClick={() => setHighlight(highlight === a.id ? null : a.id)}
                >
                  <span
                    className="legend-dot"
                    style={{ background: a.color }}
                  />
                  <span className="legend-label">{a.name}</span>
                  <span className="legend-amount">
                    {hours(a.hours)} <small>h</small>
                  </span>
                  <span className="legend-pct">
                    {hours((a.hours / r.scheduledHours) * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="small-note">
            The chart uses all scheduled hours, so an 80% utilization goal is an
            80% billable slice. If estimated completed billable hours already
            exceed the annual target, the slice shows that higher completed
            amount. Overallocated or conflicting plans are shown as amounts
            without a misleading pie.
          </p>
        </section>
        <div className="dashboard-side">
          <section className="card progress-card">
            <h2>Billable progress</h2>
            <div className="progress-stat">
              <strong>
                {hours(r.progressPct)}
                <small>%</small>
              </strong>
              <span>of the annual target completed (estimated)</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Estimated annual billable goal completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, r.progressPct)}
            >
              <div style={{ width: `${Math.min(100, r.progressPct)}%` }} />
            </div>
            <div className="progress-labels">
              <span>
                {hours(r.estimatedCompletedBillableHours)} h estimated completed
              </span>
              <span>{hours(r.billableTargetHours)} h target</span>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Annual scheduled hours</dt>
                <dd>{hours(r.scheduledHours)} h</dd>
              </div>
              <div>
                <dt>Utilization goal</dt>
                <dd>{hours(plan.billabilityGoalPct)}%</dd>
              </div>
              <div>
                <dt>Current year-to-date utilization</dt>
                <dd>{hours(plan.currentBillabilityPct)}%</dd>
              </div>
              <div>
                <dt>Billable hours still needed</dt>
                <dd>{hours(r.billableHoursRemaining)} h</dd>
              </div>
            </dl>
            <p className="small-note">
              Current utilization × {hours(r.elapsedScheduledHours)} scheduled
              hours before the calculation date ={" "}
              {hours(r.estimatedCompletedBillableHours)} estimated completed
              billable hours. Holidays and used leave stay in that denominator.
              Progress toward the annual target is a separate percentage.
            </p>
          </section>
        </div>
      </div>
      <section className="card forecast-card nonbillable-breakdown">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR NON-BILLABLE BUDGET</p>
            <h2>What is still available?</h2>
          </div>
        </div>
        <div className="forecast-grid">
          <div>
            <span>Annual allowance</span>
            <strong>
              {hours(r.annualNonBillableBudget)}
              <small>hours</small>
            </strong>
          </div>
          <div>
            <span>Already used (estimated)</span>
            <strong>
              −{hours(r.usedNonBillableHours)}
              <small>hours</small>
            </strong>
          </div>
          <div>
            <span>Future plans & holidays</span>
            <strong>
              −{hours(r.plannedNonBillableHours)}
              <small>hours</small>
            </strong>
          </div>
          <div className="forecast-target">
            <span>Available after future plans</span>
            <strong>
              {hours(r.availableNonBillableHours)}
              <small>hours</small>
            </strong>
          </div>
        </div>
        <p className="calculator-help">
          <strong>
            {hours(r.remainingNonBillableAllowance)} non-billable hours remain
            before future plans.
          </strong>{" "}
          After reserving {hours(r.plannedNonBillableHours)} hours for those
          plans, {hours(r.availableNonBillableHours)} hours are unallocated and
          can be considered for PD or other non-billable work. Availability is
          capped by remaining scheduled time.
        </p>
        <details className="calculator-details">
          <summary>See used and planned hour details</summary>
          <div className="budget-table-wrap">
            <table className="budget-table">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Used</th>
                  <th scope="col">Planned</th>
                  <th scope="col">Annual total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Vacation</th>
                  <td>{hours(plan.vacation.taken)}</td>
                  <td>{hours(plan.vacation.future)}</td>
                  <td>{hours(r.vacationHours)}</td>
                </tr>
                <tr>
                  <th scope="row">Sick leave</th>
                  <td>{hours(plan.sick.taken)}</td>
                  <td>{hours(plan.sick.future)}</td>
                  <td>{hours(r.sickHours)}</td>
                </tr>
                <tr>
                  <th scope="row">Paid holidays</th>
                  <td>{hours(r.takenHolidayHours)}</td>
                  <td>{hours(r.futureHolidayHours)}</td>
                  <td>{hours(r.holidayHours)}</td>
                </tr>
                {plan.commitments.map((c) => (
                  <tr key={c.id}>
                    <th scope="row">{c.name}</th>
                    <td>{hours(c.taken)}</td>
                    <td>{hours(c.future)}</td>
                    <td>{hours(c.taken + c.future)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="calculator-help">
            Itemized used hours: {hours(r.knownTakenNonBillableHours)}. Current
            utilization implies {hours(r.estimatedUsedNonBillableHours)} used
            non-billable hours in total, including these entries. The additional{" "}
            {hours(r.unitemizedTakenNonBillableHours)} hours are estimated
            already-used time not itemized above (for example, prior PD). We use
            the larger of the two totals, never their sum.
          </p>
        </details>
      </section>
      <section className="card forecast-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FROM THE CALCULATION DATE TO DECEMBER 31</p>
            <h2>Remaining-year billable requirement</h2>
          </div>
          <span
            className={"status-pill " + (r.feasible ? "success" : "warning")}
          >
            {r.inputConflictHours > 0.01
              ? "Review inputs"
              : r.billableHoursRemaining === 0
                ? "Billable target met"
                : r.feasible
                  ? "Fits planned schedule"
                  : "Capacity shortfall"}
          </span>
        </div>
        <div className="forecast-grid">
          <div>
            <span>Scheduled time left</span>
            <strong>
              {hours(r.remainingScheduledHours)}
              <small>hours</small>
            </strong>
          </div>
          <div>
            <span>After all future reservations</span>
            <strong>
              {hours(r.remainingAvailableHours)}
              <small>hours</small>
            </strong>
          </div>
          <div>
            <span>Equivalent available workweeks</span>
            <strong>
              {hours(r.remainingEffectiveWeeks)}
              <small>weeks</small>
            </strong>
          </div>
          <div className="forecast-target">
            <span>Billable hours needed per week</span>
            <strong>
              {r.requiredWeeklyBillable === null
                ? "—"
                : hours(r.requiredWeeklyBillable)}
              <small>hours / week</small>
            </strong>
          </div>
        </div>
        {shortfall > 0.01 && (
          <Notice tone="warning">
            Your remaining billable target exceeds available future time by{" "}
            {hours(shortfall)} hours. Reduce future non-billable plans or review
            the goal and current utilization.
          </Notice>
        )}
        <p className="small-note">
          Includes the calculation day. Only future leave, holidays, H&S and
          admin/other plans reduce future capacity; used entries are not
          deducted again. One equivalent workweek is{" "}
          {hours(r.standardWeeklyHours)} available scheduled hours. Undated
          plans use aggregate estimates.
        </p>
      </section>
      <Notice>
        <strong>Calculation rule:</strong> every non-billable hour counts
        against the goal, including vacation, sick leave, holidays, training,
        and admin/other. This is the requested planning convention, not
        confirmed company policy. Observed holiday dates remain configurable.
      </Notice>
      {r.warnings.length > 0 && (
        <details className="card warnings">
          <summary>{r.warnings.length} schedule notes to review</summary>
          <ul>
            {r.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
