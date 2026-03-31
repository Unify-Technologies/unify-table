export const ORDERS_SQL = `
CREATE TABLE IF NOT EXISTS orders AS
WITH raw AS (
  SELECT i AS id,
    hash(i * 7) AS h1, hash(i * 13) AS h2,
    hash(i * 19) AS h3, hash(i * 31) AS h4
  FROM generate_series(1, 10000) t(i)
)
SELECT
  id,
  DATE '2023-01-01' + INTERVAL (h1 % 730) DAY AS order_date,
  CASE (h2 % 6)::INTEGER
    WHEN 0 THEN 'Electronics' WHEN 1 THEN 'Clothing' WHEN 2 THEN 'Food'
    WHEN 3 THEN 'Books' WHEN 4 THEN 'Home' ELSE 'Sports'
  END AS category,
  CASE (h3 % 4)::INTEGER
    WHEN 0 THEN 'US' WHEN 1 THEN 'UK' WHEN 2 THEN 'DE' ELSE 'JP'
  END AS region,
  ROUND(((h1 % 50000)::BIGINT + 500)::DOUBLE / 100, 2) AS amount,
  ((h2 % 20)::INTEGER + 1) AS quantity,
  ROUND(((h4 % 10000)::BIGINT)::DOUBLE / 100, 2) AS shipping_cost,
  CASE
    WHEN h3 % 20 = 0 THEN 'Returned'
    WHEN h3 % 20 < 3 THEN 'Cancelled'
    ELSE 'Completed'
  END AS status
FROM raw;
`;
