// frontend/src/components/Notifications.jsx
import React from 'react';

const Notifications = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;

  const getNotificationStyle = (type) => {
    const baseStyle = {
      padding: '12px 16px',
      marginBottom: '8px',
      borderRadius: '6px',
      border: '1px solid',
      position: 'relative',
      animation: 'slideIn 0.3s ease-out'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: '#d4edda',
          borderColor: '#c3e6cb',
          color: '#155724'
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: '#f8d7da',
          borderColor: '#f5c6cb',
          color: '#721c24'
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7',
          color: '#856404'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#d1ecf1',
          borderColor: '#bee5eb',
          color: '#0c5460'
        };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      maxWidth: '400px',
      width: '100%'
    }}>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={getNotificationStyle(notification.type)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, marginRight: '10px' }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                {notification.type === 'success' && '✅ '}
                {notification.type === 'error' && '❌ '}
                {notification.type === 'warning' && '⚠️ '}
                {notification.type === 'info' && 'ℹ️ '}
                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
              </div>
              <div style={{ fontSize: '14px' }}>
                {notification.message}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={() => onDismiss(notification.id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                opacity: 0.7,
                padding: '0',
                lineHeight: '1'
              }}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
