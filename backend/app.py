import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

app = Flask(__name__)
CORS(app, origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")])

# Database setup for Render SQL
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

engine = create_engine(DATABASE_URL) if DATABASE_URL else None

@app.route("/api/stocks", methods=["GET"])
def get_stocks():
    """Get all stocks with basic info from tickers table"""
    if not engine:
        return jsonify({"status": "error", "error": "Database not configured"}), 500
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT ticker, company_name, sector, date_added 
                FROM tickers 
                ORDER BY ticker
            """))
            stocks = [dict(row._mapping) for row in result]
            return jsonify({"status": "ok", "stocks": stocks})
    except SQLAlchemyError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

@app.route("/api/stocks/<ticker>/prices", methods=["GET"])
def get_stock_prices(ticker):
    """Get price data for a specific stock"""
    if not engine:
        return jsonify({"status": "error", "error": "Database not configured"}), 500
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT price_date, open_price, high_price, low_price, close_price, volume
                FROM prices 
                WHERE ticker = :ticker 
                ORDER BY price_date DESC 
                LIMIT 100
            """), {"ticker": ticker})
            prices = [dict(row._mapping) for row in result]
            return jsonify({"status": "ok", "prices": prices})
    except SQLAlchemyError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

@app.route("/api/stocks/<ticker>/analyst-labels", methods=["GET"])
def get_stock_analyst_labels(ticker):
    """Get analyst labels for a specific stock"""
    if not engine:
        return jsonify({"status": "error", "error": "Database not configured"}), 500
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT label_date, rating, overall_score, discounted_cash_flow_score,
                       return_on_equity_score, return_on_assets_score, debt_to_equity_score,
                       price_to_earnings_score, price_to_book_score, source
                FROM analyst_labels 
                WHERE ticker = :ticker 
                ORDER BY label_date DESC 
                LIMIT 50
            """), {"ticker": ticker})
            labels = [dict(row._mapping) for row in result]
            return jsonify({"status": "ok", "analyst_labels": labels})
    except SQLAlchemyError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

@app.route("/api/stocks/<ticker>/analyst-estimates", methods=["GET"])
def get_stock_analyst_estimates(ticker):
    """Get analyst estimates for a specific stock"""
    if not engine:
        return jsonify({"status": "error", "error": "Database not configured"}), 500
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT report_date, revenue_avg, ebitda_avg, ebit_avg, net_income_avg,
                       eps_avg, num_analysts_revenue, num_analysts_eps, source
                FROM analyst_estimates 
                WHERE symbol = :ticker 
                ORDER BY report_date DESC 
                LIMIT 20
            """), {"ticker": ticker})
            estimates = [dict(row._mapping) for row in result]
            return jsonify({"status": "ok", "analyst_estimates": estimates})
    except SQLAlchemyError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

@app.route("/api/stocks/<ticker>/grades-historical", methods=["GET"])
def get_stock_grades_historical(ticker):
    """Get historical grades for a specific stock"""
    if not engine:
        return jsonify({"status": "error", "error": "Database not configured"}), 500
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT rating_date, analyst_ratings_buy, analyst_ratings_hold,
                       analyst_ratings_sell, analyst_ratings_strong_sell, source
                FROM grades_historical 
                WHERE symbol = :ticker 
                ORDER BY rating_date DESC 
                LIMIT 50
            """), {"ticker": ticker})
            grades = [dict(row._mapping) for row in result]
            return jsonify({"status": "ok", "grades_historical": grades})
    except SQLAlchemyError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

@app.route("/api/stocks/<ticker>/news", methods=["GET"])
def get_stock_news(ticker):
    """Get news for a specific stock"""
    if not engine:
        return jsonify({"status": "error", "error": "Database not configured"}), 500
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT url, published_date, publisher, title, text, source
                FROM stock_news 
                WHERE symbol = :ticker 
                ORDER BY published_date DESC 
                LIMIT 20
            """), {"ticker": ticker})
            news = [dict(row._mapping) for row in result]
            return jsonify({"status": "ok", "news": news})
    except SQLAlchemyError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

@app.route("/api/stocks/<ticker>/key-metrics", methods=["GET"])
def get_stock_key_metrics(ticker):
    """Get key metrics for a specific stock"""
    if not engine:
        return jsonify({"status": "error", "error": "Database not configured"}), 500
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT date, metrics
                FROM key_metrics 
                WHERE ticker = :ticker 
                ORDER BY date DESC 
                LIMIT 10
            """), {"ticker": ticker})
            metrics = [dict(row._mapping) for row in result]
            return jsonify({"status": "ok", "key_metrics": metrics})
    except SQLAlchemyError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

@app.route("/api/stocks/<ticker>/profile", methods=["GET"])
def get_stock_profile(ticker):
    """Get profile data for a specific stock"""
    if not engine:
        return jsonify({"status": "error", "error": "Database not configured"}), 500
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT profile_data, date_fetched
                FROM profiles 
                WHERE ticker = :ticker
            """), {"ticker": ticker})
            profiles = [dict(row._mapping) for row in result]
            return jsonify({"status": "ok", "profile": profiles[0] if profiles else None})
    except SQLAlchemyError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

@app.route("/api/stocks/<ticker>/allocations", methods=["GET"])
def get_stock_allocations(ticker):
    """Get allocation data for a specific stock"""
    if not engine:
        return jsonify({"status": "error", "error": "Database not configured"}), 500
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT allocation_date, market_cap_usd, allocation_pct, source
                FROM allocations 
                WHERE ticker = :ticker 
                ORDER BY allocation_date DESC 
                LIMIT 100
            """), {"ticker": ticker})
            allocations = [dict(row._mapping) for row in result]
            return jsonify({"status": "ok", "allocations": allocations})
    except SQLAlchemyError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

@app.route("/api/stocks/<ticker>/predictions", methods=["GET"])
def get_stock_predictions(ticker):
    """Get predictions for a specific stock"""
    if not engine:
        return jsonify({"status": "error", "error": "Database not configured"}), 500
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, request_data, response_data, created_at
                FROM predictions 
                WHERE request_data::text LIKE :ticker_pattern
                ORDER BY created_at DESC 
                LIMIT 20
            """), {"ticker_pattern": f"%{ticker}%"})
            predictions = [dict(row._mapping) for row in result]
            return jsonify({"status": "ok", "predictions": predictions})
    except SQLAlchemyError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

@app.route("/api/portfolio", methods=["GET"])
def get_portfolio():
    """Get portfolio data"""
    if not engine:
        return jsonify({"status": "error", "error": "Database not configured"}), 500
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT ticker, allocation_date, market_cap_usd, allocation_pct, source
                FROM allocations 
                ORDER BY allocation_date DESC, allocation_pct DESC
                LIMIT 100
            """))
            allocations = [dict(row._mapping) for row in result]
            return jsonify({"status": "ok", "allocations": allocations})
    except SQLAlchemyError as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    if not engine:
        return jsonify({
            "status": "unhealthy",
            "error": "Database not configured",
            "timestamp": datetime.now().isoformat()
        }), 500
    
    try:
        with engine.connect() as conn:
            # Simple query to test connection
            conn.execute(text("SELECT 1"))
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        })
    except SQLAlchemyError as exc:
        return jsonify({
            "status": "unhealthy",
            "error": str(exc),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route("/api/run-fetch", methods=["POST"])
def api_run_fetch():
    """Endpoint to trigger data updates"""
    payload = request.get_json(silent=True) or {}
    freq = payload.get("freq")
    
    if freq not in {"daily", "weekly", "quarterly", "annual"}:
        return jsonify({"status": "error", "error": "Invalid frequency"}), 400
    
    # This would trigger your update scripts
    # For now, return a placeholder response
    return jsonify({
        "status": "ok", 
        "message": f"Update for frequency '{freq}' triggered",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
