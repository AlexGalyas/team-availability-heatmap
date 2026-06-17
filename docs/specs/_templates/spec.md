# Spec: <Feature name>  (frontend)

slug: `<feature-slug>`
status: draft
owner: <you>

## Problem / Why
<Яку проблему користувача вирішуємо. 2–4 речення.>

## Scope
### In scope
- <...>
### Out of scope
- <явно перелічи, що НЕ робимо>

## User flows & screens
<Які екрани/кроки. Як користувач проходить сценарій.>

## UI states  (для кожної ключової поверхні)
- Loading / Empty / Error (як показуємо помилку API/валідації) / Success

## Data
- Server-rendered (Server Components + route handlers): <що саме>
- Client (RTK Query): <які запити/мутації>
- Global state (Redux Toolkit): <чи потрібен; що зберігаємо>

## Forms (якщо є)
- Formik + Yup: <поля, правила валідації>

## Acceptance criteria  (майбутні гейти — перевірюваний вигляд)
- [ ] <напр.: список рендериться зі server component, без layout shift>
- [ ] <напр.: Formik-форма блокує submit і показує помилки полів за Yup-схемою>
- [ ] <напр.: error-стан при 5xx з retry>
- [ ] a11y: керується з клавіатури, інпути підписані, видимий focus
- [ ] критичні компоненти/хуки покриті (Vitest+RTL); критичний flow — Playwright
- [ ] `bash scripts/gate.sh` зелений

## Open questions
- <...>

## Notes / constraints
- <responsive, перформанс, i18n>
