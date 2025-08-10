// frontend/src/App.jsx
import { useEffect, useState } from 'react';
import { fetchScores, verifyText } from './api/api.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import Header from './components/Header.jsx';
import Dashboard from './components/Dashboard.jsx';
import VerificationForm from './components/VerificationForm.jsx';
import VerificationResults from './components/VerificationResults.jsx';
import Notifications from './components/Notifications.jsx';
import RealTimeActivity from './components/RealTimeActivity.jsx';
import './App.css';

function App() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('verify'); // verify, results, dashboard, activity

  // WebSocket integration
  const {
    isConnected,
    connectionError,
    lastMessage,
    notifications,
    dismissNotification
  } = useWebSocket();

  useEffect(() => {
    fetchScores().then(data => {
      if (data && data.scores) {
        setScores(data.scores);
      }
    });

    // Fetch initial stats
    fetch('http://localhost:4000/')
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error);
  }, []);

  // Update scores when new verification results come through WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'verification_result') {
      setScores(prev => [lastMessage.data, ...prev.slice(0, 19)]); // Keep only 20 scores
    }
  }, [lastMessage]);

  const handleVerify = async (content) => {
    setLoading(true);
    try {
      const result = await verifyText(content);
      setScores(prev => [result, ...prev]);
      // Switch to results tab after verification and scroll to top
      setActiveTab('results');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Verification failed:', error);
      // Could add user notification here
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem'
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="app">
      {/* Real-time notifications */}
      <Notifications
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <div className="app-container">
        {/* Header */}
        <Header
          isConnected={isConnected}
          connectionError={connectionError}
          stats={stats}
        />

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1rem',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow-sm)',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <TabButton
            id="verify"
            label="Verify Content"
            icon=""
            isActive={activeTab === 'verify'}
            onClick={setActiveTab}
          />
          <TabButton
            id="results"
            label={`Results ${scores.length > 0 ? `(${scores.length})` : ''}`}
            icon=""
            isActive={activeTab === 'results'}
            onClick={setActiveTab}
          />
          <TabButton
            id="dashboard"
            label="Dashboard"
            icon=""
            isActive={activeTab === 'dashboard'}
            onClick={setActiveTab}
          />
          <TabButton
            id="activity"
            label="Live Activity"
            icon=""
            isActive={activeTab === 'activity'}
            onClick={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'verify' && (
            <div className="animate-fade-in">
              <VerificationForm
                onVerify={handleVerify}
                loading={loading}
              />
            </div>
          )}

          {activeTab === 'results' && (
            <div className="animate-fade-in">
              <VerificationResults scores={scores} />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <Dashboard
                stats={stats}
                isConnected={isConnected}
                lastMessage={lastMessage}
              />
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="animate-fade-in">
              <RealTimeActivity
                lastMessage={lastMessage}
                isConnected={isConnected}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: '4rem',
          padding: '2rem 0',
          borderTop: '1px solid var(--gray-200)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.875rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong>NostrOracle</strong> - AI-Powered Content Verification for Nostr
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <span>OpenAI GPT-4o-mini</span>
            <span>Lightning Network</span>
            <span>Real-time WebSocket</span>
            <span>Database Persistence</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
export default App;