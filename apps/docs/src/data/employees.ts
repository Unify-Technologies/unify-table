export const EMPLOYEES_SQL = `
CREATE TABLE IF NOT EXISTS employees AS
WITH raw AS (
  SELECT i AS id,
    hash(i * 7 + 13) AS h1, hash(i * 13 + 7) AS h2,
    hash(i * 19 + 3) AS h3, hash(i * 31 + 17) AS h4
  FROM generate_series(1, 500) t(i)
)
SELECT
  id,
  CASE (h1 % 20)::INTEGER
    WHEN 0 THEN 'Alice' WHEN 1 THEN 'Bob' WHEN 2 THEN 'Charlie'
    WHEN 3 THEN 'Diana' WHEN 4 THEN 'Eve' WHEN 5 THEN 'Frank'
    WHEN 6 THEN 'Grace' WHEN 7 THEN 'Hank' WHEN 8 THEN 'Iris'
    WHEN 9 THEN 'Jack' WHEN 10 THEN 'Kara' WHEN 11 THEN 'Leo'
    WHEN 12 THEN 'Maya' WHEN 13 THEN 'Nate' WHEN 14 THEN 'Olivia'
    WHEN 15 THEN 'Pete' WHEN 16 THEN 'Quinn' WHEN 17 THEN 'Rosa'
    WHEN 18 THEN 'Sam' ELSE 'Tina'
  END AS name,
  CASE (h2 % 5)::INTEGER
    WHEN 0 THEN 'Engineering' WHEN 1 THEN 'Sales'
    WHEN 2 THEN 'Marketing' WHEN 3 THEN 'Finance'
    ELSE 'Operations'
  END AS department,
  CASE (h3 % 4)::INTEGER
    WHEN 0 THEN 'Senior' WHEN 1 THEN 'Mid'
    WHEN 2 THEN 'Junior' ELSE 'Lead'
  END AS level,
  ROUND(((h4 % 80000)::BIGINT + 40000)::DOUBLE, 2) AS salary,
  DATE '2018-01-01' + INTERVAL (h1 % 1800) DAY AS hire_date,
  CASE (h2 % 3)::INTEGER
    WHEN 0 THEN 'New York' WHEN 1 THEN 'London' ELSE 'Tokyo'
  END AS office,
  ((h3 % 5)::DOUBLE + 1) AS rating
FROM raw;
`;
