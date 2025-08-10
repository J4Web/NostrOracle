// backend/src/nostr-client.js
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { WebSocket } from 'ws';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { NOSTR_PRIV_KEY, RELAYS } from './config.js';

// Handle private key - generate one if not provided or invalid
let sk;
if (!NOSTR_PRIV_KEY || NOSTR_PRIV_KEY === 'YOUR_64_CHAR_HEX_PRIVATE_KEY') {
  // Generate a new private key if none provided
  sk = generateSecretKey();
  console.log('Generated new private key. Add this to your .env file:');
  console.log('NOSTR_PRIV_KEY=' + bytesToHex(sk));
} else if (typeof NOSTR_PRIV_KEY === 'string' && NOSTR_PRIV_KEY.length === 64) {
  // Convert hex string to Uint8Array
  try {
    sk = hexToBytes(NOSTR_PRIV_KEY);
  } catch (error) {
    console.error('Invalid hex private key, generating new one...');
    sk = generateSecretKey();
    console.log('Generated new private key. Add this to your .env file:');
    console.log('NOSTR_PRIV_KEY=' + bytesToHex(sk));
  }
} else {
  // Invalid format, generate new one
  console.error('Invalid private key format, generating new one...');
  sk = generateSecretKey();
  console.log('Generated new private key. Add this to your .env file:');
  console.log('NOSTR_PRIV_KEY=' + bytesToHex(sk));
}

const pk = getPublicKey(sk);

const connections = [];

export async function startNostrListener(onEvent) {
  RELAYS.forEach(url => {
    const ws = new WebSocket(url);

    ws.on('open', () => {
      console.log(`Connected to relay: ${url}`);
      const sub = ['REQ', 'sub1', { kinds: [1], limit: 100 }]; // Reduced limit for testing
      ws.send(JSON.stringify(sub));
    });

    ws.on('message', msg => {
      try {
        const data = JSON.parse(msg.toString());
        if (data[0] === 'EVENT') {
          onEvent(data[2]);
        }
      } catch (error) {
        console.error('Failed to parse Nostr message:', error.message);
      }
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${url}:`, error.message);
    });

    ws.on('close', () => {
      console.log(`Disconnected from relay: ${url}`);
      // Remove from connections array
      const index = connections.indexOf(ws);
      if (index > -1) {
        connections.splice(index, 1);
      }
    });

    connections.push(ws);
  });
}

export function publishScore(eventId, scoreObj) {
  const ev = finalizeEvent(
    {
      kind: 39000,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['e', eventId], ['score', String(scoreObj.score)]],
      content: JSON.stringify(scoreObj),
    },
    sk
  );

  // Only send to open connections
  connections.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.send(JSON.stringify(['EVENT', ev]));
      } catch (error) {
        console.error('Failed to publish score to relay:', error.message);
      }
    }
  });
}