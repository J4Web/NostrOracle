// backend/src/config.js
import 'dotenv/config';
export const PORT = process.env.PORT || 4000;
export const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const NOSTR_PRIV_KEY = process.env.NOSTR_PRIV_KEY;
export const RELAYS = process.env.RELAYS.split(',');
export const CACHE_TTL = 15 * 60 * 1000; // 15 min

// Lightning configuration
export const LIGHTNING_ADDRESS = process.env.LIGHTNING_ADDRESS;
export const ZAP_AMOUNT_SATS = parseInt(process.env.ZAP_AMOUNT_SATS) || 1000;