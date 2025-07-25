import React, { useEffect, useState } from 'react';

// Dummy LLM query (replace with real API call)
const queryLLM = async (prompt) => {
  if (!prompt) return '';
  return `LLM Response for prompt: "${prompt}"`;
};

export default function Step4_ShowResult({ prompt, onResult, result, onBack, onReset, stock }) {
  const [loading, setLoading] = useState(false);
  const [localResult, setLocalResult] = useState(result);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmResponse, setLlmResponse] = useState(null);

  useEffect(() => {
    if (!prompt || result) return;
    setLoading(true);
    queryLLM(prompt).then(res => {
      setLocalResult(res);
      onResult(res);
      setLoading(false);
    });
    // eslint-disable-next-line
  }, [prompt]);

  const handleLlmVerdict = async () => {
    setLlmLoading(true);
    setLlmResponse(null);
    try {
      const resp = await fetch(`/api/stocks/${stock.ticker}/llm-verdict`, { method: 'POST' });
      const data = await resp.json();
      setLlmResponse(data.llm_response);
    } catch (e) {
      setLlmResponse({ error: e.message });
    }
    setLlmLoading(false);
  };

  return (
    <div>
      <h2>Step 4: LLM Result</h2>
      {loading ? <div>Loading…</div> : <pre style={{ background: '#222', padding: '1rem', borderRadius: '8px' }}>{localResult}</pre>}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={onBack} style={{ marginRight: '1rem' }}>Back</button>
        <button onClick={onReset}>Start Over</button>
        {stock && localResult && (
          <button onClick={handleLlmVerdict} style={{ marginLeft: '1rem' }} disabled={llmLoading}>
            {llmLoading ? 'Getting LLM Verdict…' : 'Get LLM Verdict'}
          </button>
        )}
      </div>
      {llmResponse && (
        <div style={{ marginTop: '2rem', textAlign: 'left' }}>
          <h3>LLM Verdict:</h3>
          <pre style={{ background: '#23232a', color: '#a1a1aa', padding: '1rem', borderRadius: 8 }}>
            {typeof llmResponse === 'string' ? llmResponse : JSON.stringify(llmResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 