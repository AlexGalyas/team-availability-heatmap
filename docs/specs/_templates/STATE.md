# STATE — <Feature name>

slug: `<feature-slug>`
last updated: <YYYY-MM-DD HH:MM> by <session>

> Це жива пам'ять фічі між сесіями. Агент читає це на старті (`/resume`) і
> дописує перед кожним `/clear` (`/handoff`). Тримай коротким і чесним.

## Current phase
<spec | plan | tasks | implement | ship>

## Done (зроблено й пройшло gate)
- <T1 — каркас сторінки orders (server component). gate green.>
- <...>

## In progress / next action
<Дуже конкретно: яка саме наступна задача і перший крок по ній.
напр.: "T2 — RTK Query endpoint getOrders + loading/empty. Почати зі слайсу ordersApi.">

## Key decisions (щоб не передумувати щоразу)
- <напр.: список — server component; інтерактивні фільтри — окремий client-компонент>
- <напр.: дані списку через RTK Query, не через server fetch (бо часто оновлюються)>

## Gotchas / landmines
- <напр.: hydration mismatch через дату — форматувати на клієнті в useEffect>

## Open questions for the human
- <те, що потребує твого рішення перед продовженням>

## Files touched
- <src/features/orders/...>
- <src/features/orders/ordersApi.ts (RTK Query)>

---
### Приклад заповненого STATE (видали при старті реальної фічі)
```
## Current phase
implement

## Done
- T1 — сторінка /orders каркас (server component) + layout. gate green.
- T2 — RTK Query endpoint getOrders + loading/empty стани. gate green.

## In progress / next action
T3 — презентаційний OrderList + orderList.module.scss + тест критичної логіки
сортування. Почати з рендеру списку, потім тест на порядок за датою.

## Key decisions
- Список рендериться server-side для першого екрану; пагінація/фільтри — RTK Query
  на клієнті. Глобального Redux-стану для цієї фічі поки не треба.

## Gotchas
- next build падав на серіалізації Date з server → client; передаю ISO-рядок.
```
