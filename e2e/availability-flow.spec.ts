import { expect, Page, test } from "@playwright/test";

// T10 — critical-flow e2e. One spec, one test: the in-memory mock store (T3) is a
// per-process singleton, so a single member mutated by a single test avoids the
// cross-test contamination that `fullyParallel` would otherwise risk.

const MEMBER_ID = "m2"; // Богдан — this run paints/rules for this member only.

/** Drag-paint from one cell button to another via real pointer events. */
async function dragPaint(page: Page, startId: string, endId: string) {
  const start = page.locator(`#${startId}`);
  const end = page.locator(`#${endId}`);
  const a = await start.boundingBox();
  const b = await end.boundingBox();
  if (!a || !b) throw new Error("grid cell not visible for drag");

  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  // Stepped move so intermediate cells receive `pointerenter` (extends the rectangle).
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
}

test("select identity, drag-paint a range, apply a rule, persist across reload", async ({
  page,
}) => {
  await page.goto("/availability");
  await expect(
    page.getByRole("heading", { name: "Доступність команди" }),
  ).toBeVisible();

  // 1. Pick "who am I" — this wakes the grid and reveals the recurring-rule form.
  const identity = page.locator("#member-switcher");
  await identity.selectOption(MEMBER_ID);
  await expect(
    page.getByRole("form", { name: "Повторюване правило" }),
  ).toBeVisible();

  // 2. Drag-paint a vertical range. Start on a cell that is NOT yet mine so the
  //    gesture's first cell fixes "paint" mode (not "erase").
  const startBtn = page
    .locator('[role="gridcell"] button[aria-pressed="false"]:not([disabled])')
    .first();
  await expect(startBtn).toBeVisible();
  const startId = await startBtn.getAttribute("id");
  if (!startId) throw new Error("no paintable cell found");

  const match = startId.match(/^avail-cell-(\d+)-(\d+)$/);
  if (!match) throw new Error(`unexpected cell id: ${startId}`);
  const weekday = Number(match[1]);
  const hour = Number(match[2]);
  const endHour = hour <= 17 ? hour + 2 : hour - 2; // stay inside the 08–19 window
  const endId = `avail-cell-${weekday}-${endHour}`;

  await dragPaint(page, startId, endId);

  // The painted endpoints become "mine" (aria-pressed flips → heatmap count rises).
  await expect(page.locator(`#${startId}`)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(`#${endId}`)).toHaveAttribute("aria-pressed", "true");

  // 3. Apply the default recurring rule (Понеділок 08:00–09:00) and see it land.
  await page
    .getByRole("button", { name: "Застосувати правило" })
    .click();
  await expect(page.getByRole("status")).toHaveText("Правило застосовано.");
  // The rule round-trips local→UTC→local and marks Monday 08:00 as mine.
  await expect(page.locator("#avail-cell-1-8")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // 4. Reload — identity is mirrored to localStorage and restored after mount.
  await page.reload();
  await expect(page.locator("#member-switcher")).toHaveValue(MEMBER_ID);
});
