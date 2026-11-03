import { expect, test, type Locator, type Page } from "@playwright/test";
import { E2E_CARD_B } from "./fixtures";
import { expectToast, selectOption, statementRow } from "./helpers";

test.describe.configure({ mode: "serial" });

// Card B has no closing day: purchases and refunds stay in this month's column
const column = (page: Page) => page.getByRole("region", { name: `Fatura do ${E2E_CARD_B.name}` });

async function invoiceTotal(col: Locator): Promise<number> {
  const text = (await col.getByTestId("invoice-total").textContent()) ?? "";
  const value = Number(text.replace(/[^\d,]/g, "").replace(",", "."));
  return text.includes("-") ? -value : value;
}

async function addPurchase(page: Page, description: string, amount: string) {
  await page.getByRole("button", { name: `Nova compra no ${E2E_CARD_B.name}` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Descrição").fill(description);
  await dialog.getByLabel("Valor (R$)").fill(amount);
  await selectOption(page, "Selecione a categoria", "Alimentação");
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Transação criada com sucesso");
}

async function refundFromMenu(page: Page, description: string) {
  await page.getByRole("button", { name: `Ações de ${description}` }).click();
  await page.getByRole("menuitem", { name: "Reembolsar" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/transactions?view=cards");
});

test("partial refund shows on the purchase and lowers the invoice", async ({ page }) => {
  await addPurchase(page, "Tênis E2E", "200");
  const col = column(page);
  await expect(statementRow(page, "Tênis E2E")).toBeVisible();
  const before = await invoiceTotal(col);

  await refundFromMenu(page, "Tênis E2E");
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: "Parcial" }).click();
  await dialog.getByLabel("Valor reembolsado (R$)").fill("50");
  await dialog.getByRole("button", { name: "Reembolsar" }).click();
  await expectToast(page, "Reembolso de R$ 50,00 registrado");

  await expect(statementRow(page, "Tênis E2E")).toContainText("R$ 50,00 reembolsado");
  await expect(col).toContainText("R$ 50,00 reembolsado");
  await expect.poll(() => invoiceTotal(col)).toBe(before - 50);
  // The refund is shown on the purchase, not as a separate line
  await expect(statementRow(page, "Reembolso: Tênis E2E")).toHaveCount(0);
});

test("refunding the rest marks the purchase as refunded", async ({ page }) => {
  await refundFromMenu(page, "Tênis E2E");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("radio", { name: "Total (R$ 150,00)" })).toBeVisible();
  await dialog.getByRole("button", { name: "Reembolsar" }).click();
  await expectToast(page, "Compra reembolsada");

  await expect(statementRow(page, "Tênis E2E")).toContainText("Reembolsado");
  await page.getByRole("button", { name: "Ações de Tênis E2E" }).click();
  await expect(page.getByRole("menuitem", { name: "Reembolsar" })).toHaveCount(0);
  await page.keyboard.press("Escape");
});

test("a card refund not tied to a purchase is credited to the viewed invoice", async ({ page }) => {
  const col = column(page);
  await expect(col).toBeVisible();
  const before = await invoiceTotal(col);

  await page.getByRole("button", { name: `Reembolso no ${E2E_CARD_B.name}` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Descrição").fill("Cashback E2E");
  await dialog.getByLabel("Valor (R$)").fill("30");
  await selectOption(page, "Selecione a categoria", "Alimentação");
  await dialog.getByRole("button", { name: "Adicionar reembolso" }).click();
  await expectToast(page, "Reembolso registrado");

  await expect(statementRow(page, "Cashback E2E")).toContainText("+R$ 30,00");
  await expect(statementRow(page, "Cashback E2E")).toContainText("Reembolso");
  await expect.poll(() => invoiceTotal(col)).toBe(before - 30);
});
