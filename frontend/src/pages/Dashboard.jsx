import React from 'react';
import { useDataCache } from '../hooks/useDataCache';
import { getPortfolio } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadPortfolio = async () => {
    setLoading(true);
    const res = await getPortfolio();
    setData(res.allocations);
    setLoading(false);
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  if (!data) return <div>Loading…</div>;

  return (
    <div>
      <h1>Portfolio Dashboard <span style={{fontSize: '0.5em', color: '#888'}}>(Live Data)</span></h1>
      <button onClick={loadPortfolio} disabled={loading} style={{marginBottom: '1rem'}}>
        {loading ? 'Reloading…' : 'Reload Portfolio Data'}
      </button>
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
              <td>{row.current?.toFixed(2)}%</td>
              <td>{row.recommended?.toFixed(2)}%</td>
              <td>{(row.recommended - row.current).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
