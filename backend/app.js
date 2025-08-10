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

// Rate limiting for post analysis - 1 post every 30 seconds
let lastProcessedTime = 0;
const PROCESSING_INTERVAL = 30000; // 30 seconds
let pendingEvents = [];

// Start Nostr listener with rate-limited processing
startNostrListener(async (event) => {
  // Always broadcast new Nostr events (real-time feed)
  broadcastNostrEvent(event);

  // Always save events to database
  await saveNostrEvent(event);

  // Add to pending queue for analysis
  pendingEvents.push(event);

  // Process one event every 30 seconds
  const now = Date.now();
  if (now - lastProcessedTime >= PROCESSING_INTERVAL && pendingEvents.length > 0) {
    // Get the most recent event for analysis
    const eventToProcess = pendingEvents.pop();
    pendingEvents = []; // Clear the queue

    lastProcessedTime = now;

    console.log(`🔍 Processing event for analysis: ${eventToProcess.id.substring(0, 8)}... (${pendingEvents.length} events skipped)`);

    try {
      // Process the content and broadcast results
      const verificationResult = await verifyContent(eventToProcess.content, eventToProcess.id);
      broadcastVerificationResult(verificationResult);

      // If a zap was processed, broadcast that too
      if (verificationResult.metadata?.zap) {
        broadcastLightningZap({
          eventId: eventToProcess.id,
          amount_sats: verificationResult.metadata.zap.amount_sats,
          message: verificationResult.metadata.zap.message,
          score: verificationResult.score
        });
      }
    } catch (error) {
      console.error('Error processing event:', error.message);
    }
  }
});

// Periodic processor to ensure we process events even during quiet periods
setInterval(() => {
  const now = Date.now();
  if (pendingEvents.length > 0 && now - lastProcessedTime >= PROCESSING_INTERVAL) {
    const eventToProcess = pendingEvents.pop();
    pendingEvents = []; // Clear the queue

    lastProcessedTime = now;

    console.log(`⏰ Periodic processing: ${eventToProcess.id.substring(0, 8)}... (${pendingEvents.length} events in queue)`);

    verifyContent(eventToProcess.content, eventToProcess.id)
      .then(verificationResult => {
        broadcastVerificationResult(verificationResult);

        if (verificationResult.metadata?.zap) {
          broadcastLightningZap({
            eventId: eventToProcess.id,
            amount_sats: verificationResult.metadata.zap.amount_sats,
            message: verificationResult.metadata.zap.message,
            score: verificationResult.score
          });
        }
      })
      .catch(error => {
        console.error('Error in periodic processing:', error.message);
      });
  }
}, 10000); // Check every 10 seconds

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
  console.log('🔍 Manual verification request received:', req.body);
  const { content, eventId } = req.body;

  try {
    console.log(`🔍 Starting verification for: "${content}"`);
    const result = await verifyContent(content, eventId);
    console.log(`✅ Verification completed with score: ${result.score}`);

    // Broadcast the verification result to connected clients
    broadcastVerificationResult(result);

    res.json(result);
  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({ error: error.message });
  }
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