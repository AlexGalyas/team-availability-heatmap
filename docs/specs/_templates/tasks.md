# Tasks: <Feature name>  (frontend)

slug: `<feature-slug>`
derived from: `plan.md`

> Правило: кожна задача — ≈ один логічний коміт, що самостійно проходить
> `bash scripts/gate.sh`. `/next` бере першу невиконану.

## Tasks
- [ ] T1 — <напр.: каркас сторінки/роуту (server component) у папці фічі>
- [ ] T2 — <напр.: дані: route handler / RTK Query endpoint + loading/empty>
- [ ] T3 — <напр.: презентаційний компонент + *.module.scss + тест критичної логіки>
- [ ] T4 — <напр.: Formik-форма + Yup-схема + error-стан>
- [ ] T5 — <напр.: a11y-прохід: фокус, підписи, клавіатура>
- [ ] T6 — <напр.: Playwright e2e критичного flow>

## Notes
- Залежності: <напр.: T3 потребує T2>
- Кожна закрита задача → чекбокс тут + запис у STATE.md.
