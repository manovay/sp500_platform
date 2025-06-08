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

tickers_table   = metadata.tables['tickers']
stock_news_table = metadata.tables['stock_news']

def fetch_and_upsert_stock_news():
    session = Session()
    try:
        # fixed start date because API only returns since Jan 1, 2025
        start_date = date(2025, 1, 1)
        today      = date.today()

        inserted = updated = skipped = 0
        tickers = [t[0] for t in session.query(tickers_table.c.ticker).all()]

        for ticker in tickers:
            url = (
                f"https://financialmodelingprep.com/stable/news/stock"
                f"?symbols={ticker}"
                f"&from={start_date.isoformat()}"
                f"&to={today.isoformat()}"
                f"&limit=50"
                f"&apikey={FMP_API_KEY}"
            )
            resp = requests.get(url)
            print(f"Fetching stock news for {ticker}...")
            time.sleep(API_REQUEST_DELAY) # Respect API rate limit
            resp.raise_for_status()
            data = resp.json()
            if not isinstance(data, list) or not data:
                skipped += 1
                print(f"  -> No stock news data returned or invalid format for {ticker}.")
                continue

            news_to_process_for_ticker = []
            for rec in data: # Initial filter based on date string
                pub_dt = datetime.strptime(rec["publishedDate"], "%Y-%m-%d %H:%M:%S")
                if pub_dt.date() >= start_date:
                    news_to_process_for_ticker.append(rec)
            
            if not news_to_process_for_ticker:
                print(f"  -> No stock news for {ticker} since {start_date} (out of {len(data)} fetched).")
                # If you want to count this as skipped if no relevant news:
                # skipped += 1 
                continue

            print(f"  -> Processing {len(news_to_process_for_ticker)} news items for {ticker} since {start_date}.")
            items_processed_for_ticker = 0
            for rec in news_to_process_for_ticker:
                pub_dt = datetime.strptime(rec["publishedDate"], "%Y-%m-%d %H:%M:%S")
                # This check is redundant if already filtered, but safe
                # if pub_dt.date() < start_date: 
                #    continue
                
                stmt = insert(stock_news_table).values(
                    url            = rec["url"],
                    symbol         = rec["symbol"],
                    published_date = pub_dt,
                    publisher      = rec.get("publisher"),
                    title          = rec.get("title"),
                    image          = rec.get("image"),
                    site           = rec.get("site"),
                    text           = rec.get("text"),
                    source         = 'FMP'  # Ensure source is in the VALUES clause
                ).on_conflict_do_update(
                    index_elements=['url'],
                    set_={
                      'symbol':          rec["symbol"],
                      'published_date':  pub_dt,
                      'publisher':       rec.get("publisher"),
                      'title':           rec.get("title"),
                      'image':           rec.get("image"),
                      'site':            rec.get("site"),
                      'text':            rec.get("text"),
                      'source':          'FMP'
                    }
                )

                res = session.execute(stmt)
                if res.rowcount == 1:
                    inserted += 1
                else:
                    updated += 1
                items_processed_for_ticker +=1
            
            if items_processed_for_ticker > 0:
                print(f"  -> Finished processing {items_processed_for_ticker} news items for {ticker}.")

        session.commit()
        print(f"✅ Stock news since {start_date}: Inserted={inserted}, Updated={updated}, Skipped={skipped}")
    except Exception as e:
        print(f"  -> Error during stock news processing for {ticker if 'ticker' in locals() else 'unknown ticker'}: {e}")
        session.rollback()
        raise
    finally:
        session.close()
if __name__ == '__main__':
    fetch_and_upsert_stock_news()
