import { useState, useEffect } from 'react';
import { getPerformanceSummary, getTreasuryRate } from '../api';

export default function StatisticalAnalysisPage() {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [treasuryRate, setTreasuryRate] = useState(null);
  const [chartTab, setChartTab] = useState('days'); // 'days' or 'weeks'

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load treasury rate and performance data
      const [treasuryData, summary] = await Promise.all([
        getTreasuryRate(),
        getPerformanceSummary({ 
          // Always use full history - backend will calculate from 8-25-2025
          // rf_annual will be fetched automatically by backend
        })
      ]);
      
      setTreasuryRate(treasuryData);
      setPerformanceData(summary);
    } catch (err) {
      console.error('Error loading performance data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value, decimals = 2, sign = false) => {
    if (value === null || value === undefined || isNaN(value)) return '—';
    const formatted = `${(value * 100).toFixed(decimals)}%`;
    return sign && value >= 0 ? `+${formatted}` : formatted;
  };

  const formatNumber = (value, decimals = 4, sign = false) => {
    if (value === null || value === undefined || isNaN(value)) return '—';
    const formatted = value.toFixed(decimals);
    return sign && value >= 0 ? `+${formatted}` : formatted;
  };

  if (loading) {
    return (
      <div className="performance-report">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading performance statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="performance-report">
        <div className="error-message">
          <h2>Error Loading Performance Data</h2>
          <p>{error}</p>
          <button onClick={loadPerformanceData} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="performance-report">
        <div className="error-message">
          <h2>No Performance Data Available</h2>
          <p>Unable to load performance statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="card mb-lg">
        <div className="card-header">
          <h1 className="card-title">OracleZero Statistical Analysis</h1>
          <div className="disclaimer" style={{ marginTop: 'var(--space-md)' }}>
            <p><strong>⚠️ Disclaimer:</strong> This model has only been running since August 25, 2025. Results are based on limited historical data and should not be considered indicative of long-term performance.</p>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="card mb-lg">
        <div className="chart-tabs">
          <button 
            className={`chart-tab ${chartTab === 'days' ? 'active' : ''}`}
            onClick={() => setChartTab('days')}
          >
            Last 7 Days
          </button>
          <button 
            className={`chart-tab ${chartTab === 'weeks' ? 'active' : ''}`}
            onClick={() => setChartTab('weeks')}
          >
            Last 4 Weeks
          </button>
        </div>
        
        <div className="chart-content">
          {chartTab === 'days' ? (
            <div className="performance-chart daily-chart">
              <h2 className="text-center">Daily Performance vs SPY</h2>
              <div className="chart-y-axis">
                <div className="y-axis-label">1%</div>
                <div className="y-axis-label">0.5%</div>
                <div className="y-axis-label">0%</div>
                <div className="y-axis-label">-0.5%</div>
                <div className="y-axis-label">-1%</div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color oz-color"></div>
                  <span>OracleZero</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color spy-color"></div>
                  <span>SPY</span>
                </div>
              </div>
              <div className="line-chart">
                <svg className="chart-svg" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(55, 65, 81, 0.75)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Zero line */}
                  <line x1="100" y1="400" x2="900" y2="400" stroke="var(--border)" strokeWidth="4"/>
                  
                  {/* Performance lines */}
                  {(() => {
                    // Get the last 7 days of data, but filter out weekends (Saturday=6, Sunday=0)
                    const tradingDays = performanceData?.recent_performance?.last_10_days?.slice(-7).filter(day => {
                      const date = new Date(day.date);
                      const dayOfWeek = date.getDay();
                      return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
                    }) || [];
                    
                    if (tradingDays.length === 0) {
                      return <text x="400" y="200" textAnchor="middle" fill="var(--muted)">No data available</text>;
                    }
                    
                    // Debug: Log the data we're working with
                    console.log('Chart data:', {
                      originalDaysCount: performanceData?.recent_performance?.last_10_days?.slice(-7).length || 0,
                      tradingDaysCount: tradingDays.length,
                      sampleDay: tradingDays[0],
                      allTradingDays: tradingDays
                    });
                    
                    
                    const points = tradingDays.map((day, index) => {
                      // Handle division by zero when there's only one point
                      // Use smaller range to ensure points fit within chart bounds
                      const x = tradingDays.length === 1 ? 500 : (index / (tradingDays.length - 1)) * 800 + 100;
                      // Scale returns to fit the chart better (multiply by 20000 for better visibility)
                      // Ensure we have valid numbers
                      const portfolioReturn = typeof day.portfolio_return === 'number' ? day.portfolio_return : 0;
                      const benchmarkReturn = typeof day.benchmark_return === 'number' ? day.benchmark_return : 0;
                      const portfolioY = 400 - (portfolioReturn * 20000);
                      const benchmarkY = 400 - (benchmarkReturn * 20000);
                      
                      // Debug: Log the scaling calculations
                      console.log(`Day ${index}:`, {
                        portfolioReturn: portfolioReturn,
                        benchmarkReturn: benchmarkReturn,
                        portfolioY: portfolioY,
                        benchmarkY: benchmarkY
                      });
                      
                      return { x, portfolioY, benchmarkY, day };
                    });
                    
                    // OracleZero line
                    const ozPath = points.map((point, index) => 
                      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.portfolioY}`
                    ).join(' ');
                    
                    // SPY line
                    const spyPath = points.map((point, index) => 
                      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.benchmarkY}`
                    ).join(' ');
                    
                    // If we only have one point, create a small horizontal line
                    const ozPathFinal = points.length === 1 ? 
                      `M ${points[0].x - 10} ${points[0].portfolioY} L ${points[0].x + 10} ${points[0].portfolioY}` : 
                      ozPath;
                    const spyPathFinal = points.length === 1 ? 
                      `M ${points[0].x - 10} ${points[0].benchmarkY} L ${points[0].x + 10} ${points[0].benchmarkY}` : 
                      spyPath;
                    
                    return (
                      <>
                        {/* OracleZero line */}
                        <path d={ozPathFinal} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        {/* SPY line */}
                        <path d={spyPathFinal} fill="none" stroke="var(--muted)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        
                        {/* Data points */}
                        {points.map((point, index) => (
                          <g key={index}>
                            <circle cx={point.x} cy={point.portfolioY} r="4" fill="var(--primary)" stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }}/>
                            <circle cx={point.x} cy={point.benchmarkY} r="4" fill="var(--muted)" stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }}/>
                            <text x={point.x} y="680" textAnchor="middle" fontSize="16" fill="var(--muted)">
                              {new Date(point.day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </text>
                            {/* Hover tooltip */}
                            <g className="hover-group" style={{ cursor: 'pointer' }}>
                              <rect 
                                x={point.x - 120} 
                                y={point.portfolioY - 100} 
                                width="240" 
                                height="80" 
                                fill="rgba(0, 0, 0, 0.95)" 
                                rx="12" 
                                stroke="var(--border)"
                                strokeWidth="2"
                                style={{ opacity: 0, transition: 'opacity 0.2s' }}
                                className="tooltip-bg"
                              />
                              <text 
                                x={point.x} 
                                y={point.portfolioY - 75} 
                                textAnchor="middle" 
                                fontSize="16" 
                                fill={point.day.portfolio_return >= 0 ? "var(--success)" : "var(--danger)"}
                                fontWeight="700"
                                style={{ opacity: 0, transition: 'opacity 0.2s' }}
                                className="tooltip-text"
                              >
                                OracleZero: {formatPercentage(point.day.portfolio_return, 2, true)}
                              </text>
                              <text 
                                x={point.x} 
                                y={point.portfolioY - 50} 
                                textAnchor="middle" 
                                fontSize="16" 
                                fill={point.day.benchmark_return >= 0 ? "var(--success)" : "var(--danger)"}
                                fontWeight="700"
                                style={{ opacity: 0, transition: 'opacity 0.2s' }}
                                className="tooltip-text"
                              >
                                SPY: {formatPercentage(point.day.benchmark_return, 2, true)}
                              </text>
                              <text 
                                x={point.x} 
                                y={point.portfolioY - 25} 
                                textAnchor="middle" 
                                fontSize="16" 
                                fill={point.day.excess_return >= 0 ? "var(--success)" : "var(--danger)"}
                                fontWeight="700"
                                style={{ opacity: 0, transition: 'opacity 0.2s' }}
                                className="tooltip-text"
                              >
                                Δ: {formatPercentage(point.day.excess_return, 2, true)}
                              </text>
                            </g>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          ) : (
            <div className="performance-chart weekly-chart">
              <h2 className="text-center">Weekly Performance vs SPY</h2>
              <div className="chart-y-axis">
                <div className="y-axis-label">2.5%</div>
                <div className="y-axis-label">2%</div>
                <div className="y-axis-label">1.5%</div>
                <div className="y-axis-label">1%</div>
                <div className="y-axis-label">0.5%</div>
                <div className="y-axis-label">0%</div>
                <div className="y-axis-label">-0.5%</div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color oz-color"></div>
                  <span>OracleZero</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color spy-color"></div>
                  <span>SPY</span>
                </div>
              </div>
              <div className="line-chart">
                <svg className="chart-svg" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(55, 65, 81, 0.75)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Zero line */}
                  <line x1="100" y1="400" x2="900" y2="400" stroke="var(--border)" strokeWidth="4"/>
                  
                  {/* Performance lines */}
                  {(() => {
                    // Get the last 4 weeks of data
                    const tradingWeeks = performanceData?.recent_performance?.last_6_weeks?.slice(-4) || [];
                    
                    if (tradingWeeks.length === 0) {
                      return <text x="400" y="200" textAnchor="middle" fill="var(--muted)">No data available</text>;
                    }
                    
                    // Fixed Y-axis range from -0.5% to 2.5%
                    const yMin = -0.005; // -0.5%
                    const yMax = 0.025;  // 2.5%
                    const yRange = yMax - yMin; // 0.03 (3%)
                    const yScale = 400 / yRange; // Scale to fit 400px height
                    const yCenter = 400; // Center Y position
                    
                    const points = tradingWeeks.map((week, index) => {
                      // Handle division by zero when there's only one point
                      const x = tradingWeeks.length === 1 ? 500 : (index / (tradingWeeks.length - 1)) * 800 + 100;
                      // Scale returns to fit the fixed range
                      const portfolioReturn = typeof week.portfolio_return === 'number' ? week.portfolio_return : 0;
                      const benchmarkReturn = typeof week.benchmark_return === 'number' ? week.benchmark_return : 0;
                      const portfolioY = Math.max(50, Math.min(750, yCenter - ((portfolioReturn - yMin) * yScale)));
                      const benchmarkY = Math.max(50, Math.min(750, yCenter - ((benchmarkReturn - yMin) * yScale)));
                      
                      return { x, portfolioY, benchmarkY, week };
                    });
                    
                    // OracleZero line
                    const ozPath = points.map((point, index) => 
                      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.portfolioY}`
                    ).join(' ');
                    
                    // SPY line
                    const spyPath = points.map((point, index) => 
                      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.benchmarkY}`
                    ).join(' ');
                    
                    // If we only have one point, create a small horizontal line
                    const ozPathFinal = points.length === 1 ? 
                      `M ${points[0].x - 10} ${points[0].portfolioY} L ${points[0].x + 10} ${points[0].portfolioY}` : 
                      ozPath;
                    const spyPathFinal = points.length === 1 ? 
                      `M ${points[0].x - 10} ${points[0].benchmarkY} L ${points[0].x + 10} ${points[0].benchmarkY}` : 
                      spyPath;
                    
                    return (
                      <>
                        {/* OracleZero line */}
                        <path d={ozPathFinal} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        {/* SPY line */}
                        <path d={spyPathFinal} fill="none" stroke="var(--muted)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        
                        {/* Data points */}
                        {points.map((point, index) => (
                          <g key={index}>
                            <circle cx={point.x} cy={point.portfolioY} r="4" fill="var(--primary)" stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }}/>
                            <circle cx={point.x} cy={point.benchmarkY} r="4" fill="var(--muted)" stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }}/>
                            <text x={point.x} y="680" textAnchor="middle" fontSize="16" fill="var(--muted)">
                              {new Date(point.week.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </text>
                            {/* Hover tooltip */}
                            <g className="hover-group" style={{ cursor: 'pointer' }}>
                              <rect 
                                x={point.x - 120} 
                                y={point.portfolioY - 100} 
                                width="240" 
                                height="80" 
                                fill="rgba(0, 0, 0, 0.95)" 
                                rx="12" 
                                stroke="var(--border)"
                                strokeWidth="2"
                                style={{ opacity: 0, transition: 'opacity 0.2s' }}
                                className="tooltip-bg"
                              />
                              <text 
                                x={point.x} 
                                y={point.portfolioY - 75} 
                                textAnchor="middle" 
                                fontSize="16" 
                                fill={point.week.portfolio_return >= 0 ? "var(--success)" : "var(--danger)"}
                                fontWeight="700"
                                style={{ opacity: 0, transition: 'opacity 0.2s' }}
                                className="tooltip-text"
                              >
                                OracleZero: {formatPercentage(point.week.portfolio_return, 2, true)}
                              </text>
                              <text 
                                x={point.x} 
                                y={point.portfolioY - 50} 
                                textAnchor="middle" 
                                fontSize="16" 
                                fill={point.week.benchmark_return >= 0 ? "var(--success)" : "var(--danger)"}
                                fontWeight="700"
                                style={{ opacity: 0, transition: 'opacity 0.2s' }}
                                className="tooltip-text"
                              >
                                SPY: {formatPercentage(point.week.benchmark_return, 2, true)}
                              </text>
                              <text 
                                x={point.x} 
                                y={point.portfolioY - 25} 
                                textAnchor="middle" 
                                fontSize="16" 
                                fill={point.week.excess_return >= 0 ? "var(--success)" : "var(--danger)"}
                                fontWeight="700"
                                style={{ opacity: 0, transition: 'opacity 0.2s' }}
                                className="tooltip-text"
                              >
                                Δ: {formatPercentage(point.week.excess_return, 2, true)}
                              </text>
                            </g>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Compressed Performance Table */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">Performance Summary</h2>
          <p className="section-explanation">Key performance metrics comparing OracleZero vs SPY benchmark.</p>
          <div className="treasury-rate-display" style={{ marginTop: 'var(--space-sm)' }}>
            <label style={{ fontWeight: '600', marginRight: 'var(--space-sm)' }}>Risk-Free Rate (Treasury):</label>
            {treasuryRate ? (
              <span className="treasury-rate-value">
                {treasuryRate.treasury_rate_percent.toFixed(2)}% (Auto-fetched)
              </span>
            ) : (
              <span className="treasury-rate-loading">Loading...</span>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="compressed-table">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>SPY</th>
                <th>OracleZero</th>
                <th>Delta</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="metric-name">
                  <div className="metric-title">Daily Returns</div>
                  <div className="metric-desc">Average daily returns ± volatility</div>
                </td>
                <td className="spy-value">
                  {formatPercentage(performanceData.daily_returns?.benchmark?.mean, 2, true)} ± {formatPercentage(performanceData.daily_returns?.benchmark?.std, 2)}
                </td>
                <td className="oz-value">
                  {formatPercentage(performanceData.daily_returns?.portfolio?.mean, 2, true)} ± {formatPercentage(performanceData.daily_returns?.portfolio?.std, 2)}
                </td>
                <td className={`delta-value ${(performanceData.daily_returns?.excess?.mean || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage(performanceData.daily_returns?.excess?.mean, 2, true)}
                </td>
              </tr>
              <tr>
                <td className="metric-name">
                  <div className="metric-title">Weekly Returns</div>
                  <div className="metric-desc">Weekly performance aggregated from daily data</div>
                </td>
                <td className="spy-value">
                  {formatPercentage(performanceData.weekly_returns?.benchmark?.mean, 2, true)} ± {formatPercentage(performanceData.weekly_returns?.benchmark?.std, 2)}
                </td>
                <td className="oz-value">
                  {formatPercentage(performanceData.weekly_returns?.portfolio?.mean, 2, true)} ± {formatPercentage(performanceData.weekly_returns?.portfolio?.std, 2)}
                </td>
                <td className={`delta-value ${(performanceData.weekly_returns?.excess?.mean || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage(performanceData.weekly_returns?.excess?.mean, 2, true)}
                </td>
              </tr>
              <tr>
                <td className="metric-name">
                  <div className="metric-title">Cumulative Performance</div>
                  <div className="metric-desc">Total returns since August 25, 2025</div>
                </td>
                <td className="spy-value">
                  {formatPercentage(performanceData.cumulative_performance?.benchmark, 2, true)}
                </td>
                <td className="oz-value">
                  {formatPercentage(performanceData.cumulative_performance?.portfolio, 2, true)}
                </td>
                <td className={`delta-value ${(performanceData.cumulative_performance?.outperformance || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage(performanceData.cumulative_performance?.outperformance, 2, true)}
                </td>
              </tr>
              <tr>
                <td className="metric-name">
                  <div className="metric-title">Max Drawdown</div>
                  <div className="metric-desc">Largest peak-to-trough decline</div>
                </td>
                <td className="spy-value">
                  {formatPercentage(performanceData.daily_returns?.benchmark?.max_drawdown, 2)}
                </td>
                <td className="oz-value">
                  {formatPercentage(performanceData.daily_returns?.portfolio?.max_drawdown, 2)}
                </td>
                <td className={`delta-value ${((performanceData.daily_returns?.portfolio?.max_drawdown || 0) - (performanceData.daily_returns?.benchmark?.max_drawdown || 0)) <= 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage((performanceData.daily_returns?.portfolio?.max_drawdown || 0) - (performanceData.daily_returns?.benchmark?.max_drawdown || 0), 2, true)}
                </td>
              </tr>
              <tr>
                <td className="metric-name">
                  <div className="metric-title">Sharpe Ratio</div>
                  <div className="metric-desc">Risk-adjusted returns (annualized)</div>
                </td>
                <td className="spy-value">
                  {formatNumber(performanceData.daily_returns?.benchmark?.sharpe_annualized, 3, true)}
                </td>
                <td className="oz-value">
                  {formatNumber(performanceData.daily_returns?.portfolio?.sharpe_annualized, 3, true)}
                </td>
                <td className={`delta-value ${((performanceData.daily_returns?.portfolio?.sharpe_annualized || 0) - (performanceData.daily_returns?.benchmark?.sharpe_annualized || 0)) >= 0 ? 'positive' : 'negative'}`}>
                  {formatNumber((performanceData.daily_returns?.portfolio?.sharpe_annualized || 0) - (performanceData.daily_returns?.benchmark?.sharpe_annualized || 0), 3, true)}
                </td>
              </tr>
              <tr>
                <td className="metric-name">
                  <div className="metric-title">P-Value (Daily)</div>
                  <div className="metric-desc">Statistical significance of excess returns</div>
                </td>
                <td className="spy-value">—</td>
                <td className="oz-value">—</td>
                <td className={`delta-value ${(performanceData.statistical_tests?.daily?.p_value || 1) <= 0.05 ? 'positive' : 'negative'}`}>
                  {formatNumber(performanceData.statistical_tests?.daily?.p_value, 4)}
                </td>
              </tr>
              <tr>
                <td className="metric-name">
                  <div className="metric-title">P-Value (Total)</div>
                  <div className="metric-desc">Overall statistical significance across all data</div>
                </td>
                <td className="spy-value">—</td>
                <td className="oz-value">—</td>
                <td className={`delta-value ${(performanceData.statistical_tests?.weekly?.p_value || 1) <= 0.05 ? 'positive' : 'negative'}`}>
                  {formatNumber(performanceData.statistical_tests?.weekly?.p_value, 4)}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
        <div className="pvalue-disclaimer">
          <p><strong>⚠️ P-Value Disclaimer:</strong> The p-value will decrease over time as more data is collected. A p-value below 0.05 indicates statistical significance, but this threshold may change as the sample size grows.</p>
        </div>
        <div className="sharpe-disclaimer">
          <p><strong>📊 Sharpe Ratio Disclaimer:</strong> Sharpe ratios are calculated using the risk-free rate and may not be meaningful with limited historical data. Higher values indicate better risk-adjusted returns, but results should be interpreted cautiously with small sample sizes.</p>
        </div>
      </div>

      {/* Recent Performance - Daily */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="card-title">Last {Math.min(10, performanceData.recent_performance?.last_10_days?.length || 0)} days (OZ vs SPY)</h2>
          <p className="section-explanation">Recent daily performance showing day-by-day comparison with SPY.</p>
        </div>
        <div className="card-body">
          <div className="performance-list">
          {performanceData.recent_performance?.last_10_days?.map((day, index) => (
            <div key={index} className="performance-item">
              <span className="date">{day.date}</span>
              <span className="separator">|</span>
              <span className="oz-return">OZ {formatPercentage(day.portfolio_return, 2, true)}</span>
              <span className="spy-return">SPY {formatPercentage(day.benchmark_return, 2, true)}</span>
              <span className={`excess-return ${(day.excess_return || 0) >= 0 ? 'positive' : 'negative'}`}>
                Δ {formatPercentage(day.excess_return, 2, true)}
              </span>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Recent Performance - Weekly */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Last {Math.min(6, performanceData.recent_performance?.last_6_weeks?.length || 0)} weeks (OZ vs SPY) - Aggregated</h2>
          <p className="section-explanation">Weekly performance summary showing consistency over time.</p>
        </div>
        <div className="card-body">
          <div className="performance-list">
          {performanceData.recent_performance?.last_6_weeks?.map((week, index) => (
            <div key={index} className="performance-item">
              <span className="date">{week.date}</span>
              <span className="separator">|</span>
              <span className="oz-return">OZ {formatPercentage(week.portfolio_return, 2, true)}</span>
              <span className="spy-return">SPY {formatPercentage(week.benchmark_return, 2, true)}</span>
              <span className={`excess-return ${(week.excess_return || 0) >= 0 ? 'positive' : 'negative'}`}>
                Δ {formatPercentage(week.excess_return, 2, true)}
              </span>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
