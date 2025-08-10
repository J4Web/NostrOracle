// backend/websocket-service.js
import { Server } from 'socket.io';

let io = null;
const connectedClients = new Set();

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 */
export function initializeWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5173"], // React dev servers
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    connectedClients.add(socket.id);

    // Send current stats to new client
    socket.emit('connection_established', {
      message: 'Connected to NostrOracle WebSocket',
      clientId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Handle client subscription to specific events
    socket.on('subscribe', (data) => {
      const { eventTypes } = data;
      console.log(`Client ${socket.id} subscribed to:`, eventTypes);
      
      if (eventTypes.includes('verification_results')) {
        socket.join('verification_results');
      }
      if (eventTypes.includes('nostr_events')) {
        socket.join('nostr_events');
      }
      if (eventTypes.includes('lightning_zaps')) {
        socket.join('lightning_zaps');
      }
      if (eventTypes.includes('system_stats')) {
        socket.join('system_stats');
      }
    });

    // Handle client unsubscription
    socket.on('unsubscribe', (data) => {
      const { eventTypes } = data;
      console.log(`Client ${socket.id} unsubscribed from:`, eventTypes);
      
      eventTypes.forEach(eventType => {
        socket.leave(eventType);
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      connectedClients.delete(socket.id);
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  console.log('WebSocket server initialized');
  return io;
}

/**
 * Broadcast verification result to all connected clients
 * @param {Object} verificationResult - The verification result
 */
export function broadcastVerificationResult(verificationResult) {
  if (!io) return;

  const payload = {
    type: 'verification_result',
    data: verificationResult,
    timestamp: new Date().toISOString()
  };

  // Broadcast to all clients subscribed to verification results
  io.to('verification_results').emit('verification_result', payload);
  
  console.log(`Broadcasted verification result to ${connectedClients.size} clients`);
}

/**
 * Broadcast new Nostr event to connected clients
 * @param {Object} nostrEvent - The Nostr event
 */
export function broadcastNostrEvent(nostrEvent) {
  if (!io) return;

  const payload = {
    type: 'nostr_event',
    data: {
      id: nostrEvent.id,
      pubkey: nostrEvent.pubkey,
      content: nostrEvent.content.substring(0, 200) + '...', // Truncate for performance
      kind: nostrEvent.kind,
      created_at: nostrEvent.created_at
    },
    timestamp: new Date().toISOString()
  };

  io.to('nostr_events').emit('nostr_event', payload);
}

/**
 * Broadcast Lightning zap information
 * @param {Object} zapInfo - Zap information
 */
export function broadcastLightningZap(zapInfo) {
  if (!io) return;

  const payload = {
    type: 'lightning_zap',
    data: zapInfo,
    timestamp: new Date().toISOString()
  };

  io.to('lightning_zaps').emit('lightning_zap', payload);
  
  console.log(`Broadcasted Lightning zap: ${zapInfo.amount_sats} sats`);
}

/**
 * Broadcast system statistics update
 * @param {Object} stats - System statistics
 */
export function broadcastSystemStats(stats) {
  if (!io) return;

  const payload = {
    type: 'system_stats',
    data: stats,
    timestamp: new Date().toISOString()
  };

  io.to('system_stats').emit('system_stats', payload);
}

/**
 * Send message to specific client
 * @param {string} clientId - Client socket ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export function sendToClient(clientId, event, data) {
  if (!io) return;

  io.to(clientId).emit(event, {
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get connected clients count
 * @returns {number} Number of connected clients
 */
export function getConnectedClientsCount() {
  return connectedClients.size;
}

/**
 * Get WebSocket server status
 * @returns {Object} Server status
 */
export function getWebSocketStatus() {
  return {
    initialized: !!io,
    connectedClients: connectedClients.size,
    rooms: io ? Object.keys(io.sockets.adapter.rooms) : [],
    uptime: process.uptime()
  };
}

/**
 * Broadcast general notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, warning, error, success)
 */
export function broadcastNotification(message, type = 'info') {
  if (!io) return;

  const payload = {
    type: 'notification',
    data: {
      message,
      type,
      id: `notif_${Date.now()}`
    },
    timestamp: new Date().toISOString()
  };

  io.emit('notification', payload);
}

export { io };
