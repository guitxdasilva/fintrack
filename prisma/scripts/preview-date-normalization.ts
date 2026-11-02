/**
 * Read-only preview of migration 20261102000000_normalize_calendar_dates.
 * Shows which transactions would change calendar day or month.
 *
 *   npx tsx prisma/scripts/preview-date-normalization.ts
 */
import "dotenv/config";
import { Client } from "pg";

const SP = `(("date" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')`;
const NEW_DATE = `(CASE
    WHEN "purchaseDate" IS NOT NULL AND EXTRACT(DAY FROM ${SP}) = 1 THEN ${SP}::date
    WHEN "purchaseDate" IS NOT NULL AND EXTRACT(DAY FROM "date") = 1 THEN "date"::date
    WHEN "date"::time = TIME '00:00:00' THEN "date"::date
    ELSE ${SP}::date
  END)`;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN READ ONLY");

    const { rows: summary } = await client.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "date"::time = TIME '12:00:00')::int AS already_normalized,
        COUNT(*) FILTER (WHERE ${NEW_DATE} <> ${SP}::date)::int AS day_changes_in_ui,
        COUNT(*) FILTER (
          WHERE date_trunc('month', ${NEW_DATE}) <> date_trunc('month', "date")
        )::int AS month_changes_on_server
      FROM "Transaction"
    `);
    console.table(summary);

    const { rows: samples } = await client.query(`
      SELECT
        description,
        to_char("date", 'YYYY-MM-DD HH24:MI') AS stored_utc,
        to_char(${SP}, 'YYYY-MM-DD') AS shown_in_ui,
        to_char(${NEW_DATE}, 'YYYY-MM-DD') AS new_day,
        "purchaseDate" IS NOT NULL AS credit_billed
      FROM "Transaction"
      WHERE ${NEW_DATE} <> ${SP}::date
         OR date_trunc('month', ${NEW_DATE}) <> date_trunc('month', "date")
      ORDER BY "date" DESC
      LIMIT 30
    `);
    if (samples.length > 0) {
      console.log("\nExemplos de linhas que mudam:");
      console.table(samples);
    }

    await client.query("ROLLBACK");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
