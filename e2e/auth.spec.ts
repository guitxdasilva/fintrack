import { expect, test } from "@playwright/test";

test.describe("logged out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const path of ["/dashboard", "/cards", "/budget", "/projection", "/settings"]) {
    test(`${path} redirects to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("registers a new account and lands on the dashboard", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Nome").fill("Nova Pessoa");
    await page.getByLabel("Email").fill(`novo-${Date.now()}@finplanix.test`);
    await page.getByLabel("Senha", { exact: true }).fill("senha-forte-123");
    await page.getByLabel("Confirmar Senha").fill("senha-forte-123");
    await page.getByRole("button", { name: "Criar Conta" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });

  test("rejects a short password", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Nome").fill("Pessoa");
    await page.getByLabel("Email").fill("curta@finplanix.test");
    await page.getByLabel("Senha", { exact: true }).fill("1234567");
    await page.getByLabel("Confirmar Senha").fill("1234567");
    await page.getByRole("button", { name: "Criar Conta" }).click();

    await expect(page.getByText("Senha deve ter pelo menos 8 caracteres")).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });
});
