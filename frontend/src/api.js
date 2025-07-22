// src/api.js
export async function getPortfolio() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/portfolio`);
  return res.json();
}

export async function getTickerDetails(ticker) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ticker/${ticker}`);
  return res.json();
}
