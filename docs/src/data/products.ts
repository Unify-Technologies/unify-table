export const PRODUCTS_SQL = `
CREATE TABLE IF NOT EXISTS products AS
WITH raw AS (
  SELECT i AS id,
    hash(i * 11 + 5) AS h1, hash(i * 23 + 11) AS h2,
    hash(i * 37 + 19) AS h3
  FROM generate_series(1, 200) t(i)
)
SELECT
  id,
  'SKU-' || LPAD(CAST(id AS VARCHAR), 4, '0') AS sku,
  CASE (h1 % 8)::INTEGER
    WHEN 0 THEN 'Laptop' WHEN 1 THEN 'Monitor' WHEN 2 THEN 'Keyboard'
    WHEN 3 THEN 'Mouse' WHEN 4 THEN 'Headset' WHEN 5 THEN 'Webcam'
    WHEN 6 THEN 'Dock' ELSE 'Cable'
  END AS category,
  CASE (h2 % 4)::INTEGER
    WHEN 0 THEN 'Acme' WHEN 1 THEN 'TechCo'
    WHEN 2 THEN 'Pinnacle' ELSE 'NovaTech'
  END AS brand,
  ROUND(((h1 % 200000)::BIGINT + 999)::DOUBLE / 100, 2) AS price,
  (h2 % 500)::INTEGER AS stock,
  CASE
    WHEN h3 % 10 < 2 THEN 'Discontinued'
    WHEN h3 % 10 < 5 THEN 'Low Stock'
    ELSE 'Available'
  END AS status
FROM raw;
`;
