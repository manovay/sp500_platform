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
FMP_API_KEY   = os.getenv('FMP_API_KEY')

# SQLAlchemy setup
engine   = create_engine(DATABASE_URL)
Session  = sessionmaker(bind=engine)
session  = Session()
metadata = MetaData()
metadata.reflect(bind=engine)

tickers_table           = metadata.tables['tickers']
analyst_estimates_table = metadata.tables['analyst_estimates']

def fetch_and_upsert_analyst_estimates_quarterly():
    today      = date.today()
    cutoff     = today - timedelta(days=365*3)
    inserted = updated = skipped = 0

    # Retrieve all tickers
    tickers = [t[0] for t in session.query(tickers_table.c.ticker).all()]

    for ticker in tickers:
        print(f"Processing analyst estimates for {ticker}...")
        page = 0
        all_records = []

        # Page through in chunks of 10 until we're beyond the 3-year cutoff
        while True:
            url = (
               f"https://financialmodelingprep.com/stable/analyst-estimates"
                   f"?symbol={ticker}"                
                    f"&period=annual"            # ← back to annual for your plan
                    f"&page={page}"
                    f"&limit=10"
                    f"&apikey={FMP_API_KEY}"
                )
            try:
                print(f"  Fetching analyst estimates for {ticker}, page {page}...")
                resp = requests.get(url)
                time.sleep(API_REQUEST_DELAY) # Respect API rate limit
                resp.raise_for_status()
                data = resp.json()
                if not data or not isinstance(data, list):
                    break

                all_records.extend(data)

                # stop if the oldest date on this page is before cutoff
                oldest = min(datetime.fromisoformat(r["date"]).date() for r in data)
                if oldest < cutoff:
                    break

                page += 1

            except Exception as e:
                session.rollback()
                print(f"  -> Error fetching page {page} for {ticker}: {e}. Skipping rest for this ticker.")
                skipped += 1
                break

        # filter to the last 3 years
        recent = [r for r in all_records if datetime.fromisoformat(r["date"]).date() >= cutoff]
        
        if not recent:
            skipped += 1
            if all_records:
                print(f"  -> For {ticker}: Fetched {len(all_records)} records, but none are recent (last 3 years).")
            else:
                print(f"  -> For {ticker}: No analyst estimates records found after API calls.")
            continue
        
        print(f"  -> For {ticker}: Found {len(recent)} recent analyst estimates to upsert.")
        # upsert each record
        for rec in recent:
            pub_date = rec["date"]
            stmt = insert(analyst_estimates_table).values(
                symbol                  = rec.get("symbol"),
                report_date             = pub_date,
                revenue_low             = rec.get("revenueLow"),
                revenue_high            = rec.get("revenueHigh"),
                revenue_avg             = rec.get("revenueAvg"),
                ebitda_low              = rec.get("ebitdaLow"),
                ebitda_high             = rec.get("ebitdaHigh"),
                ebitda_avg              = rec.get("ebitdaAvg"),
                ebit_low                = rec.get("ebitLow"),
                ebit_high               = rec.get("ebitHigh"),
                ebit_avg                = rec.get("ebitAvg"),
                net_income_low          = rec.get("netIncomeLow"),
                net_income_high         = rec.get("netIncomeHigh"),
                net_income_avg          = rec.get("netIncomeAvg"),
                sga_expense_low         = rec.get("sgaExpenseLow"),
                sga_expense_high        = rec.get("sgaExpenseHigh"),
                sga_expense_avg         = rec.get("sgaExpenseAvg"),
                eps_avg                 = rec.get("epsAvg"),
                eps_high                = rec.get("epsHigh"),
                eps_low                 = rec.get("epsLow"),
                num_analysts_revenue    = rec.get("numAnalystsRevenue"),
                num_analysts_eps        = rec.get("numAnalystsEps"),
                source                  = 'FMP'
            ).on_conflict_do_update(
                index_elements=['symbol','report_date'],
                set_={
                  'revenue_low':          rec.get("revenueLow"),
                  'revenue_high':         rec.get("revenueHigh"),
                  'revenue_avg':          rec.get("revenueAvg"),
                  'ebitda_low':           rec.get("ebitdaLow"),
                  'ebitda_high':          rec.get("ebitdaHigh"),
                  'ebitda_avg':           rec.get("ebitdaAvg"),
                  'ebit_low':             rec.get("ebitLow"),
                  'ebit_high':            rec.get("ebitHigh"),
                  'ebit_avg':             rec.get("ebitAvg"),
                  'net_income_low':       rec.get("netIncomeLow"),
                  'net_income_high':      rec.get("netIncomeHigh"),
                  'net_income_avg':       rec.get("netIncomeAvg"),
                  'sga_expense_low':      rec.get("sgaExpenseLow"),
                  'sga_expense_high':     rec.get("sgaExpenseHigh"),
                  'sga_expense_avg':      rec.get("sgaExpenseAvg"),
                  'eps_avg':              rec.get("epsAvg"),
                  'eps_high':             rec.get("epsHigh"),
                  'eps_low':              rec.get("epsLow"),
                  'num_analysts_revenue': rec.get("numAnalystsRevenue"),
                  'num_analysts_eps':     rec.get("numAnalystsEps"),
                  'source':               'FMP'
                }
            )
            res = session.execute(stmt)
            if res.rowcount == 1:
                inserted += 1
            else:
                updated += 1

    session.commit()
    print(f"✅ Quarterly analyst estimates: Inserted={inserted}, Updated={updated}, Skipped={skipped}")
    session.close()

if __name__ == '__main__':
    fetch_and_upsert_analyst_estimates_quarterly()
