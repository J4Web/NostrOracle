// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';

const Dashboard = ({ stats, isConnected, lastMessage }) => {
  const [systemStats, setSystemStats] = useState({
    postsProcessed: 0,
    claimsVerified: 0,
    averageScore: 0,
    uptime: 0
  });

  const [realtimeMetrics, setRealtimeMetrics] = useState({
    eventsPerMinute: 0,
    averageProcessingTime: 0,
    successRate: 100,
    activeConnections: 0
  });

  useEffect(() => {
    if (stats) {
      setSystemStats(stats);
    }
  }, [stats]);

  useEffect(() => {
    // Simulate real-time metrics updates - slower for better UX
    const interval = setInterval(() => {
      setRealtimeMetrics(prev => ({
        eventsPerMinute: Math.floor(Math.random() * 50) + 10,
        averageProcessingTime: Math.floor(Math.random() * 500) + 200,
        successRate: Math.floor(Math.random() * 10) + 90,
        activeConnections: isConnected ? Math.floor(Math.random() * 5) + 1 : 0
      }));
    }, 10000); // Update every 10 seconds for dashboard

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success-color)';
    if (score >= 60) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'var(--primary-color)', trend }) => (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        {trend && (
          <div style={{
            fontSize: '0.75rem',
            color: trend > 0 ? 'var(--success-color)' : 'var(--error-color)',
            fontWeight: '500'
          }}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{title}</div>
      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  const MetricBar = ({ label, value, max, color = 'var(--primary-color)' }) => (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{label}</span>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{value}{max ? `/${max}` : ''}</span>
      </div>
      <div style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: 'var(--gray-200)', 
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${max ? (value / max) * 100 : value}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      {/* System Overview */}
      <div className="stats-grid">
        <StatCard
          title="Posts Processed"
          value={systemStats.postsProcessed?.toLocaleString() || '0'}
          subtitle="Total verified"
          icon=""
          trend={5}
        />
        <StatCard
          title="Claims Verified"
          value={systemStats.claimsVerified?.toLocaleString() || '0'}
          subtitle="Individual claims"
          icon=""
          trend={12}
        />
        <StatCard
          title="Average Score"
          value={`${Math.round(systemStats.averageScore || 0)}/100`}
          subtitle="Credibility rating"
          icon=""
          color={getScoreColor(systemStats.averageScore || 0)}
          trend={-2}
        />
        <StatCard
          title="System Uptime"
          value={formatUptime(systemStats.uptime || 0)}
          subtitle="Continuous operation"
          icon=""
          color="var(--accent-color)"
        />
      </div>

      {/* Real-time Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="card">
          <h3 className="card-title">Real-time Performance</h3>
          <div style={{ marginTop: '1rem' }}>
            <MetricBar 
              label="Events per Minute" 
              value={realtimeMetrics.eventsPerMinute} 
              max={100}
              color="var(--primary-color)"
            />
            <MetricBar 
              label="Processing Time (ms)" 
              value={realtimeMetrics.averageProcessingTime} 
              max={1000}
              color="var(--secondary-color)"
            />
            <MetricBar 
              label="Success Rate %" 
              value={realtimeMetrics.successRate} 
              max={100}
              color="var(--success-color)"
            />
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Network Status</h3>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`}>
                <div className={`status-dot ${isConnected ? 'pulse' : ''}`} />
                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </div>
            </div>
            
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Active Relays:</span>
                <span style={{ fontWeight: '500' }}>{realtimeMetrics.activeConnections}/3</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>WebSocket Status:</span>
                <span style={{ 
                  fontWeight: '500', 
                  color: isConnected ? 'var(--success-color)' : 'var(--error-color)' 
                }}>
                  {isConnected ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Last Event:</span>
                <span style={{ fontWeight: '500' }}>
                  {lastMessage ? 'Just now' : 'Waiting...'}
                </span>
              </div>
            </div>

            {/* Relay Status */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Nostr Relays
              </div>
              {['relay.damus.io', 'nos.lol', 'relay.nostr.band'].map((relay, index) => (
                <div key={relay} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.25rem',
                  fontSize: '0.75rem'
                }}>
                  <span>{relay}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: isConnected ? 'var(--success-color)' : 'var(--error-color)'
                    }} />
                    <span style={{ 
                      color: isConnected ? 'var(--success-color)' : 'var(--error-color)',
                      fontWeight: '500'
                    }}>
                      {isConnected ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Status */}
      <div className="card">
        <h3 className="card-title">Feature Status</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginTop: '1rem'
        }}>
          {[
            { name: 'AI Claim Extraction', status: 'active', description: 'OpenAI GPT-4o-mini' },
            { name: 'Database Persistence', status: 'active', description: 'SQLite with Prisma' },
            { name: 'Lightning Zaps', status: 'mock', description: 'NIP-57 Integration' },
            { name: 'Real-time Updates', status: 'active', description: 'WebSocket Live Feed' },
            { name: 'News Verification', status: 'pending', description: 'NewsAPI Integration' },
            { name: 'Nostr Publishing', status: 'active', description: 'Score Broadcasting' }
          ].map((feature) => (
            <div key={feature.name} style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--gray-200)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 
                    feature.status === 'active' ? 'var(--success-color)' :
                    feature.status === 'mock' ? 'var(--warning-color)' : 'var(--error-color)'
                }} />
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{feature.name}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {feature.description}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: '500',
                color: 
                  feature.status === 'active' ? 'var(--success-color)' :
                  feature.status === 'mock' ? 'var(--warning-color)' : 'var(--error-color)',
                marginTop: '0.25rem',
                textTransform: 'uppercase'
              }}>
                {feature.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
