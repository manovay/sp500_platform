import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv(override=True)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

app = Flask(__name__)
CORS(app)

@app.get("/api/history")
def history():
    session = Session()
    try:
        result = session.execute(text(
            "SELECT ticker, allocation_date, market_cap_usd, allocation_pct "
            "FROM allocations ORDER BY allocation_date DESC LIMIT 100"
        ))
        records = [dict(r) for r in result]
    finally:
        session.close()
    return jsonify(records)

@app.get("/api/current")
def current():
    session = Session()
    try:
        latest_date = session.execute(text("SELECT MAX(allocation_date) FROM allocations")).scalar()
        if latest_date is None:
            data = {}
        else:
            result = session.execute(
                text("SELECT ticker, market_cap_usd, allocation_pct FROM allocations WHERE allocation_date = :d"),
                {"d": latest_date}
            )
            data = {
                "date": str(latest_date),
                "allocations": [dict(r) for r in result]
            }
    finally:
        session.close()
    return jsonify(data)

@app.get("/api/growth")
def growth():
    session = Session()
    try:
        result = session.execute(text(
            "SELECT allocation_date, SUM(market_cap_usd) AS total_market_cap "
            "FROM allocations GROUP BY allocation_date ORDER BY allocation_date"
        ))
        records = [{"allocation_date": r[0].isoformat(), "total_market_cap": int(r[1])} for r in result]
    finally:
        session.close()
    return jsonify(records)

@app.post("/api/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    result = {"prediction": "LLM forecast placeholder"}
    session = Session()
    try:
        session.execute(
            text(
                "INSERT INTO predictions (request_data, response_data) "
                "VALUES (:req, :res)"
            ),
            {
                "req": json.dumps(payload),
                "res": json.dumps(result),
            },
        )
        session.commit()
    finally:
        session.close()
    return jsonify({**result, "input": payload})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
