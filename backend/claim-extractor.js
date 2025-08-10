// backend/claim-extractor.js
import OpenAI from 'openai';
import { OPENAI_API_KEY } from './config.js';

let openai = null;
let hasLoggedApiKeyWarning = false;

// Initialize OpenAI client only if API key is available
if (OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  } catch (error) {
    console.warn('Failed to initialize OpenAI client:', error.message);
  }
}

/**
 * Extract factual claims from text using OpenAI GPT-4o-mini
 * @param {string} text - The text content to analyze
 * @returns {Promise<Array<string>>} - Array of extracted factual claims
 */
// Track if we've already logged the API key warning

export async function extractClaimsWithAI(text) {
  if (!openai || !OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
    // Only log the warning once to reduce noise
    if (!hasLoggedApiKeyWarning) {
      console.warn('OpenAI API key not configured, falling back to regex extraction');
      hasLoggedApiKeyWarning = true;
    }
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
 * Fallback regex-based claim extraction (improved implementation)
 * @param {string} text - The text content to analyze
 * @returns {Array<string>} - Array of extracted claims
 */
function extractClaimsRegex(text) {
  const claims = [];

  // Split text into sentences
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

  // Patterns that indicate factual claims
  const claimPatterns = [
    // Basic statements with "is/was/are/were"
    /\b\w+\s+(is|was|are|were)\s+.+/i,
    // Statements with "has/have/had"
    /\b\w+\s+(has|have|had)\s+.+/i,
    // Statements with "will/would/can/could"
    /\b\w+\s+(will|would|can|could)\s+.+/i,
    // Statements with action verbs
    /\b\w+\s+(announced|reported|said|declared|stated|confirmed|denied)\s+.+/i,
    // Statements with "the" (often factual)
    /\bthe\s+\w+\s+(is|was|are|were|has|have|had)\s+.+/i,
    // Simple subject-verb-object patterns
    /\b[A-Z]\w*\s+\w+\s+.+/,
  ];

  for (const sentence of sentences) {
    // Skip very short sentences
    if (sentence.length < 10) continue;

    // Check if sentence matches any claim pattern
    for (const pattern of claimPatterns) {
      if (pattern.test(sentence)) {
        claims.push(sentence.trim());
        break; // Don't add the same sentence multiple times
      }
    }
  }

  // If no patterns matched, treat the whole text as a potential claim
  if (claims.length === 0 && text.trim().length > 5) {
    claims.push(text.trim());
  }

  return claims.slice(0, 5); // Limit to 5 claims max
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
