import os
import subprocess
import psycopg2

def run_fetch(freq: str) -> str:
    from io import StringIO
    log_buffer = StringIO()

    db_config = {
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "dbname": os.getenv("DB_NAME"),
    }

    try:
        conn = psycopg2.connect(**db_config)
    except Exception as exc:
        log_buffer.write(f"Error connecting to database: {exc}\n")
        return log_buffer.getvalue()

    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT script_name FROM ingestion_metadata WHERE frequency = %s AND script_name IS NOT NULL",
                    (freq,),
                )
                scripts = [row[0] for row in cur.fetchall()]
                if not scripts:
                    log_buffer.write(f"No scripts found for frequency '{freq}'.\n")
                for script in scripts:
                    try:
                        result = subprocess.run(
                            ["python", f"ingestion/{script}"],
                            capture_output=True, text=True
                        )
                        log_buffer.write(f"Ran {script}:\n{result.stdout}\n{result.stderr}\n")
                    except Exception as exc:
                        log_buffer.write(f"Error running {script}: {exc}\n")
    except Exception as exc:
        log_buffer.write(f"Error running fetch: {exc}\n")
    finally:
        conn.close()

    return log_buffer.getvalue()