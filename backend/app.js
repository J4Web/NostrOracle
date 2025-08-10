// backend/src/index.js
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { PORT } from './config.js';
import { getRecentScores, verifyContent } from './verifier.js';
import { startNostrListener } from './nostr-client.js';
import { initializeDatabase, getSystemStats, saveNostrEvent } from './database.js';
import { initializeLightningService, getLightningWalletInfo, processContentZap } from './lightning-service.js';
import {
  initializeWebSocket,
  broadcastVerificationResult,
  broadcastNostrEvent,
  broadcastLightningZap,
  getWebSocketStatus
} from './websocket-service.js';

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

// Initialize services
await initializeDatabase();
await initializeLightningService();
initializeWebSocket(server);

// Start Nostr listener with WebSocket broadcasting
startNostrListener(async (event) => {
  // Broadcast new Nostr event
  broadcastNostrEvent(event);

  // Save the Nostr event to database
  await saveNostrEvent(event);

  // Process the content and broadcast results
  const verificationResult = await verifyContent(event.content, event.id);
  broadcastVerificationResult(verificationResult);

  // If a zap was processed, broadcast that too
  if (verificationResult.metadata?.zap) {
    broadcastLightningZap({
      eventId: event.id,
      amount_sats: verificationResult.metadata.zap.amount_sats,
      message: verificationResult.metadata.zap.message,
      score: verificationResult.score
    });
  }
});

app.get('/', async (_req, res) => {
  const stats = await getSystemStats();
  const wsStatus = getWebSocketStatus();

  res.json({
    status: 'online',
    uptime: process.uptime(),
    stats: {
      postsProcessed: stats.postsProcessed,
      claimsVerified: stats.claimsVerified,
      averageScore: Math.round(stats.averageScore * 100) / 100
    },
    websocket: {
      connected: wsStatus.connectedClients,
      initialized: wsStatus.initialized
    },
    relays: { connected: 3, urls: ['wss://relay.damus.io'] },
  });
});

app.get('/scores', async (_req, res) => {
  const scores = await getRecentScores();
  res.json({ scores });
});

app.post('/verify', async (req, res) => {
  const { content, eventId } = req.body;
  const result = await verifyContent(content, eventId);

  // Broadcast the verification result to connected clients
  broadcastVerificationResult(result);

  res.json(result);
});

// Lightning endpoints
app.get('/lightning/info', (_req, res) => {
  const walletInfo = getLightningWalletInfo();
  res.json(walletInfo);
});

app.post('/lightning/zap', async (req, res) => {
  const { eventId, authorPubkey, credibilityScore } = req.body;

  if (!eventId || !authorPubkey || credibilityScore === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: eventId, authorPubkey, credibilityScore'
    });
  }

  const zapResult = await processContentZap(eventId, authorPubkey, credibilityScore);
  res.json(zapResult);
});

server.listen(PORT, () => {
  console.log(`🚀 NostrOracle API running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready for real-time updates`);
  console.log(`⚡ Lightning zaps enabled for high-quality content`);
  console.log(`🗄️  Database persistence active`);
  console.log(`🤖 AI-powered claim extraction ready`);
});