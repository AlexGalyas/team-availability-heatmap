// Validation for the recurring-rule form, kept out of the component as a plain Yup schema
// so it can be unit-tested and reused. Mirrors the domain invariants: weekday Mon–Fri,
// hours inside the display window [START_HOUR, END_HOUR), and a non-empty half-open range
// (`endHour > startHour`, endHour exclusive).

import * as Yup from "yup";
import { END_HOUR, START_HOUR } from "../lib/geometry";

export interface RecurringRuleFormValues {
  weekday: number;
  startHour: number;
  endHour: number;
}

export const recurringRuleInitialValues: RecurringRuleFormValues = {
  weekday: 1,
  startHour: START_HOUR,
  endHour: START_HOUR + 1,
};

export const recurringRuleSchema: Yup.ObjectSchema<RecurringRuleFormValues> =
  Yup.object({
    weekday: Yup.number()
      .typeError("Оберіть день")
      .required("Оберіть день")
      .oneOf([1, 2, 3, 4, 5], "День має бути Пн–Пт"),
    startHour: Yup.number()
      .typeError("Оберіть початок")
      .required("Оберіть початок")
      .min(START_HOUR, `Не раніше ${START_HOUR}:00`)
      .max(END_HOUR - 1, `Не пізніше ${END_HOUR - 1}:00`),
    endHour: Yup.number()
      .typeError("Оберіть кінець")
      .required("Оберіть кінець")
      .min(START_HOUR + 1, `Не раніше ${START_HOUR + 1}:00`)
      .max(END_HOUR, `Не пізніше ${END_HOUR}:00`)
      .moreThan(Yup.ref("startHour"), "Кінець має бути пізніше за початок"),
  });
