create or replace view
  v_round as
select
  array_agg(distinct name) as weeks,
  year
from
  round
where 
  name is not null
group by
  year
order by
  year DESC;