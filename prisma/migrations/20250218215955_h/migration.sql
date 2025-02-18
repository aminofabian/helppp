/*
  Warnings:

  - You are about to drop the column `checkoutRequestID` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `merchantRequestID` on the `Payment` table. All the data in the column will be lost.
  - Made the column `userId` on table `Comment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `requestId` on table `Comment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `content` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PrayerStatus" AS ENUM ('PENDING', 'ANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_SENT';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "parentId" TEXT,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "requestId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "checkoutRequestID",
DROP COLUMN "merchantRequestID",
ADD COLUMN     "checkoutRequestId" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "merchantRequestId" TEXT,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "resultCode" DROP NOT NULL,
ALTER COLUMN "resultDesc" DROP NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Prayer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "PrayerStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimony" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prayerId" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answerId" TEXT,

    CONSTRAINT "testimony_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prayerId" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "donationId" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prayersAnswered" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentReaction" (
    "id" TEXT NOT NULL,
    "isLike" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,

    CONSTRAINT "CommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prayer_userId_idx" ON "Prayer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "testimony_prayerId_key" ON "testimony"("prayerId");

-- CreateIndex
CREATE UNIQUE INDEX "testimony_answerId_key" ON "testimony"("answerId");

-- CreateIndex
CREATE INDEX "testimony_userId_idx" ON "testimony"("userId");

-- CreateIndex
CREATE INDEX "testimony_answerId_idx" ON "testimony"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_prayerId_key" ON "Answer"("prayerId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_donationId_key" ON "Answer"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_paymentId_key" ON "Answer"("paymentId");

-- CreateIndex
CREATE INDEX "Answer_userId_idx" ON "Answer"("userId");

-- CreateIndex
CREATE INDEX "Answer_donationId_idx" ON "Answer"("donationId");

-- CreateIndex
CREATE INDEX "Answer_paymentId_idx" ON "Answer"("paymentId");

-- CreateIndex
CREATE INDEX "Leaderboard_userId_idx" ON "Leaderboard"("userId");

-- CreateIndex
CREATE INDEX "CommentReaction_userId_idx" ON "CommentReaction"("userId");

-- CreateIndex
CREATE INDEX "CommentReaction_commentId_idx" ON "CommentReaction"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReaction_userId_commentId_key" ON "CommentReaction"("userId", "commentId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_userId_key" ON "NotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "NotificationSettings_userId_idx" ON "NotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");
