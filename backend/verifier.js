// backend/src/verifier.js
import axios from 'axios';
import { NEWSAPI_KEY } from './config.js';
import { scoreResults } from './scorer.js';
import { publishScore } from './nostr-client.js';
import { extractClaimsEnhanced } from './claim-extractor.js';
import {
  getCachedClaim,
  cacheClaim,
  saveVerificationResult,
  getRecentVerificationResults
} from './database.js';
import { processContentZap } from './lightning-service.js';

// Fallback in-memory cache for when database is not available
const memoryCache = new Map();
let memoryRecentScores = [];

export async function verifyContent(content, eventId = null) {
  // Use AI-powered claim extraction
  const claimExtractionResult = await extractClaimsEnhanced(content);
  const { claims, metadata } = claimExtractionResult;

  const results = [];
  let cacheHits = 0;

  for (const c of claims) {
    // Try to get from database cache first
    let cachedResult = await getCachedClaim(c);

    if (cachedResult) {
      cacheHits++;
      results.push({
        claim: c,
        credibility: cachedResult.credibility,
        sources: [], // Sources not stored in cache for simplicity
        confidence: cachedResult.confidence
      });
      continue;
    }

    // Fallback to memory cache
    const key = c.toLowerCase();
    if (memoryCache.has(key)) {
      cacheHits++;
      results.push(memoryCache.get(key));
      continue;
    }

    // Skip verification if no NewsAPI key is configured
    if (!NEWSAPI_KEY || NEWSAPI_KEY === 'YOUR_NEWSAPI_KEY_HERE') {
      const claimRes = {
        claim: c,
        credibility: 50, // Default score when no verification possible
        sources: [],
        confidence: 'low',
        error: 'NewsAPI key not configured'
      };
      memoryCache.set(key, claimRes);
      results.push(claimRes);
      continue;
    }

    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        c
      )}&sortBy=publishedAt&apiKey=${NEWSAPI_KEY}&pageSize=5`;
      const { data } = await axios.get(url);
      const sources = data.articles.map(a => ({
        title: a.title,
        source: a.source.name,
        url: a.url,
      }));

      // Enhanced scoring based on source quality and relevance
      const baseScore = Math.min(100, sources.length * 15);
      const qualityBonus = sources.filter(s =>
        ['Reuters', 'AP News', 'BBC', 'CNN', 'The New York Times'].includes(s.source)
      ).length * 10;
      const credibility = Math.min(100, baseScore + qualityBonus);
      const confidence = credibility > 70 ? 'high' : credibility > 40 ? 'medium' : 'low';

      const claimRes = {
        claim: c,
        credibility,
        sources,
        confidence
      };

      // Cache the result in both database and memory
      await cacheClaim(c, credibility, confidence, sources.length);
      memoryCache.set(key, claimRes);
      results.push(claimRes);

    } catch (error) {
      console.error('NewsAPI error for claim:', c, error.message);
      const claimRes = {
        claim: c,
        credibility: 30,
        sources: [],
        confidence: 'low',
        error: 'Verification failed'
      };
      memoryCache.set(key, claimRes);
      results.push(claimRes);
    }
  }

  const score = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.credibility, 0) / results.length)
    : 0;

  const result = {
    eventId,
    content,
    claims,
    verificationResults: results,
    score,
    timestamp: new Date().toISOString(),
    metadata: {
      ...metadata,
      cacheHits,
      verificationErrors: results.filter(r => r.error).length
    }
  };

  // Save to database
  await saveVerificationResult(result);

  // Fallback to memory storage
  memoryRecentScores.unshift(result);
  if (memoryRecentScores.length > 20) memoryRecentScores.pop();

  // Process Lightning zap for high-quality content
  if (eventId && result.score > 80) {
    try {
      // Extract author pubkey from the event (this would come from the Nostr event)
      // For now, we'll use a placeholder since we don't have the full event structure
      const authorPubkey = 'placeholder_pubkey'; // In real implementation, get from event
      const zapResult = await processContentZap(eventId, authorPubkey, result.score);

      if (zapResult.success) {
        console.log(`⚡ Zapped ${zapResult.amount_sats} sats for high-quality content (score: ${result.score})`);
        result.metadata.zap = {
          amount_sats: zapResult.amount_sats,
          message: zapResult.message
        };
      }
    } catch (error) {
      console.error('Failed to process Lightning zap:', error.message);
    }
  }

  if (eventId) publishScore(eventId, result);
  return result;
}

export async function getRecentScores() {
  try {
    // Try to get from database first
    const dbResults = await getRecentVerificationResults(20);
    if (dbResults && dbResults.length > 0) {
      // Convert database format to expected format
      return dbResults.map(result => ({
        eventId: result.eventId,
        content: result.content,
        claims: result.claims.map(claim => claim.text),
        verificationResults: result.claims.map(claim => ({
          claim: claim.text,
          credibility: claim.credibility,
          sources: claim.sources.map(source => ({
            title: source.title,
            source: source.source,
            url: source.url
          })),
          confidence: claim.confidence
        })),
        score: result.overallScore,
        timestamp: result.createdAt.toISOString(),
        metadata: {
          method: result.processingMethod,
          processingTime: result.processingTime,
          cacheHits: result.cacheHits,
          verificationErrors: result.verificationErrors
        }
      }));
    }
  } catch (error) {
    console.error('Failed to get recent scores from database:', error.message);
  }

  // Fallback to memory storage
  return memoryRecentScores;
}