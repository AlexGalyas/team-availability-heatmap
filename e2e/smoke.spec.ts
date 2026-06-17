import { expect, test } from "@playwright/test";

// Bare e2e smoke test (runs only under `gate.sh --e2e`). The critical-flow
// e2e spec is added in T10.
test("availability page renders", async ({ page }) => {
  await page.goto("/availability");
  await expect(
    page.getByRole("heading", { name: "Доступність команди" }),
  ).toBeVisible();
});
