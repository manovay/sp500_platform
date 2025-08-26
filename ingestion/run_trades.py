
from dotenv import load_dotenv
load_dotenv()

import os
import time
import json
import psycopg2
import requests
from decimal import Decimal, ROUND_DOWN
from datetime import date, timedelta

"""
What it does: Rebalances the portfolio based on the latest allocations from the database.
How it works: Fetches the latest allocations from the database, calculates the target portfolio value, and submits orders to Alpaca to rebalance the portfolio.
Data storage: Stores the actual allocations after rebalancing in the actual_portfolio_allocations table.
"""


# ── Config ─────────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")
ALPACA_KEY   = os.getenv("ALPACA_KEY")
ALPACA_SEC   = os.getenv("ALPACA_SECRET")
ALPACA_BASE  = os.getenv("ALPACA_HTTP_BASE", "https://paper-api.alpaca.markets")
MIN_TRADE_NOTIONAL = Decimal(os.getenv("MIN_TRADE_NOTIONAL", "5"))
DRY_RUN = os.getenv("DRY_RUN", "1") == "1"
POST_SLEEP_SECS = float(os.getenv("POST_SLEEP_SECS", "0.35"))

def convert_ticker_for_alpaca(ticker):
    """Convert ticker names from database format to Alpaca format"""
    # Known tickers that need conversion: BF-B -> BF.B, BRK-B -> BRK.B
    ticker_conversions = {
        "BF-B": "BF.B",
        "BRK-B": "BRK.B"
    }
    return ticker_conversions.get(ticker, ticker)

required = ("DATABASE_URL","ALPACA_KEY","ALPACA_SECRET")
missing = [k for k in required if not os.getenv(k)]
if missing:
    raise RuntimeError(f"Missing required env: {', '.join(missing)}")

HEADERS = {
    "APCA-API-KEY-ID": ALPACA_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SEC,
    "accept": "application/json",
    "content-type": "application/json",
}

def aget(path, **kwargs):
    url = f"{ALPACA_BASE.rstrip('/')}/v2{path}"
    r = requests.get(url, headers=HEADERS, timeout=30, **kwargs)
    if r.status_code >= 400:
        print(f"[HTTP {r.status_code}] GET {path} -> {r.text[:200]}")
    r.raise_for_status()
    return r.json()

def apost(path, payload, retries=3):
    url = f"{ALPACA_BASE.rstrip('/')}/v2{path}"
    body = json.dumps(payload)
    for attempt in range(1, retries+1):
        r = requests.post(url, headers=HEADERS, data=body, timeout=30)
        if r.status_code == 429:
            wait = int(r.headers.get("Retry-After", "60"))
            print(f"[429] rate limit; sleeping {wait}s (attempt {attempt}/{retries})")
            time.sleep(wait)
            continue
        if r.status_code >= 400:
            print(f"[HTTP {r.status_code}] POST {path} payload={payload} -> {r.text[:500]}")
            if attempt < retries:
                time.sleep(2 * attempt)
                continue
        r.raise_for_status()
        return r.json()
    r.raise_for_status()

# ── DB: latest allocations ─────────────────────────────────────────────────────
def fetch_latest_allocations():
    """
    Returns:
      weights_raw: dict[ticker] = Decimal(allocation_pct)
      latest_date: snapshot date
    """
    sql = """
    WITH latest AS (SELECT max(allocation_date) AS d FROM allocations)
    SELECT a.ticker, a.allocation_pct, l.d
    FROM allocations a
    JOIN latest l ON a.allocation_date = l.d
    """
    with psycopg2.connect(DATABASE_URL) as conn, conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()
        if not rows:
            raise RuntimeError("No allocations found.")
    weights = {t: Decimal(str(p)) for (t, p, _) in rows}
    latest_date = rows[0][2]
    return weights, latest_date

# ── DB: actual portfolio allocations ───────────────────────────────────────────
def store_actual_allocations(weights, equity, snap_date):
    """
    Store the actual portfolio allocations after rebalancing
    """
    sql = """
    INSERT INTO actual_portfolio_allocations 
    (ticker, allocation_date, actual_allocation_pct, portfolio_value, position_value)
    VALUES (%s, %s, %s, %s, %s)
    ON CONFLICT (ticker, allocation_date) DO UPDATE SET
        actual_allocation_pct = EXCLUDED.actual_allocation_pct,
        portfolio_value = EXCLUDED.portfolio_value,
        position_value = EXCLUDED.position_value,
        created_at = NOW()
    """
    
    with psycopg2.connect(DATABASE_URL) as conn, conn.cursor() as cur:
        for ticker, norm_pct in weights.items():
            position_value = (equity * norm_pct).quantize(Decimal("0.01"))
            cur.execute(sql, (
                ticker, 
                snap_date, 
                float(norm_pct),  # Store as decimal (0.0025 for 0.25%)
                float(equity),
                float(position_value)
            ))
        conn.commit()
    
    print(f"[store] Saved actual allocations for {len(weights)} tickers")

# ── Alpaca state ───────────────────────────────────────────────────────────────
def get_account_equity():
    acct = aget("/account")  # includes 'equity'
    eq = Decimal(str(acct["equity"]))
    print(f"[account] equity=${eq:,}  cash=${acct.get('cash','?')}  buying_power=${acct.get('buying_power','?')}")
    return eq

def positions_value_map():
    """
    Returns: dict[symbol] = Decimal(market_value)
    Alpaca returns only open positions; closed symbols won't appear.
    """
    pos = aget("/positions")
    out = {p["symbol"]: Decimal(p.get("market_value","0") or "0") for p in pos}
    print(f"[positions] open={len(out)}  sample={list(out)[:8]}")
    return out

# ── Rebalance ──────────────────────────────────────────────────────────────────
def main():
    print("== Rebalance start ==")
    print(f"[env] base={ALPACA_BASE}  dry_run={DRY_RUN}  min_trade=${MIN_TRADE_NOTIONAL}  sleep={POST_SLEEP_SECS}s")

    weights_raw, snap_date = fetch_latest_allocations()
    print(f"[db] latest allocation_date={snap_date}  tickers={len(weights_raw)}")
    
    sum_all = sum(weights_raw.values())
    pos_items = {t: w for t, w in weights_raw.items() if w > 0}
    sum_pos = sum(pos_items.values())
    print(f"[db] sum(weights ALL)={sum_all:.10f}  sum(>0)={sum_pos:.10f}")
    if sum_pos <= 0:
        raise RuntimeError("Positive allocation weights sum to 0.")

    # Normalize positive weights to 1.0; zeros/negatives target $0
    weights = {t: (w / sum_pos) for t, w in pos_items.items()}
    print(f"[normalize] positive tickers={len(weights)}  sum(normalized)={sum(weights.values()):.10f}")

    equity = get_account_equity()
    cur_vals = positions_value_map()

    # Universe = tickers that should have target (weights keys) OR are currently held (sell down if 0 target)
    symbols = sorted(set(weights) | set(cur_vals))
    print(f"[universe] symbols_to_process={len(symbols)}")

    to_submit = []
    skipped_small = 0
    total_target_value = Decimal("0")  # Initialize here
    total_current_value = Decimal("0")  # Initialize here
    
    for idx, sym in enumerate(symbols, 1):
        tgt_val = (equity * weights.get(sym, Decimal("0"))).quantize(Decimal("0.01"))
        cur_val = cur_vals.get(sym, Decimal("0")).quantize(Decimal("0.01"))
        delta = tgt_val - cur_val
        
        # Track totals for verification
        total_target_value += tgt_val
        total_current_value += cur_val
        
        # Add allocation percentage to the output
        raw_pct = weights_raw.get(sym, 0)
        norm_pct = weights.get(sym, 0)
        cur_pct = (cur_val / equity * 100) if equity > 0 else 0
        tgt_pct = (tgt_val / equity * 100) if equity > 0 else 0

        if delta.copy_abs() < MIN_TRADE_NOTIONAL:
            # print(f"[{idx:03d}/{len(symbols)}][skip<min] {sym}  raw_pct={raw_pct:.4f}%  norm_pct={norm_pct:.4f}  cur_pct={cur_pct:.2f}%  cur=${cur_val}  tgt=${tgt_val}  tgt_pct={tgt_pct:.2f}%  Δ=${delta}")
            skipped_small += 1
            continue

        if delta > 0:
            side = "buy"
            notional = delta
        else:
            side = "sell"
            notional = min(delta.copy_abs(), cur_val)  # avoid shorting; cap by long value

        notional = notional.quantize(Decimal("0.01"), rounding=ROUND_DOWN)
        if notional < MIN_TRADE_NOTIONAL:
            # print(f"[{idx:03d}/{len(symbols)}][skip<min-cap] {sym}  raw_pct={raw_pct:.4f}%  norm_pct={norm_pct:.4f}  Δ→${notional}")
            skipped_small += 1
            continue

        # Convert ticker name for Alpaca if needed
        alpaca_symbol = convert_ticker_for_alpaca(sym)
        if alpaca_symbol != sym:
            print(f" Converting ticker: {sym} -> {alpaca_symbol}")
        
        od = {
            "symbol": alpaca_symbol,
            "side": side,
            "type": "market",
            "time_in_force": "day",       # fractional/notional orders require DAY
            "notional": float(notional),  # dollars
        }
        # print(f"[{idx:03d}/{len(symbols)}][plan] {sym}  raw_pct={raw_pct:.4f}%  norm_pct={norm_pct:.4f}  cur_pct={cur_pct:.2f}%  cur=${cur_val}  tgt=${tgt_val}  tgt_pct={tgt_pct:.2f}%  Δ=${delta}  -> {side.upper()} ${notional}")
        to_submit.append(od)

    print(f"[plan] orders_to_submit={len(to_submit)}  skipped_small={skipped_small}  dry_run={DRY_RUN}")
    
    # Add verification summary
    print(f"\n[VERIFICATION] Portfolio Summary:")
    print(f"  Account Equity: ${equity:,.2f}")
    print(f"  Total Current Value: ${total_current_value:,.2f} ({total_current_value/equity*100:.2f}%)")
    print(f"  Total Target Value: ${total_target_value:,.2f} ({total_target_value/equity*100:.2f}%)")
    print(f"  Cash/Unallocated: ${equity - total_target_value:,.2f} ({(equity - total_target_value)/equity*100:.2f}%)")
    
    # Verify target percentages sum to 100%
    target_pct_sum = sum((equity * weights.get(sym, Decimal("0"))).quantize(Decimal("0.01")) / equity * 100 for sym in weights)
    print(f"  Sum of Target Percentages: {target_pct_sum:.2f}%")
    
    if abs(target_pct_sum - Decimal("100.0")) > Decimal("0.01"):
        print(f" WARNING: Target percentages don't sum to 100% (off by {target_pct_sum - Decimal('100.0'):.2f}%)")
    else:
        print(f" Target percentages sum to 100% correctly")

    if DRY_RUN:
        # show first few orders verbosely
        print(json.dumps(to_submit[:10], indent=2))
        print("DRY_RUN=1 -> Preview only. No orders were sent.")
        return

    ok, fail = 0, 0
    failed_orders = []
    for i, od in enumerate(to_submit, 1):
        try:
            resp = apost("/orders", od)
            # print(f"[submit {i}/{len(to_submit)}] {od['symbol']} {od['side']} ${od['notional']} -> {resp.get('status')} id={resp.get('id')}")
            ok += 1
        except requests.HTTPError as e:
            msg = e.response.text if e.response is not None else str(e)
            print(f"[ERROR] {od['symbol']} {od['side']} ${od['notional']} -> {msg[:200]}")
            failed_orders.append({
                'symbol': od['symbol'],
                'side': od['side'],
                'notional': od['notional'],
                'error': msg[:200]
            })
            fail += 1
        time.sleep(POST_SLEEP_SECS)  # be kind to the API

    print(f"[done] submitted={ok}  failed={fail}  skipped={skipped_small}")
    
    # Store actual allocations after rebalancing
    if not DRY_RUN:
        store_actual_allocations(weights, equity, snap_date)
    
    print("== Rebalance end ==")
    
    return failed_orders

def fetch(from_date=None, limit=None):
    """
    Wrapper function to make run_trades compatible with run_all.py
    Ignores from_date and limit parameters since this is a trading script
    Returns failed orders for tracking
    """
    print("Starting portfolio rebalancing...")
    return main()

if __name__ == "__main__":
    try:
        main()
        
        # Log successful execution
        from weekly_stats_manager import log_script_execution
        log_script_execution("run_trades.py", True)
        
    except Exception as e:
        # Log failed execution
        from weekly_stats_manager import log_script_execution
        log_script_execution("run_trades.py", False, str(e))
        raise