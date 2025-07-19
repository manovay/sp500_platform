import os
from io import StringIO
import psycopg2
from psycopg2 import sql


def run_fetch(freq: str) -> str:
    """Refresh materialized views for the given frequency.

    Parameters
    ----------
    freq: str
        Frequency label to filter table names in ``ingestion_metadata``.

    Returns
    -------
    str
        Combined log output from the refresh operations.
    """
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
                    "SELECT table_name FROM ingestion_metadata WHERE frequency = %s",
                    (freq,),
                )
                tables = [row[0] for row in cur.fetchall()]
                if not tables:
                    log_buffer.write(f"No tables found for frequency '{freq}'.\n")
                for table in tables:
                    try:
                        refresh_sql = sql.SQL("REFRESH MATERIALIZED VIEW {tbl}").format(
                            tbl=sql.Identifier(table)
                        )
                        cur.execute(refresh_sql)
                        log_buffer.write(f"Refreshed {table}\n")
                    except Exception as exc:
                        conn.rollback()
                        log_buffer.write(f"Error refreshing {table}: {exc}\n")
    except Exception as exc:
        log_buffer.write(f"Error running fetch: {exc}\n")
    finally:
        conn.close()

    return log_buffer.getvalue()
