import { describe, expect, it } from "vitest";
import { recurringRuleSchema } from "./recurringRuleSchema";

const valid = { weekday: 2, startHour: 9, endHour: 12 };

describe("recurringRuleSchema", () => {
  it("accepts a well-formed rule", async () => {
    await expect(recurringRuleSchema.validate(valid)).resolves.toEqual(valid);
  });

  it("rejects an inverted range (end ≤ start)", async () => {
    await expect(
      recurringRuleSchema.validate({ ...valid, startHour: 12, endHour: 9 }),
    ).rejects.toThrow(/пізніше за початок/);
    await expect(
      recurringRuleSchema.validate({ ...valid, startHour: 12, endHour: 12 }),
    ).rejects.toThrow(/пізніше за початок/);
  });

  it("rejects a weekday outside Mon–Fri", async () => {
    await expect(
      recurringRuleSchema.validate({ ...valid, weekday: 6 }),
    ).rejects.toThrow(/Пн–Пт/);
  });

  it("rejects hours outside the display window", async () => {
    await expect(
      recurringRuleSchema.validate({ ...valid, startHour: 7 }),
    ).rejects.toThrow();
    await expect(
      recurringRuleSchema.validate({ ...valid, endHour: 21 }),
    ).rejects.toThrow();
  });
});
