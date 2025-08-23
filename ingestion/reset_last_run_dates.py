import os
from datetime import date, timedelta
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv(override=True)
DATABASE_URL = os.getenv('DATABASE_URL')

engine = create_engine(DATABASE_URL)

# Scripts to reset
SCRIPTS = [
    "fetch_tickers.py",
    "fetch_prices.py", 
    "fetch_historical_market_cap.py",
    "fetch_metrics.py",
    "fetch_profile.py",
    "fetch_analyst_labels.py",
    "fetch_analyst_estimates.py",
    "fetch_historical_analyst.py",
    "fetch_stock_news.py"
]

def reset_last_run_dates():
    with engine.connect() as conn:
        for script in SCRIPTS:
            # Set last_run_date to 3 years ago to force re-run
            old_date = (date.today() - timedelta(days=365*3)).isoformat()
            conn.execute(
                text("UPDATE ingestion_metadata SET last_run_date = :old_date WHERE script_name = :script"),
                {"old_date": old_date, "script": script}
            )
            print(f"Reset {script} last_run_date to {old_date}")
        conn.commit()
        print("✅ All last_run_dates reset successfully!")

if __name__ == "__main__":
    reset_last_run_dates()
