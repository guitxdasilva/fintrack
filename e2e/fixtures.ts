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
