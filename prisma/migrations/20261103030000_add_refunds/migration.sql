-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isRefund" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refundOfId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_refundOfId_idx" ON "Transaction"("refundOfId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_refundOfId_fkey" FOREIGN KEY ("refundOfId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
