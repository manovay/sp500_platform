// src/api.js
export async function getPortfolio() {
  return Promise.resolve({
    allocations: [
      { ticker: 'AAPL', current: 5.2, recommended: 6.0 },
      { ticker: 'MSFT', current: 4.1, recommended: 3.8 },
      /* …more dummy rows… */
    ],
  });
}

export async function getTickerDetails(ticker) {
  return Promise.resolve({
    ticker,
    history: [
      { date: '2025-06-01', value: 5.2 },
      { date: '2025-07-01', value: 6.0 },
      /* … */
    ],
    metrics: { pe: 28.5, sentiment: 0.7 },
  });
}
