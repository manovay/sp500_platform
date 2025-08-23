import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone

# Load environment variables
load_dotenv(override=True)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
Base = declarative_base()

def reset_llm_table():
    """
    Reset the weekly_llm_data table by deleting all records
    """
    session = Session()
    try:
        print("��️  Resetting weekly_llm_data table...")
        
        # Delete all records from the table
        deleted_count = session.execute(text("DELETE FROM weekly_llm_data"))
        session.commit()
        
        print(f"✅ Successfully deleted all records from weekly_llm_data table")
        print(f"   Records deleted: {deleted_count.rowcount}")
        
        # Verify the table is empty
        result = session.execute(text("SELECT COUNT(*) FROM weekly_llm_data"))
        count = result.scalar()
        print(f"   Current record count: {count}")
        
    except Exception as e:
        print(f"❌ Error resetting table: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    reset_llm_table()
