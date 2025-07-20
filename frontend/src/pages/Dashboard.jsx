import React from 'react';
import { useDataCache } from '../hooks/useDataCache';
import { getPortfolio } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { 
    data, 
    loading, 
    error, 
    lastUpdated, 
    refreshData 
  } = useDataCache('portfolio', getPortfolio);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <div>Loading Portfolio Data...</div>
          {lastUpdated && (
            <div style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        color: '#ef4444'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <div>Error: {error}</div>
          <button 
            onClick={refreshData}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1>Portfolio Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {lastUpdated && (
            <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <button 
            onClick={refreshData}
            style={{
              padding: '0.5rem 1rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {data && data.allocations && (
        <>
          <BarChart width={600} height={300} data={data.allocations}>
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
              {data.allocations.map(row => (
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
        </>
      )}
    </div>
  );
}
