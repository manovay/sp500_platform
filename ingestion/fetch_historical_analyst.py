from datetime import date, datetime, timedelta
import requests
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert
from dotenv import load_dotenv
import time
import os

#Weekly

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
metadata = MetaData()
metadata.reflect(bind=engine)

tickers_table           = metadata.tables['tickers']
grades_historical_table = metadata.tables['grades_historical']

def fetch(from_date):
    session = Session()
    if isinstance(from_date, str):
        from_date = datetime.strptime(from_date, "%Y-%m-%d").date()
    today = date.today()
    inserted = updated = skipped = 0
    try:
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

<<<<<<< HEAD
    # Retrieve all tickers
            ticker_symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']
=======
                if not data or not isinstance(data, list):
                    skipped += 1
                    print(f"  -> Skipped {ticker}: No data or invalid format from API for historical grades.")
                    continue
>>>>>>> 4a89c3ff58eeb0a6259632329e20ef2c2b93ded2

                recent = [
                    r for r in data
                    if r.get("date") and datetime.fromisoformat(r.get("date")).date() >= from_date
                ]
                if not recent:
                    skipped += 1
                    print(f"  -> No recent historical grades found for {ticker} since {from_date}.")
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
        print(f"\u2705 Grades historical: Inserted={inserted}, Updated={updated}, Skipped={skipped}")
    except Exception as e:
        print(f"❌ An error occurred during the grades historical fetching process: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == '__main__':
    default_from_date = (date.today() - timedelta(days=365*3)).isoformat()
    fetch(default_from_date)
