// backend/database.js
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Initialize database connection and create default records
 */
export async function initializeDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Create or update system stats
    const stats = await prisma.systemStats.findFirst();
    if (!stats) {
      await prisma.systemStats.create({
        data: {
          postsProcessed: 0,
          claimsVerified: 0,
          totalScore: 0,
          averageScore: 0
        }
      });
      console.log('System stats initialized');
    }
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.log('Continuing without database persistence...');
  }
}

/**
 * Save a Nostr event to the database
 */
export async function saveNostrEvent(eventData) {
  try {
    return await prisma.nostrEvent.upsert({
      where: { eventId: eventData.id },
      update: {
        // Update content if event is modified
        content: eventData.content
      },
      create: {
        eventId: eventData.id,
        pubkey: eventData.pubkey,
        content: eventData.content,
        kind: eventData.kind,
        createdAt: new Date(eventData.created_at * 1000)
      }
    });
  } catch (error) {
    // Only log non-constraint errors to reduce noise
    if (!error.message.includes('Unique constraint')) {
      console.error('Failed to save Nostr event:', error.message);
    }
    return null;
  }
}

/**
 * Save verification result with claims and sources
 */
export async function saveVerificationResult(result) {
  try {
    // Generate eventId if not provided
    if (!result.eventId) {
      result.eventId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Check if verification result already exists
    const existing = await prisma.verificationResult.findUnique({
      where: { eventId: result.eventId }
    });

    if (existing) {
      // Return existing result to avoid duplicates
      return existing;
    }

    const verificationResult = await prisma.verificationResult.create({
      data: {
        eventId: result.eventId,
        content: result.content,
        overallScore: result.score,
        claimCount: result.claims.length,
        processingMethod: result.metadata?.method || 'unknown',
        processingTime: result.metadata?.processingTime || 0,
        cacheHits: result.metadata?.cacheHits || 0,
        verificationErrors: result.metadata?.verificationErrors || 0,
        claims: {
          create: result.verificationResults.map(claim => ({
            text: claim.claim,
            credibility: claim.credibility,
            confidence: claim.confidence,
            sourceCount: claim.sources?.length || 0,
            hasError: !!claim.error,
            errorMessage: claim.error,
            sources: {
              create: (claim.sources || []).map(source => ({
                title: source.title,
                source: source.source,
                url: source.url
              }))
            }
          }))
        }
      },
      include: {
        claims: {
          include: {
            sources: true
          }
        }
      }
    });

    // Update system stats
    await updateSystemStats(result.claims.length, result.score);

    return verificationResult;
  } catch (error) {
    // Only log non-constraint errors to reduce noise
    if (!error.message.includes('Unique constraint')) {
      console.error('Failed to save verification result:', error.message);
    }
    return null;
  }
}

/**
 * Get cached claim result
 */
export async function getCachedClaim(claimText) {
  try {
    const claimHash = crypto.createHash('md5').update(claimText.toLowerCase()).digest('hex');
    const cached = await prisma.claimCache.findUnique({
      where: { claimHash }
    });
    
    if (cached) {
      // Update last used timestamp
      await prisma.claimCache.update({
        where: { claimHash },
        data: { lastUsed: new Date() }
      });
    }
    
    return cached;
  } catch (error) {
    console.error('Failed to get cached claim:', error.message);
    return null;
  }
}

/**
 * Cache a claim verification result
 */
export async function cacheClaim(claimText, credibility, confidence, sourceCount) {
  try {
    const claimHash = crypto.createHash('md5').update(claimText.toLowerCase()).digest('hex');
    return await prisma.claimCache.upsert({
      where: { claimHash },
      update: {
        credibility,
        confidence,
        sourceCount,
        lastUsed: new Date()
      },
      create: {
        claimHash,
        credibility,
        confidence,
        sourceCount
      }
    });
  } catch (error) {
    console.error('Failed to cache claim:', error.message);
    return null;
  }
}

/**
 * Get recent verification results
 */
export async function getRecentVerificationResults(limit = 20) {
  try {
    return await prisma.verificationResult.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        claims: {
          include: {
            sources: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to get recent results:', error.message);
    return [];
  }
}

/**
 * Update system statistics
 */
async function updateSystemStats(claimsCount, score) {
  try {
    const stats = await prisma.systemStats.findFirst();
    if (stats) {
      const newPostsProcessed = stats.postsProcessed + 1;
      const newClaimsVerified = stats.claimsVerified + claimsCount;
      const newTotalScore = stats.totalScore + score;
      const newAverageScore = newTotalScore / newPostsProcessed;

      await prisma.systemStats.update({
        where: { id: stats.id },
        data: {
          postsProcessed: newPostsProcessed,
          claimsVerified: newClaimsVerified,
          totalScore: newTotalScore,
          averageScore: newAverageScore
        }
      });
    }
  } catch (error) {
    console.error('Failed to update system stats:', error.message);
  }
}

/**
 * Get system statistics
 */
export async function getSystemStats() {
  try {
    return await prisma.systemStats.findFirst();
  } catch (error) {
    console.error('Failed to get system stats:', error.message);
    return {
      postsProcessed: 0,
      claimsVerified: 0,
      averageScore: 0
    };
  }
}

/**
 * Clean up old cache entries (older than 30 days)
 */
export async function cleanupOldCache() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await prisma.claimCache.deleteMany({
      where: {
        lastUsed: {
          lt: thirtyDaysAgo
        }
      }
    });
    console.log(`Cleaned up ${result.count} old cache entries`);
  } catch (error) {
    console.error('Failed to cleanup old cache:', error.message);
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  await prisma.$disconnect();
}

export { prisma };
