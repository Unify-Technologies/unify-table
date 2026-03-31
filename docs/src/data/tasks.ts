export const TASKS_SQL = `
CREATE TABLE IF NOT EXISTS tasks AS
SELECT
  i AS id,
  'Task ' || i AS title,
  CASE WHEN i % 3 = 0 THEN 'Done' WHEN i % 3 = 1 THEN 'In Progress' ELSE 'Todo' END AS status,
  CASE WHEN i % 4 = 0 THEN 'High' WHEN i % 4 = 1 THEN 'Medium' WHEN i % 4 = 2 THEN 'Low' ELSE 'Medium' END AS priority,
  DATE '2025-03-01' + INTERVAL (i * 2) DAY AS due_date
FROM generate_series(1, 50) t(i);
`;
