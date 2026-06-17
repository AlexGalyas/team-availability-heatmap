# Plan: Team Availability Heatmap  (frontend)

slug: `team-availability-heatmap`
derived from: `spec.md`

## Feature location
- Домен/папка фічі: **`src/features/availability/`** — колокуємо все:
  - `components/` — UI (grid, cell, switcher, legend, recurring form, стани).
  - `hooks/` — логічні хуки (`useDragSelection`, `useHeatmap`, `useMyAvailability`).
  - `lib/` — чисті функції (геометрія сітки, UTC↔локаль, розгортання правила).
  - `model/` — типи домену + RTK Query api + Redux slice.
  - `server/` — in-memory store + seed (імпортується route handler'ами та SSR).
  - `*.module.scss` та `*.test.ts(x)` — поруч із відповідним кодом.
- Спільні стилі: `src/styles/_variables.scss`, `_mixins.scss` (створюємо, бо проєкт порожній).

## Routes / pages
- **Сторінка**: `src/app/availability/page.tsx` — **Server Component**. Читає
  початкові дані напряму з `features/availability/server/store.ts` (без network-hop),
  рендерить клієнтський `<AvailabilityView initialMembers initialAvailability />`
  → перший паінт без layout shift, вимога «server-rendered» виконана.
- **Mock API (route handlers)** — джерело правди під час сесії, споживається RTK Query:
  - `src/app/api/members/route.ts` — `GET` список учасників.
  - `src/app/api/availability/route.ts` — `GET` усі шари; `PUT` мій шар `{memberId, slots}`.
  - `src/app/api/availability/recurring/route.ts` — `POST` `{memberId, rule}`: сервер
    розгортає правило в слоти, мерджить у мій шар, повертає оновлений стан.
- **Provider boundary**: `src/app/providers.tsx` ("use client") — Redux `<Provider>` +
  RTK Query; підключається в `src/app/layout.tsx`.

## Component tree
- `app/availability/page.tsx` *(Server)* → дані + `<AvailabilityView/>`.
  - `AvailabilityView` *(Client)* — оркестратор: тримає поточний layout, рендерить:
    - `MemberSwitcher` *(Client)* — `<select>` «Я — …», пише `currentMemberId` у slice.
    - `AvailabilityGrid` *(Client)* — `role="grid"`; шапка днів (Пн–Пт), рядки годин
      (08–19), клітинки. Обробляє drag (mouse/touch) і клавіатуру.
      - `GridCell` *(Client, memo)* — інтенсивність heat + маркер «мій слот» + a11y-мітка.
    - `HeatLegend` *(presentational)* — шкала інтенсивності 0…max.
    - `RecurringRuleForm` *(Client)* — Formik+Yup, масове застосування правила.
    - Стани: `GridSkeleton`, `GridEmpty`, `GridError(retry)`.
- **"use client" межі**: усе інтерактивне (View/Grid/Cell/Switcher/Form) — клієнт;
  `page.tsx` і `HeatLegend` лишаються серверними/презентаційними де можна.

## Data
### Domain model (`model/types.ts`)
```ts
type Weekday = 1 | 2 | 3 | 4 | 5;            // ISO: Пн..Пт
interface Slot { weekday: Weekday; hour: number } // hour — година в UTC (0–23)
type SlotKey = `${Weekday}-${number}`;        // канонічний ключ слота (UTC)
interface Member { id: string; name: string }
interface MemberAvailability { memberId: string; slots: SlotKey[] } // множина UTC-слотів
interface RecurringRule { weekday: Weekday; startHour: number; endHour: number } // локальні години
```
- Сітка відображається в **локальних** координатах (Пн–Пт, 08–19), а зберігається в
  **UTC**. Конвертація — через чисті функції в `lib/` (нижче).

### Server-rendered
- `page.tsx` читає `getMembers()` + `getAllAvailability()` зі `server/store.ts` для
  першого паінту (props у `AvailabilityView`).

### Client (RTK Query) — `model/availabilityApi.ts`
- `tagTypes: ['Availability']`.
- `getMembers` (query).
- `getAvailability` (query, tag `Availability`) — усі шари для теплової мапи.
- `putMyAvailability` (mutation) — замінює мій шар; `invalidatesTags: ['Availability']`.
- `applyRecurringRule` (mutation) — `POST` правило; `invalidatesTags: ['Availability']`.
- SSR-узгодження: перший паінт — зі server props; після монтування RTK Query володіє
  читанням; мутації інвалідовують `Availability` → мапа перераховується. Optimistic
  update для `putMyAvailability` (плавний drag-commit), rollback на помилці.

### Global state (Redux Toolkit) — `model/availabilitySlice.ts`
- `currentMemberId: string | null` — хто я. Дзеркалиться в **localStorage**
  (ініціалізація клієнтсько в `useEffect`, щоб уникнути hydration mismatch).
- **Drag-стан НЕ в Redux** — тримаємо локально в `useDragSelection` (уникаємо churn
  глобального store щокадру). У slice потрапляє лише фінальний commit через мутацію.
- localStorage-дзеркало мого шару — як backup на рестарт dev-сервера (in-memory store
  скидається); реконсиляція при завантаженні (nice-to-have, за тим самим slice/effect).

## Forms (Formik + Yup) — `RecurringRuleForm`
- Поля: `weekday` (select Пн–Пт), `startHour` (08–19), `endHour` (09–20).
- Yup-схема: усі required; `endHour > startHour`; обидві в [8, 20]; крок — ціла година.
- Помилки — на рівні полів (`aria-describedby`, `aria-invalid`); submit заблоковано поки
  форма невалідна; під час `applyRecurringRule` pending → submit вимкнено; помилка
  мутації → банер. Успіх → повідомлення «Правило застосовано».

## UI states
- **Grid**: loading → `GridSkeleton` (ті самі розміри, `aria-busy`); empty → «холодна»
  сітка + підказка; error → `GridError` + retry (refetch); success → інтерактив.
- **Form**: initial (дефолти) / pending (submit off) / error (поля + банер) / success (тост).

## Styling (SCSS Modules)
- Перевикористати/створити спільні: `_variables.scss` (розмір клітинки, gap, кольори
  heat-hue, focus-ring, breakpoints), `_mixins.scss` (visually-hidden, focus-visible,
  grid-cell). Жодних магічних чисел.
- Heat-інтенсивність: один hue, alpha = `count / max` (CSS-змінна на клітинці), щоб
  «вільні всі» = найнасиченіша. «Мій слот» — окрема рамка/патерн поверх heat.
- Responsive: десктоп — сітка + бічна форма; вузькі екрани — форма під сіткою.

## Accessibility
- Grid як **grid widget**: `role="grid"` / `row` / `gridcell`; roving `tabindex`.
  Стрілки рухають фокус, **Enter/Space** — toggle мого слота, **Shift+стрілки** —
  розширення діапазону з подальшим toggle. Drag (mouse/touch) — прогресивне покращення,
  клавіатура — повноцінна альтернатива.
- `aria-label` клітинки: напр. «Вівторок 09:00, вільні 3 з 6, ви: вільні».
- Видимий focus (focus-visible mixin). Форма: підписані інпути, помилки лінковані.

## Risks / tricky bits
- **UTC↔локаль для повторюваного тижня**: offset = `-(new Date().getTimezoneOffset()/60)`;
  `toUtcSlot(localWeekday, localHour, offset)` та `toLocalCell(utcSlot, offset)` з
  переносом через межу доби (mod 24 + зсув дня mod 7). DST ігноруємо (фіксований offset).
  **Edge**: UTC-слот, що локально випадає на Сб/Нд, поза вікном Пн–Пт → ховаємо
  (документуємо як MVP-обмеження). Усе це — чисті функції з тестами.
- **Hydration**: `currentMemberId` (localStorage) і tz-offset ініціалізуємо клієнтсько;
  SSR рендерить детермінований стан (member з server props / none), гідрація доповнює.
- **In-memory store** скидається на рестарт/HMR — приймаємо; localStorage-дзеркало мітигує.
- **Drag perf**: локальний drag-стан, `memo` клітинок, commit лише на mouseup.
- **RTK Query + SSR**: не подвоювати джерело — server props лише для першого паінту,
  далі RTK Query канонічний; уникнути миготіння через `skip`/`initiate` за потреби.

## Test strategy
- **Component/hook (Vitest + RTL)** — критичні:
  - `lib/recurring.expandRecurringRule` — межі, `end>start`, перенос.
  - `lib/time` — UTC↔локаль конвертація, перенос доби/тижня.
  - `useHeatmap` — підрахунок count/інтенсивності, max.
  - `useDragSelection` — діапазон + режим paint/erase від першої клітинки.
  - `RecurringRuleForm` — блокує невалідний submit, показує помилки полів.
  - `MemberSwitcher` — зміна `currentMemberId` перемикає шар.
- **E2E (Playwright)** — критичний flow:
  - відкрити `/availability` → обрати учасника → drag-намалювати діапазон →
    застосувати повторюване правило → бачити оновлену інтенсивність heatmap;
  - reload → `currentMemberId` збережено.
