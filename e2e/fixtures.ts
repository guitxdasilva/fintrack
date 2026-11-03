import { Client } from "pg";

export const E2E_USER = {
  name: "Usuário E2E",
  email: "e2e@finplanix.test",
  password: "e2e-password-123",
};

export const E2E_CARD = { name: "Cartão E2E", closingDay: 10 };

export function e2eDatabaseUrl(): string {
  const url =
    process.env.E2E_DATABASE_URL ?? "postgresql://postgres@localhost:54329/fintrack_e2e";
  const host = new URL(url).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    // The suite wipes the database: never let it touch a remote one.
    throw new Error(`E2E database must be local, got host "${host}"`);
  }
  return url;
}

/**
 * Runs `fn` with a connected pg client. Plain SQL on purpose: the generated
 * Prisma client is ESM-only and Playwright loads tests as CommonJS.
 */
export async function withDb<T>(fn: (db: Client) => Promise<T>): Promise<T> {
  const db = new Client({ connectionString: e2eDatabaseUrl() });
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

/** Inserts a one-off transaction for the e2e user, `monthsAgo` months back (day 10). */
export async function insertPastTransaction(
  db: Client,
  { description, amount, monthsAgo, type = "EXPENSE" }: {
    description: string;
    amount: number;
    monthsAgo: number;
    type?: "INCOME" | "EXPENSE";
  }
) {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() - monthsAgo, 10, 12));
  await db.query(
    `INSERT INTO "Transaction" (id, amount, type, description, date, "userId", "categoryId", "updatedAt")
     SELECT gen_random_uuid()::text, $1, $2::"TransactionType", $3, $4, u.id, c.id, now()
     FROM "User" u JOIN "Category" c ON c."userId" = u.id AND c.type = $2::"TransactionType"
     WHERE u.email = $5
     ORDER BY c.name LIMIT 1`,
    [amount, type, description, date, E2E_USER.email]
  );
}
