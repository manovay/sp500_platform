
import os
import time
import requests
from datetime import date, timedelta, datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Date
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables
load_dotenv(override=True)
DATABASE_URL = os.getenv('DATABASE_URL')
FMP_API_KEY = os.getenv('FMP_API_KEY')

if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

# Create SQLAlchemy base and engine
Base = declarative_base()
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# Define Ticker model
class Ticker(Base):
    __tablename__ = 'tickers'
    
    ticker = Column(String(10), primary_key=True)
    company_name = Column(String, nullable=False)
    sector = Column(String)
    date_added = Column(Date)

def fetch(from_date):
    # from_date is ignored for tickers, but kept for interface consistency
    session = Session()
    today = date.today()
    try:
        url = f"https://financialmodelingprep.com/api/v3/sp500_constituent?apikey={FMP_API_KEY}"
        print(f"Fetching S&P 500 constituents list from API...")
        response = requests.get(url)
        response.raise_for_status()
        tickers_data = response.json()
        updated_count = 0
        for ticker_data in tickers_data:
            print(f"  Processing for DB: {ticker_data.get('symbol', 'N/A')} - {ticker_data.get('name', 'N/A')}")
            ticker = Ticker(
                ticker=ticker_data['ticker'],
                company_name=ticker_data['company_name'],
                sector=ticker_data['sector'],
                date_added=today
            )
            session.merge(ticker)
            updated_count += 1
        session.commit()
        print(f"\u2705 Successfully processed {updated_count} tickers")
    except requests.RequestException as e:
        print(f"Error fetching data from API: {str(e)}")
        session.rollback()
        raise
    except Exception as e:
        print(f"Error processing data: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    default_from_date = (date.today() - timedelta(days=365*3)).isoformat()
    fetch(default_from_date) 
