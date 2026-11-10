import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { AnnualPlan, SimpleInputs } from "../lib/types";
import {
  calculateSimple,
  simpleInputs,
  applySimpleInputs,
} from "../lib/simpleCalculator";
import { NumberField, Notice } from "./Fields";
import { hours } from "../lib/format";

export default function SimpleCalculator({
  plan,
  onChange,
  onRefine,
}: {
  plan: AnnualPlan;
  onChange: (p: AnnualPlan) => void;
  onRefine: (p: AnnualPlan) => void;
}) {
  const [transferError, setTransferError] = useState("");
  const inputs = simpleInputs(plan),
    r = calculateSimple(plan);
  const update = (patch: Partial<SimpleInputs>) => {
    setTransferError("");
    onChange({ ...plan, simpleInputs: { ...inputs, ...patch } });
  };
  return (
    <form
      className="simple-planner annual-simple"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const invalid = e.currentTarget.querySelector<HTMLInputElement>(
          '[aria-invalid="true"]',
        );
        if (invalid) {
          invalid.focus();
          return;
        }
        try {
          onRefine(applySimpleInputs(plan));
        } catch (error) {
          setTransferError(
            error instanceof Error
              ? error.message
              : "Review the annual assumptions before carrying them into Refined Calculator.",
          );
        }
      }}
    >
      <div className="page-heading">
        <div>
          <h1>Simple Calculator</h1>
          <p>Find your available non-billable hours for the whole year.</p>
        </div>
        <span className="year-pill">{plan.year} annual plan</span>
      </div>
      <div className="planner-layout">
        <div className="planner-sections">
          <section className="card form-section">
            <h2>
              <span className="step-dot">1</span> Schedule & utilization goal
            </h2>
            <div className="fields-grid">
              <NumberField
                label="Hours per workday"
                value={plan.hoursPerDay}
                min={0.25}
                max={24}
                onChange={(value) =>
                  onChange({
                    ...plan,
                    hoursPerDay: value,
                    floatingHolidays: plan.floatingHolidays.map((h) =>
                      h.hours === plan.hoursPerDay ? { ...h, hours: value } : h,
                    ),
                  })
                }
              />
              <NumberField
                label="Utilization goal"
                value={plan.billabilityGoalPct}
                max={100}
                unit="%"
                onChange={(value) =>
                  onChange({ ...plan, billabilityGoalPct: value })
                }
              />
            </div>
            <p className="calculator-help">
              {r.workdays} scheduled workdays × {hours(plan.hoursPerDay)} hours
              = {hours(r.scheduledHours)} hours in {plan.year}. Your utilization
              goal applies to all scheduled hours.
            </p>
            <details className="calculator-details">
              <summary>Change workdays</summary>
              <fieldset className="weekday-field">
                <legend>Which days do you normally work?</legend>
                <div className="weekdays">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d, i) => (
                      <label
                        key={d}
                        className={
                          plan.workingDays.includes(i) ? "selected" : ""
                        }
                      >
                        <input
                          type="checkbox"
                          checked={plan.workingDays.includes(i)}
                          disabled={
                            plan.workingDays.includes(i) &&
                            plan.workingDays.length === 1
                          }
                          onChange={(e) =>
                            onChange({
                              ...plan,
                              workingDays: e.target.checked
                                ? [...plan.workingDays, i].sort()
                                : plan.workingDays.filter((day) => day !== i),
                            })
                          }
                        />
                        <span>{d}</span>
                      </label>
                    ),
                  )}
                </div>
              </fieldset>
            </details>
          </section>
          <section className="card form-section">
            <h2>
              <span className="step-dot">2</span> Paid holidays
            </h2>
            <div className="fields-grid">
              <NumberField
                label="Paid holiday allowance"
                value={inputs.holidayDays}
                max={366}
                unit="days / year"
                onChange={(holidayDays) => update({ holidayDays })}
              />
              <div className="annual-assumption-total">
                <span>Holiday hours</span>
                <strong>
                  {hours(r.holidayHours)} <small>hours / year</small>
                </strong>
              </div>
            </div>
            <p className="calculator-help">
              Starts at nine paid days, including two floating holidays. This is
              an editable annual allowance; no weekend-observation policy is
              assumed. Refined Calculator lets you enter holiday dates.
            </p>
          </section>
          <section className="card form-section">
            <h2>
              <span className="step-dot">3</span> Vacation & sick leave
            </h2>
            <p className="calculator-help">
              Enter full-year totals, including any hours already used.
            </p>
            <div className="fields-grid">
              <NumberField
                label="Annual vacation"
                value={inputs.vacationHours}
                onChange={(vacationHours) => update({ vacationHours })}
              />
              <NumberField
                label="Anticipated annual sick leave"
                value={inputs.sickHours}
                onChange={(sickHours) => update({ sickHours })}
              />
            </div>
          </section>
          <section className="card form-section">
            <h2>
              <span className="step-dot">4</span> Required training &
              administration
            </h2>
            <div className="fields-grid">
              <NumberField
                label="Required H&S training"
                value={inputs.hsHours}
                onChange={(hsHours) => update({ hsHours })}
              />
              <NumberField
                label="Assumed administration"
                value={inputs.adminHours}
                onChange={(adminHours) => update({ adminHours })}
              />
            </div>
            <p className="calculator-help">
              Administration starts at 52 hours/year for timesheets and expense
              reports. Edit this assumption as needed. These are planning
              inputs, not confirmed company requirements.
            </p>
          </section>
        </div>
        <aside
          className="planner-results card simple-annual-result"
          aria-labelledby="simple-result-title"
        >
          <div className="section-heading">
            <h2 id="simple-result-title">Your annual result</h2>
            <span className="live-badge">LIVE</span>
          </div>
          <div className="pd-result">
            <span>Available non-billable hours</span>
            <strong>
              {hours(r.availableHours)}
              <small>hours / year</small>
            </strong>
          </div>
          <dl className="detail-list calculation-list">
            {[
              ["Annual scheduled hours", hours(r.scheduledHours)],
              ["Utilization goal", `${hours(plan.billabilityGoalPct)}%`],
              ["Required utilized hours", hours(r.utilizedHours)],
              ["Non-billable allowance", hours(r.nonBillableAllowance)],
              ["Paid holidays", `−${hours(r.holidayHours)}`],
              ["Vacation", `−${hours(inputs.vacationHours)}`],
              ["Anticipated sick leave", `−${hours(inputs.sickHours)}`],
              ["H&S training", `−${hours(inputs.hsHours)}`],
              ["Administration", `−${hours(inputs.adminHours)}`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {r.deficitHours > 0 && (
            <Notice tone="warning">
              Your annual assumptions exceed the non-billable allowance by{" "}
              {hours(r.deficitHours)} hours. Available hours are shown as zero.
            </Notice>
          )}
          <p className="calculator-help">
            This is a full-year budget. For PD availability after additional
            responsibilities—or a mid-year forecast using current
            utilization—continue to Refined Calculator.
          </p>
          {transferError && <Notice tone="warning">{transferError}</Notice>}
          <button type="submit" className="button primary results-button">
            Use these inputs in Refined <ArrowRight size={17} />
          </button>
          <p className="small-note">
            Used hours and extra responsibilities already entered in Refined
            Calculator will be preserved.
          </p>
        </aside>
      </div>
    </form>
  );
}
