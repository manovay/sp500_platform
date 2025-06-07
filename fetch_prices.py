import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Date, Numeric, BigInteger
from sqlalchemy.orm import declarative_base, sessionmaker
import requests

# Load environment variables
load_dotenv(override=True)
FMP_API_KEY = os.getenv('FMP_API_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')

if not FMP_API_KEY or not DATABASE_URL:
    raise ValueError("FMP_API_KEY and DATABASE_URL must be set in .env file")

# SQLAlchemy setup
Base = declarative_base()
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# ORM model for prices table
class Price(Base):
    __tablename__ = 'prices'
    ticker = Column(String(10), primary_key=True)
    price_date = Column(Date, primary_key=True)
    open_price = Column(Numeric(12,4))
    high_price = Column(Numeric(12,4))
    low_price = Column(Numeric(12,4))
    close_price = Column(Numeric(12,4))
    volume = Column(BigInteger)

# ORM model for tickers table (to fetch tickers)
class Ticker(Base):
    __tablename__ = 'tickers'
    ticker = Column(String(10), primary_key=True)


def fetch_and_upsert_prices():
    session = Session()
    try:
        # Get first 5 tickers from the database
        tickers = session.query(Ticker.ticker).limit(5).all()
        tickers = [t[0] for t in tickers]
        total_upserts = 0
        
        for symbol in tickers:
            url = f"https://financialmodelingprep.com/stable/historical-price-eod/full?symbol={symbol}&apikey={FMP_API_KEY}"
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, list):
                print(f"Unexpected response for {symbol}: {data}")
                continue
            upserts = 0
            for record in data:
                try:
                    price = Price(
                        ticker=record['symbol'],
                        price_date=datetime.strptime(record['date'], '%Y-%m-%d').date(),
                        open_price=record.get('open'),
                        high_price=record.get('high'),
                        low_price=record.get('low'),
                        close_price=record.get('close'),
                        volume=record.get('volume')
                    )
                    session.merge(price)
                    upserts += 1
                except Exception as e:
                    print(f"Error processing record for {symbol} on {record.get('date')}: {e}")
            print(f"{symbol}: Upserted {upserts} price records.")
            total_upserts += upserts
        session.commit()
        print(f"✅ Total price records upserted: {total_upserts}")
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    fetch_and_upsert_prices() 