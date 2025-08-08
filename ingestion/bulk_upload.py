import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from pathlib import Path

def init_database():
    # Load environment variables from .env file
    load_dotenv(override=True)
    database_url = os.getenv('DATABASE_URL')
    print("Using DATABASE_URL =", database_url)
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is not set")
    engine = create_engine(database_url)
    # Read schema.sql file
    schema_path = Path(__file__).parent / 'schema.sql'
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    # Execute schema.sql
    with engine.connect() as connection:
        connection.execute(text(schema_sql))
        connection.commit()
    print(" Database schema created successfully")
    seed_sql = """
INSERT INTO ingestion_metadata (table_name, frequency, script_name, last_run_date)
VALUES
  ('tickers',           'quarterly', 'fetch_tickers.py', '2025-06-11'),
  ('prices',            'daily',     'fetch_prices.py', '2025-06-11'),
  ('analyst_labels',    'daily',     'fetch_analyst_labels.py', '2025-06-11'),
  ('analyst_estimates', 'quarterly', 'fetch_analyst_estimates.py', '2025-06-11'),
  ('grades_historical', 'weekly',    'fetch_historical_analyst.py', '2025-06-11'),
  ('stock_news',        'daily',     'fetch_stock_news.py', '2025-06-11'),
  ('key_metrics',       'annual',    'fetch_metrics.py', '2025-06-11'),
  ('profiles',          'annual',    'fetch_profile.py', '2025-06-11'),
  ('allocations',       'weekly',    'fetch_historical_market_cap.py', '2025-06-11'),
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
    print(" ingestion_metadata seeded successfully")

def upload_csv_to_table(csv_path, table_name, conn):
    with conn.cursor() as cur:
        with open(csv_path, 'r', encoding='utf-8') as f:
            cur.copy_expert(f"COPY {table_name} FROM STDIN WITH CSV HEADER", f)
    conn.commit()
    print(f"Uploaded {csv_path} to {table_name} using COPY.")

def main():
    init_database()
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(DATABASE_URL)
    csv_table_map = {
        "tickers.csv": "tickers",  # <-- must be first!
        "allocations.csv": "allocations",
        "analyst_estimates.csv": "analyst_estimates",
        "analyst_labels.csv": "analyst_labels",
        "grades_historical.csv": "grades_historical",
        "key_metrics.csv": "key_metrics",
        "prices.csv": "prices",
        "profiles.csv": "profiles",
        "stock_news.csv": "stock_news",
    }
    for csv, table in csv_table_map.items():
        print(f"Uploading {csv} to {table}...")
        upload_csv_to_table(f"ingestion/csvs/{csv}", table, conn)
    # with conn.cursor() as cur:
    #     cur.execute("SELECT ticker FROM tickers LIMIT 10;")
    #     print("First 10 tickers in DB:", cur.fetchall())
    conn.close()

if __name__ == "__main__":
    main()
