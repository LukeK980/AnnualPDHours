import { ArrowRight, Plus, Trash2 } from "lucide-react";
import type {
  AnnualPlan,
  CalculationResult,
  Observation,
  FloatingStatus,
} from "../lib/types";
import {
  DateField,
  Notice,
  NumberField,
  SelectField,
  TextField,
} from "./Fields";
import { hours } from "../lib/format";

const standardIds = new Set(["hs", "admin"]);
const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const observationLabels = {
  actual: "Actual dates; weekend holidays are not moved.",
  nearest_weekday: "Weekend holidays move to the nearest weekday.",
  next_monday: "Weekend holidays move to the next Monday.",
};

export default function Planner({
  plan,
  result: r,
  onChange,
  onCalculate,
}: {
  plan: AnnualPlan;
  result: CalculationResult;
  onChange: (p: AnnualPlan) => void;
  onCalculate: () => void;
}) {
  const patch = (p: Partial<AnnualPlan>) => onChange({ ...plan, ...p });
  const min = `${plan.year}-01-01`,
    max = `${plan.year}-12-31`;
  const floatingPatch = (
    id: string,
    values: Partial<AnnualPlan["floatingHolidays"][number]>,
  ) =>
    patch({
      floatingHolidays: plan.floatingHolidays.map((h) =>
        h.id === id ? { ...h, ...values } : h,
      ),
    });
  return (
    <form
      className="simple-planner submitted-calculator"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const invalid = e.currentTarget.querySelector<HTMLInputElement>(
          '[aria-invalid="true"]',
        );
        if (invalid) {
          for (
            let parent = invalid.parentElement;
            parent;
            parent = parent.parentElement
          )
            if (parent instanceof HTMLDetailsElement) parent.open = true;
          invalid.focus();
          invalid.scrollIntoView({ block: "center" });
          return;
        }
        onCalculate();
      }}
    >
      <div className="page-heading">
        <div>
          <h1>Hours calculator</h1>
          <p>
            Plan your taken and future hours, then see your remaining
            non-billable time.
          </p>
        </div>
      </div>
      <div className="planner-layout">
        <div className="planner-sections">
          <section className="card form-section" aria-labelledby="work-heading">
            <h2 id="work-heading">
              <span className="step-dot">1</span> Work & billability goal
            </h2>
            <div className="fields-grid">
              <NumberField
                label="Hours per workday"
                displayLabel="Hours you work per day"
                value={plan.hoursPerDay}
                min={0.25}
                max={24}
                onChange={(hoursPerDay) =>
                  patch({
                    hoursPerDay,
                    floatingHolidays: plan.floatingHolidays.map((h) =>
                      h.hours === plan.hoursPerDay
                        ? { ...h, hours: hoursPerDay }
                        : h,
                    ),
                  })
                }
              />
              <NumberField
                label="Annual billability goal"
                value={plan.billabilityGoalPct}
                max={100}
                unit="%"
                onChange={(billabilityGoalPct) => patch({ billabilityGoalPct })}
              />
              <NumberField
                label="Current billability"
                value={plan.currentBillabilityPct}
                unit="%"
                max={100}
                onChange={(currentBillabilityPct) =>
                  patch({
                    currentBillabilityPct,
                    legacyCompletedBillableHours: undefined,
                  })
                }
              />
              <DateField
                label="Calculation date"
                value={plan.calculationDate}
                onChange={(calculationDate) => patch({ calculationDate })}
              />
            </div>
            <details className="calculator-details">
              <summary>
                Workdays:{" "}
                {plan.workingDays.map((d) => weekdayNames[d]).join(", ")}{" "}
                <span>Change</span>
              </summary>
              <fieldset className="weekday-field">
                <legend>Which days do you normally work?</legend>
                <div className="weekdays">
                  {weekdayNames.map((day, i) => (
                    <label
                      key={day}
                      className={plan.workingDays.includes(i) ? "selected" : ""}
                    >
                      <input
                        type="checkbox"
                        checked={plan.workingDays.includes(i)}
                        disabled={
                          plan.workingDays.includes(i) &&
                          plan.workingDays.length === 1
                        }
                        onChange={(e) =>
                          patch({
                            workingDays: e.target.checked
                              ? [...plan.workingDays, i].sort()
                              : plan.workingDays.filter((d) => d !== i),
                          })
                        }
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </details>
            <p className="calculator-help">
              Current billability is your year-to-date percentage of all
              scheduled hours. An 80% annual goal leaves 20% for every
              non-billable hour, including vacation, sick leave, holidays,
              training, and admin/other.
            </p>
            {plan.migrationNotice && (
              <Notice>
                {plan.migrationNotice}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => patch({ migrationNotice: undefined })}
                >
                  Dismiss after review
                </button>
              </Notice>
            )}{" "}
          </section>
          <section
            className="card form-section"
            aria-labelledby="leave-heading"
          >
            <h2 id="leave-heading">
              <span className="step-dot">2</span> Vacation & sick leave
            </h2>
            <p className="calculator-help">
              Use hours, not days. Leave anything you don't use at 0.
            </p>
            {(["vacation", "sick"] as const).map((key) => (
              <div className="timeoff-group" key={key}>
                <div className="mini-heading">
                  <h3>{key === "vacation" ? "Vacation" : "Sick leave"}</h3>
                  <span>
                    {hours(key === "vacation" ? r.vacationHours : r.sickHours)}{" "}
                    hours total
                  </span>
                </div>
                <div className="fields-grid leave-inputs">
                  <NumberField
                    label={`${key === "vacation" ? "Vacation" : "Sick leave"} already taken`}
                    displayLabel="Already taken"
                    value={plan[key].taken}
                    onChange={(taken) =>
                      patch({ [key]: { ...plan[key], taken } })
                    }
                  />
                  <NumberField
                    label={`Expected future ${key === "vacation" ? "vacation" : "sick leave"}`}
                    displayLabel="Planned for the rest of the year"
                    value={plan[key].future}
                    onChange={(future) =>
                      patch({ [key]: { ...plan[key], future } })
                    }
                  />
                </div>
              </div>
            ))}
            <p className="calculator-help">
              Keep paid holidays separate. Only planned leave is deducted from
              your remaining-year forecast.
            </p>
          </section>
          <section
            className="card form-section"
            aria-labelledby="other-heading"
          >
            <h2 id="other-heading">
              <span className="step-dot">3</span> H&S training & admin / other
            </h2>
            <p className="calculator-help">
              Split these hours into already taken and still planned. Taken
              hours are included in your current billability total, not added
              twice.
            </p>
            <div className="commitment-groups">
              {plan.commitments.map((c) => (
                <div className="timeoff-group" key={c.id}>
                  <div className="mini-heading">
                    <h3>{c.name}</h3>
                    <span>{hours(c.taken + c.future)} hours total</span>
                  </div>
                  {!standardIds.has(c.id) && (
                    <TextField
                      label={"Name for " + c.name}
                      value={c.name}
                      onChange={(name) =>
                        patch({
                          commitments: plan.commitments.map((x) =>
                            x.id === c.id ? { ...x, name } : x,
                          ),
                        })
                      }
                    />
                  )}
                  <div className="fields-grid leave-inputs">
                    <NumberField
                      label={c.name + " already taken"}
                      displayLabel="Already taken"
                      value={c.taken}
                      onChange={(taken) =>
                        patch({
                          commitments: plan.commitments.map((x) =>
                            x.id === c.id ? { ...x, taken } : x,
                          ),
                        })
                      }
                    />
                    <NumberField
                      label={"Planned " + c.name}
                      displayLabel="Planned for the rest of the year"
                      value={c.future}
                      onChange={(future) =>
                        patch({
                          commitments: plan.commitments.map((x) =>
                            x.id === c.id ? { ...x, future } : x,
                          ),
                        })
                      }
                    />
                  </div>
                  {!standardIds.has(c.id) && (
                    <button
                      type="button"
                      className="text-button delete-button"
                      aria-label={"Delete " + c.name}
                      onClick={() =>
                        patch({
                          commitments: plan.commitments.filter(
                            (x) => x.id !== c.id,
                          ),
                        })
                      }
                    >
                      <Trash2 size={15} /> Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="text-button"
              disabled={plan.commitments.length >= 50}
              onClick={() =>
                patch({
                  commitments: [
                    ...plan.commitments,
                    {
                      id: crypto.randomUUID(),
                      name: `Custom category ${plan.commitments.length - 1}`,
                      taken: 0,
                      future: 0,
                    },
                  ],
                })
              }
            >
              <Plus size={16} /> Add another category
            </button>
          </section>
          <section
            className="card form-section"
            aria-labelledby="holiday-heading"
          >
            <div className="section-heading">
              <h2 id="holiday-heading">
                <span className="step-dot">4</span> Paid holidays
              </h2>
              <span className="holiday-total">
                {hours(r.holidayHours)} hours included
              </span>
            </div>
            <p className="calculator-help">
              The seven named holidays are calculated for {plan.year}. Set the
              status of your two floating holidays below.
            </p>
            {plan.floatingHolidays.map((h, i) => (
              <div className="fields-grid" key={h.id}>
                <SelectField
                  label={"Floating #" + (i + 1) + " status"}
                  value={h.status}
                  onChange={(value) =>
                    floatingPatch(h.id, { status: value as FloatingStatus })
                  }
                >
                  <option value="not_taken">Not Taken</option>
                  <option value="planned">Planned</option>
                  <option value="taken">Taken</option>
                </SelectField>
                <DateField
                  label={"Floating #" + (i + 1) + " date (optional)"}
                  value={h.date}
                  optional
                  min={min}
                  max={max}
                  onChange={(date) => floatingPatch(h.id, { date })}
                />
              </div>
            ))}
            <p className="calculator-help">
              {observationLabels[plan.observation]} Undated floating holidays
              reserve up to one workday each; Taken holidays aren't deducted
              again from future hours.
            </p>
            <details className="calculator-details">
              <summary>
                Holiday dates & settings <span>Optional</span>
              </summary>
              <SelectField
                label="Weekend observation assumption"
                value={plan.observation}
                onChange={(value) =>
                  patch({ observation: value as Observation })
                }
                hint="Choose your policy. Terraphase's weekend observation rule is unconfirmed."
              >
                <option value="actual">Use actual dates</option>
                <option value="nearest_weekday">
                  Move weekend holidays to nearest weekday
                </option>
                <option value="next_monday">
                  Move weekend holidays to Monday
                </option>
              </SelectField>
              <div className="holiday-list">
                {r.holidays.slice(0, 7).map((h) => (
                  <div className="holiday-row" key={h.id}>
                    <div>
                      <strong>{h.name}</strong>
                      <small>{hours(h.hours)} hours counted</small>
                    </div>
                    <div className="holiday-date">
                      <DateField
                        label={`Observed date — ${h.name}`}
                        value={h.date}
                        min={min}
                        max={max}
                        onChange={(date) =>
                          patch({
                            holidayOverrides: {
                              ...plan.holidayOverrides,
                              [h.id]: date,
                            },
                          })
                        }
                      />
                      {plan.holidayOverrides[h.id] && (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            const overrides = { ...plan.holidayOverrides };
                            delete overrides[h.id];
                            patch({ holidayOverrides: overrides });
                          }}
                        >
                          Use observation rule
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {plan.floatingHolidays.map((h, i) => (
                <div className="floating-card" key={h.id}>
                  <h3>Floating Holiday #{i + 1}</h3>
                  <div className="fields-grid">
                    <NumberField
                      label={`Floating #${i + 1} hours`}
                      value={h.hours}
                      max={24}
                      onChange={(value) =>
                        floatingPatch(h.id, { hours: value })
                      }
                    />
                  </div>
                </div>
              ))}
              <p className="calculator-help">
                {hours(r.futureHolidayHours)} holiday hours remain after the
                calculation date. Overlapping dated holidays count once, up to
                daily scheduled hours. Dates outside the work schedule count
                zero.
              </p>
            </details>
          </section>
          <p className="calculator-help goal-rule">
            Calculation rule: your goal applies to all {hours(r.scheduledHours)}{" "}
            scheduled hours. Vacation, sick leave, holidays, H&S training, and
            admin/other all use the non-billable allowance. This is the
            requested planning rule, not a confirmed company policy. Leave is
            entered as aggregate hours excluding holidays.
          </p>
        </div>
      </div>
      <div className="calculator-submit card">
        <div>
          <h2>Ready to see your results?</h2>
          <p className="calculator-help">
            Your entries are saved automatically in this browser.
          </p>
        </div>
        <button type="submit" className="button primary">
          Calculate my results <ArrowRight size={17} />
        </button>
      </div>
    </form>
  );
}
