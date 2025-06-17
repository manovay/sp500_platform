import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert
import requests
import time

# Load environment variables
load_dotenv(override=True)
FMP_API_KEY = os.getenv('FMP_API_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')

if not FMP_API_KEY or not DATABASE_URL:
    raise ValueError("FMP_API_KEY and DATABASE_URL must be set in .env file")

# Create SQLAlchemy base and engine
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
metadata = MetaData()
metadata.reflect(bind=engine)

tickers_table = metadata.tables['tickers']
key_metrics_table = metadata.tables['key_metrics']

API_REQUEST_DELAY = 0.21  # seconds (for ~285 requests per minute)

def fetch_and_upsert_metrics():
    session = Session()
    inserted = updated = skipped = 0
    try:
        # Get all tickers from the tickers table
        ticker_symbols = [t[0] for t in session.query(tickers_table.c.ticker).all()]
        total_tickers = len(ticker_symbols)
        print(f"Found {total_tickers} tickers in DB to process for key metrics.")

        for idx, ticker in enumerate(ticker_symbols):
            print(f"\nProcessing Ticker {idx + 1}/{total_tickers}: {ticker}")
            items_processed_for_ticker = 0
            try:
                url = f"https://financialmodelingprep.com/api/v3/key-metrics/{ticker}?period=annual&limit=3&apikey={FMP_API_KEY}"
                print(f"  Fetching key metrics for {ticker}...")
                response = requests.get(url)
                time.sleep(API_REQUEST_DELAY)  # Respect API rate limit
                response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)

                metrics_data = response.json()

                if not isinstance(metrics_data, list) or not metrics_data:
                    print(f"  -> No metrics data returned or invalid format for {ticker}.")
                    skipped += 1
                    continue

                print(f"  -> Processing {len(metrics_data)} metric entries for {ticker}.")
                for entry in metrics_data:
                    date_str = entry.get('date')
                    if not date_str:
                        print(f"    Skipping entry for {ticker} due to missing date: {entry}")
                        continue
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()

                    stmt = insert(key_metrics_table).values(
                        ticker=ticker,
                        date=date_obj,
                        metrics=entry  # Store the whole JSON entry
                    ).on_conflict_do_update(
                        index_elements=['ticker', 'date'], # Primary key columns
                        set_={'metrics': entry} # Column to update on conflict
                    )
                    res = session.execute(stmt)

                    if res.rowcount == 1: # Row was affected (inserted or updated)
                        inserted += 1 # As per fetch_stock_news, this counts an affected row.
                                      # A more precise insert/update count would need res.inserted_primary_key
                    else: # rowcount == 0 (e.g. conflict, but DO UPDATE conditions not met or DO NOTHING)
                        updated += 1
                    items_processed_for_ticker +=1
                
                if items_processed_for_ticker > 0:
                    print(f"  -> Finished processing {items_processed_for_ticker} metric entries for {ticker}.")
                elif not metrics_data: # Already handled by the check above
                    pass
                else: # metrics_data was a list, but all entries might have been skipped
                    print(f"  -> No processable metric entries found for {ticker} (out of {len(metrics_data)} fetched).")

            except requests.exceptions.HTTPError as http_err:
                print(f"  -> HTTP error fetching metrics for {ticker}: {http_err}")
                skipped += 1
            except requests.exceptions.RequestException as req_err: # Catch other request-related errors
                print(f"  -> Request error fetching metrics for {ticker}: {req_err}")
                skipped += 1
            except Exception as e: # Catch any other error during this ticker's processing
                print(f"  -> Error processing metrics for {ticker}: {e}")
                skipped += 1 # Count this ticker as skipped
                continue

        session.commit() # Commit once after processing all tickers
        print(f"\n✅ Key metrics processing complete: Inserted/Updated={inserted}, Potentially Re-updated={updated}, Skipped Tickers={skipped}")

    except Exception as e:
        print(f"❌ An error occurred during the metrics fetching process: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    fetch_and_upsert_metrics()
