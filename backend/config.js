// backend/src/config.js
import 'dotenv/config';
export const PORT = process.env.PORT || 4000;
export const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
export const NOSTR_PRIV_KEY = process.env.NOSTR_PRIV_KEY;
export const RELAYS = process.env.RELAYS.split(',');
export const CACHE_TTL = 15 * 60 * 1000; // 15 min