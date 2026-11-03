import { expect, test } from "@playwright/test";
import { expectToast, fillNewTransaction } from "./helpers";

// Builds on shared state: income + expense, then the starting balance.
test.describe.configure({ mode: "serial" });

test("dashboard shows the month's totals", async ({ page }) => {
  await page.goto("/transactions");

  let dialog = await fillNewTransaction(page, "Receita", {
    description: "Salário E2E",
    amount: "5000",
    category: "Salário",
  });
  await dialog.getByRole("button", { name: "Fixa" }).click();
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Receita fixa criada para 12 meses");

  dialog = await fillNewTransaction(page, "Despesa", {
    description: "Aluguel E2E",
    amount: "1500",
    category: "Alimentação",
  });
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Transação criada com sucesso");

  await page.goto("/dashboard");
  await expect(page.getByText("Resultado do Mês")).toBeVisible();
  await expect(page.getByText("Próximos meses")).toBeVisible();
  await expect(page.getByText("Resultado previsto de cada mês", { exact: false })).toBeVisible();
  await expect(page.getByText("Aluguel E2E")).toBeVisible();
  await expect(page.getByText("R$ 5.000,00").first()).toBeVisible();
});

test("projection tooltip shows the month breakdown", async ({ page }) => {
  await page.goto("/projection");
  await expect(page.getByRole("heading", { name: "Projeção" })).toBeVisible();

  await page.locator(".recharts-bar-rectangle").first().hover();
  const tooltip = page.locator(".recharts-tooltip-wrapper");
  await expect(tooltip.getByText("Resultado do mês")).toBeVisible();
  await expect(tooltip.getByText("R$ 5.000,00")).toBeVisible();
  await expect(page.getByText("NaN")).toHaveCount(0);
});

test("starting balance turns into current and projected balance", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Saldo (somando suas contas)").fill("1000");
  await page.getByRole("button", { name: "Salvar saldo" }).click();
  await expectToast(page, "Saldo atualizado");
  await expect(page.getByText("Saldo hoje")).toBeVisible();
  // Today's transactions are already part of the informed (end-of-day) balance
  await expect(page.getByText("R$ 1.000,00").first()).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("Saldo Atual")).toBeVisible();
  await expect(page.getByText("R$ 1.000,00").first()).toBeVisible();
  await expect(page.getByText("Saldo previsto no fim de cada mês")).toBeVisible();
  await expect(page.getByText("· este mês")).toBeVisible();

  await page.goto("/projection");
  await expect(page.getByText("Saldo projetado", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Informar saldo" })).toHaveCount(0);
});
