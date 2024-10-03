drop view if exists v_matchup;

create or replace view v_matchup as
select
    away_team.name as away_team_name,
    home_team.name as home_team_name,
    m.winner_is_home as winner_is_home,
    m.week as week,
    m.year as year,
    m.id as id
from
    matchup as m
    left join team as away_team on m.away_team_id = away_team.id
    left join team as home_team on m.home_team_id = home_team.id
order by year desc, week asc