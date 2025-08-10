// frontend/src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import Logo from './Logo.jsx';

const Header = ({ isConnected, connectionError, stats }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000); // Update every 5 seconds instead of 1

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <header className="app-header">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="app-tagline">AI-Powered Content Verification</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Logo size={64} showText={true} />
          </div>
          <p className="hero-description">
            Real-time fact-checking and credibility scoring for the Nostr network.
            Enhancing information integrity through advanced AI and Lightning Network integration.
          </p>
          
          {/* Connection Status */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <div className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
              <div className={`status-dot ${isConnected ? 'pulse' : ''}`} />
              <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>

          {connectionError && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'rgba(239, 68, 68, 0.9)',
              fontSize: '0.875rem'
            }}>
              ⚠️ Connection Error: {connectionError}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: 'var(--primary-color)',
            marginBottom: '0.25rem'
          }}>
            {stats?.postsProcessed?.toLocaleString() || '0'}
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Posts Verified
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: 'var(--accent-color)',
            marginBottom: '0.25rem'
          }}>
            {stats?.claimsVerified?.toLocaleString() || '0'}
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Claims Analyzed
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: 'var(--secondary-color)',
            marginBottom: '0.25rem'
          }}>
            {Math.round(stats?.averageScore || 0)}%
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Avg. Credibility
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: isConnected ? 'var(--success-color)' : 'var(--error-color)',
            marginBottom: '0.25rem'
          }}>
            {isConnected ? '3/3' : '0/3'}
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Relays Connected
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        {[
          {
            title: 'AI-Powered Analysis',
            description: 'Advanced claim extraction using OpenAI GPT-4o-mini',
            status: 'active'
          },
          {
            title: 'Lightning Rewards',
            description: 'Automatic zaps for high-quality content via NIP-57',
            status: 'beta'
          },
          {
            title: 'Real-time Processing',
            description: 'Live monitoring and verification of Nostr events',
            status: 'active'
          },
          {
            title: 'Persistent Storage',
            description: 'Database-backed analytics and historical data',
            status: 'active'
          }
        ].map((feature, index) => (
          <div key={index} style={{
            padding: '1.5rem',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-200)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div>
                <div style={{ 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  marginBottom: '0.25rem'
                }}>
                  {feature.title}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: feature.status === 'active' ? 'var(--success-color)' : 'var(--warning-color)',
                  color: 'white',
                  textTransform: 'uppercase',
                  fontWeight: '500',
                  display: 'inline-block'
                }}>
                  {feature.status}
                </div>
              </div>
            </div>
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.5'
            }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </header>
  );
};

export default Header;
