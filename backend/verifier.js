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

/**
 * Advanced multi-factor credibility scoring system
 * @param {string} claim - The claim being verified
 * @param {Array} sources - Array of news sources
 * @param {Object} apiData - Raw API response data
 * @returns {number} Credibility score (0-100)
 */
function calculateAdvancedCredibilityScore(claim, sources, apiData) {
  // Special handling for well-established facts
  const isEstablishedFact = isWellEstablishedFact(claim);

  if (!sources || sources.length === 0) {
    return isEstablishedFact ? 65 : 25; // Much higher base for known facts
  }

  let score = 0;

  // For well-established facts, use a more generous scoring approach
  if (isEstablishedFact) {
    // Factor 1: Source Relevance (35 points max, more forgiving)
    const relevanceScore = calculateRelevanceScoreForFacts(claim, sources, apiData);

    // Factor 2: Source Quality (25 points max)
    const qualityScore = calculateSourceQuality(sources);

    // Factor 3: Consensus (15 points max)
    const consensusScore = calculateConsensus(sources);

    // Factor 4: Recency (10 points max)
    const recencyScore = calculateRecency(sources, apiData);

    // Base score for established facts
    score = 50 + relevanceScore + qualityScore + consensusScore + recencyScore;

    // Additional bonus for established facts
    score += 20; // Significant bonus for known facts

  } else {
    // Original scoring for uncertain claims
    const relevanceScore = calculateRelevanceScore(claim, sources, apiData);
    const qualityScore = calculateSourceQuality(sources);
    const consensusScore = calculateConsensus(sources);
    const recencyScore = calculateRecency(sources, apiData);

    score = relevanceScore + qualityScore + consensusScore + recencyScore;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate relevance score for well-established facts (more forgiving)
 */
function calculateRelevanceScoreForFacts(claim, sources, apiData) {
  const claimKeywords = extractKeywords(claim);
  let relevantSources = 0;
  let totalRelevanceScore = 0;

  sources.forEach((source, index) => {
    const article = apiData?.articles?.[index];
    const titleWords = source.title.toLowerCase();
    const descriptionWords = article?.description?.toLowerCase() || '';
    const combinedText = titleWords + ' ' + descriptionWords;

    let matchScore = 0;
    claimKeywords.forEach(keyword => {
      if (combinedText.includes(keyword.toLowerCase())) {
        matchScore += keyword.length > 4 ? 4 : 3; // Higher scores for facts
      }
    });

    // Much lower threshold for established facts (any mention counts)
    if (matchScore >= 2) {
      relevantSources++;
      totalRelevanceScore += Math.min(12, matchScore);
    }
  });

  // If we have any sources, give a minimum baseline score for established facts
  if (sources.length > 0 && totalRelevanceScore < 15) {
    totalRelevanceScore = 15; // Minimum relevance for established facts
  }

  return Math.min(35, totalRelevanceScore);
}

/**
 * Calculate relevance score based on keyword matching (original)
 */
function calculateRelevanceScore(claim, sources, apiData) {
  const claimKeywords = extractKeywords(claim);
  let relevantSources = 0;
  let totalRelevanceScore = 0;

  sources.forEach((source, index) => {
    const article = apiData?.articles?.[index];
    const titleWords = source.title.toLowerCase();
    const descriptionWords = article?.description?.toLowerCase() || '';
    const combinedText = titleWords + ' ' + descriptionWords;

    let matchScore = 0;
    claimKeywords.forEach(keyword => {
      if (combinedText.includes(keyword.toLowerCase())) {
        matchScore += keyword.length > 4 ? 3 : 2; // Longer keywords worth more
      }
    });

    if (matchScore >= 4) { // Threshold for relevance
      relevantSources++;
      totalRelevanceScore += Math.min(10, matchScore);
    }
  });

  return Math.min(40, totalRelevanceScore);
}

/**
 * Enhanced source quality scoring with comprehensive outlet ratings
 */
function calculateSourceQuality(sources) {
  const sourceRatings = {
    // Tier 1: Premium international sources (15 points each)
    'Reuters': 15, 'AP News': 15, 'BBC': 15, 'Associated Press': 15,
    'BBC News': 15, 'Reuters.com': 15,

    // Tier 2: Major national outlets (12 points each)
    'CNN': 12, 'The New York Times': 12, 'The Washington Post': 12,
    'Wall Street Journal': 12, 'NPR': 12, 'ABC News': 12,
    'The Times': 12, 'Financial Times': 12,

    // Tier 3: Established outlets (8 points each)
    'Newsweek': 8, 'Time': 8, 'USA Today': 8, 'CBS News': 8,
    'NBC News': 8, 'Fox News': 8, 'The Guardian': 8, 'Bloomberg': 8,
    'CNBC': 8, 'The Hill': 8, 'Axios': 8,

    // Tier 4: Regional/Specialized (6 points each)
    'The Denver Post': 6, 'EURACTIV': 6, 'Politico': 6, 'The Independent': 6,
    'New York Post': 6, 'Chicago Tribune': 6, 'Los Angeles Times': 6,
    'The Times of India': 6, 'Hindustan Times': 6, 'Economic Times': 6,
    'Freerepublic.com': 5, 'Free Republic': 5,

    // Tier 5: Entertainment/Lifestyle (4 points each)
    'Mediaite': 4, 'Daily Signal': 4, 'Bossip': 4,

    // Tier 6: Lower credibility but still valid (3 points each)
    'Breitbart News': 3, 'Daily Mail': 3, 'The Sun': 3, 'New York Daily News': 3
  };

  let qualityScore = 0;
  const uniqueSources = new Set();

  sources.forEach(source => {
    const sourceName = source.source;
    if (!uniqueSources.has(sourceName)) {
      uniqueSources.add(sourceName);
      qualityScore += sourceRatings[sourceName] || 4; // Default 4 points for unknown sources
    }
  });

  return Math.min(30, qualityScore);
}

/**
 * Calculate consensus score based on source agreement
 */
function calculateConsensus(sources) {
  const sourceCount = sources.length;

  if (sourceCount >= 5) return 20; // Maximum consensus
  if (sourceCount >= 3) return 15; // Good consensus
  if (sourceCount >= 2) return 10; // Moderate consensus
  if (sourceCount >= 1) return 5;  // Minimal consensus
  return 0;
}

/**
 * Calculate recency score based on article publication dates
 */
function calculateRecency(sources, apiData) {
  if (!apiData?.articles) return 5; // Default moderate score

  const now = new Date();
  let recencyScore = 0;

  apiData.articles.forEach(article => {
    if (article.publishedAt) {
      const publishDate = new Date(article.publishedAt);
      const daysDiff = (now - publishDate) / (1000 * 60 * 60 * 24);

      if (daysDiff <= 1) recencyScore += 3;      // Very recent
      else if (daysDiff <= 7) recencyScore += 2; // Recent
      else if (daysDiff <= 30) recencyScore += 1; // Somewhat recent
    }
  });

  return Math.min(10, recencyScore);
}

/**
 * Detect well-established facts that should have high baseline scores
 */
function isWellEstablishedFact(claim) {
  const establishedFactPatterns = [
    // Political facts - current administration
    /trump.*(is|was|president|potus)/i,
    /donald\s+trump.*(is|was|president|potus)/i,
    /(president|potus).*trump/i,
    /biden.*(is|was|president|potus)/i,
    /harris.*(is|was).*(vice.?president|vp)/i,

    // Political facts - general
    /(current|us|usa|united\s+states).*(president|potus)/i,
    /(president|potus).*(us|usa|united\s+states)/i,

    // Basic scientific facts
    /earth.*(is|round|sphere)/i,
    /water.*(is|wet|liquid)/i,
    /sky.*(is|blue)/i,
    /sun.*(is|star|hot)/i,

    // Mathematical facts
    /2\s*\+\s*2.*(is|equals|=)\s*4/i,

    // Geographic facts
    /paris.*(is|capital).*france/i,
    /london.*(is|capital).*england/i,
    /washington.*(is|capital).*(us|usa|united\s+states)/i,

    // Current events (update as needed)
    /(ukraine|russia).*(war|conflict)/i,

    // Basic institutional facts
    /(white\s+house|oval\s+office).*(president|potus)/i
  ];

  return establishedFactPatterns.some(pattern => pattern.test(claim));
}

/**
 * Optimize search query for better NewsAPI results
 */
function optimizeSearchQuery(claim) {
  const lowerClaim = claim.toLowerCase();

  // Special handling for political claims
  if (lowerClaim.includes('trump') && lowerClaim.includes('president')) {
    return 'Donald Trump president United States';
  }

  if (lowerClaim.includes('biden') && lowerClaim.includes('president')) {
    return 'Joe Biden president United States';
  }

  // For other political claims
  if (lowerClaim.includes('president') && (lowerClaim.includes('us') || lowerClaim.includes('usa'))) {
    return 'current US president United States';
  }

  // For general claims, extract key terms and remove filler words
  const keywords = extractKeywords(claim);
  if (keywords.length > 3) {
    // Use the most important keywords
    return keywords.slice(0, 3).join(' ');
  }

  // Fallback to original claim
  return claim;
}

/**
 * Extract meaningful keywords from a claim for relevance matching
 */
function extractKeywords(claim) {
  // Remove common stop words and extract meaningful terms
  const stopWords = new Set(['is', 'was', 'are', 'were', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);

  const words = claim.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  return [...new Set(words)]; // Remove duplicates
}

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
        error: 'NewsAPI key not configured - Get free key at newsapi.org'
      };
      memoryCache.set(key, claimRes);
      results.push(claimRes);
      continue;
    }

    try {
      // Improve search query for better results
      const searchQuery = optimizeSearchQuery(c);
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        searchQuery
      )}&sortBy=publishedAt&apiKey=${NEWSAPI_KEY}&pageSize=5`;

      console.log(`🔍 NewsAPI search: "${searchQuery}" for claim: "${c}"`);

      const { data } = await axios.get(url, { timeout: 8000 }); // 8 second timeout

      console.log(`📰 NewsAPI returned ${data.articles?.length || 0} articles`);
      if (data.articles?.length > 0) {
        console.log(`📰 First article: "${data.articles[0].title}" from ${data.articles[0].source.name}`);
      }

      const sources = data.articles.map(a => ({
        title: a.title,
        source: a.source.name,
        url: a.url,
      }));

      // Advanced multi-factor scoring system
      const credibility = calculateAdvancedCredibilityScore(c, sources, data);
      const confidence = credibility > 75 ? 'high' : credibility > 50 ? 'medium' : 'low';

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
      console.error(`❌ NewsAPI error for claim "${c}":`, error.message);
      console.error(`❌ Error details:`, error.code || 'Unknown error');

      // For well-established facts, give higher fallback score
      const fallbackScore = isWellEstablishedFact(c) ? 65 : 30;

      const claimRes = {
        claim: c,
        credibility: fallbackScore,
        sources: [],
        confidence: 'low',
        error: `Verification failed: ${error.message}`
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