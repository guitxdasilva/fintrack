import { expect, type Page } from "@playwright/test";

/** Picks an option in a Radix Select identified by its current placeholder/value. */
export async function selectOption(page: Page, triggerText: string, option: string) {
  await page.getByRole("combobox").filter({ hasText: triggerText }).click();
  await page.getByRole("option", { name: option, exact: false }).click();
}

/** Opens "Nova Despesa"/"Nova Receita" and fills the common fields. */
export async function fillNewTransaction(
  page: Page,
  type: "Despesa" | "Receita",
  { description, amount, category }: { description: string; amount: string; category: string }
) {
  await page.getByRole("button", { name: `Nova ${type}` }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Descrição").fill(description);
  await dialog.getByLabel("Valor (R$)").fill(amount);
  await selectOption(page, "Selecione a categoria", category);
  return dialog;
}

/** A statement line (in any tab) by its description. */
export function statementRow(page: Page, description: string) {
  return page.getByRole("listitem").filter({ hasText: description });
}

/** Deletes a transaction through its row's actions menu (confirm dialog opens). */
export async function deleteFromMenu(page: Page, description: string) {
  await page.getByRole("button", { name: `Ações de ${description}` }).click();
  await page.getByRole("menuitem", { name: "Excluir" }).click();
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible();
}
