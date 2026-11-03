-- CreateTable
CREATE TABLE "RecurrenceDismissal" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RecurrenceDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecurrenceDismissal_userId_type_key_key" ON "RecurrenceDismissal"("userId", "type", "key");

-- AddForeignKey
ALTER TABLE "RecurrenceDismissal" ADD CONSTRAINT "RecurrenceDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
