
import os
from datetime import date
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Date
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables
load_dotenv(override=True)
DATABASE_URL = os.getenv('DATABASE_URL')

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

def fetch_and_upsert_tickers():
    session = Session()
    today = date.today()
    inserted = updated = 0
    
    # Test tickers with placeholder data
    test_tickers_data = [
        {'ticker': 'AAPL', 'company_name': 'Apple Inc.', 'sector': 'Technology'},
        {'ticker': 'MSFT', 'company_name': 'Microsoft Corporation', 'sector': 'Technology'},
        {'ticker': 'GOOGL', 'company_name': 'Alphabet Inc.', 'sector': 'Technology'},
        {'ticker': 'AMZN', 'company_name': 'Amazon.com Inc.', 'sector': 'Consumer Cyclical'},
        {'ticker': 'TSLA', 'company_name': 'Tesla Inc.', 'sector': 'Consumer Cyclical'}
    ]
    
    for ticker_data in test_tickers_data:
        try:
            ticker = Ticker(
                ticker=ticker_data['ticker'],
                company_name=ticker_data['company_name'],
                sector=ticker_data['sector'],
                date_added=today
            )
            
            session.merge(ticker)
            inserted += 1
            print(f"✅ Added/Updated {ticker_data['ticker']}")
            
        except Exception as e:
            print(f"❌ Error processing {ticker_data['ticker']}: {e}")
    
    session.commit()
    session.close()
    print(f"✅ Tickers processing complete. Inserted/Updated: {inserted}")

if __name__ == "__main__":
    fetch_and_upsert_tickers()
