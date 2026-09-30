-- Seller dashboard: payout account, listing views/promotion, saved listings,
-- follows, offers, order messages and notifications.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "payoutMethod" TEXT,
ADD COLUMN "payoutNumber" TEXT,
ADD COLUMN "payoutName" TEXT;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "featuredUntil" TIMESTAMP(3),
ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
-- The handover timestamp the auto-release deadline is measured from.
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- Money named in the notification body, which is translated and so cannot
-- contain the number itself.
ALTER TABLE "Notification" ADD COLUMN "amount" INTEGER;

-- CreateTable
CREATE TABLE "SavedListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderMessage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "href" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedListing_userId_listingId_key" ON "SavedListing"("userId", "listingId");

-- CreateIndex
CREATE INDEX "SavedListing_userId_idx" ON "SavedListing"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerFollow_followerId_sellerId_key" ON "SellerFollow"("followerId", "sellerId");

-- CreateIndex
CREATE INDEX "SellerFollow_sellerId_idx" ON "SellerFollow"("sellerId");

-- CreateIndex
CREATE INDEX "Offer_listingId_status_idx" ON "Offer"("listingId", "status");

-- CreateIndex
CREATE INDEX "Offer_buyerId_idx" ON "Offer"("buyerId");

-- CreateIndex
CREATE INDEX "OrderMessage_orderId_createdAt_idx" ON "OrderMessage"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerFollow" ADD CONSTRAINT "SellerFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerFollow" ADD CONSTRAINT "SellerFollow_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
