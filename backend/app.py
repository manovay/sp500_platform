import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import json
from datetime import date, timedelta, datetime
import requests
import re
import statistics

# Alpaca imports
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import GetOrdersRequest
from alpaca.trading.enums import QueryOrderStatus

# Load environment variables before anything else
load_dotenv(override=True)

# Initialize Alpaca client
ALPACA_API_KEY = os.getenv("ALPACA_KEY")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET")

#Sanity Check for Alpaca Clie, KEYS
if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
    print("WARNING: ALPACA_KEY or ALPACA_SECRET not initalized in environment variables")
    trading_client = None
else:
    try:
        trading_client = TradingClient(ALPACA_API_KEY, ALPACA_SECRET_KEY, paper=True)
        print("Alpaca client initialized successfully")
    except Exception as e:
        print(f"Error initializing Alpaca client: {e}")
        trading_client = None

#Flask Setup 
app = Flask(__name__)
CORS(app, origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")])

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL is not found in environment variables")
    engine = None
else:
    engine = create_engine(DATABASE_URL)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
def check_database_configured():
    """Check if database is configured and return error response if not"""
    if not engine:
        return jsonify({
            "status": "error", 
            "error": "Database not configured. Set DATABASE_URL environment variable."
        }), 500
    return None

def check_alpaca_configured():
    """Check if Alpaca is configured and return error response if not"""
    if trading_client is None:
        return jsonify({
            "status": "error", 
            "error": "Alpaca not configured. Set ALPACA_KEY and ALPACA_SECRET environment variables."
        }), 500
    return None

def get_full_data_for_ticker_llm(conn, ticker):
    """
    Helper to fetch and build the full_data dict for a given ticker, using current date - 7 days for snapshot.
    This function matches the structure from fetch_weekly_llm.py
    """
    today = date.today()
    snapshot_date = today - timedelta(days=7)  # Use current date - 7 days for snapshot
    week_ago = today - timedelta(days=7)
    year_ago = today - timedelta(days=365)

    # Get snapshot date (use snapshot_date instead of latest allocation_date)
    snapshot = snapshot_date.isoformat()

    # Previous ACTUAL allocation pct (from actual_portfolio_allocations table)
    prev_actual_row = conn.execute(text("""
        SELECT actual_allocation_pct FROM actual_portfolio_allocations 
        WHERE ticker = :ticker AND allocation_date < :week_ago 
        ORDER BY allocation_date DESC LIMIT 1
    """), {"ticker": ticker, "week_ago": week_ago}).mappings().fetchone()
    
    # Fallback to FMP allocations if no actual data exists
    if not prev_actual_row:
        prev_alloc_row = conn.execute(text("""
            SELECT allocation_pct FROM allocations WHERE ticker = :ticker AND allocation_date < :week_ago ORDER BY allocation_date DESC LIMIT 1
        """), {"ticker": ticker, "week_ago": week_ago}).mappings().fetchone()
        previous_allocation_pct = float(prev_alloc_row["allocation_pct"]) if prev_alloc_row else None
    else:
        previous_allocation_pct = float(prev_actual_row["actual_allocation_pct"])

    # Profile summary (from profiles)
    profile_row = conn.execute(text("""
        SELECT profile_data FROM profiles WHERE ticker = :ticker AND date_fetched >= :week_ago ORDER BY date_fetched DESC LIMIT 1
    """), {"ticker": ticker, "week_ago": week_ago}).fetchone()
    profile_summary = profile_row[0] if profile_row else None

    # Weekly: grades_historical, allocations, predictions (last 7 days)
    weekly = {}
    weekly["grades_historical"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM grades_historical WHERE symbol = :ticker AND rating_date >= :week_ago ORDER BY rating_date DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]
    weekly["allocations"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM allocations WHERE ticker = :ticker AND allocation_date >= :week_ago ORDER BY allocation_date DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]
    weekly["predictions"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM weekly_llm_data WHERE ticker = :ticker AND created_at >= :week_ago ORDER BY created_at DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]

    # Daily: prices, analyst_labels, stock_news (last 7 days)
    daily = {}
    daily["prices"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM prices WHERE ticker = :ticker AND price_date >= :week_ago ORDER BY price_date DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]
    daily["analyst_labels"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM analyst_labels WHERE ticker = :ticker AND label_date >= :week_ago ORDER BY label_date DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]
    daily["stock_news"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM stock_news WHERE symbol = :ticker AND published_date >= :week_ago ORDER BY published_date DESC
    """), {"ticker": ticker, "week_ago": week_ago}).mappings()]

    # Quarterly: tickers, analyst_estimates (last 4 quarters)
    quarterly = {}
    quarterly["tickers"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM tickers WHERE ticker = :ticker
    """), {"ticker": ticker}).mappings()]
    quarterly["analyst_estimates"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM analyst_estimates WHERE symbol = :ticker AND report_date >= :year_ago ORDER BY report_date DESC
    """), {"ticker": ticker, "year_ago": year_ago}).mappings()]

    # Annual: key_metrics, profiles (last 1 year)
    annual = {}
    annual["key_metrics"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM key_metrics WHERE ticker = :ticker AND date >= :year_ago ORDER BY date DESC
    """), {"ticker": ticker, "year_ago": year_ago}).mappings()]
    annual["profiles"] = [dict(row) for row in conn.execute(text("""
        SELECT * FROM profiles WHERE ticker = :ticker AND date_fetched >= :year_ago ORDER BY date_fetched DESC
    """), {"ticker": ticker, "year_ago": year_ago}).mappings()]

    # Calculate weekly volatility and average volume
    weekly_volatility = 0
    weekly_avg_vol = 0
    if daily["prices"] and len(daily["prices"]) > 1:
        prices = daily["prices"]
        # Calculate price volatility (standard deviation of returns)
        returns = []
        for i in range(1, len(prices)):
            prev_price = float(prices[i-1].get('close_price', 0))
            curr_price = float(prices[i].get('close_price', 0))
            if prev_price > 0:
                returns.append((curr_price - prev_price) / prev_price)
        
        # Only calculate volatility if we have at least 2 returns
        if len(returns) >= 2:
            try:
                weekly_volatility = statistics.stdev(returns) * 100  # Convert to percentage
            except Exception as e:
                print(f"Warning: Could not calculate weekly volatility for {ticker}: {e}")
                weekly_volatility = 0
        
        # Calculate average volume
        volumes = [float(price.get('volume', 0)) for price in prices if price.get('volume')]
        if volumes:
            weekly_avg_vol = sum(volumes) / len(volumes)

    # Yearly return pct (from prices, 1 year ago vs now)
    price_now_row = conn.execute(text("""
        SELECT close_price FROM prices WHERE ticker = :ticker ORDER BY price_date DESC LIMIT 1
    """), {"ticker": ticker}).mappings().fetchone()
    price_year_ago_row = conn.execute(text("""
        SELECT close_price FROM prices WHERE ticker = :ticker AND price_date <= :year_ago ORDER BY price_date DESC LIMIT 1
    """), {"ticker": ticker, "year_ago": year_ago}).mappings().fetchone()
    yearly_return_pct = None
    if price_now_row and price_year_ago_row and price_year_ago_row["close_price"]:
        yearly_return_pct = 100.0 * (float(price_now_row["close_price"]) - float(price_year_ago_row["close_price"])) / float(price_year_ago_row["close_price"])

    # Key metrics (latest)
    key_metrics = conn.execute(text("""
        SELECT * FROM key_metrics WHERE ticker = :ticker ORDER BY date DESC LIMIT 1
    """), {"ticker": ticker}).mappings().fetchone()

    return {
        "ticker": ticker,
        "snapshot": snapshot,
        "previous_allocation_pct": previous_allocation_pct,
        "profile_summary": profile_summary,
        "weekly": weekly,
        "daily": daily,
        "quarterly": quarterly,
        "annual": annual,
        "yearly_return_pct": yearly_return_pct,
        "key_metrics": dict(key_metrics) if key_metrics else {},
        "weekly_volatility": weekly_volatility,
        "weekly_avg_vol": weekly_avg_vol
    }

def calculate_volatility_and_volume(prices, ticker, period_name): 
    """Calculate volatility and average volume for a given price dataset.
    Takes in a list of prices, ticker symbol and period name"""
    volatility = 0
    avg_vol = 0
    
    if prices and len(prices) > 1:
        # Calculate price volatility (standard deviation of returns)
        returns = []
        for i in range(1, len(prices)):
            prev_price = float(prices[i-1].get('close_price', 0)) #i-1 gives access to prev price 
            curr_price = float(prices[i].get('close_price', 0)) # current price
            if prev_price > 0: #prev price cant be 0 
                returns.append((curr_price - prev_price) / prev_price) # Difference in pct between prev and curr 
        
        # Only calculate volatility if we have at least 2 returns
        if len(returns) >= 2:
            try:
                volatility = statistics.stdev(returns) * 100  # Convert to percentage
            except Exception as e:
                print(f"Warning: Could not calculate {period_name} volatility for {ticker}: {e}")
                volatility = 0
        
        # Calculate average volume by grabing volumes array for every price and averaging
        
        volumes = [float(price.get('volume', 0)) for price in prices if price.get('volume')]
        
        if volumes:
            avg_vol = sum(volumes) / len(volumes)
    
    return volatility, avg_vol

#Classic prompt creation
def create_prompt_for_ticker(full_data):
    """
    Create a prompt for the LLM based on the ticker data in the required format
    (Same as fetch_weekly_llm.py)
    """
    ticker = full_data['ticker']
    snapshot = full_data['snapshot']
    profile = full_data['profile_summary']
    latest_price = full_data['daily']['prices'][0] if full_data['daily']['prices'] else None
    latest_news = full_data['daily']['stock_news'][:2] if full_data['daily']['stock_news'] else []
    latest_estimates = full_data['quarterly']['analyst_estimates'][:1] if full_data['quarterly']['analyst_estimates'] else []
    previous_allocation = full_data['previous_allocation_pct']
    yearly_return = full_data['yearly_return_pct']
    
    # Multiply allocation percentages by 100 for the model (S = 100)
    S = 100
    scaled_previous_allocation = previous_allocation * S if previous_allocation else 0
    
    # Extract news headlines (limit to 2 headlines, max 100 chars each)
    news_headlines = []
    for news in latest_news[:2]:
        title = news.get('title', '')
        if title:
            truncated_title = title[:100] + "..." if len(title) > 100 else title
            news_headlines.append(truncated_title)
    
    # Extract first sentence from profile description
    profile_summary = "No profile data available"
    if profile and isinstance(profile, dict) and 'description' in profile:
        description = profile['description']
        if description:
            # Find the first sentence (ends with . ! or ?)
            first_sentence_end = -1
            for char in ['.', '!', '?']:
                pos = description.find(char)
                if pos != -1 and (first_sentence_end == -1 or pos < first_sentence_end):
                    first_sentence_end = pos
            
            if first_sentence_end != -1:
                profile_summary = description[:first_sentence_end + 1].strip()
            else:
                # If no sentence ending found, take first 150 characters
                profile_summary = description[:150].strip()
    
    # Simplified data object to reduce prompt length
    data_obj = {
        "ticker": ticker,
        "snapshot": snapshot,
        "previous_allocation_pct": scaled_previous_allocation,
        "profile_summary": profile_summary,
        "latest_price": latest_price.get('close_price', 'N/A') if latest_price else 'N/A',
        "yearly_return_pct": yearly_return if yearly_return else 0,
        "weekly_volatility": full_data.get('weekly_volatility', 0),
        "weekly_avg_vol": full_data.get('weekly_avg_vol', 0),
        "recent_news_count": len(latest_news),
        "recent_news_headlines": news_headlines,
        "key_metrics": {
            "pe_ratio": full_data.get('key_metrics', {}).get('metrics', {}).get('peRatio', 'N/A'),
            "market_cap": full_data.get('key_metrics', {}).get('metrics', {}).get('marketCap', 'N/A'),
            "debt_to_equity": full_data.get('key_metrics', {}).get('metrics', {}).get('debtToEquity', 'N/A')
        }
    }
    
    # Convert the data object to JSON string
    data_json = json.dumps(data_obj)
    
    prompt = f"""<s>[INST] <<SYS>>
You are a portfolio optimization assistant.

For a given stock snapshot, recommend how the allocation should be adjusted.
Your response MUST be valid JSON matching this schema:
{{
  "ticker": "<string>",
  "snapshot": "<YYYY-MM-DD>",
  "verdict": "<Increase|Decrease|Hold|Add|Remove>",
  "new_alloc_pct": <number>,
  "reasoning": "<short explanation>"
}}

IMPORTANT: Allocation percentages are scaled by 100 (S=100). 
- Input previous_allocation_pct is in basis points (1.00 = 100 basis points = 1%)
- Output new_alloc_pct should also be in basis points (e.g., 150 = 1.5%, 250 = 2.5%)
- This scaling helps the model work with more precise decimal values

Do not include any extra keys or commentary. At the end, emit only the JSON.

<</SYS>>

DATA:
{data_json}

Please produce the JSON response.[/INST]"""
    
    return prompt

# ============================================================================
# STOCK ANALYSIS ENDPOINTS (Used by Stepper components)
# ============================================================================

@app.route("/api/stocks", methods=["GET"])
def api_stocks():
    """List all tickers with company name and sector"""
    error_response = check_database_configured()
    if error_response:
        return error_response
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT ticker, company_name, sector FROM tickers ORDER BY ticker
        """))
        #Creates a dict of all tickers, company names, and sectors 
        stocks = [dict(row) for row in result.mappings()] 
        return jsonify({"status": "ok", "stocks": stocks})

@app.route("/api/stocks/<ticker>/info", methods=["GET"])
def api_stock_info(ticker):
    """Basic info for a ticker: name, sector, profile"""
    error_response = check_database_configured()
    if error_response:
        return error_response
    
    with engine.connect() as conn:
        ticker_row = conn.execute(text("""
            SELECT ticker, company_name, sector FROM tickers WHERE ticker = :ticker
        """), {"ticker": ticker}).mappings().fetchone()
        profile_row = conn.execute(text("""
            SELECT profile_data FROM profiles WHERE ticker = :ticker
        """), {"ticker": ticker}).fetchone()
        info = dict(ticker_row) if ticker_row else {}
        if profile_row:
            info["profile"] = profile_row[0] # only one profile entry 
        return jsonify({"status": "ok", "info": info})

#Builds prompt 
@app.route("/api/stocks/<ticker>/prompt", methods=["GET"])
def api_stock_prompt(ticker):
    """Return the LLM prompt for a ticker (used by Step3_PromptReview)"""
    error_response = check_database_configured()
    if error_response:
        return error_response
    
    with engine.connect() as conn:
        # Get basic ticker info
        ticker_row = conn.execute(text("""
            SELECT ticker, company_name, sector FROM tickers WHERE ticker = :ticker
        """), {"ticker": ticker}).mappings().fetchone()
        
        if not ticker_row:
            return jsonify({"status": "error", "error": "Ticker not found"}), 404
        
        # Use the helper function to get full data (same as fetch_weekly_llm.py)
        full_data = get_full_data_for_ticker_llm(conn, ticker)
        
        # Create the prompt using the same function as fetch_weekly_llm.py
        prompt = create_prompt_for_ticker(full_data)
        
        return jsonify({
            "status": "ok", 
            "data": {
                "ticker": ticker,
                "prompt": prompt,
                "full_data": full_data
            }
        })

# ============================================================================
# PORTFOLIO MANAGEMENT ENDPOINTS (Used by Portfolio components)
# ============================================================================

@app.route("/api/account", methods=["GET"])
def api_account():
    """Get account summary information"""
    error_response = check_alpaca_configured()
    if error_response:
        return error_response
    
    try:
        # Get real account data from Alpaca
        account = trading_client.get_account()
        
        account_data = {
            "equity": float(account.equity),
            "cash": float(account.cash),
            "buying_power": float(account.buying_power),
            "portfolio_value": float(account.portfolio_value),
            "market_open": account.status == "ACTIVE",
            "last_updated": account.created_at.isoformat() + "Z"
        }
        return jsonify({"status": "ok", "account": account_data})
    except Exception as e:
        print(f"Error fetching account data: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route("/api/positions", methods=["GET"])
def api_positions():
    """Get current positions"""
    error_response = check_alpaca_configured()
    if error_response:
        return error_response
    
    try:
        # Get real positions from Alpaca
        positions = trading_client.get_all_positions()
        
        positions_data = []
        for position in positions:
            if float(position.qty) != 0:  # Only include non-zero positions
                positions_data.append({
                    "symbol": position.symbol,
                    "qty": int(float(position.qty)),
                    "market_value": float(position.market_value),
                    "avg_price": float(position.avg_entry_price),
                    "unrealized_pl": float(position.unrealized_pl),
                    "unrealized_pl_pct": float(position.unrealized_plpc),
                    "current_price": float(position.current_price)
                })
        
        return jsonify({"status": "ok", "positions": positions_data})
    except Exception as e:
        print(f"Error fetching positions: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route("/api/history", methods=["GET"])
def api_history():
    """Get portfolio history"""
    timeframe = request.args.get('timeframe', 'ytd')
    
    error_response = check_alpaca_configured()
    if error_response:
        return error_response
    
    try:
        # Get current account information
        account = trading_client.get_account()
        current_equity = float(account.equity)
        current_cash = float(account.cash)
        account_created = account.created_at
        
        # Determine the actual start date based on timeframe
        end_date = datetime.now()
        
        if timeframe == 'ytd':
            start_date = datetime(end_date.year, 1, 1)
        elif timeframe == '3m':
            start_date = end_date - timedelta(days=90)
        elif timeframe == '1m':
            start_date = end_date - timedelta(days=30)
        elif timeframe == '1w':
            start_date = end_date - timedelta(days=7)
        else:
            start_date = datetime(end_date.year, 1, 1)
        
        # For a new account, create a simple linear progression from initial cash to current equity
        equity_data = []
        
        if start_date >= end_date:
            # If start date is today or in the future, just show current equity
            equity_data.append({
                "date": end_date.isoformat() + "Z",
                "equity": round(current_equity, 2)
            })
        else:
            # Create daily data points from start to end
            current_date = start_date
            days_between = (end_date - start_date).days
            
            if days_between == 0:
                # Same day, just show current equity
                equity_data.append({
                    "date": end_date.isoformat() + "Z",
                    "equity": round(current_equity, 2)
                })
            else:
                # Use the actual starting equity of $100,000
                starting_equity = 100000.0
                
                while current_date <= end_date:
                    # Skip weekends
                    if current_date.weekday() < 5:  # Monday = 0, Friday = 4
                        # Linear interpolation from start to current equity
                        progress = (current_date - start_date).days / days_between
                        progress = min(1.0, max(0.0, progress))  # Clamp between 0 and 1
                        
                        # For the last data point, use the real current equity
                        if current_date == end_date:
                            daily_equity = current_equity
                        else:
                            daily_equity = starting_equity + (current_equity - starting_equity) * progress
                        
                        equity_data.append({
                            "date": current_date.isoformat() + "Z",
                            "equity": round(daily_equity, 2)
                        })
                    
                    current_date += timedelta(days=1)
        
        # Calculate KPIs using $100,000 as the starting point
        start_equity = 100000.0
        current_equity = float(account.equity)
            
        ytd_pl = current_equity - start_equity
        ytd_return = (ytd_pl / start_equity) * 100 if start_equity > 0 else 0
        
        return jsonify({
            "status": "ok",
            "history": equity_data,
            "kpis": {
                "start_equity": start_equity,
                "current_equity": current_equity,
                "ytd_pl": round(ytd_pl, 2),
                "ytd_return": round(ytd_return, 2)
            }
        })
    except Exception as e:
        print(f"Error fetching portfolio history: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route("/api/history/orders", methods=["GET"])
def api_order_history():
    """Get order history"""
    error_response = check_alpaca_configured()
    if error_response:
        return error_response
    
    try:
        # Get real order history from Alpaca with pagination
        request_params = GetOrdersRequest(status=QueryOrderStatus.ALL)
        request_params.limit = 500  # Get up to 500 orders
        
        after = request.args.get('after')
        if after:
            request_params.after = after
        
        orders = trading_client.get_orders(request_params)
        
        orders_data = []
        for order in orders:
            notional = float(order.notional) if order.notional else 0
            orders_data.append({
                "id": order.id,
                "symbol": order.symbol,
                "side": order.side.value,
                "qty": float(order.qty) if order.qty else 0,
                "notional": notional,
                "status": order.status.value,
                "submitted_at": order.submitted_at.isoformat() + "Z",
                "updated_at": order.updated_at.isoformat() + "Z"
            })
        
        # Sort by notional value (biggest orders first) and take top 5
        orders_data.sort(key=lambda x: x['notional'] or 0, reverse=True)
        top_5_orders = orders_data[:5]
        
        print(f"Retrieved {len(orders_data)} total orders, showing top 5 by notional value")
        print(f"Top 5 notional values: {[order['notional'] for order in top_5_orders]}")
        return jsonify({"status": "ok", "orders": top_5_orders, "total_orders": len(orders_data)})
    except Exception as e:
        print(f"Error fetching order history: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route("/api/history/activities", methods=["GET"])
def api_activity_history():
    """Get activity history (fills, dividends, fees)"""
    types = request.args.get('types', 'FILL,DIV,FEES')
    page_size = request.args.get('page_size', 100)
    
    error_response = check_alpaca_configured()
    if error_response:
        return error_response
    
    try:
        # Try to get activities from Alpaca, but provide fallback if method doesn't exist
        activities_data = []
        
        try:
            # Check if get_activities method exists
            if hasattr(trading_client, 'get_activities'):
                activities = trading_client.get_activities()
                
                for activity in activities:
                    # Map Alpaca activity types to our format
                    activity_type = "FILL"  # Default
                    if hasattr(activity, 'activity_type'):
                        if activity.activity_type == "DIV":
                            activity_type = "DIV"
                        elif activity.activity_type == "FEE":
                            activity_type = "FEES"
                        elif activity.activity_type == "TRADE":
                            activity_type = "FILL"
                    
                    activities_data.append({
                        "id": activity.id,
                        "type": activity_type,
                        "symbol": getattr(activity, 'symbol', None),
                        "qty": int(float(activity.qty)) if hasattr(activity, 'qty') and activity.qty else None,
                        "price": float(activity.price) if hasattr(activity, 'price') and activity.price else None,
                        "time": activity.transaction_time.isoformat() + "Z",
                        "side": getattr(activity, 'side', None),
                        "net_amount": float(activity.net_amount) if hasattr(activity, 'net_amount') else 0,
                        "description": getattr(activity, 'description', None)
                    })
            else:
                # Fallback: return empty activities list with a note
                print("Warning: get_activities method not available in Alpaca SDK")
                activities_data = []
                
        except AttributeError:
            print("Warning: get_activities method not available in Alpaca SDK")
            activities_data = []
        
        # Filter activities based on query parameters
        if types != 'all':
            requested_types = [t.strip() for t in types.split(',')]
            activities_data = [activity for activity in activities_data if activity['type'] in requested_types]
        
        # Apply page size limit
        try:
            page_size_int = int(page_size)
            activities_data = activities_data[:page_size_int]
        except ValueError:
            pass  # Keep all if page_size is invalid
        
        return jsonify({"status": "ok", "activities": activities_data})
    except Exception as e:
        print(f"Error fetching activity history: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route("/api/orders", methods=["GET"])
def api_get_orders():
    """Get open orders"""
    error_response = check_alpaca_configured()
    if error_response:
        return error_response
    
    try:
        # Get real open orders from Alpaca with pagination
        request_params = GetOrdersRequest(status=QueryOrderStatus.OPEN)
        request_params.limit = 500  # Get up to 500 orders
        orders = trading_client.get_orders(request_params)
        
        orders_data = []
        for order in orders:
            orders_data.append({
                "id": order.id,
                "symbol": order.symbol,
                "side": order.side.value,
                "qty": float(order.qty) if order.qty else 0,
                "type": order.type.value if hasattr(order, 'type') else 'market',
                "filled_qty": float(order.filled_qty) if hasattr(order, 'filled_qty') and order.filled_qty else 0,
                "filled_avg_price": float(order.filled_avg_price) if hasattr(order, 'filled_avg_price') and order.filled_avg_price else None,
                "limit_price": float(order.limit_price) if hasattr(order, 'limit_price') and order.limit_price else None,
                "notional": float(order.notional) if order.notional else None,
                "status": order.status.value,
                "submitted_at": order.submitted_at.isoformat() + "Z"
            })
        
        print(f"Retrieved {len(orders_data)} open orders from Alpaca")
        return jsonify({"status": "ok", "orders": orders_data})
    except Exception as e:
        print(f"Error fetching open orders: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route("/api/orders/<order_id>", methods=["DELETE"])
def api_cancel_order(order_id):
    """Cancel a specific order"""
    error_response = check_alpaca_configured()
    if error_response:
        return error_response
    
    try:
        # Cancel real order in Alpaca
        trading_client.cancel_order_by_id(order_id)
        return jsonify({"status": "ok", "message": "Order cancelled successfully"})
    except Exception as e:
        print(f"Error cancelling order: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route("/api/orders", methods=["DELETE"])
def api_cancel_all_orders():
    """Cancel all open orders"""
    error_response = check_alpaca_configured()
    if error_response:
        return error_response
    
    try:
        # Cancel all real orders in Alpaca
        trading_client.cancel_all_orders()
        return jsonify({"status": "ok", "message": "All orders cancelled successfully"})
    except Exception as e:
        print(f"Error cancelling all orders: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

# ============================================================================
# LLM HELPER FUNCTIONS (Based on fetch_weekly_llm.py)
# ============================================================================

# Load LLM environment variables
LLM_KEY = os.getenv("LLM_KEY")
if not LLM_KEY:
    print("LLM_KEY not found in environment variables!")

# Custom JSON encoder to handle date and decimal objects
class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        elif hasattr(obj, '__float__'):  # Handle Decimal, Fraction, etc.
            return float(obj)
        return super().default(obj)

def call_render_endpoint(prompt):
    """
    Call the Render endpoint with the prompt
    """
    if not LLM_KEY:
        return None
        
    url = "https://api.runpod.ai/v2/75lfr05y2bgbmr/run"
    headers = {
        "Authorization": f"Bearer {LLM_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "input": {
            "prompt": prompt
        },
        "sampling_params": {
            "temperature": 0,
            "top_p": 1.0,
            "max_tokens": 1024,
            "repetition_penalty": 1.0
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error calling Render endpoint: {e}")
        return None



def create_default_json_response(ticker, text):
    """
    Create a default JSON response when parsing fails
    """
    try:
        # Try to extract any useful information from the text
        ticker_match = re.search(r'"ticker":\s*"([^"]+)"', text)
        extracted_ticker = ticker_match.group(1) if ticker_match else ticker
        
        snapshot_match = re.search(r'"snapshot":\s*"([^"]+)"', text)
        snapshot = snapshot_match.group(1) if snapshot_match else "2025-08-16"
        
        verdict_match = re.search(r'"verdict":\s*"([^"]+)"', text)
        verdict = verdict_match.group(1) if verdict_match else "Hold"
        
        alloc_match = re.search(r'"new_alloc_pct":\s*([0-9.]+)', text)
        new_alloc_pct = float(alloc_match.group(1)) if alloc_match else 0.0
        
        reasoning_match = re.search(r'"reasoning":\s*"([^"]*)"', text)
        reasoning = reasoning_match.group(1) if reasoning_match else "Unable to parse response"
        
        # Create the proper JSON structure
        default_response = {
            "ticker": extracted_ticker,
            "snapshot": snapshot,
            "verdict": verdict,
            "new_alloc_pct": new_alloc_pct / 100,  # Convert from basis points
            "reasoning": reasoning
        }
        
        return default_response
        
    except Exception as e:
        print(f"Error creating default response: {e}")
        # Ultimate fallback
        return {
            "ticker": ticker,
            "snapshot": "2025-08-16",
            "verdict": "Hold",
            "new_alloc_pct": 0.0,
            "reasoning": "Failed to parse LLM response"
        }

# ============================================================================
# PORTFOLIO ANALYSIS ENDPOINT
# ============================================================================

@app.route("/portfolio-analysis", methods=["GET"])
def portfolio_analysis():
    """Get top 10 allocation differences between FMP API and LLM recommendations"""
    error_response = check_database_configured()
    if error_response:
        return error_response
    
    try:
        with engine.connect() as conn:
            # Get the latest allocation data for each ticker and compare with LLM recommendations
            result = conn.execute(text("""
                WITH latest_allocations AS (
                    SELECT 
                        ticker,
                        allocation_pct as fmp_allocation_pct,
                        allocation_date,
                        ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY allocation_date DESC) as rn
                    FROM allocations
                ),
                latest_llm_data AS (
                    SELECT 
                        ticker,
                        response_data->>'new_alloc_pct' as llm_allocation_pct,
                        week_start_date,
                        ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY week_start_date DESC) as rn
                    FROM weekly_llm_data
                    WHERE status = 'completed' 
                    AND response_data->>'new_alloc_pct' IS NOT NULL
                )
                SELECT 
                    la.ticker,
                    la.fmp_allocation_pct,
                    lld.llm_allocation_pct::NUMERIC as llm_allocation_pct,
                    ABS(la.fmp_allocation_pct - (lld.llm_allocation_pct::NUMERIC)) as allocation_difference,
                    la.allocation_date,
                    lld.week_start_date,
                    t.company_name,
                    t.sector
                FROM latest_allocations la
                JOIN latest_llm_data lld ON la.ticker = lld.ticker
                JOIN tickers t ON la.ticker = t.ticker
                WHERE la.rn = 1 AND lld.rn = 1
                ORDER BY allocation_difference DESC
                LIMIT 10
            """))
            
            positions = []
            total_fmp_allocation = 0
            total_llm_allocation = 0
            
            for row in result.mappings():
                ticker = row['ticker']
                fmp_allocation_pct = float(row['fmp_allocation_pct'])
                llm_allocation_pct = float(row['llm_allocation_pct'])
                allocation_difference = float(row['allocation_difference'])
                allocation_date = row['allocation_date']
                week_start_date = row['week_start_date']
                company_name = row['company_name']
                sector = row['sector']
                
                # Calculate percentage difference
                percentage_diff = ((llm_allocation_pct - fmp_allocation_pct) / fmp_allocation_pct * 100) if fmp_allocation_pct > 0 else 0
                
                total_fmp_allocation += fmp_allocation_pct
                total_llm_allocation += llm_allocation_pct
                
                positions.append({
                    "ticker": ticker,
                    "company_name": company_name,
                    "sector": sector,
                    "fmp_allocation_pct": fmp_allocation_pct,
                    "llm_allocation_pct": llm_allocation_pct,
                    "allocation_difference": allocation_difference,
                    "percentage_diff": percentage_diff,
                    "allocation_date": allocation_date.isoformat() if allocation_date else None,
                    "llm_date": week_start_date.isoformat() if week_start_date else None
                })
            
            # Add ranking
            for i, position in enumerate(positions, 1):
                position["rank"] = i
            
            total_difference = total_llm_allocation - total_fmp_allocation
            
            return jsonify({
                "top_positions": positions,
                "summary": {
                    "total_positions": len(positions),
                    "total_fmp_allocation": total_fmp_allocation,
                    "total_llm_allocation": total_llm_allocation,
                    "total_difference": total_difference
                }
            })
            
    except Exception as e:
        print(f"Error in portfolio analysis: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

# ============================================================================
# LLM ENDPOINTS
# ============================================================================

@app.route("/api/stocks/<ticker>/llm-analysis", methods=["POST"])
def api_llm_analysis(ticker):
    """Send ticker data to LLM for analysis and return the raw response"""
    error_response = check_database_configured()
    if error_response:
        return error_response
    
    if not LLM_KEY:
        return jsonify({
            "status": "error", 
            "error": "LLM not configured. Set LLM_KEY environment variable."
        }), 500
    
    try:
        with engine.connect() as conn:
            # Get full data for ticker
            full_data = get_full_data_for_ticker_llm(conn, ticker)
            
            # Create prompt
            prompt = create_prompt_for_ticker(full_data)
            
            # Call Render endpoint
            response = call_render_endpoint(prompt)
            
            if response:
                # Just return the raw response
                return jsonify({
                    "status": "ok", 
                    "raw_response": response,
                    "prompt_length": len(prompt)
                })
            else:
                return jsonify({
                    "status": "error", 
                    "error": "No response from LLM service"
                }), 500
                
    except Exception as e:
        print(f"Error in LLM analysis: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
