-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('daily', 'campaign', 'multiplayer_public', 'multiplayer_family', 'free');

-- CreateEnum
CREATE TYPE "RoomMode" AS ENUM ('multiplayer_public', 'multiplayer_family');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('waiting', 'starting', 'active', 'finished');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('discovery', 'standard', 'premium', 'event');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "totalBingos" INTEGER NOT NULL DEFAULT 0,
    "preferredHour" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT,
    "mode" "GameMode" NOT NULL,
    "card" JSONB NOT NULL,
    "ballsDrawn" INTEGER[],
    "lineValidated" BOOLEAN NOT NULL DEFAULT false,
    "quineValidated" BOOLEAN NOT NULL DEFAULT false,
    "bingoValidated" BOOLEAN NOT NULL DEFAULT false,
    "couponAwarded" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_games" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "couponAwarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "mode" "RoomMode" NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'waiting',
    "inviteCode" TEXT,
    "maxPlayers" INTEGER NOT NULL DEFAULT 10,
    "ballSequence" INTEGER[],
    "ballsDrawnCount" INTEGER NOT NULL DEFAULT 0,
    "firstBingoUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_players" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT,
    "isGhost" BOOLEAN NOT NULL DEFAULT false,
    "ghostName" TEXT,
    "card" JSONB NOT NULL,
    "reactionDelayMs" INTEGER,
    "lineValidated" BOOLEAN NOT NULL DEFAULT false,
    "quineValidated" BOOLEAN NOT NULL DEFAULT false,
    "bingoValidated" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "subscriptionTier" "SubscriptionTier" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_offers" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monthlyStock" INTEGER NOT NULL,
    "dailyCap" INTEGER NOT NULL DEFAULT 2,
    "weeklyPlayerCap" INTEGER NOT NULL DEFAULT 1,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_stock" (
    "id" TEXT NOT NULL,
    "couponOfferId" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "distributed" INTEGER NOT NULL DEFAULT 0,
    "dailyDistributed" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" DATE NOT NULL,

    CONSTRAINT "coupon_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_coupons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "couponOfferId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "giftedToUserId" TEXT,

    CONSTRAINT "player_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "game_sessions_userId_idx" ON "game_sessions"("userId");

-- CreateIndex
CREATE INDEX "game_sessions_roomId_idx" ON "game_sessions"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_games_gameSessionId_key" ON "daily_games"("gameSessionId");

-- CreateIndex
CREATE INDEX "daily_games_date_idx" ON "daily_games"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_games_userId_date_key" ON "daily_games"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_inviteCode_key" ON "rooms"("inviteCode");

-- CreateIndex
CREATE INDEX "rooms_status_idx" ON "rooms"("status");

-- CreateIndex
CREATE INDEX "rooms_mode_status_idx" ON "rooms"("mode", "status");

-- CreateIndex
CREATE INDEX "room_players_roomId_idx" ON "room_players"("roomId");

-- CreateIndex
CREATE INDEX "room_players_userId_idx" ON "room_players"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_siret_key" ON "merchants"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_stripeCustomerId_key" ON "merchants"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "merchants_active_idx" ON "merchants"("active");

-- CreateIndex
CREATE INDEX "coupon_offers_merchantId_active_idx" ON "coupon_offers"("merchantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_stock_couponOfferId_month_key" ON "coupon_stock"("couponOfferId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "player_coupons_qrCode_key" ON "player_coupons"("qrCode");

-- CreateIndex
CREATE INDEX "player_coupons_userId_idx" ON "player_coupons"("userId");

-- CreateIndex
CREATE INDEX "player_coupons_qrCode_idx" ON "player_coupons"("qrCode");

-- CreateIndex
CREATE INDEX "player_coupons_merchantId_idx" ON "player_coupons"("merchantId");

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_games" ADD CONSTRAINT "daily_games_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_offers" ADD CONSTRAINT "coupon_offers_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_stock" ADD CONSTRAINT "coupon_stock_couponOfferId_fkey" FOREIGN KEY ("couponOfferId") REFERENCES "coupon_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_coupons" ADD CONSTRAINT "player_coupons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_coupons" ADD CONSTRAINT "player_coupons_couponOfferId_fkey" FOREIGN KEY ("couponOfferId") REFERENCES "coupon_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
