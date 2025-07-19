import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

def init_database():
    try:
        # Load environment variables from .env file
        load_dotenv(override=True)
        
        # Get database URL from environment variable
        database_url = os.getenv('DATABASE_URL')
        print("Using DATABASE_URL =", database_url)
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is not set")
        
        # Create SQLAlchemy engine
        engine = create_engine(database_url)
        
        # Read schema.sql file
        schema_path = Path(__file__).parent / 'schema.sql'
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        # Execute schema.sql
        with engine.connect() as connection:
            connection.execute(text(schema_sql))
            connection.commit()
        
        print("✅ Database schema created successfully")
        seed_sql = """
        INSERT INTO ingestion_metadata (table_name, frequency)
        VALUES
          ('tickers',           'quarterly'),
          ('prices',            'daily'),
          ('analyst_labels',    'daily'),
          ('analyst_estimates', 'quarterly'),
          ('grades_historical', 'weekly'),
          ('stock_news',        'daily'),
          ('key_metrics',       'annual'),
          ('profiles',          'annual'),
          ('allocations',       'weekly'),
          ('predictions',       'weekly')
        ON CONFLICT (table_name) DO UPDATE
          SET frequency = EXCLUDED.frequency;
        """
        with engine.connect() as conn:
            conn.execute(text(seed_sql))
            conn.commit()
        print("✅ ingestion_metadata seeded successfully")
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise

if __name__ == "__main__":
    init_database()
