import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from pathlib import Path
import importlib
from datetime import date, timedelta, datetime

def drop_all_tables():
    """Drop all tables to start fresh"""
    load_dotenv(override=True)
    database_url = os.getenv('DATABASE_URL')
    engine = create_engine(database_url)
    
    print("🗑️  Dropping all existing tables...")
    with engine.connect() as connection:
        # Drop all tables in the correct order (respecting foreign keys)
        drop_sql = """
        DROP TABLE IF EXISTS 
            weekly_llm_data,
            predictions,
            stock_news,
            profiles,
            prices,
            key_metrics,
            grades_historical,
            analyst_labels,
            analyst_estimates,
            allocations,
            tickers,
            ingestion_metadata
        CASCADE;
        """
        connection.execute(text(drop_sql))
        connection.commit()
    print("✅ All tables dropped successfully")

def init_database():
    """Initialize fresh database with schema and metadata"""
    load_dotenv(override=True)
    database_url = os.getenv('DATABASE_URL')
    print("Using DATABASE_URL =", database_url)
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")
    
    engine = create_engine(database_url)
    
    # Read and execute schema.sql
    schema_path = Path(__file__).parent / 'schema.sql'
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    with engine.connect() as connection:
        connection.execute(text(schema_sql))
        connection.commit()
    print("✅ Database schema created successfully")
    
    # Seed ingestion_metadata with the actual last run dates you provided
    seed_sql = """
    INSERT INTO ingestion_metadata (table_name, frequency, script_name, last_run_date)
    VALUES
      ('tickers',           'quarterly', 'fetch_tickers.py', '2025-06-11'),
      ('prices',            'daily',     'fetch_prices.py', '2025-06-11'),
      ('analyst_labels',    'daily',     'fetch_analyst_labels.py', '2025-06-11'),
      ('analyst_estimates', 'quarterly', 'fetch_analyst_estimates.py', '2025-06-13'),
      ('grades_historical', 'weekly',    'fetch_historical_analyst.py', '2025-06-01'),
      ('stock_news',        'daily',     'fetch_stock_news.py', '2025-06-11'),
      ('key_metrics',       'annual',    'fetch_metrics.py', '2025-06-13'),
      ('profiles',          'annual',    'fetch_profile.py', '2025-06-11'),
      ('allocations',       'weekly',    'fetch_historical_market_cap.py', '2025-06-13'),
      ('predictions',       'weekly',    NULL, NULL),
      ('weekly_llm_data',   'weekly',    'fetch_weekly_llm.py', NULL)
    ON CONFLICT (table_name) DO UPDATE
      SET frequency = EXCLUDED.frequency,
          script_name = EXCLUDED.script_name,
          last_run_date = EXCLUDED.last_run_date;
    """
    with engine.connect() as conn:
        conn.execute(text(seed_sql))
        conn.commit()
    print("✅ ingestion_metadata seeded with actual last run dates")

def upload_csv_to_table(csv_path, table_name, conn):
    """Upload CSV data to table"""
    with conn.cursor() as cur:
        with open(csv_path, 'r', encoding='utf-8') as f:
            cur.copy_expert(f"COPY {table_name} FROM STDIN WITH CSV HEADER", f)
    conn.commit()
    print(f" Uploaded {csv_path} to {table_name}")

def upload_current_data():
    """Upload all current CSV data"""
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(DATABASE_URL)
    
    csv_table_map = {
        "tickers.csv": "tickers",  # Must be first!
        "allocations.csv": "allocations",
        "analyst_estimates.csv": "analyst_estimates",
        "analyst_labels.csv": "analyst_labels",
        "grades_historical.csv": "grades_historical",
        "key_metrics.csv": "key_metrics",
        "prices.csv": "prices",
        "profiles.csv": "profiles",
        "stock_news.csv": "stock_news",
    }
    
    print("📥 Uploading current CSV data...")
    for csv, table in csv_table_map.items():
        csv_path = f"ingestion/csvs/{csv}"
        if os.path.exists(csv_path):
            print(f"  Uploading {csv} to {table}...")
            upload_csv_to_table(csv_path, table, conn)
        else:
            print(f"  ⚠️  {csv} not found, skipping...")
    
    conn.close()
    print("✅ Current data upload complete")

def run_all_fetch_scripts():
    """Run the fetch scripts to update data"""
    print("🔄 Running fetch scripts to update data...")
    
    # Import and run the same logic as run_all_fetch_scripts.py
    FETCH_MODULES = [
        ("fetch_tickers", "tickers"),
        ("fetch_prices", "prices"),
        ("fetch_historical_market_cap", "allocations"),
        ("fetch_metrics", "key_metrics"),
        ("fetch_profile", "profiles"),
        ("fetch_analyst_labels", "analyst_labels"),
        ("fetch_analyst_estimates", "analyst_estimates"),
        ("fetch_historical_analyst", "grades_historical"),
        ("fetch_stock_news", "stock_news")
    ]
    
    FREQUENCY_TO_DAYS = {
        "daily": 1,
        "weekly": 7,
        "quarterly": 90,
        "annual": 365,
        "manual": 0,
    }
    
    engine = create_engine(os.getenv('DATABASE_URL'))
    
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

def main():
    """Main function: Delete DB, upload current data, then update"""
    print("🚀 Starting complete database refresh process...")
    
    # Step A: Delete current database
    drop_all_tables()
    
    # Step B: Upload current data
    init_database()
    upload_current_data()
    
    # Step C: Update using run_all logic
    run_all_fetch_scripts()
    
    print("\n🎉 Complete database refresh process finished!")

if __name__ == "__main__":
    main()
