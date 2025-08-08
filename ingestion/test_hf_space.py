import requests
import json
import os
from datetime import date, timedelta, datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv(override=True)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)

BASE_URL = "https://mdot77-sp500llm.hf.space"  # or your HF Space URL

# Custom JSON encoder to handle date and decimal objects
class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        elif hasattr(obj, '__float__'):  # Handle Decimal, Fraction, etc.
            return float(obj)
        return super().default(obj)

def get_full_data_for_ticker(conn, ticker):
    """
    Helper to fetch and build the full_data dict for a given ticker, using current date - 7 days for snapshot.
    """
    today = date.today()
    snapshot_date = today - timedelta(days=7)  # Use current date - 7 days for snapshot
    week_ago = today - timedelta(days=7)
    year_ago = today - timedelta(days=365)

    # Get snapshot date (use snapshot_date instead of latest allocation_date)
    snapshot = snapshot_date.isoformat()

    # Previous allocation pct (previous week)
    prev_alloc_row = conn.execute(text("""
        SELECT allocation_pct FROM allocations WHERE ticker = :ticker AND allocation_date < :week_ago ORDER BY allocation_date DESC LIMIT 1
    """), {"ticker": ticker, "week_ago": week_ago}).mappings().fetchone()
    previous_allocation_pct = float(prev_alloc_row["allocation_pct"]) if prev_alloc_row else None

    # Profile summary (from profiles)
    profile_row = conn.execute(text("""
        SELECT profile_data FROM profiles WHERE ticker = :ticker AND date_fetched >= :week_ago ORDER BY date_fetched DESC LIMIT 1
    """), {"ticker": ticker, "week_ago": week_ago}).fetchone()
    profile_summary = profile_row[0] if profile_row else None

    # Weekly: grades_historical, allocations, predictions (last 7 days)
    weekly = {}
    weekly["grades_historical"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM grades_historical WHERE symbol = :ticker AND rating_date >= :week_ago ORDER BY rating_date DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]
    weekly["allocations"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM allocations WHERE ticker = :ticker AND allocation_date >= :week_ago ORDER BY allocation_date DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]
    weekly["predictions"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM predictions WHERE request_data->>'ticker' = :ticker AND created_at >= :week_ago ORDER BY created_at DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]

    # Daily: prices, analyst_labels, stock_news (last 7 days)
    daily = {}
    daily["prices"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM prices WHERE ticker = :ticker AND price_date >= :week_ago ORDER BY price_date DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]
    daily["analyst_labels"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM analyst_labels WHERE ticker = :ticker AND label_date >= :week_ago ORDER BY label_date DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]
    daily["stock_news"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM stock_news WHERE symbol = :ticker AND published_date >= :week_ago ORDER BY published_date DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]

    # Quarterly: tickers, analyst_estimates (last 4 quarters)
    quarterly = {}
    quarterly["tickers"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM tickers WHERE ticker = :ticker
    """), {"ticker": ticker}).mappings()]
    quarterly["analyst_estimates"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM analyst_estimates WHERE symbol = :ticker AND report_date >= :year_ago ORDER BY report_date DESC
    """), {"ticker": ticker, "year_ago": year_ago}).mappings()]

    # Annual: key_metrics, profiles (last 1 year)
    annual = {}
    annual["key_metrics"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM key_metrics WHERE ticker = :ticker AND date >= :year_ago ORDER BY date DESC
    """), {"ticker": ticker, "year_ago": year_ago}).mappings()]
    annual["profiles"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM profiles WHERE ticker = :ticker AND date_fetched >= :year_ago ORDER BY date_fetched DESC
    """), {"ticker": ticker, "year_ago": year_ago}).mappings()]

    # Yearly return pct (from prices, 1 year ago vs now)
    price_now_row = conn.execute(text("""
        SELECT close_price FROM prices WHERE ticker = :ticker ORDER BY price_date DESC LIMIT 1
    """), {"ticker": ticker}).mappings().fetchone()
    price_year_ago_row = conn.execute(text("""
        SELECT close_price FROM prices WHERE ticker = :ticker AND price_date <= :year_ago ORDER BY price_date DESC LIMIT 1
    """), {"ticker": ticker, "year_ago": year_ago}).mappings().fetchone()
    yearly_return_pct = None
    if price_now_row and price_year_ago_row and price_year_ago_row["close_price"]:
        yearly_return_pct = 100.0 * (float(price_now_row["close_price"]) - float(price_year_ago_row["close_price"])) / float(price_year_ago_row["close_price"])

    # Latest label
    latest_label = conn.execute(text("""
        SELECT * FROM analyst_labels WHERE ticker = :ticker ORDER BY label_date DESC LIMIT 1
    """), {"ticker": ticker}).mappings().fetchone()

    # Latest estimate
    latest_est = conn.execute(text("""
        SELECT * FROM analyst_estimates WHERE symbol = :ticker ORDER BY report_date DESC LIMIT 1
    """), {"ticker": ticker}).mappings().fetchone()

    # Grades summary (latest grades_historical)
    grades_summary = conn.execute(text("""
        SELECT * FROM grades_historical WHERE symbol = :ticker ORDER BY rating_date DESC LIMIT 1
    """), {"ticker": ticker}).mappings().fetchone()

    # Key metrics (latest)
    key_metrics = conn.execute(text("""
        SELECT * FROM key_metrics WHERE ticker = :ticker ORDER BY date DESC LIMIT 1
    """), {"ticker": ticker}).mappings().fetchone()

    # News: last 7 days
    news = [dict(row) for row in conn.execute(text("""
        SELECT * FROM stock_news WHERE symbol = :ticker AND published_date >= :week_ago ORDER BY published_date DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]

    return {
        "ticker": ticker,
        "snapshot": snapshot,
        "previous_allocation_pct": previous_allocation_pct,
        "profile_summary": profile_summary,
        "weekly": weekly,
        "daily": daily,
        "quarterly": quarterly,
        "annual": annual,
        "yearly_return_pct": yearly_return_pct,
        "latest_label": dict(latest_label) if latest_label else None,
        "latest_est": dict(latest_est) if latest_est else None,
        "grades_summary": dict(grades_summary) if grades_summary else None,
        "key_metrics": dict(key_metrics) if key_metrics else None,
        "news": news
    }

def test_gradio_api():
    """Test using Gradio's built-in API endpoints"""
    print("Testing Gradio's built-in API endpoints...")
    
    # Test the main prediction endpoint using Gradio's API
    test_data = {
        "ticker": "AAPL",
        "snapshot": "2025-01-01",
        "previous_allocation_pct": 0.05
    }
    
    # Gradio's API expects the data in a specific format
    payload = {
        "data": [json.dumps(test_data)]
    }
    
    print(f"Sending request to {BASE_URL}/api/predict/...")
    try:
        r = requests.post(f"{BASE_URL}/api/predict/", json=payload, timeout=60)
        print("PREDICT:", r.status_code)
        
        if r.status_code == 200:
            response = r.json()
            print("Response:")
            print(json.dumps(response, indent=2))
        else:
            print(f"Error: {r.status_code}")
            print(r.text[:500])
    except Exception as e:
        print(f"Error: {e}")

def test_gradio_interface():
    """Test using Gradio's interface directly"""
    print("Testing Gradio's interface directly...")
    
    # Get a real ticker from the database
    with engine.connect() as conn:
        # Get the first ticker that has some data
        result = conn.execute(text("""
            SELECT ticker FROM tickers 
            WHERE ticker IN (
                SELECT DISTINCT ticker FROM prices 
                WHERE ticker IN (SELECT DISTINCT ticker FROM allocations)
            )
            ORDER BY ticker 
            LIMIT 1
        """))
        ticker_row = result.fetchone()
        
        if not ticker_row:
            print("No tickers found with sufficient data")
            return
            
        ticker = ticker_row[0]
        print(f"Testing with ticker: {ticker}")
        
        # Build the full data structure
        full_data = get_full_data_for_ticker(conn, ticker)
        
        print(f"Data summary for {ticker}:")
        print(f"  - Snapshot: {full_data['snapshot']}")
        print(f"  - Previous allocation: {full_data['previous_allocation_pct']}")
        print(f"  - Weekly data points: {len(full_data['weekly']['allocations'])} allocations, {len(full_data['weekly']['grades_historical'])} grades")
        print(f"  - Daily data points: {len(full_data['daily']['prices'])} prices, {len(full_data['daily']['stock_news'])} news")
        
        # Test using Gradio's interface
        data_json = json.dumps(full_data, cls=DateEncoder)
        
        print(f"\nSending request to {BASE_URL}/run/predict...")
        try:
            r = requests.post(f"{BASE_URL}/run/predict", json={"data": [data_json]}, timeout=60)
            print("PREDICT:", r.status_code)
            
            if r.status_code == 200:
                response = r.json()
                print("Response:")
                print(json.dumps(response, indent=2))
            else:
                print(f"Error: {r.status_code}")
                print(r.text[:500])
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing Hugging Face Space endpoints...")
    print("=" * 50)
    
    test_gradio_api()
    print("\n" + "=" * 50)
    test_gradio_interface()
