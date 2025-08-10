// frontend/src/hooks/useWebSocket.js
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setConnectionError(null);
      
      // Subscribe to all event types
      socket.emit('subscribe', {
        eventTypes: ['verification_results', 'nostr_events', 'lightning_zaps', 'system_stats']
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socket.on('connection_established', (data) => {
      console.log('WebSocket connection established:', data);
      addNotification('Connected to NostrOracle real-time updates', 'success');
    });

    // Message handlers
    socket.on('verification_result', (payload) => {
      console.log('Received verification result:', payload);
      setLastMessage({
        type: 'verification_result',
        data: payload.data,
        timestamp: payload.timestamp
      });
    });

    socket.on('nostr_event', (payload) => {
      console.log('Received Nostr event:', payload);
      setLastMessage({
        type: 'nostr_event',
        data: payload.data,
        timestamp: payload.timestamp
      });
    });

    socket.on('lightning_zap', (payload) => {
      console.log('Received Lightning zap:', payload);
      setLastMessage({
        type: 'lightning_zap',
        data: payload.data,
        timestamp: payload.timestamp
      });
      addNotification(
        `⚡ ${payload.data.amount_sats} sats zapped for high-quality content!`, 
        'success'
      );
    });

    socket.on('system_stats', (payload) => {
      console.log('Received system stats:', payload);
      setLastMessage({
        type: 'system_stats',
        data: payload.data,
        timestamp: payload.timestamp
      });
    });

    socket.on('notification', (payload) => {
      addNotification(payload.data.message, payload.data.type);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 notifications
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const sendMessage = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  const subscribe = (eventTypes) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('subscribe', { eventTypes });
    }
  };

  const unsubscribe = (eventTypes) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('unsubscribe', { eventTypes });
    }
  };

  const ping = () => {
    if (socketRef.current && isConnected) {
      const startTime = Date.now();
      socketRef.current.emit('ping');
      socketRef.current.once('pong', () => {
        const latency = Date.now() - startTime;
        console.log(`WebSocket latency: ${latency}ms`);
      });
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    isConnected,
    connectionError,
    lastMessage,
    notifications,
    sendMessage,
    subscribe,
    unsubscribe,
    ping,
    dismissNotification,
    socket: socketRef.current
  };
}
