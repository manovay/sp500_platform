import os
from flask import Flask, request, jsonify
from flask_cors import CORS


from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from scripts import run_fetch

app = Flask(__name__)
CORS(app, origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")])

# start scheduler to refresh data automatically
scheduler = BackgroundScheduler(timezone="UTC")
scheduler.add_job(lambda: run_fetch("daily"), CronTrigger(hour=0, minute=0))
scheduler.add_job(lambda: run_fetch("weekly"), CronTrigger(day_of_week="sun", hour=0, minute=0))
scheduler.add_job(lambda: run_fetch("quarterly"), CronTrigger(month="1,4,7,10", day=1, hour=0, minute=0))
scheduler.add_job(lambda: run_fetch("annual"), CronTrigger(month=1, day=1, hour=0, minute=0))
scheduler.start()


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
        log_message = f"[INFO] Fetch script for frequency '{freq}' was triggered."
        return jsonify({"status": "ok", "log": log_message + "\n" + log})
    except Exception as exc:
        return jsonify({"status": "error", "error": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
