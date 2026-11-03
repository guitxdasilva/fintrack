import { expect, test } from "@playwright/test";
import { E2E_CARD } from "./fixtures";
import { expectToast, fillNewTransaction, selectOption, statementRow } from "./helpers";

test("statement groups the month by day", async ({ page }) => {
  await page.goto("/transactions");
  const dialog = await fillNewTransaction(page, "Despesa", {
    description: "Padaria E2E",
    amount: "12.5",
    category: "Alimentação",
  });
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Transação criada com sucesso");

  await expect(page.getByRole("region", { name: "Hoje" }).getByText("Padaria E2E")).toBeVisible();
});

test("cards tab: a new purchase is prefilled with the card and lands in its invoice", async ({
  page,
}) => {
  await page.goto("/transactions?view=cards");
  await expect(page.getByRole("radio", { name: E2E_CARD.name })).toHaveAttribute(
    "aria-checked",
    "true"
  );

  await page.getByRole("button", { name: "Nova compra" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("combobox").filter({ hasText: E2E_CARD.name })).toBeVisible();
  await dialog.getByLabel("Descrição").fill("Fone E2E");
  await dialog.getByLabel("Valor (R$)").fill("250");
  await selectOption(page, "Selecione a categoria", "Alimentação");
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Transação criada com sucesso");

  // Bought up to the closing day: next month's invoice; after it, the one after.
  const monthsAhead = new Date().getDate() <= E2E_CARD.closingDay ? 1 : 2;
  for (let i = 0; i < monthsAhead; i++) {
    await page.getByRole("button", { name: "Próximo mês" }).click();
  }
  await expect(statementRow(page, "Fone E2E")).toContainText("Compra");
  await expect(page.getByText("Total da fatura")).toBeVisible();
});

test("fixed tab: the bills checklist marks as paid from the icon", async ({ page }) => {
  await page.goto("/transactions?view=fixed");
  await page.getByRole("button", { name: "Conta fixa" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Repetir por quantos meses?")).toBeVisible(); // opened as fixed
  await dialog.getByLabel("Descrição").fill("Internet Fixa E2E");
  await dialog.getByLabel("Valor (R$)").fill("100");
  await selectOption(page, "Selecione a categoria", "Alimentação");
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Despesa fixa criada para 12 meses");

  const row = statementRow(page, "Internet Fixa E2E");
  await expect(row).toContainText("Pendente");
  await page.getByRole("button", { name: "Marcar como paga: Internet Fixa E2E" }).click();
  await expect(row).toContainText("Pago");
});

test("others tab groups non-card entries by category", async ({ page }) => {
  await page.goto("/transactions");
  const dialog = await fillNewTransaction(page, "Despesa", {
    description: "Feira PIX E2E",
    amount: "40",
    category: "Alimentação",
  });
  await selectOption(page, "Selecione (opcional)", "PIX");
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Transação criada com sucesso");

  await page.getByRole("tab", { name: "Avulsas" }).click();
  await expect(page).toHaveURL(/view=others/);
  await expect(
    page.getByRole("region", { name: /Alimentação/ }).getByText("Feira PIX E2E")
  ).toBeVisible();
});
