// backend/src/verifier.js
import axios from 'axios';
import { NEWSAPI_KEY } from './config.js';
import { scoreResults } from './scorer.js';
import { publishScore } from './nostr-client.js';

const cache = new Map();
const recentScores = [];

function extractClaims(text) {
  // naive regex extraction
  const matches = text.match(/\b[A-Z][^.!?]*\b(is|was|will be|announced|reported|said)\b[^.!?]*[.!?]/gi);
  return matches ? matches.map(c => c.trim()) : [];
}

export async function verifyContent(content, eventId = null) {
  const claims = extractClaims(content);
  const results = [];
  for (const c of claims) {
    const key = c.toLowerCase();
    if (cache.has(key)) {
      results.push(cache.get(key));
      continue;
    }
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      c
    )}&sortBy=publishedAt&apiKey=${NEWSAPI_KEY}&pageSize=5`;
    const { data } = await axios.get(url);
    const sources = data.articles.map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
    }));
    const claimRes = { claim: c, credibility: Math.min(100, sources.length * 20), sources, confidence: 'medium' };
    cache.set(key, claimRes);
    results.push(claimRes);
  }
  const score = Math.round(results.reduce((s, r) => s + r.credibility, 0) / results.length || 0);
  const result = {
    eventId,
    content,
    claims,
    verificationResults: results,
    score,
    timestamp: new Date().toISOString(),
  };
  recentScores.unshift(result);
  if (recentScores.length > 20) recentScores.pop();
  if (eventId) publishScore(eventId, result);
  return result;
}

export const getRecentScores = () => recentScores;