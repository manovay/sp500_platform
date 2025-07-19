import React, { useState } from 'react';

export default function Admin() {
  const [logs, setLogs] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL || '';

  const runFetch = async (freq) => {
    setLogs(`Running ${freq}…\n`);
    try {
      const token = localStorage.getItem('ADMIN_TOKEN') || '';
      const res = await fetch(`${apiUrl}/api/run-fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token,
        },
        body: JSON.stringify({ freq }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setLogs(prev => prev + data.log);
      } else {
        setLogs(prev => prev + `Error: ${data.error}\n`);
      }
    } catch (err) {
      setLogs(prev => prev + `Fetch error: ${err}\n`);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Admin Fetch Triggers</h1>
      <div style={{ margin: '1rem 0' }}>
        {['daily', 'weekly', 'quarterly', 'annual'].map(freq => (
          <button
            key={freq}
            onClick={() => runFetch(freq)}
            style={{ marginRight: '0.5rem' }}
          >
            Run {freq.charAt(0).toUpperCase() + freq.slice(1)}
          </button>
        ))}
      </div>
      <pre style={{
        whiteSpace: 'pre-wrap',
        background: '#f8f8f8',
        padding: '1rem',
        border: '1px solid #ddd'
      }}>
        {logs}
      </pre>
    </div>
  );
}
