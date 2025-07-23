import React, { useEffect, useState } from 'react';
import { getStockInfo } from '../api';

export default function Step2_ShowInfo({ stock, onInfoLoaded, onBack }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stock) return;
    setLoading(true);
    getStockInfo(stock.ticker).then(data => {
      setInfo(data);
      setLoading(false);
    });
  }, [stock]);

  if (loading || !info) return <div>Loading…</div>;

  return (
    <div>
      <h2>Step 2: Stock Info</h2>
      <p><strong>Ticker:</strong> {info.ticker}</p>
      <p><strong>Name:</strong> {info.company_name}</p>
      <p><strong>Sector:</strong> {info.sector}</p>
      {info.profile && (
        <div style={{ margin: '1rem 0', textAlign: 'left', background: '#23232a', borderRadius: 8, padding: '1rem' }}>
          <strong>Profile:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#a1a1aa', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(info.profile, null, 2)}</pre>
        </div>
      )}
      <button onClick={onBack} style={{ marginTop: '1rem', marginRight: '1rem' }}>Back</button>
      <button onClick={() => onInfoLoaded(info)} style={{ marginTop: '1rem' }}>Next</button>
    </div>
  );
} 