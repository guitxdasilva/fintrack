-- Normalize calendar dates to 12:00 UTC (see src/lib/dates.ts).
--
-- Columns are TIMESTAMP(3) holding UTC. Before this migration values came from
-- three sources, each with its own convention:
--   * Browser (toISOString of a local date): intended day = São Paulo local day.
--   * Server-built dates at exact 00:00:00 UTC (import, bulk duplicate):
--     intended day = UTC day.
--   * Credit card billing dates (purchaseDate IS NOT NULL): always day 1 of
--     the billing month, built with the server clock; pick whichever reading
--     (São Paulo or UTC) lands on day 1.
-- The migration is idempotent: rows already at 12:00 UTC keep their day.

UPDATE "Transaction"
SET "date" = (
  CASE
    WHEN "purchaseDate" IS NOT NULL
      AND EXTRACT(DAY FROM (("date" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')) = 1
      THEN ((("date" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date)
    WHEN "purchaseDate" IS NOT NULL
      AND EXTRACT(DAY FROM "date") = 1
      THEN ("date"::date)
    WHEN "date"::time = TIME '00:00:00'
      THEN ("date"::date)
    ELSE ((("date" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date)
  END
) + TIME '12:00:00';

UPDATE "Transaction"
SET "purchaseDate" = (
  CASE
    WHEN "purchaseDate"::time = TIME '00:00:00'
      THEN ("purchaseDate"::date)
    ELSE ((("purchaseDate" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date)
  END
) + TIME '12:00:00'
WHERE "purchaseDate" IS NOT NULL;

UPDATE "Goal"
SET "deadline" = (
  CASE
    WHEN "deadline"::time = TIME '00:00:00'
      THEN ("deadline"::date)
    ELSE ((("deadline" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date)
  END
) + TIME '12:00:00'
WHERE "deadline" IS NOT NULL;
