import React, { useState, useEffect } from 'react';
import { getAccountInfo, getPositions } from '../api';

const PortfolioSnapshot = () => {
  const [account, setAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('market_value');
  const [sortOrder, setSortOrder] = useState('desc');

  // Auto-refresh interval (30 seconds)
  const REFRESH_INTERVAL = 30000;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountData, positionsData] = await Promise.all([
        getAccountInfo(),
        getPositions()
      ]);
      setAccount(accountData);
      setPositions(positionsData);
      setFilteredPositions(positionsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch portfolio data');
      console.error('Error fetching portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh when market is open
    const interval = setInterval(() => {
      if (account?.market_open) {
        fetchData();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [account?.market_open]);

  // Filter and sort positions
  useEffect(() => {
    let filtered = positions.filter(pos => 
      pos.symbol.toLowerCase().includes(filter.toLowerCase())
    );

    // Sort positions
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'market_value':
          aValue = a.market_value;
          bValue = b.market_value;
          break;
        case 'unrealized_pl_pct':
          aValue = a.unrealized_pl_pct;
          bValue = b.unrealized_pl_pct;
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        default:
          aValue = a.market_value;
          bValue = b.market_value;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPositions(filtered);
  }, [positions, filter, sortBy, sortOrder]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPLColor = (value) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
  };

  const getPLPill = (value) => {
    if (value > 0) return 'pill-success';
    if (value < 0) return 'pill-danger';
    return 'pill';
  };

  if (loading && !account) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading portfolio data...
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
          <h1 className="card-title">Portfolio Snapshot</h1>
          {account?.market_open && (
            <div className="flex items-center gap-sm">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-sm text-success font-medium">Market Open - Auto-refreshing</span>
            </div>
          )}
          {!account?.market_open && (
            <div className="flex items-center gap-sm">
              <div className="w-2 h-2 bg-muted rounded-full"></div>
              <span className="text-sm text-muted font-medium">Market Closed</span>
            </div>
          )}
        </div>
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-4 mb-xl">
        <div className="card">
          <h4 className="text-muted mb-sm">Equity</h4>
          <div className="text-xl font-bold">{formatCurrency(account?.equity || 0)}</div>
        </div>
        <div className="card">
          <h4 className="text-muted mb-sm">Cash</h4>
          <div className="text-xl font-bold">{formatCurrency(account?.cash || 0)}</div>
        </div>
        <div className="card">
          <h4 className="text-muted mb-sm">Buying Power</h4>
          <div className="text-xl font-bold">{formatCurrency(account?.buying_power || 0)}</div>
        </div>
        <div className="card">
          <h4 className="text-muted mb-sm">Portfolio Value</h4>
          <div className="text-xl font-bold">{formatCurrency(account?.portfolio_value || 0)}</div>
        </div>
      </div>

      {/* Positions Table Controls */}
      <div className="card mb-lg">
        <div className="flex justify-between items-center mb-md">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Filter by symbol..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-md">
            <label className="text-sm font-medium">Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-32"
            >
              <option value="market_value">Market Value</option>
              <option value="unrealized_pl_pct">P&L %</option>
              <option value="symbol">Symbol</option>
            </select>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn btn-sm"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Positions Table */}
        <div className="overflow-x-auto">
          <table className="table table-compact w-full">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Market Value</th>
                <th>Avg Price</th>
                <th>Current Price</th>
                <th>Unrealized P/L</th>
                <th>Unrealized %</th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.map((position) => (
                <tr key={position.symbol}>
                  <td className="font-semibold">{position.symbol}</td>
                  <td>{position.qty.toLocaleString()}</td>
                  <td className="font-medium">{formatCurrency(position.market_value)}</td>
                  <td>{formatCurrency(position.avg_price)}</td>
                  <td>{formatCurrency(position.current_price)}</td>
                  <td className={getPLColor(position.unrealized_pl)}>
                    {formatCurrency(position.unrealized_pl)}
                  </td>
                  <td>
                    <span className={`pill ${getPLPill(position.unrealized_pl_pct)}`}>
                      {formatPercentage(position.unrealized_pl_pct)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPositions.length === 0 && (
            <div className="text-center py-xl text-muted">
              {filter ? 'No positions match your filter' : 'No positions found'}
            </div>
          )}
        </div>
      </div>

      {/* Last Updated */}
      {account?.last_updated && (
        <div className="text-center text-sm text-muted">
          Last updated: {new Date(account.last_updated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default PortfolioSnapshot;

