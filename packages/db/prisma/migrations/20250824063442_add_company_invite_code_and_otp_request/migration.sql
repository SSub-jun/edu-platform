/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('signup');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "inviteCode" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "otp_requests" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_requests_phone_purpose_createdAt_idx" ON "otp_requests"("phone", "purpose", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "companies_inviteCode_key" ON "companies"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
