// frontend/src/components/VerificationForm.jsx
import React, { useState } from 'react';

const VerificationForm = ({ onVerify, loading }) => {
  const [input, setInput] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const exampleTexts = [
    {
      title: "Breaking News Example",
      content: "BREAKING: Bitcoin reaches new all-time high of $75,000 according to CoinDesk. The cryptocurrency market cap has surpassed $2 trillion for the first time in history.",
      category: "Financial News"
    },
    {
      title: "Technology Announcement",
      content: "Apple announced today that the new iPhone 16 will feature a revolutionary quantum processor that increases battery life by 300%. The device will be available starting next month.",
      category: "Tech News"
    },
    {
      title: "Scientific Discovery",
      content: "NASA scientists have discovered water on Mars using the Perseverance rover. The finding was published in Nature journal and confirms the presence of liquid water beneath the planet's surface.",
      category: "Science"
    },
    {
      title: "Political Statement",
      content: "The President announced a new climate initiative that will reduce carbon emissions by 50% over the next decade. The plan includes $2 trillion in green energy investments.",
      category: "Politics"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onVerify(input.trim());
    }
  };

  const handleExampleClick = (example) => {
    setInput(example.content);
    setShowExamples(false);
  };

  const clearInput = () => {
    setInput('');
  };

  return (
    <div className="verification-form">
      <div className="form-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          Verify Content Credibility
        </h2>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '1rem',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          Paste any text content to analyze its factual claims and get an AI-powered credibility assessment.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="content-input">
            Content to Verify
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              id="content-input"
              className="form-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a Nostr post, news article, or any text content here to verify its factual claims..."
              rows={6}
              style={{
                paddingRight: input ? '3rem' : '1rem'
              }}
            />
            {input && (
              <button
                type="button"
                onClick={clearInput}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'var(--gray-200)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: 'var(--text-muted)'
                }}
                title="Clear input"
              >
                ×
              </button>
            )}
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <span>{input.length} characters</span>
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textDecoration: 'underline'
              }}
            >
              {showExamples ? 'Hide examples' : 'Show examples'}
            </button>
          </div>
        </div>

        {showExamples && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--gray-200)'
          }}>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: 'var(--text-primary)'
            }}>
              Example Content to Test
            </h4>
            <div style={{ 
              display: 'grid', 
              gap: '0.75rem'
            }}>
              {exampleTexts.map((example, index) => (
                <div
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  style={{
                    padding: '0.75rem',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--gray-200)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-200)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {example.title}
                    </span>
                    <span style={{
                      fontSize: '0.625rem',
                      padding: '0.125rem 0.375rem',
                      background: 'var(--primary-color)',
                      color: 'white',
                      borderRadius: 'var(--radius-sm)',
                      textTransform: 'uppercase'
                    }}>
                      {example.category}
                    </span>
                  </div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {example.content.substring(0, 120)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
            style={{
              minWidth: '200px',
              fontSize: '1rem',
              padding: '0.875rem 2rem'
            }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                Analyzing Claims...
              </>
            ) : (
              'Verify Content'
            )}
          </button>
          
          {input && !loading && (
            <button
              type="button"
              onClick={clearInput}
              className="btn btn-secondary"
            >
              Clear
            </button>
          )}
        </div>

        {/* Processing Info */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--gray-200)'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: 'var(--text-primary)'
          }}>
            How Verification Works
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}>
            <div>• AI extracts factual claims</div>
            <div>• Cross-references news sources</div>
            <div>• Calculates credibility score</div>
            <div>• Rewards quality content</div>
          </div>

          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--gray-300)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <strong>Note:</strong> Full functionality requires OpenAI and NewsAPI keys.
            The system works with basic pattern matching when API keys are not configured.
          </div>
        </div>
      </form>
    </div>
  );
};

export default VerificationForm;
