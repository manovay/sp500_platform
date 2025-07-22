import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, text
import pandas as pd
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

# start scheduler to refresh data automatically
scheduler = BackgroundScheduler(timezone="UTC")
scheduler.add_job(lambda: run_fetch("daily"), CronTrigger(hour=0, minute=0))
scheduler.add_job(lambda: run_fetch("weekly"), CronTrigger(day_of_week="sun", hour=0, minute=0))
scheduler.add_job(lambda: run_fetch("quarterly"), CronTrigger(month="1,4,7,10", day=1, hour=0, minute=0))
scheduler.add_job(lambda: run_fetch("annual"), CronTrigger(month=1, day=1, hour=0, minute=0))
scheduler.start()

@app.route("/api/portfolio", methods=["GET"])
def api_portfolio():
    # Example: return current and recommended allocations for all tickers
    with engine.connect() as conn:
        # Get the latest allocation_date
        latest_date = conn.execute(text("SELECT MAX(allocation_date) FROM allocations")).scalar()
        if not latest_date:
            return jsonify({"allocations": []})
        # Get allocations for the latest date
        result = conn.execute(text("""
            SELECT ticker, allocation_pct*100 as current
            FROM allocations
            WHERE allocation_date = :latest_date
        """), {"latest_date": latest_date})
        allocations = [dict(row) for row in result]
        # Optionally, add a 'recommended' field (here just a dummy example)
        for row in allocations:
            row["recommended"] = row["current"]  # Replace with real logic if available
        return jsonify({"allocations": allocations})

@app.route("/api/ticker/<ticker>", methods=["GET"])
def api_ticker_details(ticker):
    with engine.connect() as conn:
        # Get allocation history for this ticker
        result = conn.execute(text("""
            SELECT allocation_date as date, allocation_pct*100 as value
            FROM allocations
            WHERE ticker = :ticker
            ORDER BY allocation_date
        """), {"ticker": ticker})
        history = [dict(row) for row in result]
        # Get latest metrics (dummy example, replace with real logic)
        metrics = {}
        metrics_result = conn.execute(text("""
            SELECT metrics FROM key_metrics WHERE ticker = :ticker ORDER BY date DESC LIMIT 1
        """), {"ticker": ticker})
        row = metrics_result.fetchone()
        if row:
            metrics = row[0] if isinstance(row[0], dict) else {}
        return jsonify({
            "ticker": ticker,
            "history": history,
            "metrics": metrics
        })

@app.route("/api/run-fetch", methods=["POST"])
def api_run_fetch():
    if request.headers.get("X-ADMIN-TOKEN") != os.getenv("ADMIN_TOKEN"):
        return jsonify({"status": "error", "error": "Forbidden"}), 403
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
