# STATE — Team Availability Heatmap

slug: `team-availability-heatmap`
last updated: 2026-06-17 by session-ship

> Жива пам'ять фічі між сесіями. Читати на старті (`/resume`), дописувати перед
> кожним `/clear` (`/handoff`). Коротко й чесно.

## Current phase
spec ✓ → plan ✓ → tasks ✓ → implement ✓ → **ship ✓**. **ФІЧА ВІДВАНТАЖЕНА.**
Репо: https://github.com/AlexGalyas/team-availability-heatmap (public), гілка `main`,
тег `v0.1.0`. Рішення людини (2026-06-17): public repo, **push-to-main + tag** (без PR —
бо це перший і єдиний коміт, історії-бейзлайну для діфа не було), назва репо
`team-availability-heatmap`. Жодних відкритих фаз не лишилось.

## Done (зроблено й пройшло gate)
- Прочитано конституцію (mission/tech-stack/conventions), WORKFLOW.md, шаблони, gate.sh.
- Q&A зі замовником, рішення зафіксовані (див. Key decisions).
- Написано `spec.md` (acceptance criteria = майбутні гейти).
- Написано `plan.md`: feature-папка `src/features/availability/`, роут `/availability` +
  mock route handlers, дерево компонентів (Server shell + Client grid/form), доменна модель
  (UTC-слоти), RTK Query api + теги, Redux slice (тільки currentMemberId; drag — локально),
  чисті lib-функції (time/recurring/geometry), a11y grid-патерн, SCSS-структура, test strategy.
- (Gate не застосовний на spec/plan — коду ще немає.)
- **T1 — Скафолд + gate green.** Підняв проєкт з нуля (раніше не було package.json/src).
  Next 15.1.6 (App Router) + React 19 + TS strict (`tsconfig.json`, no `any`), pnpm.
  Скрипти `typecheck`(tsc --noEmit)/`lint`(next lint)/`test`(vitest run)/`build`(next build).
  Vitest+RTL+jsdom (`vitest.config.ts`, `vitest.setup.ts`, smoke `src/smoke.test.tsx`).
  Playwright (`playwright.config.ts`, `e2e/smoke.spec.ts`) — НЕ в дефолтному gate,
  тільки `gate.sh --e2e` (T10; браузер ще не завантажено `playwright install`).
  SCSS Modules працюють; base `src/styles/_variables.scss`
  + `_mixins.scss` (visually-hidden, focus-visible). Порожня `/availability` + root page.
  (Прим.: `availability/page.module.scss` з T1 видалено в T5 — стилі тепер у компонентах.)
  **`bash scripts/gate.sh` → GATE GREEN** (typecheck/lint/test/build усі ✓).
- **T2 — Доменна модель + чисті lib з тестами.** `model/types.ts`, `lib/geometry.ts`,
  `lib/time.ts`, `lib/recurring.ts` + колоковані тести (20 тестів зелені).
  **Рішення про типи (відхилення від plan):** plan типізував `Slot.weekday` як
  `Weekday`(1–5), але offset-перенос може закинути UTC-слот на Сб/Нд. Тому ввів
  `IsoWeekday`(1–7) для **UTC-зберігання** (`Slot`, `SlotKey`), а `Weekday`(1–5)
  лишив для **локального дисплея** (`RecurringRule`, `LocalCell`). `toLocalCell`
  повертає `null` для слотів, що локально випадають на Сб/Нд або поза вікном 08–20.
  **Конвенції для наступних задач:** години — half-open `[start, end)` (endHour
  виключний; форма в T8 валідує `end>start`). offset = `local − UTC` у цілих годинах,
  DST ігноруємо. `getLocalOffsetHours()` — лише клієнтсько (юзає `new Date`).
  Ключі: `slotKey`/`parseSlotKey` (UTC), `localCellKey` (локальний, для React).
  Сітка: `WEEKDAYS`(1–5), `HOURS`(8–19, 12 шт), `allLocalCells()` = 60.
  **`bash scripts/gate.sh` → GATE GREEN**.
- **T3 — Mock server: store + seed + route handlers.** `server/store.ts` (6 сід-учасників
  m1–m6 з укр. іменами, сід-слоти як UTC `SlotKey`; чисті `setMemberSlots`/`applyRuleToState`
  + stateful `getMembers`/`getAllAvailability`/`putMyAvailability`/`applyRecurringRule`).
  `server/contracts.ts` — DTO + type-guards (body як `unknown` → narrow, без `any`).
  Route handlers: `app/api/members`(GET), `app/api/availability`(GET/PUT),
  `app/api/availability/recurring`(POST), усі `dynamic="force-dynamic"`, 400 на невалід.
  **КОНТРАКТ POST recurring:** `{ memberId, rule, offsetHours }` — сервер кличе
  `expandRecurringRule(rule, offsetHours)`, бо rule локальне, а store — UTC. Клієнт (T4/T8)
  має слати свій `getLocalOffsetHours()`. PUT: `{ memberId, slots: SlotKey[] }` (replace).
  store.test.ts — 10 тестів (replace/merge/dedupe/immutability/seed). **GATE GREEN** (30 тестів).
- **T4 — Дата-шар клієнта.** Додав deps `@reduxjs/toolkit@2.12`, `react-redux@9.3`
  (причина: RTK Query + Redux slice — вимога стеку). `model/availabilityApi.ts` (RTK Query:
  getMembers/getAvailability/putMyAvailability/applyRecurringRule; tag `Availability`;
  putMy — optimistic update getAvailability-кешу + rollback, invalidatesTags).
  `model/availabilitySlice.ts` (`currentMemberId`, `setCurrentMember`, `selectCurrentMemberId`).
  `app/store.ts` (`makeStore()` factory — інстанс на клієнта; `RootState`/`AppDispatch`/`AppStore`),
  `app/hooks.ts` (типізовані `useAppDispatch/Selector/Store`), `app/providers.tsx`
  ("use client", store через `useRef`) + підключено в `layout.tsx`.
  **baseUrl абсолютний** (`window.location.origin + /api`) — інакше undici/jsdom падає на
  relative URL. Тести: slice (4) + api-флоу (3: getMembers, optimistic, rollback).
  **Граблі (для тестів):** `fetchBaseQuery` кличе `fetch` з ОДНИМ `Request`-обʼєктом
  (не `(url, init)`) — метод/URL читати з `request.method`/`request.url`. **GATE GREEN** (37 тестів).
- **T5 — Сітка + теплова мапа + 4 стани.** `hooks/useHeatmap.ts` (`computeHeatmap` пура +
  `useHeatmap` мемо; count/max=кількість учасників, intensity=count/max, проєкція UTC→локаль
  через `toLocalCell`, off-grid пропускаємо). Компоненти: `AvailabilityView` (Client-boundary
  "use client", оркестратор), `AvailabilityGrid` (`role="grid"`/`row`/`columnheader`/`rowheader`),
  `GridCell` (memo; `role="gridcell"` ОБГОРТКА навколо `<button aria-pressed>` — бо `aria-pressed`
  не валідний на самому gridcell), `HeatLegend` (decorative, `aria-hidden`), `GridStates`
  (Skeleton/Empty/Error+retry). `grid.module.scss` + `view.module.scss`. page.tsx — Server,
  читає store → props у View. Тест `useHeatmap` (7). **GATE GREEN** (44 тести).
  **Граблі SCSS:** Dart Sass парсить `hsl(...)` як свою color-функцію і падає на
  `var(--heat-alpha)` → значення емітимо як інтерпольований рядок `#{"hsl(... / var(...))"}`.
  **Дизайн-рішення:** offset через `useState(0)`+`useEffect` (SSR/перший рендер = 0 → без
  hydration mismatch, далі реальний). Server props = fallback кешу RTK Query (перший паінт
  success). Toggle вже дротований у `putMyAvailability`, але `currentMemberId` поки null
  (інертний до T7). 4 стани обробляються в `renderGrid()` (error/loading/empty/success).
- **T6 — Drag-фарбування + commit.** `hooks/useDragSelection.ts` (+тест, 8 кейсів): прямокутне
  виділення start↔current, **режим (paint|erase) фіксує ПЕРША клітинка** (selected.has → erase,
  інакше paint), preview через `isSelected`/`isInRange`, commit на **window `pointerup`**,
  abort на `pointercancel`. Hook return — `{isDragging,start,extend,isSelected,isInRange}`.
  **Локальний стан (useState), НЕ Redux** (perf — churn на кожну клітинку; memo'd GridCell
  ререндериться лише коли його prop-флаги змінились). `onCommit({mode, cells})` — hook віддає
  лише прямокутник; View (`onDragCommit`) застосовує як **diff над повним UTC-списком слотів**
  (зберігає off-grid слоти Сб/Нд/поза вікном, які toLocalCell дропає). GridCell: `onPointerDown`
  (з guarded `releasePointerCapture` для touch cross-cell) → start, `onPointerEnter` → extend,
  preview-клас `.cellButtonPreview` (dashed). **Клік лишився ТІЛЬКИ як keyboard-fallback:**
  `onClick` фільтрує `e.detail === 0` (Enter/Space), бо pointer-кліки (detail≥1) комітяться
  через pointerup — інакше подвійний toggle. SCSS: `touch-action:none`+`user-select:none` на
  кнопці. Grid тепер приймає `drag: DragSelection` замість `mySlots`; стабільні адаптери
  `onPaintStart/Enter` через destructure `{start,extend}` (бо hook-return — новий обʼєкт щорендер).
  **`bash scripts/gate.sh` → GATE GREEN** (9 файлів, 52 тести).
- **T7 — MemberSwitcher + персистенс ідентичності.** Сітка ОЖИЛА: `currentMemberId` тепер
  керується юзером. `lib/memberStorage.ts` — чисті `readStoredMemberId/writeStoredMemberId`
  (ключ `team-availability:current-member`, guard `typeof window` + try/catch — SSR/private
  mode/quota деградують тихо). `hooks/useCurrentMember.ts` — slice = джерело правди в сесії,
  localStorage = дзеркало; restore в `useEffect` (client-only → без hydration mismatch: SSR і
  перший рендер бачать `null`, далі застосовуємо збережене). **Restore раз** (ref-guard) і лише
  коли вже є `members` — валідуємо stored id проти списку (stale id видаленого учасника
  ігнорується). `select(id|null)` → dispatch `setCurrentMember` + write. `components/MemberSwitcher.tsx`
  — **презентаційний** `<select>` (label «Я —» лінкований `htmlFor`/`id`, placeholder-опція → null),
  логіка в хуку. Підключено у View в **зарезервовану 2-гу колонку** `.body` (`<aside className=sidebar>`,
  280px desktop) — раніше була порожня. View: `currentMemberId` тепер з `useCurrentMember(members)`
  (прибрав прямий `useAppSelector`), members/availability підняті вище offset. Тести: useCurrentMember
  (5: restore/stale-ignore/wait-for-members/switch+persist/clear) + MemberSwitcher (3: рендер+value/
  вибір/placeholder→null). **Граблі:** anon wrapper-компонент у тесті → next build lint
  `react/display-name` (build лінтить і тести) — назвав `StoreWrapper`. **GATE GREEN** (11 файлів, 60 тестів).
- **T8 — Форма повторюваного правила (Formik + Yup).** **Deps додано:** `formik@2.4.9` + `yup@1.7.1`
  (причина: вимога стеку для форм/валідації). `model/recurringRuleSchema.ts` — чиста Yup-схема
  (`RecurringRuleFormValues`=numbers, `recurringRuleInitialValues`={1,8,9}): weekday oneOf 1–5,
  startHour 8..19, endHour 9..20, **`moreThan(ref(startHour))`** для end>start. `components/RecurringRuleForm.tsx`
  — `<Formik>` render-props, **презентаційний щодо мережі**: parent дає `onApply(rule)` + `status`
  (`idle|pending|error|success`). 3 `<select>` (День=WEEKDAY_FULL_LABELS, З=8..19, По=9..20), числа
  через `setFieldValue(Number)`; field-помилки лінковані `aria-describedby`+`aria-invalid` (показ
  лише `touched && errors`). Submit disabled на pending; банери error(`role=alert`)/success(`role=status`).
  View: `useApplyRecurringRuleMutation` → `ruleStatus` (з isLoading/isError/isSuccess), `onApplyRule`
  шле **{memberId, rule, offsetHours: offset}** (T3-контракт, rule локальне → сервер expand'ить).
  Форма в `.sidebar` ПІД MemberSwitcher, лише коли є `currentMemberId` (інакше hint). mutation
  `invalidatesTags Availability` → heatmap/mySlots самооновлюються. Тести: schema (4 матриця) +
  RecurringRuleForm (4: valid submit / блок інверт-діапазону+aria-invalid / pending+success / error).
  **Прим.:** `/availability` бандл 4.4→29.5 kB (formik+yup) — очікувано. **GATE GREEN** (13 файлів, 68 тестів).
- **T9 — A11y-прохід сітки.** **Roving tabindex**: раніше всі 60 `<button>` були tab-стопами →
  тепер 1 на сітку. `hooks/useGridKeyboard.ts` тримає `active: LocalCell` (старт {1,8}) + `onKeyDown`:
  стрілки рухають active (clamp на краях), Home/End → перша/остання колонка ряду. **Shift+стрілка
  range-paint**: destination toggl'иться, щоб дорівняти origin (дзеркалить drag T6) — через наявний
  `onToggle` (без нового колбека; differ-check `isSelected(origin)!==isSelected(dest)`). Enter/Space
  toggle вже працює натив-кліком кнопки (detail===0 з T6). **Фокус імперативно** через
  `document.getElementById(cellDomId(...))` у keydown-хендлері — НЕ self-focus на active (бо вкрав
  би фокус на mount). `lib/geometry.ts` +`cellDomId(w,h)`=`avail-cell-{w}-{h}`. GridCell: +`active`
  prop → `tabIndex={active?0:-1}` + `id`. AvailabilityGrid: `onKeyDown` на `role=grid`-контейнері,
  передає `active` у клітинки. **Інпути форми + лінковані помилки вже були (T8); aria-label клітинок +
  focus-visible — з T5** (перевірено, повні). **Прим.:** коли сітка `disabled` (немає учасника),
  кнопки disabled → не фокусуються → keyboard-nav неактивна (read-only heatmap) — прийнятно для MVP.
  Тест `AvailabilityGrid` (6: roving tabindex / arrow-nav+focus / Home+End+clamp / Shift-paint /
  plain-arrow-no-toggle / detail0-vs-detail1 click) зі stub DragSelection+Heatmap. **GATE GREEN**
  (14 файлів, 74 тести).
- **T10 — Playwright e2e критичного flow + повний gate (`--e2e`). ФІНАЛЬНА — ВСЕ ЗАКРИТО.**
  `pnpm exec playwright install chromium` (браузер встановлено: chromium-headless-shell v1228).
  Новий спек `e2e/availability-flow.spec.ts` — **ОДИН тест** (свідомо, щоб module-singleton store
  не контамінувався при `fullyParallel`), мутує лише `m2` (Богдан). Сценарій: `/availability` →
  `selectOption("m2")` на `#member-switcher` → чекаємо появу форми (`getByRole("form", {name:
  "Повторюване правило"})`) → **drag-paint**: знаходимо першу `button[aria-pressed="false"]:not([disabled])`
  (гарантує paint-режим, бо перша клітинка фіксує mode), парсимо id `avail-cell-{w}-{h}`, тягнемо
  вертикально на ±2 години через `page.mouse.move/down/move({steps:8})/up`, асертимо обидва кінці
  `aria-pressed=true` → клік «Застосувати правило» (дефолт Пн 08–09) → `getByRole("status")` =
  «Правило застосовано.» + `#avail-cell-1-8` стає `aria-pressed=true` (правило round-trip'иться
  local→UTC→local) → `page.reload()` → `#member-switcher` має value `m2` (localStorage restore).
  **Граблі підтверджені:** offset round-trip стабільний (фарбуєш видиму клітинку — вона лишається
  видимою), тож асерти offset-незалежні. `getByRole("form")` працює бо `<Form aria-label>` дає
  named form role. **`bash scripts/gate.sh --e2e` → GATE GREEN** (typecheck/lint/74 unit/build/
  **2 e2e passed**: smoke + critical-flow).

## In progress / next action
**Нічого не відкрито — фічу відвантажено end-to-end.** Усі фази закрито.

Що зроблено в Ship-сесії (2026-06-17):
1. ✓ `bash scripts/gate.sh --e2e` → GATE GREEN (typecheck/lint/74 unit/build/2 e2e).
2. ✓ `git init` + гілка (спершу `feat/...`, потім перейменована на `main` за рішенням
   push-to-main). `.gitignore` доповнено: додано `.idea` (IDE-файли НЕ комітимо).
3. ✓ Перший коміт усього дерева (75 файлів) `2660926`
   "feat(availability): team availability heatmap MVP".
4. ✓ `gh repo create team-availability-heatmap --public` → push `main`.
5. ✓ Анотований тег `v0.1.0` створено й запушено.

Можливі дальші кроки (НЕ обов'язкові, лише якщо людина захоче):
- GitHub Release з нотатками поверх тегу `v0.1.0` (зараз є лише git-тег).
- Деплой (Vercel) — наразі не налаштовано.
- Nice-to-have з spec: кнопка «Очистити мій вибір»; реальний бекенд замість mock route handlers.
**Прим.:** `.claude/commands/` так і не створено — фази виконували вручну за цим STATE.

## Key decisions (щоб не передумувати щоразу)
- **Persistence**: frontend-only. Next route handlers = mock API з in-memory seed.
  Мій шар дзеркалиться в localStorage. Без реальної БД / зовнішнього бекенду.
- **Identity**: без auth. Перемикач "хто я" зі сід-списку команди.
- **Grid**: Пн–Пт, 08:00–20:00, крок 60 хв → 5×12 = 60 слотів. Дні — колонки, години — рядки.
- **TZ**: зберігати в UTC (день-тижня + година), показувати в локальному. DST ігноруємо
  (фіксований offset, MVP). Перенос через межу доби обробити коректно.
- **Drag**: режим paint/erase задає перша клітинка; commit на mouseup через RTK Query.
- **Heatmap**: інтенсивність ∝ кількість вільних учасників; легенда; виділення "всі вільні".

## Gotchas / landmines
- ~~Проєкт ще НЕ заскафолджено~~ → зроблено в T1. Redux/RTK Query додані в T4.
  ~~Formik/Yup ще НЕ додані~~ → додані в T8 (`formik@2.4.9`, `yup@1.7.1`; форми/валідація).
- Playwright-браузер ще не встановлено: перед першим `gate.sh --e2e` (T10) зробити
  `pnpm exec playwright install chromium`. Дефолтний `gate.sh` e2e не запускає.
- SCSS partials підключаю відносним шляхом (`@use "../../styles/variables"`), а НЕ через
  `@/` alias — sass не знає про webpack/TS-alias.
- Hydration mismatch ризик через локаль/offset форматування часу → форматувати клієнтсько.
- `.claude/commands/` ще не існує (хоч WORKFLOW.md їх згадує) — фази поки виконуємо вручну.

## Open questions for the human
- Підтвердити: фіксований offset без DST прийнятний для MVP? (див. spec Open questions).
- Кнопка "Очистити мій вибір" у MVP — так/ні? (закладено як nice-to-have).
- Кількість/імена сід-учасників — РОЗВ'ЯЗАНО в T3: 6 фейкових (m1–m6, укр. імена).

## Files touched
- docs/specs/team-availability-heatmap/spec.md (новий)
- docs/specs/team-availability-heatmap/plan.md (новий)
- docs/specs/team-availability-heatmap/STATE.md (новий)
- T1: package.json, tsconfig.json, next.config.ts, .eslintrc.json, .gitignore,
  vitest.config.ts, vitest.setup.ts, playwright.config.ts (нові)
- T1: src/app/{layout.tsx,page.tsx}, src/app/availability/{page.tsx,page.module.scss},
  src/styles/{_variables.scss,_mixins.scss}, src/smoke.test.tsx, e2e/smoke.spec.ts (нові)
- T2: src/features/availability/model/types.ts; src/features/availability/lib/
  {geometry.ts,time.ts,recurring.ts} + {geometry,time,recurring}.test.ts (нові)
- T3: src/features/availability/server/{store.ts,contracts.ts,store.test.ts};
  src/app/api/members/route.ts, src/app/api/availability/route.ts,
  src/app/api/availability/recurring/route.ts (нові)
- T4: src/features/availability/model/{availabilityApi.ts,availabilitySlice.ts,
  availabilityApi.test.ts,availabilitySlice.test.ts}; src/app/{store.ts,hooks.ts,
  providers.tsx} (нові); src/app/layout.tsx (Providers); package.json (+RTK,+react-redux)
- T5: src/features/availability/hooks/{useHeatmap.ts,useHeatmap.test.tsx};
  src/features/availability/components/{AvailabilityView,AvailabilityGrid,GridCell,
  HeatLegend,GridStates}.tsx + {grid,view}.module.scss; src/features/availability/lib/
  geometry.ts (+WEEKDAY_FULL_LABELS,+formatHour); src/app/availability/page.tsx (Server→View);
  видалено src/app/availability/page.module.scss
- T6: src/features/availability/hooks/{useDragSelection.ts,useDragSelection.test.tsx} (нові);
  components/{GridCell,AvailabilityGrid,AvailabilityView}.tsx (drag-інтеграція);
  components/grid.module.scss (+touch-action/user-select, +.cellButtonPreview)
- T7: src/features/availability/lib/memberStorage.ts; hooks/{useCurrentMember.ts,
  useCurrentMember.test.tsx}; components/{MemberSwitcher.tsx,MemberSwitcher.test.tsx,
  memberSwitcher.module.scss} (нові); components/AvailabilityView.tsx (useCurrentMember +
  MemberSwitcher у sidebar, прибрано placeholder-hint); components/view.module.scss (+.main,+.sidebar)
- T8: src/features/availability/model/{recurringRuleSchema.ts,recurringRuleSchema.test.ts};
  components/{RecurringRuleForm.tsx,RecurringRuleForm.test.tsx,recurringRuleForm.module.scss} (нові);
  components/AvailabilityView.tsx (applyRecurringRule mutation + ruleStatus + RecurringRuleForm);
  package.json (+formik,+yup)
- T9: src/features/availability/hooks/useGridKeyboard.ts; components/AvailabilityGrid.test.tsx (нові);
  lib/geometry.ts (+cellDomId); components/GridCell.tsx (+active→tabIndex,+id);
  components/AvailabilityGrid.tsx (useGridKeyboard, onKeyDown, active per cell)
