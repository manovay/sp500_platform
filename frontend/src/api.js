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

export async function getOpenOrders() {
  try {
    const response = await fetch(`${API_BASE}/api/orders?status=open`);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.orders;
    } else {
      throw new Error(data.error || 'Failed to fetch open orders');
    }
  } catch (error) {
    console.error('Error fetching open orders:', error);
    throw error;
  }
}

export async function cancelOrder(orderId) {
  try {
    const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (data.status === 'ok') {
      return data;
    } else {
      throw new Error(data.error || 'Failed to cancel order');
    }
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
}

export async function cancelAllOrders() {
  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (data.status === 'ok') {
      return data;
    } else {
      throw new Error(data.error || 'Failed to cancel all orders');
    }
  } catch (error) {
    console.error('Error cancelling all orders:', error);
    throw error;
  }
}
