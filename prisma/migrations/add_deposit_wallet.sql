-- CreateTable
CREATE TABLE "DepositWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "name" TEXT DEFAULT 'Donation Pool',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DepositWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DepositWallet_userId_key" ON "DepositWallet"("userId");

-- CreateIndex
CREATE INDEX "DepositWallet_userId_idx" ON "DepositWallet"("userId");

-- AddForeignKey
ALTER TABLE "DepositWallet" ADD CONSTRAINT "DepositWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 