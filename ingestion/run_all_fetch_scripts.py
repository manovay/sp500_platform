import os
from datetime import date, timedelta, datetime
from dotenv import load_dotenv
import importlib
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv(override=True)
DATABASE_URL = os.getenv('DATABASE_URL')

# Map script names to their module names (without .py)
FETCH_MODULES = [
    ("fetch_tickers", "tickers"),
    ("fetch_prices", "prices"),
    ("fetch_historical_market_cap", "allocations"),
    ("fetch_metrics", "key_metrics"),
    ("fetch_profile", "profiles"),
    ("fetch_analyst_labels", "analyst_labels"),
    ("fetch_analyst_estimates", "analyst_estimates"),
    ("fetch_historical_analyst", "grades_historical"),
    ("fetch_stock_news", "stock_news"),
]

FREQUENCY_TO_DAYS = {
    "daily": 1,
    "weekly": 7,
    "quarterly": 90,
    "annual": 365,
    "manual": 0,  # always run if manual
}

engine = create_engine(DATABASE_URL)

def get_meta_info():
    with engine.connect() as conn:
        meta_info = {}
        for script, table in FETCH_MODULES:
            result = conn.execute(text("""
                SELECT frequency, last_run_date
                FROM ingestion_metadata
                WHERE script_name = :script
            """), {"script": f"{script}.py"})
            row = result.fetchone()
            if row:
                meta_info[script] = {
                    "frequency": row[0],
                    "last_run_date": row[1]
                }
            else:
                meta_info[script] = {
                    "frequency": "manual",
                    "last_run_date": (date.today() - timedelta(days=365*3)).isoformat()
                }
        return meta_info

def should_run_script(frequency, last_run_date):
    if last_run_date is None:
        return True
    freq_days = FREQUENCY_TO_DAYS.get(frequency, 1)
    try:
        last_run = last_run_date if isinstance(last_run_date, date) else datetime.strptime(str(last_run_date), "%Y-%m-%d").date()
    except Exception:
        last_run = date.today() - timedelta(days=365*3)
    days_since = (date.today() - last_run).days
    return days_since >= freq_days

def update_last_run_date(script):
    with engine.connect() as conn:
        conn.execute(
            text("UPDATE ingestion_metadata SET last_run_date = :today WHERE script_name = :script"),
            {"today": date.today().isoformat(), "script": f"{script}.py"}
        )
        conn.commit()

def main():
    print(f"\n[{datetime.now().isoformat()}] 🚀 Starting the scheduled data fetching pipeline...\n")
    meta_info = get_meta_info()
    for script, _ in FETCH_MODULES:
        freq = meta_info[script]["frequency"]
        last_run = meta_info[script]["last_run_date"]
        if should_run_script(freq, last_run):
            try:
                print(f"\n[{datetime.now().isoformat()}] --- Running {script}.py (frequency: {freq}, last_run_date: {last_run}) ---")
                module = importlib.import_module(f"ingestion.{script}")
                from_date = last_run if last_run else (date.today() - timedelta(days=365*3)).isoformat()
                print(f"[{datetime.now().isoformat()}] Calling fetch(from_date={from_date}) for {script}...")
                module.fetch(from_date)
                update_last_run_date(script)
                print(f"[{datetime.now().isoformat()}] --- {script}.py finished successfully and last_run_date updated ---")
            except Exception as e:
                print(f"[{datetime.now().isoformat()}] ❌ Error running {script}: {e}")
                break
        else:
            print(f"[{datetime.now().isoformat()}] ⏩ Skipping {script}.py (frequency: {freq}, last_run_date: {last_run}) - Not due yet.")
    print(f"\n[{datetime.now().isoformat()}] --- Pipeline Execution Summary ---")
    print(f"[{datetime.now().isoformat()}] 🎉 All due fetch modules executed (or stopped on error).\n")

if __name__ == "__main__":
    main()