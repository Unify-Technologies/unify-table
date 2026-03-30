/**
 * Generate 1M rows of sample trade data using DuckDB's generate_series.
 * Uses hash() for pseudo-random but deterministic distributions.
 */

export const SEED_SQL = `
CREATE TABLE IF NOT EXISTS trades AS
WITH raw AS (
  SELECT
    i AS id,
    hash(i * 7 + 13) AS h1,
    hash(i * 13 + 7) AS h2,
    hash(i * 19 + 3) AS h3,
    hash(i * 31 + 17) AS h4,
    hash(i * 43 + 29) AS h5,
    hash(i * 61 + 41) AS h6
  FROM generate_series(1, 1000000) t(i)
)
SELECT
  id,
  -- 5 tickers, heavily skewed: AAPL ~35%, MSFT ~25%, GOOG ~20%, AMZN ~12%, META ~8%
  CASE
    WHEN h1 % 100 < 35 THEN 'AAPL'
    WHEN h1 % 100 < 60 THEN 'MSFT'
    WHEN h1 % 100 < 80 THEN 'GOOG'
    WHEN h1 % 100 < 92 THEN 'AMZN'
    ELSE 'META'
  END AS ticker,
  ROUND(
    CASE
      WHEN h2 % 100 < 5  THEN ((h2 % 20000)::BIGINT - 10000) / 10.0     -- 5% extreme outliers
      WHEN h2 % 100 < 20 THEN ((h2 % 6000)::BIGINT - 3000) / 10.0       -- 15% moderate moves
      ELSE ((h2 % 2000)::BIGINT - 1000) / 10.0                           -- 80% normal range
    END
  , 2) AS pnl,
  -- 7 regions, skewed: US ~28%, EMEA ~22%, APAC ~18%, LATAM ~12%, Canada ~8%, MEA ~7%, Nordics ~5%
  CASE
    WHEN h3 % 100 < 28 THEN 'US'
    WHEN h3 % 100 < 50 THEN 'EMEA'
    WHEN h3 % 100 < 68 THEN 'APAC'
    WHEN h3 % 100 < 80 THEN 'LATAM'
    WHEN h3 % 100 < 88 THEN 'Canada'
    WHEN h3 % 100 < 95 THEN 'MEA'
    ELSE 'Nordics'
  END AS region,
  -- 3 desks, skewed: Trading ~55%, Sales ~30%, Research ~15%
  CASE
    WHEN h4 % 100 < 55 THEN 'Trading'
    WHEN h4 % 100 < 85 THEN 'Sales'
    ELSE 'Research'
  END AS desk,
  DATE '2023-06-01' + INTERVAL (h5 % 640) DAY AS trade_date,
  CASE
    WHEN h6 % 100 < 10 THEN (h6 % 500) + 50                              -- 10% tiny trades
    WHEN h6 % 100 < 85 THEN (h6 % 40000) + 500                           -- 75% normal range
    ELSE (h6 % 200000) + 40000                                            -- 15% large blocks
  END::INTEGER AS volume,
  ROUND(
    CASE
      WHEN h1 % 100 < 20 THEN ((h3 % 500000)::BIGINT + 5000) / 100.0        -- 20% small notional
      WHEN h1 % 100 < 80 THEN ((h3 % 5000000)::BIGINT + 50000) / 100.0      -- 60% mid-range
      ELSE ((h3 % 50000000)::BIGINT + 500000) / 100.0                        -- 20% large notional
    END
  , 2) AS notional
FROM raw;
`;
