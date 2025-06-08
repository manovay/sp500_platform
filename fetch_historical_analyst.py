from datetime import date, datetime, timedelta
import requests
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert
from dotenv import load_dotenv
import time
import os

# Load environment (override if already set)
load_dotenv(override=True)

# Configuration
# Define a delay to stay within API rate limits
API_REQUEST_DELAY = 0.21  # seconds

DATABASE_URL = os.getenv('DATABASE_URL')
FMP_API_KEY  = os.getenv('FMP_API_KEY')

# SQLAlchemy setup
engine   = create_engine(DATABASE_URL)
Session  = sessionmaker(bind=engine)
session  = Session()
metadata = MetaData()
metadata.reflect(bind=engine)

tickers_table           = metadata.tables['tickers']
grades_historical_table = metadata.tables['grades_historical']

def fetch_and_upsert_grades_historical():
    today      = date.today()
    cutoff     = today - timedelta(days=365*3)
    inserted = updated = skipped = 0

    # Retrieve all tickers
    tickers = [t[0] for t in session.query(tickers_table.c.ticker).all()]

    for ticker in tickers:
        url   = (
            f"https://financialmodelingprep.com/stable/grades-historical"
            f"?symbol={ticker}&apikey={FMP_API_KEY}"
        )
        try:
            resp = requests.get(url)
            print(f"Fetching historical grades for {ticker}...")
            time.sleep(API_REQUEST_DELAY) # Respect API rate limit
            resp.raise_for_status()
            data = resp.json()

            # Expecting a list of { symbol, date, analystRatingsBuy, … }
            if not data or not isinstance(data, list):
                skipped += 1
                print(f"  -> Skipped {ticker}: No data or invalid format from API for historical grades.")
                continue

            # Filter to last 3 years
            recent = [
                r for r in data
                if r.get("date") and datetime.fromisoformat(r.get("date")).date() >= cutoff
            ]
            if not recent:
                skipped += 1
                print(f"  -> No recent (last 3 years) historical grades found for {ticker}.")
                continue

            for rec in recent:
                stmt = insert(grades_historical_table).values(
                    symbol                      = rec.get("symbol"),
                    rating_date                 = rec.get("date"),
                    analyst_ratings_buy         = rec.get("analystRatingsBuy"),
                    analyst_ratings_hold        = rec.get("analystRatingsHold"),
                    analyst_ratings_sell        = rec.get("analystRatingsSell"),
                    analyst_ratings_strong_sell = rec.get("analystRatingsStrongSell"),
                    source                      = 'FMP'
                ).on_conflict_do_update(
                    index_elements=['symbol','rating_date'],
                    set_={
                      'analyst_ratings_buy':         rec.get("analystRatingsBuy"),
                      'analyst_ratings_hold':        rec.get("analystRatingsHold"),
                      'analyst_ratings_sell':        rec.get("analystRatingsSell"),
                      'analyst_ratings_strong_sell': rec.get("analystRatingsStrongSell"),
                      'source':                      'FMP'
                    }
                )

                result = session.execute(stmt)
                if result.rowcount == 1:
                    inserted += 1
                else:
                    updated += 1
            print(f"  -> Successfully processed {len(recent)} historical grade records for {ticker}.")

        except Exception as e:
            session.rollback()
            print(f"  -> Error processing historical grades for {ticker}: {e}")
            skipped += 1

    session.commit()
    print(f"✅ Grades historical: Inserted={inserted}, Updated={updated}, Skipped={skipped}")
    session.close()

if __name__ == '__main__':
    fetch_and_upsert_grades_historical()
