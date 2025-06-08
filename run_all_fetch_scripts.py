import subprocess
import sys
import os

# List of fetch scripts to run in order
# fetch_tickers.py must run first as other data depends on the tickers.
# The order of the subsequent scripts is generally flexible as they primarily depend on tickers.
FETCH_SCRIPTS = [
    "init_db.py",
    "fetch_tickers.py",
    "fetch_prices.py",
    "fetch_analyst_labels.py",
    "fetch_analyst_estimates.py",
    "fetch_historical_analyst.py",
    "fetch_stock_news.py"
]

def run_script(script_name: str) -> bool:
    """
    Runs a given Python script using the same Python interpreter
    and checks its output.
    Args:
        script_name: The name of the script file to run.
    Returns:
        True if the script ran successfully, False otherwise.
    """
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), script_name)
    print(f"\n--- Running {script_name} ---")
    
    if not os.path.exists(script_path):
        print(f"❌ Error: Script {script_path} not found.")
        return False
        
    try:
        # Use sys.executable to ensure the script is run with the same Python interpreter,
        # especially important if you are using a virtual environment.
        python_executable = sys.executable
        # Let the subprocess print directly to the terminal for real-time output
        process = subprocess.Popen(
            [python_executable, script_path],
            text=True, # Ensures strings for stdout/stderr if we were capturing
            cwd=os.path.dirname(script_path) # Ensure script runs in its own directory context
        )
        
        process.wait() # Wait for the script to complete
        
        if process.returncode != 0:
            # Error messages from the script would have already printed to the terminal
            print(f"--- {script_name} finished with an error ---")
            print(f"❌ Error executing {script_name}: Return code: {process.returncode}")
            return False
            
        print(f"--- {script_name} finished successfully ---")
        print(f"✅ Successfully executed {script_name}")
        return True
        
    except Exception as e:
        print(f"❌ An unexpected error occurred while trying to run {script_name}: {e}")
        return False

def main():
    print("🚀 Starting the data fetching pipeline...\n")
    print("🔔 IMPORTANT:")
    print("   1. Ensure your Docker containers (PostgreSQL, pgAdmin) are running.")
    print("      (You can start them with: docker-compose up -d)")
    print("   3. Make sure your .env file is correctly configured with API keys and DATABASE_URL.\n")

    all_successful = True
    for script_file in FETCH_SCRIPTS:
        if not run_script(script_file):
            all_successful = False
            print(f"\n🛑 Halting pipeline due to error in {script_file}.")
            break
    
    print("\n--- Pipeline Execution Summary ---")
    if all_successful:
        print("🎉 All fetch scripts executed successfully!")
    else:
        print("⚠️ Some scripts failed to execute. Please review the logs above.")

if __name__ == "__main__":
    main()