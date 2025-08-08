import os
import json
import requests
from datetime import date, timedelta, datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Custom JSON encoder to handle date and decimal objects
class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        elif hasattr(obj, '__float__'):  # Handle Decimal, Fraction, etc.
            return float(obj)
        return super().default(obj)

# Load environment variables
load_dotenv(override=True)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)

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

def call_hf_space(prompt):
    """
    Calls your HF Space inference endpoint.
    """
    # Your actual HF Space URL
    url = "https://mdot77-sp500llm.hf.space/infer"
    
    payload = {
        "prompt": prompt,
        "max_new_tokens": 256,
        "temperature": 0.0,
        "top_p": 1.0,
        "top_k": 50,
        "repetition_penalty": 1.0
    }
    
    try:
        resp = requests.post(url, json=payload, timeout=60)
        resp.raise_for_status()
        result = resp.json()
        return {"output": result["output"]}
    except Exception as e:
        print(f"Error calling HF Space: {e}")
        return {"error": f"HF Space API error: {str(e)}"}

def fetch(from_date):
    """
    Main fetch function - follows the same pattern as other fetch scripts.
    from_date is ignored for weekly LLM, but kept for interface consistency.
    """
    print("Starting weekly LLM prompts and responses generation")
    
    # Get current week start date (Monday)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # Monday of current week
    
    print(f" Processing week starting {week_start}")
    
    try:
        # Get all tickers
        with engine.connect() as conn:
            result = conn.execute(text("SELECT ticker FROM tickers ORDER BY ticker"))
            tickers = [row[0] for row in result]
        
        print(f" Found {len(tickers)} tickers to process")
        
        processed_count = 0
        
        with engine.connect() as conn:
            for i, ticker in enumerate(tickers):
                print(f"Processing {i+1}/{len(tickers)}: {ticker}")
                
                try:
                    # Check if already processed for this week
                    existing = conn.execute(text("""
                        SELECT id FROM weekly_llm_data 
                        WHERE ticker = :ticker AND week_start_date = :week_start
                    """), {"ticker": ticker, "week_start": week_start}).fetchone()
                    
                    if existing:
                        print(f" Already processed {ticker} for week {week_start}")
                        continue
                    
                    # Get full data for the ticker
                    full_data = get_full_data_for_ticker(conn, ticker)
                    
                    # Build prompt (same as your backend)
                    system_prompt = (
                        "[INST] <<SYS>>\n"
                        "You are a portfolio optimization assistant.\n\n"
                        "Return ONLY valid JSON matching this exact schema:\n"
                        "{\n"
                        "  \"ticker\": \"<string>\",\n"
                        "  \"snapshot\": \"<YYYY-MM-DD>\",\n"
                        "  \"verdict\": \"<Increase|Decrease|Hold|Add|Remove>\",\n"
                        "  \"new_alloc_pct\": <number>,\n"
                        "  \"reasoning\": \"<short explanation>\"\n"
                        "}\n\n"
                        "Never add extra keys or commentary.\n"
                        "Emit only JSON — no prose before or after.\n"
                        "<</SYS>>\n\n"
                        "TABLES (freq → table_name(columns)):\n"
                        "Quarterly → tickers(ticker, company_name, sector, date_added); analyst_estimates(...); \n"
                        "Daily → prices(...); analyst_labels(...); stock_news(...);\n"
                        "Weekly → grades_historical(...); allocations(...); predictions(...);\n"
                        "Annual → key_metrics(...); profiles(...).\n\n"
                        f"DATA:\n{json.dumps(full_data, ensure_ascii=False, cls=DateEncoder)}\n\n"
                        "Now output the JSON response.\n[/INST]"
                    )
                    
                    # Store prompt (initially with pending status)
                    result = conn.execute(text("""
                        INSERT INTO weekly_llm_data (ticker, week_start_date, prompt_data, status)
                        VALUES (:ticker, :week_start, :prompt_data, 'pending')
                        RETURNING id
                    """), {
                        "ticker": ticker,
                        "week_start": week_start,
                        "prompt_data": json.dumps(full_data, cls=DateEncoder)
                    })
                    record_id = result.fetchone()[0]
                    
                    # Call HF Space
                    print(f" Calling HF Space for {ticker}...")
                    hf_response = call_hf_space(system_prompt)
                    
                    # Update with response
                    conn.execute(text("""
                        UPDATE weekly_llm_data 
                        SET response_data = :response_data, status = 'completed', updated_at = NOW()
                        WHERE id = :id
                    """), {
                        "response_data": json.dumps(hf_response, cls=DateEncoder),
                        "id": record_id
                    })
                    
                    processed_count += 1
                    print(f" Completed {ticker}")
                    
                except Exception as e:
                    print(f" Error processing {ticker}: {e}")
                    # Update status to failed
                    try:
                        conn.execute(text("""
                            UPDATE weekly_llm_data 
                            SET status = 'failed', updated_at = NOW()
                            WHERE ticker = :ticker AND week_start_date = :week_start
                        """), {"ticker": ticker, "week_start": week_start})
                    except:
                        pass
                    continue
                
                # Commit after each ticker
                conn.commit()
        
        print(f" Weekly LLM processing completed!")
        print(f" Processed {processed_count} tickers for week {week_start}")
        
    except Exception as e:
        print(f" Weekly LLM processing failed: {e}")
        raise

if __name__ == "__main__":
    default_from_date = (date.today() - timedelta(days=365*3)).isoformat()
    fetch(default_from_date) 