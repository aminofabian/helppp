DO $$ 
BEGIN
    -- Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS "DepositWallet" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "name" TEXT DEFAULT 'Donation Pool',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "DepositWallet_pkey" PRIMARY KEY ("id")
    );

    -- Create indices if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'DepositWallet' 
        AND indexname = 'DepositWallet_userId_idx'
    ) THEN
        CREATE INDEX "DepositWallet_userId_idx" ON "DepositWallet"("userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'DepositWallet' 
        AND indexname = 'DepositWallet_userId_key'
    ) THEN
        CREATE UNIQUE INDEX "DepositWallet_userId_key" ON "DepositWallet"("userId");
    END IF;

    -- Add foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DepositWallet_userId_fkey'
    ) THEN
        ALTER TABLE "DepositWallet" 
        ADD CONSTRAINT "DepositWallet_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

END $$; 