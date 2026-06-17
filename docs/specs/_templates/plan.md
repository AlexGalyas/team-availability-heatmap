# Plan: <Feature name>  (frontend)

slug: `<feature-slug>`
derived from: `spec.md`

## Feature location
- Домен/папка фічі: <...>; що колокуємо (компоненти, хуки, *.module.scss, тести)

## Routes / pages
- <App Router segment(s), layouts, route handlers>

## Component tree
- <дерево; Server vs Client і чому (прагматично)>
- "use client" межі: <де і навіщо>

## Data
- Server-rendered: <Server Components + route handlers — що>
- RTK Query: <endpoints/мутації, кеш, інвалідація тегів>
- Redux Toolkit slices: <лише якщо потрібен глобальний стан>

## Forms (Formik + Yup)
- <форм-стейт, Yup-схема, вивід помилок полів>

## UI states
- loading / empty / error / success — для кожної поверхні

## Styling (SCSS Modules)
- <які наявні міксини/змінні перевикористати; нові partials>

## Accessibility
- <фокус-менеджмент, ARIA за потреби, клавіатура>

## Risks / tricky bits
- <RSC/serialization, hydration, гонки, кеш RTK Query>

## Test strategy
- Component/hook (Vitest + RTL): <критичні>
- E2E (Playwright): <критичні сценарії>
