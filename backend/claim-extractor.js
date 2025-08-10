// backend/claim-extractor.js
import OpenAI from 'openai';
import { OPENAI_API_KEY } from './config.js';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/**
 * Extract factual claims from text using OpenAI GPT-4o-mini
 * @param {string} text - The text content to analyze
 * @returns {Promise<Array<string>>} - Array of extracted factual claims
 */
export async function extractClaimsWithAI(text) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
    console.warn('OpenAI API key not configured, falling back to regex extraction');
    return extractClaimsRegex(text);
  }

  try {
    const prompt = `
You are a fact-checking assistant. Analyze the following text and extract only factual claims that can be verified against news sources or public information.

Rules:
1. Extract only objective, verifiable statements of fact
2. Ignore opinions, subjective statements, and personal experiences
3. Focus on claims about events, announcements, statistics, or concrete facts
4. Each claim should be a complete, standalone statement
5. Return claims as a JSON array of strings
6. If no verifiable claims are found, return an empty array

Text to analyze:
"${text.replace(/"/g, '\\"')}"

Return only the JSON array, no other text:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise fact-checking assistant that extracts only verifiable factual claims from text. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      console.warn('Empty response from OpenAI, falling back to regex');
      return extractClaimsRegex(text);
    }

    // Parse the JSON response
    try {
      const claims = JSON.parse(content);
      if (Array.isArray(claims)) {
        return claims.filter(claim => typeof claim === 'string' && claim.trim().length > 0);
      } else {
        console.warn('OpenAI response is not an array, falling back to regex');
        return extractClaimsRegex(text);
      }
    } catch (parseError) {
      console.warn('Failed to parse OpenAI response as JSON, falling back to regex:', parseError.message);
      return extractClaimsRegex(text);
    }

  } catch (error) {
    console.error('OpenAI API error, falling back to regex extraction:', error.message);
    return extractClaimsRegex(text);
  }
}

/**
 * Fallback regex-based claim extraction (original implementation)
 * @param {string} text - The text content to analyze
 * @returns {Array<string>} - Array of extracted claims
 */
function extractClaimsRegex(text) {
  // Original naive regex extraction as fallback
  const matches = text.match(/\b[A-Z][^.!?]*\b(is|was|will be|announced|reported|said)\b[^.!?]*[.!?]/gi);
  return matches ? matches.map(c => c.trim()) : [];
}

/**
 * Enhanced claim extraction with confidence scoring
 * @param {string} text - The text content to analyze
 * @returns {Promise<Object>} - Object with claims and metadata
 */
export async function extractClaimsEnhanced(text) {
  const startTime = Date.now();
  const claims = await extractClaimsWithAI(text);
  const processingTime = Date.now() - startTime;

  return {
    claims,
    metadata: {
      processingTime,
      method: OPENAI_API_KEY && OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE' ? 'ai' : 'regex',
      claimCount: claims.length,
      textLength: text.length
    }
  };
}
