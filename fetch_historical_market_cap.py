import os
import time
import requests
from datetime import date, timedelta, datetime
from decimal import Decimal
from dotenv import load_dotenv
from sqlalchemy import (
    create_engine,
    Column,
    String,
    Date,
    Numeric,
    BigInteger,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables
load_dotenv(override=True)
FMP_API_KEY = os.getenv("FMP_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not FMP_API_KEY or not DATABASE_URL:
    raise ValueError("FMP_API_KEY and DATABASE_URL must be set in .env file")

# Define a delay to stay within API rate limits
API_REQUEST_DELAY = 0.21  # seconds (~285 requests per minute)

# SQLAlchemy setup
Base = declarative_base()
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# ORM model for allocations table
class HistoricalAllocation(Base):
    __tablename__ = "allocations"

    ticker = Column(String(10), primary_key=True)
    allocation_date = Column(Date, primary_key=True)
    market_cap_usd = Column(BigInteger, nullable=False)
    allocation_pct = Column(Numeric(7, 6), nullable=False)
    source = Column(String(50), nullable=False)
    # retrieved_at is handled by DB default (NOW())

# ORM model for tickers table (to fetch tickers)
class Ticker(Base):
    __tablename__ = "tickers"
    ticker = Column(String(10), primary_key=True)

def fetch_and_upsert_market_caps():
    session = Session()
    try:
        today = date.today()
        three_years_ago = today - timedelta(days=365 * 3)

        # Get all tickers from the database
        tickers = [t[0] for t in session.query(Ticker.ticker).all()]
        total_upserts = 0
        skipped_tickers = 0
        print(f"Found {len(tickers)} tickers to process for historical market cap data.")

        for idx, symbol in enumerate(tickers, start=1):
            from_date_str = three_years_ago.isoformat()
            to_date_str = today.isoformat()
            url = (
                f"https://financialmodelingprep.com/api/v3/"
                f"historical-market-capitalization/{symbol}"
                f"?from={from_date_str}&to={to_date_str}&apikey={FMP_API_KEY}"
            )

            print(f"\nProcessing {idx}/{len(tickers)}: {symbol}")
            print(f"  Fetching market caps from {from_date_str} to {to_date_str}...")
            try:
                resp = requests.get(url)
                time.sleep(API_REQUEST_DELAY)
                resp.raise_for_status()
                data = resp.json()

                if not isinstance(data, list):
                    print(f"  Unexpected JSON for {symbol}: {type(data)}. Skipping.")
                    skipped_tickers += 1
                    continue
                if not data:
                    print(f"  No data returned for {symbol}.")
                    continue

                upserts_for_ticker = 0
                for record in data:
                    date_str = record.get("date")
                    mc = record.get("marketCap")
                    if not date_str or mc is None:
                        continue
                    try:
                        rec_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                        entry = HistoricalAllocation(
                            ticker=symbol,
                            allocation_date=rec_date,
                            market_cap_usd=int(mc),
                            allocation_pct=Decimal("0.000000"),  # placeholder
                            source="FMP Historical Market Cap",
                        )
                        session.merge(entry)
                        upserts_for_ticker += 1
                    except Exception as e:
                        print(f"    Error on record {record}: {e}")

                session.commit()
                print(f"  Upserted {upserts_for_ticker} records for {symbol}.")
                total_upserts += upserts_for_ticker

            except Exception as e:
                print(f"  Error fetching {symbol}: {e}")
                skipped_tickers += 1
                session.rollback()

        # ─── Compute allocation_pct for each date ───────────────────────────────
        print("\n🔢 Calculating allocation_pct for each allocation_date …")
        session.execute(text("""
            UPDATE allocations AS a
            SET allocation_pct = (a.market_cap_usd::numeric) / totals.total_mc
            FROM (
              SELECT allocation_date, SUM(market_cap_usd) AS total_mc
              FROM allocations
              GROUP BY allocation_date
            ) AS totals
            WHERE a.allocation_date = totals.allocation_date;
        """))
        session.commit()
        print("✅ allocation_pct updated for all dates.")

        print(f"\n🏁 Finished. Total upserted: {total_upserts}, Skipped: {skipped_tickers}")

    except Exception as e:
        print(f"❌ Fatal error: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("🚀 Starting historical market cap fetch …")
    fetch_and_upsert_market_caps()
    print("🏁 Complete.")
