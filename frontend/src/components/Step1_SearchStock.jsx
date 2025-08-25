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
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Step 1: Search for a Stock</h2>
      </div>
      <div className="card-body">
        <div className="flex gap-md mb-lg">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter ticker or company name"
            className="flex-1"
          />
          <button onClick={handleSearch} disabled={loading} className="btn btn-primary">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        
        {results.length > 0 && (
          <div className="space-y-sm">
            {results.map(stock => (
              <button 
                key={stock.ticker} 
                onClick={() => onSelect(stock)} 
                className="btn w-full text-left justify-start"
              >
                <span className="font-semibold">{stock.ticker}</span>
                <span className="text-muted ml-sm">- {stock.company_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 