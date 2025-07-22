import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTickerDetails } from '../api';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function Details() {
  const { ticker } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    const res = await getTickerDetails(ticker);
    setInfo(res);
    setLoading(false);
  };

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line
  }, [ticker]);

  if (!info) return <div>Loading…</div>;

  return (
    <div>
      <Link to="/">← Back to Dashboard</Link>
      <h1>Details for {info.ticker} <span style={{fontSize: '0.5em', color: '#888'}}>(Live Data)</span></h1>
      <button onClick={loadDetails} disabled={loading} style={{marginBottom: '1rem'}}>
        {loading ? 'Reloading…' : 'Reload Ticker Data'}
      </button>
      <LineChart width={600} height={300} data={info.history}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" name="Allocation %" />
      </LineChart>
      <div style={{ marginTop: '1rem' }}>
        <p>PE Ratio: {info.metrics?.pe ?? 'N/A'}</p>
        <p>Sentiment Score: {info.metrics?.sentiment ?? 'N/A'}</p>
      </div>
    </div>
  );
}
