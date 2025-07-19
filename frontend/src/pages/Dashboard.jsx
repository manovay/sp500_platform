import React, { useEffect, useState } from 'react';
import { getPortfolio } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getPortfolio().then(res => setData(res.allocations));
  }, []);

  if (!data) return <div>Loading…</div>;

  return (
    <div>
      <h1>Portfolio Dashboard</h1>

      <BarChart width={600} height={300} data={data}>
        <XAxis dataKey="ticker" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="recommended" name="Recommended %" />
        <Bar dataKey="current" name="Current %" />
      </BarChart>

      <table border="1" cellPadding="8" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Current</th>
            <th>Recommended</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.ticker}>
              <td>
                <Link to={`/details/${row.ticker}`}>{row.ticker}</Link>
              </td>
              <td>{row.current}%</td>
              <td>{row.recommended}%</td>
              <td>{(row.recommended - row.current).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
