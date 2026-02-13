-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_paymentMethodId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "PaymentMethod_name_userId_key";
DROP INDEX IF EXISTS "PaymentMethod_userId_idx";

-- AlterTable: Remove paymentMethodId, add paymentType and cardId
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "paymentMethodId";
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "paymentType" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "cardId" TEXT;

-- DropTable
DROP TABLE IF EXISTS "PaymentMethod";

-- CreateTable
CREATE TABLE IF NOT EXISTS "Card" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Card_name_userId_key" ON "Card"("name", "userId");
CREATE INDEX IF NOT EXISTS "Card_userId_idx" ON "Card"("userId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Card" ADD CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
