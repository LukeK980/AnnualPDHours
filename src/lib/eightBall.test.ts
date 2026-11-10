import { describe, expect, it } from "vitest";
import { calculate } from "./calculations";
import { defaultPlan } from "./plan";
import { smartAnswer } from "./eightBall";
describe("Smart 8-Ball uses remaining non-billable availability", () => {
  it("compares an activity with the current unallocated allowance, not the original annual budget", () => {
    const p = defaultPlan();
    p.vacation.future = 200;
    const r = calculate(p);
    expect(r.availableNonBillableHours).toBeCloseTo(93.6);
    expect(smartAnswer("Can I attend a 24-hour conference?", r)).toContain(
      "fits your remaining non-billable budget",
    );
    expect(smartAnswer("Can I attend a 100-hour conference?", r)).toContain(
      "exceeds your remaining non-billable budget",
    );
  });
  it("rejects nonpositive durations and supports comma-formatted hours", () => {
    const r = calculate(defaultPlan());
    expect(smartAnswer("Can I do -24 hours?", r)).toContain(
      "greater than zero",
    );
    expect(smartAnswer("Can I do 1,000 hours?", r)).toContain("exceeds");
  });
  it("does not approve activities when the budget is overallocated or taken entries conflict", () => {
    const p = defaultPlan();
    p.vacation.future = 1000;
    expect(smartAnswer("Can I do 24 hours?", calculate(p))).toContain("Review");
    p.vacation.future = 0;
    p.vacation.taken = 8;
    expect(smartAnswer("Can I do 24 hours?", calculate(p))).toContain(
      "conflicting",
    );
  });
  it("answers weekly/capacity questions and gives supported prompts for other requests", () => {
    const r = calculate(defaultPlan());
    expect(smartAnswer("What is my weekly requirement?", r)).toContain(
      "after all future reservations",
    );
    expect(smartAnswer("How many PD hours do I have?", r)).toContain(
      "after estimated used",
    );
    expect(smartAnswer("Will I be promoted?", r)).toContain("Try");
  });
});
