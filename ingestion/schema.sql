-- 1. Tickers table: stores ticker info
CREATE TABLE IF NOT EXISTS tickers (
    ticker VARCHAR(10) PRIMARY KEY,
    company_name TEXT NOT NULL,
    sector TEXT,
    date_added DATE
);

-- 2. Prices table: stores daily price data for each ticker
CREATE TABLE IF NOT EXISTS prices (
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
CREATE TABLE IF NOT EXISTS analyst_labels (
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

CREATE TABLE IF NOT EXISTS analyst_estimates (
  symbol               VARCHAR(10)    NOT NULL,
  report_date          DATE           NOT NULL,
  revenue_low          BIGINT,
  revenue_high         BIGINT,
  revenue_avg          BIGINT,
  ebitda_low           BIGINT,
  ebitda_high          BIGINT,
  ebitda_avg           BIGINT,
  ebit_low             BIGINT,
  ebit_high            BIGINT,
  ebit_avg             BIGINT,
  net_income_low       BIGINT,
  net_income_high      BIGINT,
  net_income_avg       BIGINT,
  sga_expense_low      BIGINT,
  sga_expense_high     BIGINT,
  sga_expense_avg      BIGINT,
  eps_avg              NUMERIC(10,4),
  eps_high             NUMERIC(10,4),
  eps_low              NUMERIC(10,4),
  num_analysts_revenue INTEGER,
  num_analysts_eps     INTEGER,
  source               VARCHAR(50)    NOT NULL,
  PRIMARY KEY (symbol, report_date)
);
CREATE TABLE IF NOT EXISTS grades_historical (
  symbol                     VARCHAR(10)  NOT NULL,
  rating_date                DATE         NOT NULL,
  analyst_ratings_buy        INTEGER,
  analyst_ratings_hold       INTEGER,
  analyst_ratings_sell       INTEGER,
  analyst_ratings_strong_sell INTEGER,
  source                     VARCHAR(10)  NOT NULL,
  PRIMARY KEY (symbol, rating_date)
);


CREATE TABLE IF NOT EXISTS stock_news (
  url              TEXT         NOT NULL,
  symbol           VARCHAR(10)  NOT NULL,
  published_date   TIMESTAMP    NOT NULL,
  publisher        VARCHAR(255),
  title            TEXT,
  image            TEXT,
  site             VARCHAR(255),
  text             TEXT,
  source           VARCHAR(10)  NOT NULL,
  PRIMARY KEY (url)
);

CREATE TABLE IF NOT EXISTS key_metrics (
    ticker VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    metrics JSON NOT NULL,
    PRIMARY KEY (ticker, date),
    FOREIGN KEY (ticker) REFERENCES tickers(ticker) ON DELETE CASCADE
);

-- 5. Profiles table: stores company profile data for each ticker
CREATE TABLE IF NOT EXISTS profiles (
    ticker VARCHAR(10) PRIMARY KEY,
    profile_data JSON NOT NULL,
    date_fetched DATE NOT NULL,
    FOREIGN KEY (ticker) REFERENCES tickers(ticker) ON DELETE CASCADE
);

-- Historical Allocations Table
CREATE TABLE IF NOT EXISTS allocations (
    ticker             VARCHAR(10)    NOT NULL
        REFERENCES tickers(ticker) 
        ON DELETE CASCADE,
    allocation_date    DATE           NOT NULL,
    market_cap_usd     BIGINT         NOT NULL,    -- raw market-cap value from FMP
    allocation_pct     NUMERIC(7,6)   NOT NULL,    -- e.g. 0.061234 = 6.1234%
    source             VARCHAR(50)    NOT NULL,    -- e.g. 'FMP Historical Market Cap'
    retrieved_at       TIMESTAMP      NOT NULL 
        DEFAULT NOW(),                  -- when this row was loaded
    PRIMARY KEY (ticker, allocation_date)
);

-- Index to speed date-range and time-series queries
CREATE INDEX IF NOT EXISTS idx_allocations_date 
    ON allocations (allocation_date);
