"""
Scheduler for Render SQL Deployment
Handles different update frequencies
"""
import os
import schedule
import time
import logging
from datetime import datetime
from update_manager import UpdateManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def trigger_daily_updates():
    """Trigger daily update scripts"""
    logger.info(f"Running daily updates at {datetime.now()}")
    manager = UpdateManager()
    manager.run_scheduled_updates()

def trigger_weekly_updates():
    """Trigger weekly update scripts"""
    logger.info(f"Running weekly updates at {datetime.now()}")
    manager = UpdateManager()
    manager.run_scheduled_updates()

def trigger_quarterly_updates():
    """Trigger quarterly update scripts"""
    logger.info(f"Running quarterly updates at {datetime.now()}")
    manager = UpdateManager()
    manager.run_scheduled_updates()

def trigger_annual_updates():
    """Trigger annual update scripts"""
    logger.info(f"Running annual updates at {datetime.now()}")
    manager = UpdateManager()
    manager.run_scheduled_updates()

def setup_schedule():
    """Setup the scheduling"""
    # Schedule updates at different times to avoid conflicts
    schedule.every().day.at("02:00").do(trigger_daily_updates)
    schedule.every().monday.at("03:00").do(trigger_weekly_updates)
    schedule.every().quarter.at("04:00").do(trigger_quarterly_updates)
    schedule.every().year.at("05:00").do(trigger_annual_updates)
    
    logger.info("Scheduler setup complete")
    logger.info("Daily updates: 02:00 UTC")
    logger.info("Weekly updates: Monday 03:00 UTC")
    logger.info("Quarterly updates: Every quarter 04:00 UTC")
    logger.info("Annual updates: Every year 05:00 UTC")

def run_scheduler():
    """Run the scheduler"""
    setup_schedule()
    
    logger.info("Starting scheduler...")
    while True:
        try:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
            break
        except Exception as exc:
            logger.error(f"Scheduler error: {exc}")
            time.sleep(60)  # Wait before retrying

if __name__ == "__main__":
    run_scheduler()
