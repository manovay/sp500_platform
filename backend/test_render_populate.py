"""
Simple script to test Render database population with fake data
"""
import os
import json
from datetime import datetime, date, timedelta
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Load environment variables
load_dotenv(override=True)

# Test tickers
TEST_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']

def init_schema():
    """Initialize database schema"""
    print("🗄️ Initializing database schema...")
    
    database_url = os.getenv('DATABASE_URL')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    engine = create_engine(database_url)
    
    with open("ingestion/schema.sql", 'r') as f:
        schema_sql = f.read()
    
    with engine.connect() as conn:
        conn.execute(text(schema_sql))
        conn.commit()
    print("✅ Schema initialized")
    return engine

def populate_fake_data(engine):
    """Populate database with fake data"""
    print("📊 Populating with fake data...")
    
    # Fake tickers data
    tickers_data = [
        ('AAPL', 'Apple Inc.', 'Technology'),
        ('MSFT', 'Microsoft Corporation', 'Technology'),
        ('GOOGL', 'Alphabet Inc.', 'Technology'),
        ('AMZN', 'Amazon.com Inc.', 'Consumer Cyclical'),
        ('TSLA', 'Tesla Inc.', 'Consumer Cyclical')
    ]
    
    # Fake prices data (last 5 days)
    prices_data = []
    for ticker, _, _ in tickers_data:
        base_price = 100 + hash(ticker) % 500  # Different base price for each ticker
        for i in range(5):
            date_val = date.today() - timedelta(days=i)
            prices_data.append({
                'ticker': ticker,
                'price_date': date_val,
                'open_price': base_price + i * 2,
                'high_price': base_price + i * 2 + 5,
                'low_price': base_price + i * 2 - 3,
                'close_price': base_price + i * 2 + 1,
                'volume': 1000000 + i * 100000
            })
    
    # Fake analyst labels
    analyst_labels_data = []
    for ticker, _, _ in tickers_data:
        analyst_labels_data.append({
            'ticker': ticker,
            'label_date': date.today(),
            'rating': 'A',
            'overall_score': 4,
            'discounted_cash_flow_score': 4,
            'return_on_equity_score': 4,
            'return_on_assets_score': 3,
            'debt_to_equity_score': 5,
            'price_to_earnings_score': 3,
            'price_to_book_score': 4,
            'source': 'TEST'
        })
    
    # Fake profiles
    profiles_data = []
    for ticker, company_name, sector in tickers_data:
        profiles_data.append({
            'ticker': ticker,
            'profile_data': json.dumps({
                'symbol': ticker,
                'companyName': company_name,
                'sector': sector,
                'price': 150.0,
                'marketCap': 1000000000,
                'description': f'Test company {company_name}'
            }),
            'date_fetched': date.today()
        })
    
    # Insert data
    with engine.connect() as conn:
        # Insert tickers
        for ticker, company, sector in tickers_data:
            conn.execute(text("""
                INSERT INTO tickers (ticker, company_name, sector, date_added)
                VALUES (:ticker, :company, :sector, CURRENT_DATE)
                ON CONFLICT (ticker) DO UPDATE SET
                    company_name = EXCLUDED.company_name,
                    sector = EXCLUDED.sector
            """), {'ticker': ticker, 'company': company, 'sector': sector})
        
        # Insert prices
        for price in prices_data:
            conn.execute(text("""
                INSERT INTO prices (ticker, price_date, open_price, high_price, low_price, close_price, volume)
                VALUES (:ticker, :price_date, :open_price, :high_price, :low_price, :close_price, :volume)
                ON CONFLICT (ticker, price_date) DO UPDATE SET
                    open_price = EXCLUDED.open_price,
                    high_price = EXCLUDED.high_price,
                    low_price = EXCLUDED.low_price,
                    close_price = EXCLUDED.close_price,
                    volume = EXCLUDED.volume
            """), price)
        
        # Insert analyst labels
        for label in analyst_labels_data:
            conn.execute(text("""
                INSERT INTO analyst_labels (ticker, label_date, rating, overall_score, 
                                          discounted_cash_flow_score, return_on_equity_score, 
                                          return_on_assets_score, debt_to_equity_score, 
                                          price_to_earnings_score, price_to_book_score, source)
                VALUES (:ticker, :label_date, :rating, :overall_score, :discounted_cash_flow_score,
                        :return_on_equity_score, :return_on_assets_score, :debt_to_equity_score,
                        :price_to_earnings_score, :price_to_book_score, :source)
                ON CONFLICT (ticker, label_date) DO UPDATE SET
                    rating = EXCLUDED.rating,
                    overall_score = EXCLUDED.overall_score,
                    discounted_cash_flow_score = EXCLUDED.discounted_cash_flow_score,
                    return_on_equity_score = EXCLUDED.return_on_equity_score,
                    return_on_assets_score = EXCLUDED.return_on_assets_score,
                    debt_to_equity_score = EXCLUDED.debt_to_equity_score,
                    price_to_earnings_score = EXCLUDED.price_to_earnings_score,
                    price_to_book_score = EXCLUDED.price_to_book_score,
                    source = EXCLUDED.source
            """), label)
        
        # Insert profiles
        for profile in profiles_data:
            conn.execute(text("""
                INSERT INTO profiles (ticker, profile_data, date_fetched)
                VALUES (:ticker, :profile_data, :date_fetched)
                ON CONFLICT (ticker) DO UPDATE SET
                    profile_data = EXCLUDED.profile_data,
                    date_fetched = EXCLUDED.date_fetched
            """), profile)
        
        # Insert metadata
        metadata = [
            ('tickers', 'quarterly', 'fetch_tickers.py'),
            ('prices', 'daily', 'fetch_prices.py'),
            ('analyst_labels', 'daily', 'fetch_analyst_labels.py'),
            ('profiles', 'annual', 'fetch_profile.py')
        ]
        
        for table_name, frequency, script_name in metadata:
            conn.execute(text("""
                INSERT INTO ingestion_metadata (table_name, frequency, script_name, last_updated)
                VALUES (:table_name, :frequency, :script_name, NOW())
                ON CONFLICT (table_name) DO UPDATE SET
                    frequency = EXCLUDED.frequency,
                    script_name = EXCLUDED.script_name,
                    last_updated = NOW()
            """), {
                'table_name': table_name,
                'frequency': frequency,
                'script_name': script_name
            })
        
        conn.commit()
    
    print("✅ Fake data populated")

def test_data_access(engine):
    """Test that we can access the data"""
    print("🧪 Testing data access...")
    
    with engine.connect() as conn:
        # Test tickers
        result = conn.execute(text("SELECT COUNT(*) FROM tickers"))
        ticker_count = result.scalar()
        print(f"  📊 Tickers: {ticker_count} records")
        
        # Test prices
        result = conn.execute(text("SELECT COUNT(*) FROM prices"))
        price_count = result.scalar()
        print(f"  📈 Prices: {price_count} records")
        
        # Test analyst labels
        result = conn.execute(text("SELECT COUNT(*) FROM analyst_labels"))
        label_count = result.scalar()
        print(f"  📊 Analyst labels: {label_count} records")
        
        # Test profiles
        result = conn.execute(text("SELECT COUNT(*) FROM profiles"))
        profile_count = result.scalar()
        print(f"  �� Profiles: {profile_count} records")
        
        # Test sample data
        result = conn.execute(text("SELECT ticker, company_name FROM tickers LIMIT 3"))
        sample_tickers = result.fetchall()
        print(f"  �� Sample tickers: {[f'{t[0]} ({t[1]})' for t in sample_tickers]}")
        
        # Test recent prices
        result = conn.execute(text("""
            SELECT ticker, price_date, close_price 
            FROM prices 
            WHERE ticker = 'AAPL' 
            ORDER BY price_date DESC 
            LIMIT 3
        """))
        sample_prices = result.fetchall()
        print(f"  �� Sample AAPL prices: {[(p[0], p[1], p[2]) for p in sample_prices]}")

def cleanup_fake_data(engine):
    """Remove fake data"""
    print("🧹 Cleaning up fake data...")
    
    with engine.connect() as conn:
        # Delete in reverse order (respecting foreign keys)
        conn.execute(text("DELETE FROM prices"))
        conn.execute(text("DELETE FROM analyst_labels"))
        conn.execute(text("DELETE FROM profiles"))
        conn.execute(text("DELETE FROM tickers"))
        conn.execute(text("DELETE FROM ingestion_metadata"))
        conn.commit()
    
    print("✅ Fake data cleaned up")

def main():
    """Main function"""
    print("🚀 Testing Render database population with fake data")
    print("=" * 60)
    
    try:
        # Initialize schema
        engine = init_schema()
        
        # Populate fake data
        populate_fake_data(engine)
        
        # Test data access
        test_data_access(engine)
        
        print("\n" + "=" * 60)
        print("✅ Test completed successfully!")
        print("📊 Database is working correctly")
        
        # Ask user if they want to clean up
        response = input("\n�� Clean up fake data? (y/n): ").lower().strip()
        if response == 'y':
            cleanup_fake_data(engine)
            print("�� All done! Database is clean and ready for real data.")
        else:
            print("📊 Fake data left in database for further testing.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main() 