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
    const response = await fetch(`${API_BASE}/api/stocks/${ticker}/prompt`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch prompt data');
    }
  } catch (error) {
    console.error('Error fetching prompt data:', error);
    throw error;
  }
}

// Portfolio Management Functions
export async function getAccountInfo() {
  try {
    const response = await fetch(`${API_BASE}/api/account`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.account;
    } else {
      throw new Error(data.error || 'Failed to fetch account info');
    }
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw error;
  }
}

export async function getPositions() {
  try {
    const response = await fetch(`${API_BASE}/api/positions`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.positions;
    } else {
      throw new Error(data.error || 'Failed to fetch positions');
    }
  } catch (error) {
    console.error('Error fetching positions:', error);
    throw error;
  }
}

export async function getHistory(timeframe = 'ytd') {
  try {
    const response = await fetch(`${API_BASE}/api/history?timeframe=${timeframe}`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data;
    } else {
      throw new Error(data.error || 'Failed to fetch history');
    }
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
}

export async function getOrderHistory() {
  try {
    const response = await fetch(`${API_BASE}/api/history/orders`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.orders;
    } else {
      throw new Error(data.error || 'Failed to fetch order history');
    }
  } catch (error) {
    console.error('Error fetching order history:', error);
    throw error;
  }
}

export async function getActivityHistory() {
  try {
    const response = await fetch(`${API_BASE}/api/history/activities`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.activities;
    } else {
      throw new Error(data.error || 'Failed to fetch activity history');
    }
  } catch (error) {
    console.error('Error fetching activity history:', error);
    throw error;
  }
}
