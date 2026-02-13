-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "currentInstallment" INTEGER,
ADD COLUMN     "installmentGroupId" TEXT,
ADD COLUMN     "installments" INTEGER,
ADD COLUMN     "paymentMethodId" TEXT;

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_name_userId_key" ON "PaymentMethod"("name", "userId");

-- CreateIndex
CREATE INDEX "Transaction_installmentGroupId_idx" ON "Transaction"("installmentGroupId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
