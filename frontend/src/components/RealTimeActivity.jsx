// frontend/src/components/RealTimeActivity.jsx
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const RealTimeActivity = ({ lastMessage, isConnected }) => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (lastMessage) {
      const activity = {
        id: Date.now(),
        ...lastMessage,
        displayTime: dayjs().fromNow()
      };
      
      setActivities(prev => [activity, ...prev.slice(0, 19)]); // Keep only 20 activities
    }
  }, [lastMessage]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'verification_result':
        return '•';
      case 'nostr_event':
        return '•';
      case 'lightning_zap':
        return '•';
      case 'system_stats':
        return '•';
      default:
        return '•';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'verification_result':
        return '#007bff';
      case 'nostr_event':
        return '#6f42c1';
      case 'lightning_zap':
        return '#ffc107';
      case 'system_stats':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const formatActivityMessage = (activity) => {
    switch (activity.type) {
      case 'verification_result':
        return `Verified content with score ${activity.data.score}/100 (${activity.data.claims.length} claims)`;
      case 'nostr_event':
        return `New Nostr event from ${activity.data.pubkey.substring(0, 8)}...`;
      case 'lightning_zap':
        return `${activity.data.amount_sats} sats zapped for quality content`;
      case 'system_stats':
        return `System stats updated: ${activity.data.postsProcessed} posts processed`;
      default:
        return 'Unknown activity';
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '15px',
        gap: '10px'
      }}>
        <h3 style={{ margin: 0 }}>Real-time Activity</h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '14px',
          color: isConnected ? '#28a745' : '#dc3545'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#28a745' : '#dc3545'
          }} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {activities.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#6c757d',
          fontStyle: 'italic',
          border: '2px dashed #dee2e6',
          borderRadius: '8px'
        }}>
          {isConnected ? 'Waiting for real-time updates...' : 'Connect to see real-time activity'}
        </div>
      ) : (
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          {activities.map((activity) => (
            <div
              key={activity.id}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                backgroundColor: '#fff',
                margin: '4px',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{
                fontSize: '20px',
                flexShrink: 0
              }}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: getActivityColor(activity.type),
                  marginBottom: '4px'
                }}>
                  {formatActivityMessage(activity)}
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: '#6c757d'
                }}>
                  {dayjs(activity.timestamp).fromNow()}
                </div>
                
                {activity.type === 'verification_result' && activity.data.verificationResults && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#495057'
                  }}>
                    <details>
                      <summary style={{ cursor: 'pointer', fontWeight: '500' }}>
                        View Claims ({activity.data.verificationResults.length})
                      </summary>
                      <div style={{ marginTop: '4px', paddingLeft: '16px' }}>
                        {activity.data.verificationResults.slice(0, 3).map((result, idx) => (
                          <div key={idx} style={{ marginBottom: '4px' }}>
                            • {result.claim.substring(0, 100)}
                            {result.claim.length > 100 && '...'}
                            <span style={{ 
                              marginLeft: '8px',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              backgroundColor: result.credibility > 70 ? '#d4edda' : 
                                             result.credibility > 40 ? '#fff3cd' : '#f8d7da',
                              color: result.credibility > 70 ? '#155724' : 
                                     result.credibility > 40 ? '#856404' : '#721c24'
                            }}>
                              {result.credibility}%
                            </span>
                          </div>
                        ))}
                        {activity.data.verificationResults.length > 3 && (
                          <div style={{ fontStyle: 'italic', color: '#6c757d' }}>
                            +{activity.data.verificationResults.length - 3} more claims...
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RealTimeActivity;
