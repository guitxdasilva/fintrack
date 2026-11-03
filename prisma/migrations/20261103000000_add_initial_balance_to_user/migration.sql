-- AlterTable
ALTER TABLE "User" ADD COLUMN     "initialBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "initialBalanceDate" TIMESTAMP(3);
