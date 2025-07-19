import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTickerDetails } from '../api';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function Details() {
  const { ticker } = useParams();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    getTickerDetails(ticker).then(setInfo);
  }, [ticker]);

  if (!info) return <div>Loading…</div>;

  return (
    <div>
      <Link to="/">← Back to Dashboard</Link>
      <h1>Details for {info.ticker}</h1>

      <LineChart width={600} height={300} data={info.history}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" name="Allocation %" />
      </LineChart>

      <div style={{ marginTop: '1rem' }}>
        <p>PE Ratio: {info.metrics.pe}</p>
        <p>Sentiment Score: {info.metrics.sentiment}</p>
      </div>
    </div>
  );
}
