import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Area
} from 'recharts';
import { 
  getAllStocks, getStockPrices, getStockAnalystLabels, getStockAnalystEstimates,
  getStockGradesHistorical, getStockNews, getStockKeyMetrics, getStockProfile,
  getStockAllocations, getStockPredictions
} from '../api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function StockList() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      setLoading(true);
      const stocksData = await getAllStocks();
      setStocks(stocksData);
      if (stocksData.length > 0) {
        setSelectedStock(stocksData[0].ticker);
      }
    } catch (err) {
      setError('Failed to load stocks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStock) {
      loadStockData(selectedStock);
    }
  }, [selectedStock]);

  const loadStockData = async (ticker) => {
    try {
      const [
        prices, analystLabels, analystEstimates, gradesHistorical,
        news, keyMetrics, profile, allocations, predictions
      ] = await Promise.allSettled([
        getStockPrices(ticker),
        getStockAnalystLabels(ticker),
        getStockAnalystEstimates(ticker),
        getStockGradesHistorical(ticker),
        getStockNews(ticker),
        getStockKeyMetrics(ticker),
        getStockProfile(ticker),
        getStockAllocations(ticker),
        getStockPredictions(ticker)
      ]);

      setStockData({
        prices: prices.status === 'fulfilled' ? prices.value : [],
        analystLabels: analystLabels.status === 'fulfilled' ? analystLabels.value : [],
        analystEstimates: analystEstimates.status === 'fulfilled' ? analystEstimates.value : [],
        gradesHistorical: gradesHistorical.status === 'fulfilled' ? gradesHistorical.value : [],
        news: news.status === 'fulfilled' ? news.value : [],
        keyMetrics: keyMetrics.status === 'fulfilled' ? keyMetrics.value : [],
        profile: profile.status === 'fulfilled' ? profile.value : null,
        allocations: allocations.status === 'fulfilled' ? allocations.value : [],
        predictions: predictions.status === 'fulfilled' ? predictions.value : []
      });
    } catch (err) {
      console.error('Error loading stock data:', err);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderOverview = () => (
    <div className="overview-grid">
      {/* Price Chart */}
      {stockData.prices && stockData.prices.length > 0 && (
        <div className="data-card">
          <h3>Price History (Last 100 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stockData.prices.slice().reverse()}>
              <XAxis dataKey="price_date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="close_price" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Market Cap Allocation */}
      {stockData.allocations && stockData.allocations.length > 0 && (
        <div className="data-card">
          <h3>Market Cap Allocation</h3>
          <p>Current Allocation: <strong>{(stockData.allocations[0]?.allocation_pct * 100).toFixed(2)}%</strong></p>
          <p>Market Cap: <strong>{formatCurrency(stockData.allocations[0]?.market_cap_usd)}</strong></p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stockData.allocations.slice(0, 20).reverse()}>
              <XAxis dataKey="allocation_date" />
              <YAxis />
              <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} />
              <Line type="monotone" dataKey="allocation_pct" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Company Profile */}
      {stockData.profile && (
        <div className="data-card">
          <h3>Company Profile</h3>
          <div className="profile-info">
            <p><strong>Industry:</strong> {stockData.profile.profile_data?.industry || 'N/A'}</p>
            <p><strong>Market Cap:</strong> {formatCurrency(stockData.profile.profile_data?.mktCap)}</p>
            <p><strong>Beta:</strong> {stockData.profile.profile_data?.beta?.toFixed(2) || 'N/A'}</p>
            <p><strong>52 Week High:</strong> {formatCurrency(stockData.profile.profile_data?.price)}</p>
            <p><strong>52 Week Low:</strong> {formatCurrency(stockData.profile.profile_data?.price)}</p>
            <p><strong>Website:</strong> <a href={stockData.profile.profile_data?.website} target="_blank" rel="noopener noreferrer">{stockData.profile.profile_data?.website}</a></p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalystData = () => (
    <div className="analyst-grid">
      {/* Analyst Ratings */}
      {stockData.analystLabels && stockData.analystLabels.length > 0 && (
        <div className="data-card">
          <h3>Analyst Ratings</h3>
          <div className="rating-summary">
            <p>Current Rating: <strong>{stockData.analystLabels[0]?.rating}</strong></p>
            <p>Overall Score: <strong>{stockData.analystLabels[0]?.overall_score}/5</strong></p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stockData.analystLabels.slice(0, 10)}>
              <XAxis dataKey="label_date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="overall_score" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Historical Grades */}
      {stockData.gradesHistorical && stockData.gradesHistorical.length > 0 && (
        <div className="data-card">
          <h3>Analyst Recommendations</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stockData.gradesHistorical.slice(0, 10)}>
              <XAxis dataKey="rating_date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="analyst_ratings_buy" fill="#4CAF50" name="Buy" />
              <Bar dataKey="analyst_ratings_hold" fill="#FF9800" name="Hold" />
              <Bar dataKey="analyst_ratings_sell" fill="#F44336" name="Sell" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Analyst Estimates */}
      {stockData.analystEstimates && stockData.analystEstimates.length > 0 && (
        <div className="data-card">
          <h3>Analyst Estimates</h3>
          <div className="estimates-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Revenue (Avg)</th>
                  <th>EPS (Avg)</th>
                  <th>Analysts</th>
                </tr>
              </thead>
              <tbody>
                {stockData.analystEstimates.slice(0, 5).map((estimate, index) => (
                  <tr key={index}>
                    <td>{formatDate(estimate.report_date)}</td>
                    <td>{formatCurrency(estimate.revenue_avg)}</td>
                    <td>{formatCurrency(estimate.eps_avg)}</td>
                    <td>{estimate.num_analysts_eps || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderFinancialData = () => (
    <div className="financial-grid">
      {/* Key Metrics */}
      {stockData.keyMetrics && stockData.keyMetrics.length > 0 && (
        <div className="data-card">
          <h3>Key Metrics</h3>
          <div className="metrics-grid">
            {Object.entries(stockData.keyMetrics[0]?.metrics || {}).slice(0, 12).map(([key, value]) => (
              <div key={key} className="metric-item">
                <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>
                <span>{typeof value === 'number' ? formatNumber(value) : value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Volume Chart */}
      {stockData.prices && stockData.prices.length > 0 && (
        <div className="data-card">
          <h3>Price & Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={stockData.prices.slice(0, 30).reverse()}>
              <XAxis dataKey="price_date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value, name) => [name === 'volume' ? formatNumber(value) : formatCurrency(value), name]}/>
              <Area yAxisId="right" type="monotone" dataKey="volume" fill="#8884d8" opacity={0.3} />
              <Line yAxisId="left" type="monotone" dataKey="close_price" stroke="#82ca9d" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderNews = () => (
    <div className="news-section">
      {stockData.news && stockData.news.length > 0 ? (
        <div className="data-card">
          <h3>Recent News</h3>
          <div className="news-list">
            {stockData.news.slice(0, 10).map((item, index) => (
              <div key={index} className="news-item">
                <h4>{item.title}</h4>
                <p className="news-meta">
                  {formatDate(item.published_date)} - {item.publisher}
                </p>
                <p className="news-excerpt">
                  {item.text?.substring(0, 200)}...
                </p>
                <a href={item.url} target="_blank" rel="noopener noreferrer">Read more</a>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="data-card">
          <h3>Recent News</h3>
          <p>No recent news available for this stock.</p>
        </div>
      )}
    </div>
  );

  const renderPredictions = () => (
    <div className="predictions-section">
      {stockData.predictions && stockData.predictions.length > 0 ? (
        <div className="data-card">
          <h3>LLM Predictions</h3>
          <div className="predictions-list">
            {stockData.predictions.map((prediction, index) => (
              <div key={index} className="prediction-item">
                <h4>Prediction #{prediction.id}</h4>
                <p className="prediction-meta">
                  {formatDate(prediction.created_at)}
                </p>
                <div className="prediction-data">
                  <strong>Request:</strong>
                  <pre>{JSON.stringify(prediction.request_data, null, 2)}</pre>
                  <strong>Response:</strong>
                  <pre>{JSON.stringify(prediction.response_data, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="data-card">
          <h3>LLM Predictions</h3>
          <p>No predictions available for this stock.</p>
        </div>
      )}
    </div>
  );

  if (loading) return <div className="loading">Loading stocks...</div>;
  if (error) return <div className="error">{error}</div>;

  const currentStock = stocks.find(s => s.ticker === selectedStock);

  return (
    <div className="stock-list-container">
      <div className="stock-list-header">
        <h1>S&P 500 Stock Analysis</h1>
        <p>Comprehensive data for all S&P 500 stocks</p>
      </div>

      <div className="stock-list-content">
        {/* Stock Selector */}
        <div className="stock-selector">
          <label htmlFor="stock-select">Select Stock:</label>
          <select 
            id="stock-select"
            value={selectedStock || ''} 
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            {stocks.map(stock => (
              <option key={stock.ticker} value={stock.ticker}>
                {stock.ticker} - {stock.company_name}
              </option>
            ))}
          </select>
        </div>

        {currentStock && (
          <div className="stock-details">
            <div className="stock-header">
              <h2>{currentStock.ticker} - {currentStock.company_name}</h2>
              <p>Sector: {currentStock.sector}</p>
              <p>Date Added: {formatDate(currentStock.date_added)}</p>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button 
                className={activeTab === 'overview' ? 'active' : ''} 
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={activeTab === 'analyst' ? 'active' : ''} 
                onClick={() => setActiveTab('analyst')}
              >
                Analyst Data
              </button>
              <button 
                className={activeTab === 'financial' ? 'active' : ''} 
                onClick={() => setActiveTab('financial')}
              >
                Financial Data
              </button>
              <button 
                className={activeTab === 'news' ? 'active' : ''} 
                onClick={() => setActiveTab('news')}
              >
                News
              </button>
              <button 
                className={activeTab === 'predictions' ? 'active' : ''} 
                onClick={() => setActiveTab('predictions')}
              >
                Predictions
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'analyst' && renderAnalystData()}
              {activeTab === 'financial' && renderFinancialData()}
              {activeTab === 'news' && renderNews()}
              {activeTab === 'predictions' && renderPredictions()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 