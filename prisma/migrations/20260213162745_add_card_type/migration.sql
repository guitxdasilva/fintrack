-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN     "isCard" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "cardType" TEXT;
