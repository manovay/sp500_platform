from datetime import date
import requests
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert
from dotenv import load_dotenv
import time
import os

# Load environment with override
load_dotenv(override=True)

# Configuration
# Define a delay to stay within API rate limits
API_REQUEST_DELAY = 0.21  # seconds

DATABASE_URL = os.getenv('DATABASE_URL')
FMP_API_KEY = os.getenv('FMP_API_KEY')

# SQLAlchemy setup
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()
metadata = MetaData()
metadata.reflect(bind=engine)

tickers_table = metadata.tables['tickers']
analyst_labels_table = metadata.tables['analyst_labels']

def fetch_and_upsert_analyst_labels():
    today = date.today()
    inserted = updated = skipped = 0

    # Retrieve all tickers
    tickers = [t[0] for t in session.query(tickers_table.c.ticker).all()]

    for ticker in tickers:
        url = (
            f"https://financialmodelingprep.com/stable/ratings-snapshot"
            f"?symbol={ticker}&apikey={FMP_API_KEY}"
        )
        try:
            response = requests.get(url)
            print(f"Fetching analyst labels for {ticker}...")
            time.sleep(API_REQUEST_DELAY) # Respect API rate limit
            response.raise_for_status()
            data = response.json()

            # Validate response structure
            if not data or not isinstance(data, list):
                skipped += 1
                print(f"  -> Skipped {ticker}: No data or invalid format from API.")
                continue

            snapshot = data[0]
            # Extract all relevant fields
            rating                     = snapshot.get('rating')
            overall_score              = snapshot.get('overallScore')
            discounted_cash_flow_score = snapshot.get('discountedCashFlowScore')
            return_on_equity_score     = snapshot.get('returnOnEquityScore')
            return_on_assets_score     = snapshot.get('returnOnAssetsScore')
            debt_to_equity_score       = snapshot.get('debtToEquityScore')
            price_to_earnings_score    = snapshot.get('priceToEarningsScore')
            price_to_book_score        = snapshot.get('priceToBookScore')

            # Skip if no overall score available
            if overall_score is None:
                skipped += 1
                print(f"  -> Skipped {ticker}: No overall score available.")
                continue

            # Build upsert statement
            stmt = insert(analyst_labels_table).values(
                ticker=ticker,
                label_date=today,
                rating=rating,
                overall_score=overall_score,
                discounted_cash_flow_score=discounted_cash_flow_score,
                return_on_equity_score=return_on_equity_score,
                return_on_assets_score=return_on_assets_score,
                debt_to_equity_score=debt_to_equity_score,
                price_to_earnings_score=price_to_earnings_score,
                price_to_book_score=price_to_book_score,
                source='FMP'
            ).on_conflict_do_update(
                index_elements=['ticker', 'label_date'],
                set_={
                    'rating': rating,
                    'overall_score': overall_score,
                    'discounted_cash_flow_score': discounted_cash_flow_score,
                    'return_on_equity_score': return_on_equity_score,
                    'return_on_assets_score': return_on_assets_score,
                    'debt_to_equity_score': debt_to_equity_score,
                    'price_to_earnings_score': price_to_earnings_score,
                    'price_to_book_score': price_to_book_score,
                    'source': 'FMP'
                }
            )

            result = session.execute(stmt)
            if result.rowcount == 1:
                inserted += 1
            else:
                updated += 1
            print(f"  -> Successfully processed analyst labels for {ticker}.")

        except Exception as e:
            session.rollback()
            print(f"  -> Error processing analyst labels for {ticker}: {e}")
            skipped += 1

    session.commit()
    print(f"✅ Analyst labels: Inserted={inserted}, Updated={updated}, Skipped={skipped}")
    session.close()

if __name__ == '__main__':
    fetch_and_upsert_analyst_labels()
