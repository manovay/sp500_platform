import os
from datetime import date
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Date, JSON
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

# Define Profile model
class Profile(Base):
    __tablename__ = 'profiles'
    ticker = Column(String(10), primary_key=True)
    profile_data = Column(JSON, nullable=False)
    date_fetched = Column(Date, nullable=False)

API_REQUEST_DELAY = 0.21  # seconds (for ~285 requests per minute)

def fetch_and_upsert_profiles():
    session = Session()
    today = date.today()
    try:
        # Get all tickers from the tickers table
        tickers = session.execute('SELECT ticker FROM tickers').fetchall()
        tickers = [row[0] for row in tickers]
        print(f"Found {len(tickers)} tickers in DB.")
        for ticker in tickers:
            url = f"https://financialmodelingprep.com/api/v3/profile/{ticker}?apikey={FMP_API_KEY}"
            print(f"Fetching profile for {ticker}...")
            response = requests.get(url)
            time.sleep(API_REQUEST_DELAY)  # Respect API rate limit
            if response.status_code != 200:
                print(f"  Error fetching {ticker}: {response.status_code}")
                continue
            profile_data = response.json()
            if not profile_data or not isinstance(profile_data, list):
                print(f"  No profile data for {ticker}")
                continue
            profile = Profile(
                ticker=ticker,
                profile_data=profile_data[0],
                date_fetched=today
            )
            session.merge(profile)
        session.commit()
        print(f"✅ Successfully processed {len(tickers)} profiles")
    except Exception as e:
        print(f"Error: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    fetch_and_upsert_profiles()
