create or replace view v_round as
select distinct
    week,
    year
from matchup
order by year desc, week asc