// src/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function getAllStocks() {
  try {
    const response = await fetch(`${API_BASE}/api/stocks`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.stocks;
    } else {
      throw new Error(data.error || 'Failed to fetch stocks');
    }
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
}

export async function getStockInfo(ticker) {
  try {
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/info`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.info;
    } else {
      throw new Error(data.error || 'Failed to fetch stock info');
    }
  } catch (error) {
    console.error('Error fetching stock info:', error);
    throw error;
  }
}

export async function getPromptData(ticker) {
  try {
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/full-data`);
    if (!response.ok) throw new Error('Failed to fetch prompt data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching prompt data:', error);
    throw error;
  }
}

export async function getStockPrices(ticker) {
  try {
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/prices`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.prices;
    } else {
      throw new Error(data.error || 'Failed to fetch prices');
    }
  } catch (error) {
    console.error('Error fetching prices:', error);
    throw error;
  }
}

export async function getStockAnalystLabels(ticker) {
  try {
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/analyst-labels`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.analyst_labels;
    } else {
      throw new Error(data.error || 'Failed to fetch analyst labels');
    }
  } catch (error) {
    console.error('Error fetching analyst labels:', error);
    throw error;
  }
}

export async function getStockAnalystEstimates(ticker) {
  try {
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/analyst-estimates`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.analyst_estimates;
    } else {
      throw new Error(data.error || 'Failed to fetch analyst estimates');
    }
  } catch (error) {
    console.error('Error fetching analyst estimates:', error);
    throw error;
  }
}

export async function getStockGradesHistorical(ticker) {
  try {
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/grades-historical`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.grades_historical;
    } else {
      throw new Error(data.error || 'Failed to fetch historical grades');
    }
  } catch (error) {
    console.error('Error fetching historical grades:', error);
    throw error;
  }
}

export async function getStockNews(ticker) {
  try {
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/news`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.news;
    } else {
      throw new Error(data.error || 'Failed to fetch news');
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}

export async function getStockKeyMetrics(ticker) {
  try {
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/key-metrics`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.key_metrics;
    } else {
      throw new Error(data.error || 'Failed to fetch key metrics');
    }
  } catch (error) {
    console.error('Error fetching key metrics:', error);
    throw error;
  }
}

export async function getStockProfile(ticker) {
  try {
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/profile`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.profile;
    } else {
      throw new Error(data.error || 'Failed to fetch profile');
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

export async function getStockAllocations(ticker) {
  try {
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/allocations`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.allocations;
    } else {
      throw new Error(data.error || 'Failed to fetch allocations');
    }
  } catch (error) {
    console.error('Error fetching allocations:', error);
    throw error;
  }
}

export async function getStockPredictions(ticker) {
  try {
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/predictions`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.predictions;
    } else {
      throw new Error(data.error || 'Failed to fetch predictions');
    }
  } catch (error) {
    console.error('Error fetching predictions:', error);
    throw error;
  }
}

export async function testPopulate() {
  try {
    const response = await fetch(`${API_BASE}/api/test-populate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data.status === 'ok') {
      return data;
    } else {
      throw new Error(data.error || 'Failed to populate test data');
    }
  } catch (error) {
    console.error('Error populating test data:', error);
    throw error;
  }
}

export async function runFetch(freq) {
  try {
    const response = await fetch(`${API_BASE}/api/run-fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ freq })
    });
    const data = await response.json();
    if (data.status === 'ok') {
      return data;
    } else {
      throw new Error(data.error || 'Failed to run fetch');
    }
  } catch (error) {
    console.error('Error running fetch:', error);
    throw error;
  }
}

export async function checkConsistency() {
  try {
    const response = await fetch(`${API_BASE}/api/health/consistency`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data.status === 'ok') {
      return data;
    } else {
      throw new Error(data.error || 'Failed to check consistency');
    }
  } catch (error) {
    console.error('Error checking consistency:', error);
    throw error;
  }
}

export async function fixConsistency() {
  try {
    const response = await fetch(`${API_BASE}/api/health/consistency/fix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data.status === 'ok') {
      return data;
    } else {
      throw new Error(data.error || 'Failed to fix consistency');
    }
  } catch (error) {
    console.error('Error fixing consistency:', error);
    throw error;
  }
}

// Cache management functions
export function clearAllCache() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('sp500_')) {
      localStorage.removeItem(key);
    }
  });
  console.log('🗑️ Cleared all cache');
}

export function getCacheInfo() {
  const cacheInfo = {};
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.startsWith('sp500_')) {
      try {
        const cached = JSON.parse(localStorage.getItem(key));
        const dataKey = key.replace('sp500_', '');
        cacheInfo[dataKey] = {
          timestamp: cached.timestamp,
          age: Math.round((Date.now() - cached.timestamp) / 1000),
          size: JSON.stringify(cached.data).length
        };
      } catch {
        // Invalid cache entry
      }
    }
  });
  
  return cacheInfo;
}
