import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Date, JSON, PrimaryKeyConstraint
from sqlalchemy.orm import declarative_base, sessionmaker
import requests
import time

# Load environment variables
load_dotenv(override=True)
FMP_API_KEY = os.getenv('FMP_API_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')

if not FMP_API_KEY or not DATABASE_URL:
    raise ValueError("FMP_API_KEY and DATABASE_URL must be set in .env file")

# Create SQLAlchemy base and engine
Base = declarative_base()
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# Define KeyMetric model
class KeyMetric(Base):
    __tablename__ = 'key_metrics'
    ticker = Column(String(10), nullable=False)
    date = Column(Date, nullable=False)
    metrics = Column(JSON, nullable=False)
    __table_args__ = (
        PrimaryKeyConstraint('ticker', 'date'),
    )

API_REQUEST_DELAY = 0.21  # seconds (for ~285 requests per minute)

def fetch_and_upsert_metrics():
    session = Session()
    try:
        # Get all tickers from the tickers table
        tickers = session.execute('SELECT ticker FROM tickers').fetchall()
        tickers = [row[0] for row in tickers]
        print(f"Found {len(tickers)} tickers in DB.")
        for ticker in tickers:
            url = f"https://financialmodelingprep.com/api/v3/key-metrics/{ticker}?period=annual&limit=3&apikey={FMP_API_KEY}"
            print(f"Fetching key metrics for {ticker}...")
            response = requests.get(url)
            time.sleep(API_REQUEST_DELAY)  # Respect API rate limit
            if response.status_code != 200:
                print(f"  Error fetching {ticker}: {response.status_code}")
                continue
            metrics_data = response.json()
            for entry in metrics_data:
                date_str = entry.get('date')
                if not date_str:
                    continue
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                metric = KeyMetric(
                    ticker=ticker,
                    date=date_obj,
                    metrics=entry
                )
                session.merge(metric)
            session.commit()
            print(f"  Upserted {len(metrics_data)} records for {ticker}")
    except Exception as e:
        print(f"Error: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    fetch_and_upsert_metrics()
