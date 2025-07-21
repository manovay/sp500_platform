import importlib

# List of fetch module names (without .py)
FETCH_MODULES = [
    "fetch_tickers",
    "fetch_prices",
    "fetch_historical_market_cap",
    "fetch_metrics",
    "fetch_profile",
    "fetch_analyst_labels",
    "fetch_analyst_estimates",
    "fetch_historical_analyst",
    "fetch_stock_news",
]

def main():
    test_from_date = "2025-01-01"
    print(f"\n🚀 Starting TEST fetch run with from_date={test_from_date} for all modules...\n")
    for script in FETCH_MODULES:
        try:
            print(f"\n--- Running {script}.py ---")
            module = importlib.import_module(f"ingestion.{script}")
            print(f"Calling fetch(from_date={test_from_date}) for {script}...")
            module.fetch(test_from_date)
            print(f"--- {script}.py finished successfully ---")
        except Exception as e:
            print(f"❌ Error running {script}: {e}")
            break
    print("\n--- TEST Pipeline Execution Summary ---")
    print("🎉 All fetch modules executed (or stopped on error).\n")

if __name__ == "__main__":
    main() 