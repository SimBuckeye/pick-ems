create or replace view
  v_round as
select
  array_agg(distinct week) as weeks,
  year
from
  matchup
where 
  week is not null
group by
  year
order by
  year DESC;