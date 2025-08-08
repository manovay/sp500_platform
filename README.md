# S&P 500 Platform

A comprehensive platform for analyzing S&P 500 stocks with real-time data fetching, LLM-powered analysis, and a modern React frontend.

## Quick Start

### 1. **Set up your environment**
```bash
# Create and activate virtual environment (recommended)
python -m venv venv

# On Windows
venv\Scripts\activate

# On Mac/Linux
source venv/bin/activate
```

### 2. **Install dependencies**
```bash
pip install -r requirements.txt
```

### 3. **Set up your database**
You'll need a PostgreSQL database running locally or remotely. Update your `.env` file with your database credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
FMP_API_KEY=your_fmp_api_key_here
HF_TOKEN=your_huggingface_token_here
```

### 4. **Initialize the database schema**
```bash
cd ingestion
python init_db.py
```

### 5. **Fetch initial data**
```bash
# Fetch S&P 500 tickers
python fetch_tickers.py

# Fetch price data
python fetch_prices.py

# Fetch analyst data
python fetch_analyst_labels.py
```

### 6. **Start the Flask backend**
```bash
cd backend
python app.py
```
The server will run on `http://localhost:5000`

### 7. **Start the React frontend**
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`

## Project Structure

- **`ingestion/`** - Data fetching scripts for S&P 500 data
- **`backend/`** - Flask API server
- **`frontend/`** - React application
- **`prompting-training/`** - ML model training scripts

## API Endpoints

The Flask backend provides these endpoints:
- `GET /api/stocks` - List all stocks
- `GET /api/stocks/{ticker}/info` - Stock information
- `GET /api/stocks/{ticker}/prices` - Price data
- `GET /api/stocks/{ticker}/analyst-labels` - Analyst ratings
- `GET /api/stocks/{ticker}/full-data` - Complete stock data
- `POST /api/stocks/{ticker}/llm-verdict` - LLM analysis

## Data Sources

- **Financial Modeling Prep API** - Stock data, prices, analyst estimates
- **Hugging Face** - LLM inference for stock analysis

## Requirements

- Python 3.9+
- PostgreSQL database
- Node.js 16+ (for frontend)
- Financial Modeling Prep API key
- Hugging Face API token
