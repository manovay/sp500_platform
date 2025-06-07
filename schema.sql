-- 1. Tickers table: stores ticker info
CREATE TABLE tickers (
    ticker VARCHAR(10) PRIMARY KEY,
    company_name TEXT NOT NULL,
    sector TEXT,
    date_added DATE
);

-- 2. Prices table: stores daily price data for each ticker
CREATE TABLE prices (
    ticker VARCHAR(10),
    price_date DATE,
    open_price NUMERIC(12,4),
    high_price NUMERIC(12,4),
    low_price NUMERIC(12,4),
    close_price NUMERIC(12,4),
    volume BIGINT,
    PRIMARY KEY (ticker, price_date),
    FOREIGN KEY (ticker) REFERENCES tickers(ticker) ON DELETE CASCADE
);

-- Index for fast lookup by ticker and price_date
CREATE INDEX idx_prices_ticker_date ON prices (ticker, price_date);

-- 3. Analyst labels table: stores analyst ratings for each ticker
CREATE TABLE analyst_labels (
    ticker                         VARCHAR(10) NOT NULL,
    label_date                     DATE        NOT NULL,
    -- letter‐grade overall rating (e.g. 'A-', 'B+')
    rating                         VARCHAR(3)  NOT NULL,
    -- integer scores (1–5)
    overall_score                  SMALLINT,
    discounted_cash_flow_score     SMALLINT,
    return_on_equity_score         SMALLINT,
    return_on_assets_score         SMALLINT,
    debt_to_equity_score           SMALLINT,
    price_to_earnings_score        SMALLINT,
    price_to_book_score            SMALLINT,
    source                         TEXT,
    PRIMARY KEY (ticker, label_date)
);
