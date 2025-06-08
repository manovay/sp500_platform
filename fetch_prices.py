import os
from datetime import date, timedelta, datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Date, Numeric, BigInteger
from sqlalchemy.orm import declarative_base, sessionmaker
import time
import requests

# Load environment variables
load_dotenv(override=True)
FMP_API_KEY  = os.getenv('FMP_API_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')

if not FMP_API_KEY or not DATABASE_URL:
    raise ValueError("FMP_API_KEY and DATABASE_URL must be set in .env file")

# Define a delay to stay within API rate limits (e.g., FMP allows 300 req/min -> 5 req/sec -> 0.2s/req)
API_REQUEST_DELAY = 0.21  # seconds (for ~285 requests per minute)

# SQLAlchemy setup
Base = declarative_base()
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# ORM model for prices table
class Price(Base):
    __tablename__ = 'prices'
    ticker      = Column(String(10), primary_key=True)
    price_date  = Column(Date,      primary_key=True)
    open_price  = Column(Numeric(12,4))
    high_price  = Column(Numeric(12,4))
    low_price   = Column(Numeric(12,4))
    close_price = Column(Numeric(12,4))
    volume      = Column(BigInteger)

# ORM model for tickers table (to fetch tickers)
class Ticker(Base):
    __tablename__ = 'tickers'
    ticker = Column(String(10), primary_key=True)

def fetch_and_upsert_prices():
    session = Session()
    try:
        today = date.today()
        three_years_ago = today - timedelta(days=365*3)

        # Get all tickers from the database
        tickers = [t[0] for t in session.query(Ticker.ticker).all()]
        total_upserts = 0
        print(f"Found {len(tickers)} tickers to process for price data.")

        for symbol in tickers:
            # Format dates for the API query
            from_date_str = three_years_ago.isoformat()
            to_date_str = today.isoformat()

            # Updated URL to fetch only the required date range
            # Using /api/v3/historical-price-full/ which is documented to support from/to
            url = f"https://financialmodelingprep.com/api/v3/historical-price-full/{symbol}?from={from_date_str}&to={to_date_str}&apikey={FMP_API_KEY}"

            print(f"\nFetching prices for {symbol} (from {from_date_str} to {to_date_str})...")
            response = requests.get(url)
            time.sleep(API_REQUEST_DELAY) # Respect API rate limit
            response.raise_for_status()

            print(f"  Parsing JSON response for {symbol}...")
            data_response = response.json()
            print(f"  Finished parsing JSON for {symbol}.")

            # FMP API for single symbol history usually returns: {"symbol": "XYZ", "historical": [...]}
            if isinstance(data_response, dict) and 'historical' in data_response:
                historical_data = data_response['historical']
            elif isinstance(data_response, list): # Fallback if it's a direct list (less common for single symbol with date range)
                historical_data = data_response
            else:
                print(f"  Unexpected JSON structure for {symbol}: {type(data_response)}. Skipping.")
                continue

            if not historical_data:
                print(f"  No historical price data returned for {symbol} in the date range.")
                continue

            print(f"  Processing {len(historical_data)} price records for {symbol}...")
            upserts = 0
            for record_idx, record in enumerate(historical_data):
                # parse the record date
                record_date_str = record.get('date')
                if not record_date_str:
                    print(f"    Skipping record for {symbol} (index {record_idx}) due to missing date: {record}")
                    continue
                try:
                    record_date = datetime.strptime(record_date_str, '%Y-%m-%d').date()
                    price = Price(
                        ticker      = symbol, # Use the symbol from the outer loop, as 'historical' items might not have it
                        price_date  = record_date,
                        open_price  = record.get('open'),
                        high_price  = record.get('high'),
                        low_price   = record.get('low'),
                        close_price = record.get('close'),
                        volume      = record.get('volume') # FMP 'historical-price-full' uses 'volume'
                    )
                    session.merge(price)
                    upserts += 1
                except Exception as e:
                    print(f"    Error processing record for {symbol} on {record_date_str} (index {record_idx}): {e}")

            session.commit() # Commit after processing all records for the current ticker
            print(f"  {symbol}: Upserted and committed {upserts} price records.")
            total_upserts += upserts

        # session.commit() # Final commit is redundant if committing per ticker
        print(f"\n✅ Finished processing all tickers. Total price records upserted: {total_upserts}")
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    fetch_and_upsert_prices()
