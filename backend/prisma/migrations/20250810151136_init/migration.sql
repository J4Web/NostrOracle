-- CreateTable
CREATE TABLE "nostr_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "kind" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "verification_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT,
    "content" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "claimCount" INTEGER NOT NULL,
    "processingMethod" TEXT NOT NULL,
    "processingTime" INTEGER NOT NULL,
    "cacheHits" INTEGER NOT NULL DEFAULT 0,
    "verificationErrors" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verification_results_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "nostr_events" ("eventId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verificationResultId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "credibility" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "hasError" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "claims_verificationResultId_fkey" FOREIGN KEY ("verificationResultId") REFERENCES "verification_results" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sources_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "claim_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimHash" TEXT NOT NULL,
    "credibility" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "system_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postsProcessed" INTEGER NOT NULL DEFAULT 0,
    "claimsVerified" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "averageScore" REAL NOT NULL DEFAULT 0,
    "lastReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "nostr_events_eventId_key" ON "nostr_events"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_results_eventId_key" ON "verification_results"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "claim_cache_claimHash_key" ON "claim_cache"("claimHash");
