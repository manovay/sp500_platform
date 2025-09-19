import React, { useState, useEffect } from 'react';
import { getHistory, getOrderHistory } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const History = () => {
  const [historyData, setHistoryData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('ytd');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [history, ordersData] = await Promise.all([
        getHistory(timeframe),
        getOrderHistory()
      ]);
             console.log('History data received:', history);
       console.log('History array:', history?.history);
       console.log('History array length:', history?.history?.length);
       console.log('Debug info:', history?.debug);
       console.log('First data point:', history?.history?.[0]);
       console.log('Last data point:', history?.history?.[history?.history?.length - 1]);
      setHistoryData(history);
      setOrders(ordersData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch history data');
      console.error('Error fetching history data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPLColor = (value) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'filled':
        return 'text-success';
      case 'cancelled':
        return 'text-danger';
      case 'pending':
        return 'text-muted';
      default:
        return 'text-muted';
    }
  };

  const getSideColor = (side) => {
    return side.toLowerCase() === 'buy' ? 'text-success' : 'text-danger';
  };

  // Calculate timeframe-specific KPIs from chart data
  const calculateTimeframeKPIs = () => {
    if (!historyData?.history || historyData.history.length === 0) {
      return null;
    }

    const history = historyData.history;
    const startEquity = history[0].equity;
    const currentEquity = history[history.length - 1].equity;
    const pl = currentEquity - startEquity;
    const returnPercent = (pl / startEquity) * 100;

    return {
      start_equity: startEquity,
      current_equity: currentEquity,
      pl: pl,
      return_percent: returnPercent
    };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="card" style={{ padding: 'var(--space-sm)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-medium mb-xs">{formatDate(label)}</p>
          <p className="text-sm">
            Equity: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading && !historyData) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading history data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        {error}
        <button onClick={fetchData} className="btn btn-primary mt-md">Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="card mb-lg">
        <div className="card-header">
          <h1 className="card-title">Portfolio History</h1>
          <div className="segmented-control">
            <button 
              className={timeframe === 'ytd' ? 'active' : ''}
              onClick={() => setTimeframe('ytd')}
            >
              YTD
            </button>
            <button 
              className={timeframe === '3m' ? 'active' : ''}
              onClick={() => setTimeframe('3m')}
            >
              3M
            </button>
            <button 
              className={timeframe === '1m' ? 'active' : ''}
              onClick={() => setTimeframe('1m')}
            >
              1M
            </button>
            <button 
              className={timeframe === '1w' ? 'active' : ''}
              onClick={() => setTimeframe('1w')}
            >
              1W
            </button>
          </div>
        </div>
      </div>

      {/* Equity Chart */}
      <div className="card mb-lg">
        <h2 className="mb-lg">Equity Performance</h2>
        {historyData?.history && historyData.history.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historyData.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              stroke="var(--muted)"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              minTickGap={50}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              domain={['dataMin - 1000', 'dataMax + 1000']}
              stroke="var(--muted)"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              width={80}
            />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="equity" 
                stroke="var(--primary)" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: 'var(--primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
                 ) : (
           <div className="text-center py-xl">
             <p className="text-muted">No chart data available</p>
             <p className="text-sm text-muted">History data: {JSON.stringify(historyData?.history)}</p>
             
             {/* Simple fallback chart with just current equity */}
             {historyData?.debug && (
               <div className="mt-md">
                 <h4 className="text-sm font-medium mb-sm">Simple Chart (Current Equity Only):</h4>
                 <div className="bg-light border rounded p-md">
                   <div className="text-2xl font-bold text-primary">
                     ${historyData.debug.real_current_equity?.toFixed(2)}
                   </div>
                   <p className="text-sm text-muted">Current Portfolio Value</p>
                 </div>
               </div>
             )}
             
             {historyData?.debug && (
               <div className="mt-md p-md bg-light border rounded">
                 <h4 className="text-sm font-medium mb-sm">Debug Info:</h4>
                 <div className="text-xs text-muted">
                   <p>Account Created: {historyData.debug.account_created}</p>
                   <p>Current Cash: ${historyData.debug.current_cash?.toFixed(2)}</p>
                   <p>Current Equity: ${historyData.debug.current_equity?.toFixed(2)}</p>
                   <p>Start Equity: ${historyData.debug.start_equity?.toFixed(2)}</p>
                   <p>End Equity: ${historyData.debug.end_equity?.toFixed(2)}</p>
                   <p>Real Current Equity: ${historyData.debug.real_current_equity?.toFixed(2)}</p>
                   <p>Start Date: {historyData.debug.start_date}</p>
                   <p>End Date: {historyData.debug.end_date}</p>
                   <p>Data Points: {historyData.debug.data_points}</p>
                 </div>
               </div>
             )}
           </div>
         )}
      </div>

      {/* KPI Row */}
      {historyData?.history && historyData.history.length > 0 && (() => {
        const timeframeKPIs = calculateTimeframeKPIs();
        return timeframeKPIs ? (
          <div className="grid grid-4 mb-xl">
            <div className="card">
              <h4 className="text-muted mb-sm">Start Equity</h4>
              <div className="text-xl font-bold">{formatCurrency(timeframeKPIs.start_equity)}</div>
            </div>
            <div className="card">
              <h4 className="text-muted mb-sm">Current Equity</h4>
              <div className="text-xl font-bold">{formatCurrency(timeframeKPIs.current_equity)}</div>
            </div>
            <div className="card">
              <h4 className="text-muted mb-sm">P&L</h4>
              <div className={`text-xl font-bold ${getPLColor(timeframeKPIs.pl)}`}>
                {formatCurrency(timeframeKPIs.pl)}
              </div>
            </div>
            <div className="card">
              <h4 className="text-muted mb-sm">Return</h4>
              <div className={`text-xl font-bold ${getPLColor(timeframeKPIs.return_percent)}`}>
                {formatPercentage(timeframeKPIs.return_percent)}
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Tabs */}
      <div className="card">
        <div className="tabs mb-lg">
                     <ul className="tab-list">
             <li 
               className={`tab-item active`}
             >
               Orders
             </li>
           </ul>
        </div>

        <div className="tab-content">
          <div>
            {orders.length > 0 && (
              <p className="text-sm text-muted mb-md">
                Showing top 5 orders by notional value (largest trades first)
              </p>
            )}
            <div className="table-container">
              <table className="table table-compact w-full">
                                <thead>
                <tr>
                                       <th>Status</th>
                   <th>Symbol</th>
                   <th>Side</th>
                   <th>QTY</th>
                   <th>Notional</th>
                </tr>
              </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                                               <td>
                         <span className={`pill ${getStatusColor(order.status) === 'text-success' ? 'pill-success' : getStatusColor(order.status) === 'text-danger' ? 'pill-danger' : 'pill'}`}>
                           {order.status.toUpperCase()}
                         </span>
                       </td>
                       <td className="font-semibold">{order.symbol}</td>
                       <td>
                         <span className={`pill ${getSideColor(order.side) === 'text-success' ? 'pill-success' : 'pill-danger'}`}>
                           {order.side.toUpperCase()}
                         </span>
                       </td>
                                            <td>{order.qty.toFixed(4) === '0.0000' ? 'FRACTIONAL' : order.qty.toFixed(4)}</td>
                    <td>{formatCurrency(order.notional)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
