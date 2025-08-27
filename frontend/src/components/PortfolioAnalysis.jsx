import { useState, useEffect } from 'react';

export default function PortfolioAnalysis() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPortfolioAnalysis();
  }, []);

  const fetchPortfolioAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/portfolio-analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio analysis');
      }
      const data = await response.json();
      setPortfolioData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getDifferenceColor = (difference) => {
    if (difference > 0) return 'text-success';
    if (difference < 0) return 'text-danger';
    return 'text-muted';
  };

  const getDifferenceIcon = (difference) => {
    if (difference > 0) return '↗';
    if (difference < 0) return '↘';
    return '→';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading portfolio analysis...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h3>Error Loading Portfolio Analysis</h3>
        <p>{error}</p>
        <button onClick={fetchPortfolioAnalysis} className="btn btn-primary mt-md">
          Retry
        </button>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="text-center py-xl">
        <h3>No Portfolio Data Available</h3>
        <p className="text-muted">Unable to load portfolio analysis data.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card mb-lg">
        <div className="card-header">
          <h1 className="card-title">Portfolio Analysis</h1>
          <p className="text-muted mb-0">Top 10 Allocation Differences: FMP vs LLM Recommendations</p>
        </div>
        <div className="card-body">
          <button onClick={fetchPortfolioAnalysis} className="btn btn-sm">
            ↻ Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-3 mb-xl">
        <div className="card">
          <h4 className="text-muted mb-sm">FMP Allocation (TOP 10)</h4>
          <div className="text-xl font-bold">{(portfolioData.summary.total_fmp_allocation * 100).toFixed(2)}%</div>
        </div>
        <div className="card">
          <h4 className="text-muted mb-sm">LLM Allocation (TOP 10)</h4>
          <div className="text-xl font-bold">{(portfolioData.summary.total_llm_allocation * 100).toFixed(2)}%</div>
        </div>
        <div className="card">
          <h4 className="text-muted mb-sm">Total Difference</h4>
          <div className={`text-xl font-bold ${getDifferenceColor(portfolioData.summary.total_difference)}`}>
            {getDifferenceIcon(portfolioData.summary.total_difference)} {(portfolioData.summary.total_difference * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="card mb-lg">
        <div className="overflow-x-auto">
          <table className="table table-compact w-full">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Ticker</th>
                <th>Company</th>
                <th>Sector</th>
                <th>FMP Allocation</th>
                <th>LLM Allocation</th>
                <th>Difference</th>
                <th>% Diff</th>
                <th>FMP Date</th>
                <th>LLM Date</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.top_positions.map((position) => (
                <tr key={position.ticker}>
                  <td>
                    <span className="pill pill-primary">#{position.rank}</span>
                  </td>
                                     <td>
                     <span className={`font-semibold pill ${getDifferenceColor(position.allocation_difference) === 'text-success' ? 'pill-success' : getDifferenceColor(position.allocation_difference) === 'text-danger' ? 'pill-danger' : 'pill'}`}>
                       {position.ticker}
                     </span>
                   </td>
                  <td>{position.company_name}</td>
                  <td>{position.sector}</td>
                  <td>{(position.fmp_allocation_pct * 100).toFixed(4)}%</td>
                  <td>{(position.llm_allocation_pct * 100).toFixed(4)}%</td>
                  <td className={getDifferenceColor(position.allocation_difference)}>
                    {(position.allocation_difference * 100).toFixed(4)}%
                  </td>
                  <td className={getDifferenceColor(position.percentage_diff)}>
                    {position.percentage_diff > 0 ? '+' : ''}{position.percentage_diff.toFixed(2)}%
                  </td>
                  <td className="text-sm text-muted">
                    {position.allocation_date ? new Date(position.allocation_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="text-sm text-muted">
                    {position.llm_date ? new Date(position.llm_date).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h4 className="mb-md">Legend</h4>
        <div className="flex gap-lg flex-wrap">
          <div className="flex items-center gap-sm">
            <span className="pill pill-success font-semibold">AAPL</span>
            <span className="text-sm font-medium">LLM recommends higher allocation than FMP</span>
          </div>
          <div className="flex items-center gap-sm">
            <span className="pill pill-danger font-semibold">MSFT</span>
            <span className="text-sm font-medium">LLM recommends lower allocation than FMP</span>
          </div>
          <div className="flex items-center gap-sm">
            <span className="pill font-semibold">GOOGL</span>
            <span className="text-sm font-medium">No difference in recommendations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
