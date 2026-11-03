import { expect, test } from "@playwright/test";
import { E2E_USER, withDb } from "./fixtures";
import { expectToast, fillNewTransaction, transactionTable } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/transactions");
});

test("creates, edits and deletes an expense", async ({ page }) => {
  const dialog = await fillNewTransaction(page, "Despesa", {
    description: "Mercado E2E",
    amount: "123.45",
    category: "Alimentação",
  });
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Transação criada com sucesso");

  const table = transactionTable(page);
  await expect(table.getByText("Mercado E2E")).toBeVisible();
  await expect(table.getByText("R$ 123,45")).toBeVisible();

  await page.getByRole("button", { name: "Editar Mercado E2E" }).first().click();
  await page.getByRole("dialog").getByLabel("Descrição").fill("Mercado E2E editado");
  await page.getByRole("dialog").getByRole("button", { name: "Atualizar" }).click();
  await expectToast(page, "Transação atualizada com sucesso");
  await expect(table.getByText("Mercado E2E editado")).toBeVisible();

  await page.getByRole("button", { name: "Excluir Mercado E2E editado" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Excluir" }).click();
  await expectToast(page, "Transação excluída com sucesso");
  await expect(table.getByText("Mercado E2E editado")).toHaveCount(0);
});

test("marks selected expenses as paid and back", async ({ page }) => {
  for (const description of ["Conta A E2E", "Conta B E2E"]) {
    const dialog = await fillNewTransaction(page, "Despesa", {
      description,
      amount: "10",
      category: "Alimentação",
    });
    await dialog.getByRole("button", { name: "Criar" }).click();
    await expectToast(page, "Transação criada com sucesso");
  }

  const table = transactionTable(page);
  for (const description of ["Conta A E2E", "Conta B E2E"]) {
    await table.getByRole("row").filter({ hasText: description }).getByTitle("Selecionar").click();
  }
  await page.getByRole("button", { name: "Marcar Pago" }).click();
  await expectToast(page, "2 transação(ões) atualizada(s)");

  // Selecting them again offers to unmark: both are paid now
  for (const description of ["Conta A E2E", "Conta B E2E"]) {
    await table.getByRole("row").filter({ hasText: description }).getByTitle("Selecionar").click();
  }
  await expect(page.getByRole("button", { name: "Desmarcar Pago" })).toBeVisible();
});

test("edits and deletes an installment series", async ({ page }) => {
  const dialog = await fillNewTransaction(page, "Despesa", {
    description: "Notebook E2E",
    amount: "300",
    category: "Alimentação",
  });
  await dialog.getByRole("switch").click(); // Parcelado
  await dialog.getByLabel("Número de parcelas").fill("3");
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Despesa parcelada em 3x criada com sucesso");

  // Rename the whole series from the first installment
  await page.getByRole("button", { name: "Editar Notebook E2E (1/3)" }).first().click();
  const edit = page.getByRole("dialog");
  await edit.getByRole("radio", { name: "Todas" }).click();
  await edit.getByLabel("Descrição").fill("Laptop E2E (1/3)");
  await edit.getByRole("button", { name: "Atualizar" }).click();
  await expectToast(page, "3 transações atualizadas com sucesso");

  const series = () =>
    withDb(async (db) => {
      const { rows } = await db.query(
        `SELECT t.description, t.amount FROM "Transaction" t JOIN "User" u ON u.id = t."userId"
         WHERE u.email = $1 AND t.description LIKE 'Laptop E2E%'
         ORDER BY t."currentInstallment"`,
        [E2E_USER.email]
      );
      return rows;
    });

  expect(await series()).toEqual([
    { description: "Laptop E2E (1/3)", amount: 100 },
    { description: "Laptop E2E (2/3)", amount: 100 },
    { description: "Laptop E2E (3/3)", amount: 100 },
  ]);

  // Delete the whole series
  await page.getByRole("button", { name: "Excluir Laptop E2E (1/3)" }).first().click();
  const confirm = page.getByRole("dialog");
  await confirm.getByRole("radio", { name: "Todas" }).click();
  await confirm.getByRole("button", { name: "Excluir" }).click();
  await expectToast(page, "3 transações excluídas com sucesso");

  expect(await series()).toEqual([]);
});
