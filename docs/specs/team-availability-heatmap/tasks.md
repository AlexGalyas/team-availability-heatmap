# Tasks: Team Availability Heatmap  (frontend)

slug: `team-availability-heatmap`
derived from: `plan.md`

> Правило: кожна задача — ≈ один логічний коміт, що самостійно проходить
> `bash scripts/gate.sh`. `/next` бере першу невиконану.

## Tasks
- [x] **T1 — Скафолд проєкту + gate green на голому каркасі.**
      Next.js (App Router, TS strict, no `any`), pnpm. Скрипти `typecheck/lint/test/build`
      під `scripts/gate.sh`. Vitest+RTL та Playwright сконфігуровано (порожній smoke-тест).
      SCSS Modules працюють; базові `src/styles/_variables.scss` + `_mixins.scss`
      (visually-hidden, focus-visible). Порожня сторінка `/availability`. → gate зелений.

- [x] **T2 — Доменна модель + чисті lib-функції з тестами.**
      `features/availability/model/types.ts` (Weekday/Slot/SlotKey/Member/MemberAvailability/
      RecurringRule). `lib/geometry.ts` (масиви днів Пн–Пт, годин 08–19, ключі клітинок).
      `lib/time.ts` (`toUtcSlot`/`toLocalCell`, фіксований offset, перенос доби/тижня).
      `lib/recurring.ts` (`expandRecurringRule`). Vitest: межі, `end>start`, перенос. (no UI)

- [x] **T3 — Mock server: in-memory store + seed + route handlers.**
      `server/store.ts` (5–6 сід-учасників + сід-слоти, getMembers/getAll/putMy/applyRule).
      `app/api/members`, `app/api/availability` (GET/PUT), `app/api/availability/recurring` (POST).
      Тест чистої store-логіки (merge правила, replace мого шару).

- [x] **T4 — Дата-шар клієнта: RTK Query api + Redux slice + providers.**
      `model/availabilityApi.ts` (getMembers/getAvailability/putMyAvailability/applyRecurringRule,
      tag `Availability`, invalidation, optimistic для putMy). `model/availabilitySlice.ts`
      (`currentMemberId`). `app/providers.tsx` + підключення в `layout.tsx`. Тест slice + api-флоу.

- [x] **T5 — Сітка + теплова мапа + усі 4 стани.**
      `page.tsx` (Server) читає store для першого паінту → `AvailabilityView`. `AvailabilityGrid`
      (`role="grid"`), `GridCell` (memo, heat-alpha = count/max, маркер мого слота), `HeatLegend`.
      `useHeatmap` (count/max). `GridSkeleton/GridEmpty/GridError(retry)`. SCSS module.
      Тест `useHeatmap`. (drag ще ні — клітинки статичні/клік-toggle базовий)

- [x] **T6 — Drag-фарбування + commit.**
      `useDragSelection` (start/current/mode paint|erase від першої клітинки, preview-діапазон,
      mouseup → commit через `putMyAvailability`, optimistic). Інтеграція в Grid. Тест хука.

- [x] **T7 — MemberSwitcher + персистенс ідентичності.**
      `MemberSwitcher` (select «Я — …») пише `currentMemberId` у slice; дзеркало в localStorage
      (init у `useEffect`, без hydration mismatch); відновлення після reload. Тест перемикання шару.

- [x] **T8 — Форма повторюваного правила (Formik + Yup).**
      `RecurringRuleForm` (weekday/startHour/endHour), Yup (`end>start`, межі, required),
      помилки полів, submit-блок, pending/error/success стани, `applyRecurringRule` → оновлення мапи.
      Тест валідації (блок невалідного submit, показ помилок).

- [x] **T9 — A11y-прохід сітки та форми.**
      Roving tabindex, стрілки/Enter/Space/Shift+стрілки, `aria-label` клітинок, видимий focus,
      підписані інпути + лінковані помилки. Перевірка клавіатурного флоу в RTL-тесті.

- [x] **T10 — Playwright e2e критичного flow + повний gate (`--e2e`).**
      Відкрити `/availability` → обрати учасника → drag-намалювати діапазон → застосувати правило →
      бачити оновлену інтенсивність; reload → `currentMemberId` збережено.

## Notes
- Залежності: T2→T1; T3→T2; T4→T3; T5→T4; T6→T5; T7→T4; T8→T4(+T3); T9→T5,T6,T8; T10→усі.
- Кожна закрита задача → чекбокс тут + запис у STATE.md. Не маркувати без зеленого `gate.sh`.
- Open questions з spec (фіксований offset/DST; кнопка «Очистити»; кількість сід-учасників)
  розв'язуються дефолтами під час відповідних задач (T2/T5/T3) — за потреби уточнити в людини.
