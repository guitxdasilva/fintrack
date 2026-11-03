import { expect, test, type Page } from "@playwright/test";
import { E2E_CARD, E2E_USER, withDb } from "./fixtures";
import { expectToast, selectOption } from "./helpers";

test.describe.configure({ mode: "serial" });

/** Invoice month ("yyyy-MM") of each installment of the series, in order. */
const seriesMonths = () =>
  withDb(async (db) => {
    const { rows } = await db.query(
      `SELECT to_char(t.date, 'YYYY-MM') AS month FROM "Transaction" t
       JOIN "User" u ON u.id = t."userId"
       WHERE u.email = $1 AND t.description LIKE 'Lavadora E2E%'
       ORDER BY t."currentInstallment"`,
      [E2E_USER.email]
    );
    return rows.map((r) => r.month as string);
  });

/** Goes to the month ("yyyy-MM") on the "Todas" tab using the month picker. */
async function goToMonth(page: Page, month: string) {
  await page.goto("/transactions");
  const now = new Date();
  const [y, m] = month.split("-").map(Number);
  const steps = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
  for (let i = 0; i < steps; i++) await page.getByRole("button", { name: "Próximo mês" }).click();
}

const monthLabel = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1)
  );
};

test("moves one installment to another invoice month", async ({ page }) => {
  await page.goto("/transactions?view=cards");
  await page.getByRole("button", { name: `Nova compra no ${E2E_CARD.name}` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Descrição").fill("Lavadora E2E");
  await dialog.getByLabel("Valor (R$)").fill("300");
  await selectOption(page, "Selecione a categoria", "Alimentação");
  await dialog.getByRole("switch").click(); // Parcelado
  await dialog.getByLabel("Número de parcelas").fill("3");
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expectToast(page, "Despesa parcelada em 3x criada com sucesso");

  const [first, second, third] = await seriesMonths();

  // Simulate the bug report: move 2/3 into 3/3's invoice...
  await goToMonth(page, second);
  await page.getByRole("button", { name: "Editar Lavadora E2E (2/3)" }).click();
  await page.getByRole("combobox", { name: "Mês da fatura" }).click();
  await page.getByRole("option", { name: new RegExp(monthLabel(third), "i") }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Atualizar" }).click();
  await expectToast(page, "Transação atualizada com sucesso");
  expect(await seriesMonths()).toEqual([first, third, third]);

  // ...and fix it back
  await goToMonth(page, third);
  await page.getByRole("button", { name: "Editar Lavadora E2E (2/3)" }).click();
  await page.getByRole("combobox", { name: "Mês da fatura" }).click();
  await page.getByRole("option", { name: new RegExp(monthLabel(second), "i") }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Atualizar" }).click();
  await expectToast(page, "Transação atualizada com sucesso");
  expect(await seriesMonths()).toEqual([first, second, third]);
});

const setClosingDay = (day: number) =>
  withDb((db) =>
    db.query(`UPDATE "Card" SET "closingDayValue" = $1 WHERE name = $2`, [day, E2E_CARD.name])
  );

test("editing only the description keeps the installment's month", async ({ page }) => {
  const before = await seriesMonths();

  // The real cause: the card's closing day changed after the purchase. A
  // recompute with the new rule (day 1: today is after it) would move 3/3.
  await setClosingDay(1);
  try {
    await goToMonth(page, before[2]);
    await page.getByRole("button", { name: "Editar Lavadora E2E (3/3)" }).click();
    await page.getByRole("dialog").getByLabel("Descrição").fill("Lavadora E2E nova (3/3)");
    await page.getByRole("dialog").getByRole("button", { name: "Atualizar" }).click();
    await expectToast(page, "Transação atualizada com sucesso");

    expect(await seriesMonths()).toEqual(before);
  } finally {
    await setClosingDay(E2E_CARD.closingDay);
  }
});
