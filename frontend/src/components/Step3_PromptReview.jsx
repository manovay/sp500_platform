import React, { useState, useEffect } from 'react';
import { getPromptData } from '../api';

export default function Step3_PromptReview({ info, onPromptReady, onBack }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!info || !info.ticker) return;
    setLoading(true);
    getPromptData(info.ticker).then(fullData => {
      const pretty = JSON.stringify(fullData, null, 2);
      setPrompt(pretty);
      setLoading(false);
    });
  }, [info]);

  if (loading) return <div>Loading…</div>;

  return (
    <div>
      <h2>Step 3: Review Prompt</h2>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        rows={15}
        style={{ width: '100%', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '1rem' }}
      />
      <div>
        <button onClick={onBack} style={{ marginRight: '1rem' }}>Back</button>
        <button onClick={() => onPromptReady(prompt)}>Send to LLM</button>
      </div>
    </div>
  );
} 