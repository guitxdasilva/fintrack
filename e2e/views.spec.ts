import { expect, test } from "@playwright/test";
import { E2E_CARD, E2E_CARD_B } from "./fixtures";
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

test("cards tab: every card side by side, each with its own new purchase", async ({ page }) => {
  await page.goto("/transactions?view=cards");
  await expect(page.getByRole("radio", { name: "Todos" })).toHaveAttribute("aria-checked", "true");
  const cardA = page.getByRole("region", { name: `Fatura do ${E2E_CARD.name}` });
  const cardB = page.getByRole("region", { name: `Fatura do ${E2E_CARD_B.name}` });
  await expect(cardA).toBeVisible();
  await expect(cardB).toBeVisible();

  // Card B has no closing day: the purchase stays in this month's column
  await page.getByRole("button", { name: `Nova compra no ${E2E_CARD_B.name}` }).click();
  let dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("combobox").filter({ hasText: E2E_CARD_B.name })).toBeVisible();
  await dialog.getByLabel("Descrição").fill("Livro E2E");
  await dialog.getByLabel("Valor (R$)").fill("80");
  await selectOption(page, "Selecione a categoria", "Alimentação");
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Transação criada com sucesso");
  await expect(cardB.getByText("Livro E2E")).toBeVisible();
  await expect(cardB).toContainText("R$ 80,00 pendente");
  await expect(cardA.getByText("Livro E2E")).toHaveCount(0);

  // Card A closes on day 10: the purchase goes to a later invoice
  await page.getByRole("button", { name: `Nova compra no ${E2E_CARD.name}` }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Descrição").fill("Fone E2E");
  await dialog.getByLabel("Valor (R$)").fill("250");
  await selectOption(page, "Selecione a categoria", "Alimentação");
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Transação criada com sucesso");

  const monthsAhead = new Date().getDate() <= E2E_CARD.closingDay ? 1 : 2;
  for (let i = 0; i < monthsAhead; i++) {
    await page.getByRole("button", { name: "Próximo mês" }).click();
  }
  await expect(statementRow(page, "Fone E2E")).toContainText("Compra");

  // Paying one card's invoice from its column
  await cardA.getByRole("button", { name: `Pagar fatura do ${E2E_CARD.name}` }).click();
  await expect(cardA).toContainText("Paga");
});

test("cards tab: picking a card opens its detail", async ({ page }) => {
  await page.goto("/transactions?view=cards");
  await page.getByRole("radio", { name: E2E_CARD.name }).click();
  await expect(page).toHaveURL(/card=/);
  await expect(page.getByText("Total da fatura")).toBeVisible();
  await page.getByRole("radio", { name: "Todos" }).click();
  await expect(page).not.toHaveURL(/card=/);
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
