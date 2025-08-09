// frontend/src/App.jsx
import { useEffect, useState } from 'react';
import { fetchScores, verifyText } from './api/api.js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

function App() {
  const [scores, setScores] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchScores().then(setScores); }, []);

  const handleVerify = async () => {
    setLoading(true);
    const res = await verifyText(input);
    setScores(prev => [res, ...prev]);
    setInput('');
    setLoading(false);
  };

  return (
    <div className="App">
      <h1>NostrOracle Demo</h1>
      <textarea
        rows="3"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Paste a Nostr post here…"
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? 'Verifying…' : 'Verify'}
      </button>

      <h2>Latest Scores</h2>
      {scores.map(s => (
        <div key={s.timestamp} className="card">
          <p>{s.content.slice(0, 120)}…</p>
          <strong>Score: {s.score}</strong> ·{' '}
          <span>{dayjs(s.timestamp).fromNow()}</span>
          <details>
            {s.verificationResults.map(r => (
              <div key={r.claim}>
                <p>Claim: {r.claim}</p>
                <ul>
                  {r.sources.map(src => (
                    <li key={src.url}>
                      <a href={src.url} target="_blank" rel="noreferrer">
                        {src.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </details>
        </div>
      ))}
    </div>
  );
}
export default App;