CREATE OR REPLACE VIEW
  public.v_round AS
SELECT
  array_agg(DISTINCT week) AS weeks,
  YEAR
FROM
  matchup
GROUP BY
  YEAR
ORDER BY
  YEAR DESC;