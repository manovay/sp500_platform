import React, { useEffect, useState } from 'react';

// Dummy LLM query (replace with real API call)
const queryLLM = async (prompt) => {
  if (!prompt) return '';
  return `LLM Response for prompt: "${prompt}"`;
};

export default function Step4_ShowResult({ prompt, onResult, result, onBack, onReset }) {
  const [loading, setLoading] = useState(false);
  const [localResult, setLocalResult] = useState(result);

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

  return (
    <div>
      <h2>Step 4: LLM Result</h2>
      {loading ? <div>Loading…</div> : <pre style={{ background: '#222', padding: '1rem', borderRadius: '8px' }}>{localResult}</pre>}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={onBack} style={{ marginRight: '1rem' }}>Back</button>
        <button onClick={onReset}>Start Over</button>
      </div>
    </div>
  );
} 