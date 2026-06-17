// Recurring weekly availability rule — "вільний(а) щотижня, день, з…по…". Formik owns form
// state, Yup the validation (model/recurringRuleSchema). Presentational w.r.t. the network:
// the parent passes `onApply` (which fires the mutation) and a `status` for the result banner.

import { Formik, Form } from "formik";
import {
  formatHour,
  END_HOUR,
  HOURS,
  START_HOUR,
  WEEKDAY_FULL_LABELS,
  WEEKDAYS,
} from "../lib/geometry";
import type { RecurringRule, Weekday } from "../model/types";
import {
  recurringRuleInitialValues,
  recurringRuleSchema,
} from "../model/recurringRuleSchema";
import styles from "./recurringRuleForm.module.scss";

export type RecurringStatus = "idle" | "pending" | "error" | "success";

export interface RecurringRuleFormProps {
  /** Apply the (valid) rule — wired to `applyRecurringRule`. */
  onApply: (rule: RecurringRule) => void;
  /** Lifecycle of the last apply, for the result banner / pending state. */
  status: RecurringStatus;
}

/** Start-of-cell hours: 08:00 … 19:00. */
const START_OPTIONS = HOURS;
/** End-of-range hours (exclusive): 09:00 … 20:00. */
const END_OPTIONS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + 1 + i,
);

export function RecurringRuleForm({ onApply, status }: RecurringRuleFormProps) {
  const pending = status === "pending";

  return (
    <Formik
      initialValues={recurringRuleInitialValues}
      validationSchema={recurringRuleSchema}
      onSubmit={(values) => {
        onApply({
          weekday: values.weekday as Weekday,
          startHour: values.startHour,
          endHour: values.endHour,
        });
      }}
    >
      {({ values, errors, touched, setFieldValue, handleBlur }) => {
        const fieldError = (name: "weekday" | "startHour" | "endHour") =>
          touched[name] && errors[name] ? errors[name] : undefined;

        return (
          <Form className={styles.form} noValidate aria-label="Повторюване правило">
            <p className={styles.heading}>Я вільний(а) щотижня</p>

            <div className={styles.field}>
              <label htmlFor="rule-weekday" className={styles.label}>
                День
              </label>
              <select
                id="rule-weekday"
                name="weekday"
                className={styles.select}
                value={values.weekday}
                onChange={(e) => setFieldValue("weekday", Number(e.target.value))}
                onBlur={handleBlur}
                aria-invalid={fieldError("weekday") ? true : undefined}
                aria-describedby={
                  fieldError("weekday") ? "rule-weekday-error" : undefined
                }
              >
                {WEEKDAYS.map((weekday) => (
                  <option key={weekday} value={weekday}>
                    {WEEKDAY_FULL_LABELS[weekday]}
                  </option>
                ))}
              </select>
              {fieldError("weekday") ? (
                <p id="rule-weekday-error" className={styles.error}>
                  {fieldError("weekday")}
                </p>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="rule-start" className={styles.label}>
                З
              </label>
              <select
                id="rule-start"
                name="startHour"
                className={styles.select}
                value={values.startHour}
                onChange={(e) =>
                  setFieldValue("startHour", Number(e.target.value))
                }
                onBlur={handleBlur}
                aria-invalid={fieldError("startHour") ? true : undefined}
                aria-describedby={
                  fieldError("startHour") ? "rule-start-error" : undefined
                }
              >
                {START_OPTIONS.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
              {fieldError("startHour") ? (
                <p id="rule-start-error" className={styles.error}>
                  {fieldError("startHour")}
                </p>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="rule-end" className={styles.label}>
                По
              </label>
              <select
                id="rule-end"
                name="endHour"
                className={styles.select}
                value={values.endHour}
                onChange={(e) => setFieldValue("endHour", Number(e.target.value))}
                onBlur={handleBlur}
                aria-invalid={fieldError("endHour") ? true : undefined}
                aria-describedby={
                  fieldError("endHour") ? "rule-end-error" : undefined
                }
              >
                {END_OPTIONS.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
              {fieldError("endHour") ? (
                <p id="rule-end-error" className={styles.error}>
                  {fieldError("endHour")}
                </p>
              ) : null}
            </div>

            <button type="submit" className={styles.submit} disabled={pending}>
              {pending ? "Застосовуємо…" : "Застосувати правило"}
            </button>

            {status === "error" ? (
              <p className={styles.statusError} role="alert">
                Не вдалося застосувати правило. Спробуйте ще раз.
              </p>
            ) : null}
            {status === "success" ? (
              <p className={styles.statusSuccess} role="status">
                Правило застосовано.
              </p>
            ) : null}
          </Form>
        );
      }}
    </Formik>
  );
}
