import { expect, test as setup } from "@playwright/test";
import { E2E_USER } from "./fixtures";

// Logs in once (login is rate limited) and shares the session with all tests.
setup("log in", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_USER.email);
  await page.getByLabel("Senha", { exact: true }).fill(E2E_USER.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
