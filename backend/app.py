# Readability - Once app is live, go through and check to see if there any unused functions (i bet there are)
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from scripts import run_fetch

# Load environment variables before anything else
load_dotenv(override=True)

app = Flask(__name__)
CORS(app, origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")])

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL is not set! Check your .env file or environment variables.")
engine = create_engine(DATABASE_URL)


@app.route("/api/stocks", methods=["GET"])
def api_stocks():
    """List all tickers with company name and sector"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT ticker, company_name, sector FROM tickers ORDER BY ticker
        """))
        stocks = [dict(row) for row in result.mappings()]
        return jsonify({"status": "ok", "stocks": stocks})

@app.route("/api/stocks/<ticker>/info", methods=["GET"])
def api_stock_info(ticker):
    """Basic info for a ticker: name, sector, profile"""
    with engine.connect() as conn:
        ticker_row = conn.execute(text("""
            SELECT ticker, company_name, sector FROM tickers WHERE ticker = :ticker
        """), {"ticker": ticker}).mappings().fetchone()
        profile_row = conn.execute(text("""
            SELECT profile_data FROM profiles WHERE ticker = :ticker
        """), {"ticker": ticker}).fetchone()
        info = dict(ticker_row) if ticker_row else {}
        if profile_row:
            info["profile"] = profile_row[0]
        return jsonify({"status": "ok", "info": info})

@app.route("/api/stocks/<ticker>/prices", methods=["GET"])
def api_stock_prices(ticker):
    """Recent prices for a ticker (last 30 days)"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT price_date, open_price, high_price, low_price, close_price, volume
            FROM prices
            WHERE ticker = :ticker
            ORDER BY price_date DESC
            LIMIT 30
        """), {"ticker": ticker})
        prices = [dict(row) for row in result.mappings()]
        return jsonify({"status": "ok", "prices": prices})

@app.route("/api/stocks/<ticker>/analyst-labels", methods=["GET"])
def api_stock_analyst_labels(ticker):
    """Latest analyst label for a ticker"""
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT * FROM analyst_labels WHERE ticker = :ticker ORDER BY label_date DESC LIMIT 1
        """), {"ticker": ticker}).mappings().fetchone()
        label = dict(row) if row else None
        return jsonify({"status": "ok", "analyst_labels": label})

@app.route("/api/stocks/<ticker>/key-metrics", methods=["GET"])
def api_stock_key_metrics(ticker):
    """Latest key metrics for a ticker"""
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT metrics, date FROM key_metrics WHERE ticker = :ticker ORDER BY date DESC LIMIT 1
        """), {"ticker": ticker}).mappings().fetchone()
        metrics = dict(row) if row else None
        return jsonify({"status": "ok", "key_metrics": metrics})

@app.route("/api/stocks/<ticker>/news", methods=["GET"])
def api_stock_news(ticker):
    """Recent news for a ticker (last 10 articles)"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT url, published_date, publisher, title, site, text
            FROM stock_news
            WHERE symbol = :ticker
            ORDER BY published_date DESC
            LIMIT 10
        """), {"ticker": ticker})
        news = [dict(row) for row in result.mappings()]
        return jsonify({"status": "ok", "news": news})

@app.route("/api/stocks/<ticker>/full-data", methods=["GET"])
def api_stock_full_data(ticker):
    """Return a packed JSON object with all relevant slices for the frontend prompt."""
    with engine.connect() as conn:
        # Get latest snapshot date (use latest allocation_date as snapshot)
        snapshot_row = conn.execute(text("""
            SELECT MAX(allocation_date) as snapshot FROM allocations WHERE ticker = :ticker
        """), {"ticker": ticker}).mappings().fetchone()
        snapshot = snapshot_row["snapshot"].isoformat() if snapshot_row and snapshot_row["snapshot"] else None

        # Previous allocation pct (previous week)
        prev_alloc_row = conn.execute(text("""
            SELECT allocation_pct FROM allocations WHERE ticker = :ticker ORDER BY allocation_date DESC OFFSET 1 LIMIT 1
        """), {"ticker": ticker}).mappings().fetchone()
        previous_allocation_pct = float(prev_alloc_row["allocation_pct"]) if prev_alloc_row else None

        # Profile summary (from profiles)
        profile_row = conn.execute(text("""
            SELECT profile_data FROM profiles WHERE ticker = :ticker ORDER BY date_fetched DESC LIMIT 1
        """), {"ticker": ticker}).fetchone()
        profile_summary = profile_row[0] if profile_row else None

        # Weekly: grades_historical, allocations, predictions (last 4 weeks)
        weekly = {}
        weekly["grades_historical"] = [dict(row) for row in conn.execute(text("""
            SELECT * FROM grades_historical WHERE symbol = :ticker ORDER BY rating_date DESC LIMIT 4
        """), {"ticker": ticker}).mappings()]
        weekly["allocations"] = [dict(row) for row in conn.execute(text("""
            SELECT * FROM allocations WHERE ticker = :ticker ORDER BY allocation_date DESC LIMIT 4
        """), {"ticker": ticker}).mappings()]
        weekly["predictions"] = [dict(row) for row in conn.execute(text("""
            SELECT * FROM predictions WHERE request_data->>'ticker' = :ticker ORDER BY created_at DESC LIMIT 4
        """), {"ticker": ticker}).mappings()]

        # Daily: prices, analyst_labels, stock_news (last 7 days)
        daily = {}
        daily["prices"] = [dict(row) for row in conn.execute(text("""
            SELECT * FROM prices WHERE ticker = :ticker ORDER BY price_date DESC LIMIT 7
        """), {"ticker": ticker}).mappings()]
        daily["analyst_labels"] = [dict(row) for row in conn.execute(text("""
            SELECT * FROM analyst_labels WHERE ticker = :ticker ORDER BY label_date DESC LIMIT 7
        """), {"ticker": ticker}).mappings()]
        daily["stock_news"] = [dict(row) for row in conn.execute(text("""
            SELECT * FROM stock_news WHERE symbol = :ticker ORDER BY published_date DESC LIMIT 7
        """), {"ticker": ticker}).mappings()]

        # Quarterly: tickers, analyst_estimates (last 4 quarters)
        quarterly = {}
        quarterly["tickers"] = [dict(row) for row in conn.execute(text("""
            SELECT * FROM tickers WHERE ticker = :ticker
        """), {"ticker": ticker}).mappings()]
        quarterly["analyst_estimates"] = [dict(row) for row in conn.execute(text("""
            SELECT * FROM analyst_estimates WHERE symbol = :ticker ORDER BY report_date DESC LIMIT 4
        """), {"ticker": ticker}).mappings()]

        # Annual: key_metrics, profiles (last 4 years)
        annual = {}
        annual["key_metrics"] = [dict(row) for row in conn.execute(text("""
            SELECT * FROM key_metrics WHERE ticker = :ticker ORDER BY date DESC LIMIT 4
        """), {"ticker": ticker}).mappings()]
        annual["profiles"] = [dict(row) for row in conn.execute(text("""
            SELECT * FROM profiles WHERE ticker = :ticker ORDER BY date_fetched DESC LIMIT 4
        """), {"ticker": ticker}).mappings()]

        # Yearly return pct (from prices, 1 year ago vs now)
        price_now_row = conn.execute(text("""
            SELECT close_price FROM prices WHERE ticker = :ticker ORDER BY price_date DESC LIMIT 1
        """), {"ticker": ticker}).mappings().fetchone()
        price_year_ago_row = conn.execute(text("""
            SELECT close_price FROM prices WHERE ticker = :ticker AND price_date <= (SELECT MAX(price_date) FROM prices WHERE ticker = :ticker) - INTERVAL '1 year' ORDER BY price_date DESC LIMIT 1
        """), {"ticker": ticker}).mappings().fetchone()
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
            SELECT * FROM stock_news WHERE symbol = :ticker AND published_date >= (CURRENT_DATE - INTERVAL '7 days') ORDER BY published_date DESC
        """), {"ticker": ticker}).mappings()]

        return jsonify({
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
        })

@app.route("/api/run-fetch", methods=["POST"])
def api_run_fetch():
    """Endpoint to trigger data updates"""
    payload = request.get_json(silent=True) or {}
    freq = payload.get("freq")
    if freq not in {"daily", "weekly", "quarterly", "annual"}:
        return jsonify({"status": "error", "error": "Invalid frequency"}), 400
    try:
        log = run_fetch(freq)
        log_message = f"[INFO] Fetch script for frequency '{freq}' was triggered."
        return jsonify({"status": "ok", "log": log_message + "\n" + log})
    except Exception as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
