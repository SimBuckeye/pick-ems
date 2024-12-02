drop view if exists v_matchup;

create or replace view v_matchup as
select
    away_team.name as away_team_name,
    home_team.name as home_team_name,
    m.winner_is_home as winner_is_home,
    r.name as week,
    r.year as year,
    m.id as id,
    m.is_postseason as is_postseason,
    m.is_postseason and (away_team.is_b1g or home_team.is_b1g) as is_b1g_postseason,
    m.matchup_title as matchup_title,
    m.round as round
from
    matchup as m
    left join team as away_team on m.away_team_id = away_team.id
    left join team as home_team on m.home_team_id = home_team.id
    left join round as r on m.round = r.id
order by year desc, week asc