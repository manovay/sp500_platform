import React, { useState } from 'react';
import { getAllStocks } from '../api';

export default function Step1_SearchStock({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const stocks = await getAllStocks();
      const filtered = stocks.filter(stock =>
        stock.ticker.toUpperCase().includes(query.toUpperCase()) ||
        stock.company_name.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Step 1: Search for a Stock</h2>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Enter ticker or company name"
        style={{ marginRight: '1rem', padding: '0.5rem' }}
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching…' : 'Search'}
      </button>
      <ul style={{ marginTop: '1rem' }}>
        {results.map(stock => (
          <li key={stock.ticker} style={{ marginBottom: '0.5rem' }}>
            <button onClick={() => onSelect(stock)} style={{ padding: '0.5rem 1rem' }}>
              {stock.ticker} - {stock.company_name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 