-- CreateEnum
CREATE TYPE "TypeOfVote" AS ENUM ('LOVE', 'SUSPISION');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalDonations" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalRequestsHelped" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creatorId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "textContent" JSONB,
    "imageString" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" INTEGER NOT NULL,
    "pointsUsed" DOUBLE PRECISION NOT NULL,
    "communityName" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteType" "TypeOfVote" NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Community_name_key" ON "Community"("name");
