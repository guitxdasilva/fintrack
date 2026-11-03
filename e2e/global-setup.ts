import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES } from "../src/lib/default-categories";
import { E2E_CARD, E2E_CARD_B, E2E_USER, withDb } from "./fixtures";

/** Wipes the local e2e database and creates the test user. */
export default async function globalSetup() {
  await withDb(async (db) => {
    await db.query(
      'TRUNCATE "Transaction", "Category", "Card", "Goal", "Feedback", "PasswordResetToken", "Account", "User" CASCADE'
    );

    const userId = randomUUID();
    await db.query(
      `INSERT INTO "User" (id, name, email, password, "hasCompletedTour", "updatedAt")
       VALUES ($1, $2, $3, $4, true, now())`, // tour done: its overlay would block clicks
      [userId, E2E_USER.name, E2E_USER.email, await bcrypt.hash(E2E_USER.password, 10)]
    );

    for (const c of DEFAULT_CATEGORIES) {
      await db.query(
        `INSERT INTO "Category" (id, name, icon, color, type, "userId")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), c.name, c.icon, c.color, c.type, userId]
      );
    }

    await db.query(
      `INSERT INTO "Card" (id, name, icon, "closingDayType", "closingDayValue", "userId")
       VALUES ($1, $2, '💳', 'FIXED', $3, $4)`,
      [randomUUID(), E2E_CARD.name, E2E_CARD.closingDay, userId]
    );
    await db.query(
      `INSERT INTO "Card" (id, name, icon, "userId") VALUES ($1, $2, '💳', $3)`,
      [randomUUID(), E2E_CARD_B.name, userId]
    );
  });
}
