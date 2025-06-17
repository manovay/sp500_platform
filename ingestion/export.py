#!/usr/bin/env python3
import os
import psycopg2

# ———— Config (match your docker-compose) ————
DB_HOST     = "localhost"
DB_PORT     = 1111
DB_NAME     = "sp500_db"
DB_USER     = "manovay"
DB_PASSWORD = "Padhai007"

# List of tables from your schema.sql
TABLES = [
   "tickers",
   "prices",
   "analyst_labels",
   "analyst_estimates",
   "grades_historical",
   "stock_news",
   "key_metrics",
   "profiles",
    "allocations"
]

def main():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )
    try:
        for table in TABLES:
            filename = f"{table}.csv"
            print(f"Exporting {table} → {filename} …", end="", flush=True)
            with conn.cursor() as cur, open(filename, "w", newline="") as f:
                cur.copy_expert(f"COPY {table} TO STDOUT WITH CSV HEADER", f)
            print(" done.")
    finally:
        conn.close()
    print("✅ All tables exported.")

if __name__ == "__main__":
    main()
