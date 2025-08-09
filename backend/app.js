// backend/src/index.js
import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import { getRecentScores, verifyContent } from './verifier.js';

const app = express();
app.use(cors());
app.use(express.json());

let stats = { postsProcessed: 0, claimsVerified: 0, averageScore: 0 };

app.get('/', (_req, res) =>
  res.json({
    status: 'online',
    uptime: process.uptime(),
    stats,
    relays: { connected: 3, urls: ['wss://relay.damus.io'] },
  })
);

app.get('/scores', (_req, res) => res.json({ scores: getRecentScores() }));

app.post('/verify', async (req, res) => {
  const { content, eventId } = req.body;
  const result = await verifyContent(content, eventId);
  stats.postsProcessed += 1;
  stats.claimsVerified += result.claims.length;
  res.json(result);
});

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));