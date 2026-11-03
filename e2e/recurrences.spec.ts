import { expect, test } from "@playwright/test";
import { E2E_USER, insertPastTransaction, withDb } from "./fixtures";
import { expectToast } from "./helpers";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await withDb(async (db) => {
    for (const monthsAgo of [1, 2, 3]) {
      await insertPastTransaction(db, { description: "Internet E2E", amount: 100, monthsAgo });
      await insertPastTransaction(db, { description: "Streaming E2E", amount: 39.9, monthsAgo });
    }
  });
});

const rowsFor = (description: string) =>
  withDb(async (db) => {
    const { rows } = await db.query(
      `SELECT t."isFixed", count(*)::int AS n FROM "Transaction" t JOIN "User" u ON u.id = t."userId"
       WHERE u.email = $1 AND t.description = $2 GROUP BY t."isFixed" ORDER BY t."isFixed"`,
      [E2E_USER.email, description]
    );
    return rows;
  });

test("turns a recurring expense into a fixed series", async ({ page }) => {
  await page.goto("/projection");
  const card = page.getByText("Internet E2E").locator("xpath=ancestor::li");
  await expect(card).toContainText("R$ 100,00/mês");
  await card.getByRole("button", { name: "Tornar fixa" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Os 3 lançamentos anteriores passam a ser fixos");
  await dialog.getByRole("button", { name: "Tornar fixa" }).click();
  await expectToast(page, "12 lançamento(s) criado(s)");

  await expect(page.getByText("Internet E2E")).toHaveCount(0);
  expect(await rowsFor("Internet E2E")).toEqual([{ isFixed: true, n: 15 }]);
});

test("ignored suggestions stay hidden", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Revisar" }).click();
  const row = page.getByRole("dialog").getByText("Streaming E2E").locator("xpath=ancestor::li");
  await row.getByRole("button", { name: "Ignorar" }).click();
  await expectToast(page, "Sugestão ignorada");

  await page.reload();
  await expect(page.getByRole("button", { name: "Revisar" })).toHaveCount(0);
  expect(await rowsFor("Streaming E2E")).toEqual([{ isFixed: false, n: 3 }]);
});
