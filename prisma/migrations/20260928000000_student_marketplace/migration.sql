-- Student marketplace: universities, verification, listings, escrow.
--
-- Existing shop orders keep working: Order.sellerId and the escrow columns are
-- nullable and default to the "shop sold this itself" case.

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameSw" TEXT NOT NULL,
    "emailDomain" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentVerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleSw" TEXT NOT NULL,
    "descEn" TEXT NOT NULL,
    "descSw" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sellerId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerRating" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerRating_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "universityId" TEXT,
ADD COLUMN     "studentVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "studentNumber" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "sellerId" TEXT,
ADD COLUMN     "escrowStatus" TEXT NOT NULL DEFAULT 'AWAITING_FUNDING',
ADD COLUMN     "escrowRef" TEXT,
ADD COLUMN     "escrowFundedAt" TIMESTAMP(3),
ADD COLUMN     "payoutRef" TEXT,
ADD COLUMN     "releasedAt" TIMESTAMP(3),
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "disputeReason" TEXT,
ADD COLUMN     "resolvedBy" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "platformFee" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "listingId" TEXT;

-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN "marketplaceFeePercent" INTEGER NOT NULL DEFAULT 6;

-- CreateIndex
CREATE UNIQUE INDEX "University_slug_key" ON "University"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "University_emailDomain_key" ON "University"("emailDomain");

-- CreateIndex
CREATE INDEX "StudentVerificationCode_userId_consumedAt_idx" ON "StudentVerificationCode"("userId", "consumedAt");

-- CreateIndex
CREATE INDEX "StudentVerificationCode_expiresAt_idx" ON "StudentVerificationCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE INDEX "Listing_status_createdAt_idx" ON "Listing"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_sellerId_status_idx" ON "Listing"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Listing_universityId_status_idx" ON "Listing"("universityId", "status");

-- CreateIndex
CREATE INDEX "Listing_categoryId_status_idx" ON "Listing"("categoryId", "status");

-- CreateIndex
CREATE INDEX "ListingImage_listingId_idx" ON "ListingImage"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerRating_orderId_key" ON "SellerRating"("orderId");

-- CreateIndex
CREATE INDEX "SellerRating_sellerId_idx" ON "SellerRating"("sellerId");

-- CreateIndex
CREATE INDEX "User_universityId_idx" ON "User"("universityId");

-- CreateIndex
CREATE INDEX "Order_sellerId_idx" ON "Order"("sellerId");

-- CreateIndex
CREATE INDEX "Order_escrowStatus_idx" ON "Order"("escrowStatus");

-- CreateIndex
CREATE INDEX "OrderItem_listingId_idx" ON "OrderItem"("listingId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentVerificationCode" ADD CONSTRAINT "StudentVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerRating" ADD CONSTRAINT "SellerRating_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerRating" ADD CONSTRAINT "SellerRating_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
