// frontend/src/components/VerificationResults.jsx
import React, { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const VerificationResults = ({ scores }) => {
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [sortBy, setSortBy] = useState('timestamp'); // timestamp, score, claims

  const toggleExpanded = (timestamp) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(timestamp)) {
      newExpanded.delete(timestamp);
    } else {
      newExpanded.add(timestamp);
    }
    setExpandedCards(newExpanded);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success-color)';
    if (score >= 60) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'High Credibility';
    if (score >= 60) return 'Medium Credibility';
    if (score >= 40) return 'Low Credibility';
    return 'Very Low Credibility';
  };

  const getConfidenceIcon = (confidence) => {
    switch (confidence) {
      case 'high': return '🎯';
      case 'medium': return '🔍';
      case 'low': return '⚠️';
      default: return '❓';
    }
  };

  const sortedScores = React.useMemo(() => {
    return [...scores].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'claims':
          return (b.verificationResults?.length || 0) - (a.verificationResults?.length || 0);
        case 'timestamp':
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });
  }, [scores, sortBy]);

  if (scores.length === 0) {
    return (
      <div className="empty-state">
        <h3 className="empty-state-title">No Verification Results Yet</h3>
        <p className="empty-state-description">
          Start by verifying some content in the "Verify Content" tab, or wait for real-time Nostr events to be processed automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="verification-results">
      <div className="section-header">
        <h2 className="section-title">Verification Results ({scores.length})</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--gray-300)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          >
            <option value="timestamp">Latest First</option>
            <option value="score">Highest Score</option>
            <option value="claims">Most Claims</option>
          </select>

          {scores.length > 0 && (
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              padding: '0.25rem 0.5rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)'
            }}>
              Most recent verification appears at the top
            </div>
          )}
        </div>
      </div>

      <div className="results-grid">
        {sortedScores.map((result, index) => {
          const isExpanded = expandedCards.has(result.timestamp);
          const scoreColor = getScoreColor(result.score);
          const isLatest = index === 0 && sortBy === 'timestamp';

          return (
            <div
              key={result.timestamp}
              className="result-card animate-fade-in"
              style={{
                border: isLatest ? '2px solid var(--primary-color)' : '1px solid var(--gray-200)',
                position: 'relative'
              }}
            >
              {isLatest && (
                <div style={{
                  position: 'absolute',
                  top: '-1px',
                  right: '1rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  Latest
                </div>
              )}
              <div className="result-header">
                <div style={{ flex: 1 }}>
                  <div className="result-content">
                    {result.content.length > 200 
                      ? `${result.content.substring(0, 200)}...` 
                      : result.content
                    }
                  </div>
                  
                  <div className="result-meta">
                    <span>{dayjs(result.timestamp).fromNow()}</span>
                    <span>{result.verificationResults?.length || 0} claims</span>
                    {result.metadata?.method && (
                      <span>{result.metadata.method === 'ai' ? 'AI Analysis' : 'Pattern Matching'}</span>
                    )}
                    {result.metadata?.processingTime && (
                      <span>{result.metadata.processingTime}ms</span>
                    )}
                  </div>
                </div>

                <div className="result-score">
                  <div 
                    className="score-value"
                    style={{ color: scoreColor }}
                  >
                    {result.score}/100
                  </div>
                  <div className="score-label" style={{ color: scoreColor }}>
                    {getScoreLabel(result.score)}
                  </div>
                  
                  {result.metadata?.zap && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: 'linear-gradient(135deg, var(--warning-color), var(--secondary-dark))',
                      color: 'white',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textAlign: 'center'
                    }}>
                      {result.metadata.zap.amount_sats} sats earned
                    </div>
                  )}
                </div>
              </div>

              {result.verificationResults && result.verificationResults.length > 0 && (
                <div className="claims-section">
                  <button
                    className="claims-summary"
                    onClick={() => toggleExpanded(result.timestamp)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>
                      {isExpanded ? '▼' : '▶'} View {result.verificationResults.length} Claims
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Click to {isExpanded ? 'collapse' : 'expand'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="claims-list animate-fade-in">
                      {result.verificationResults.map((claim, index) => (
                        <div key={index} className="claim-item">
                          <div className="claim-text">{claim.claim}</div>
                          
                          <div className="claim-meta">
                            <span className={`score-badge ${
                              claim.credibility >= 70 ? 'score-high' : 
                              claim.credibility >= 40 ? 'score-medium' : 'score-low'
                            }`}>
                              {claim.credibility}%
                            </span>
                            
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)'
                            }}>
                              {getConfidenceIcon(claim.confidence)}
                              {claim.confidence} confidence
                            </span>
                            
                            {claim.sources && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                📰 {claim.sources.length} sources
                              </span>
                            )}
                          </div>

                          {claim.error && (
                            <div style={{
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              color: 'var(--error-color)'
                            }}>
                              ⚠️ {claim.error}
                            </div>
                          )}

                          {claim.sources && claim.sources.length > 0 && (
                            <div className="claim-sources">
                              <div style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '500', 
                                marginBottom: '0.5rem',
                                color: 'var(--text-primary)'
                              }}>
                                Supporting Sources:
                              </div>
                              <ul className="source-list">
                                {claim.sources.map((source, sourceIndex) => (
                                  <li key={sourceIndex} className="source-item">
                                    <a 
                                      href={source.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="source-link"
                                    >
                                      {source.title}
                                    </a>
                                    <span className="source-name">- {source.source}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Processing Metadata */}
              {result.metadata && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {result.metadata.method && (
                      <span>Method: {result.metadata.method}</span>
                    )}
                    {result.metadata.processingTime && (
                      <span>Processing: {result.metadata.processingTime}ms</span>
                    )}
                    {result.metadata.cacheHits !== undefined && (
                      <span>Cache hits: {result.metadata.cacheHits}</span>
                    )}
                    {result.metadata.verificationErrors !== undefined && result.metadata.verificationErrors > 0 && (
                      <span style={{ color: 'var(--error-color)' }}>
                        Errors: {result.metadata.verificationErrors}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Session Summary
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
              {scores.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total Verifications
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-color)' }}>
              {scores.reduce((sum, s) => sum + (s.verificationResults?.length || 0), 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Claims Analyzed
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--secondary-color)' }}>
              {Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) || 0}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Average Score
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning-color)' }}>
              {scores.filter(s => s.metadata?.zap).length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Zaps Earned
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationResults;
