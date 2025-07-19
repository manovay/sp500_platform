import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from scripts import run_fetch

app = Flask(__name__)
CORS(app, origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")])


@app.route("/api/run-fetch", methods=["POST"])
def api_run_fetch():
    if request.headers.get("X-ADMIN-TOKEN") != os.getenv("ADMIN_TOKEN"):
        return jsonify({"status": "error", "error": "Forbidden"}), 403
    payload = request.get_json(silent=True) or {}
    freq = payload.get("freq")
    if freq not in {"daily", "weekly", "quarterly", "annual"}:
        return jsonify({"status": "error", "error": "Invalid frequency"}), 400
    try:
        log = run_fetch(freq)
        return jsonify({"status": "ok", "log": log})
    except Exception as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
