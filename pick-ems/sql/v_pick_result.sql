drop view if exists v_pick_result;

create or replace view v_pick_result as
select
    u.nickname as picker,
    u.text_color as picker_text_color,
    u.background_color as picker_background_color,
    p.picker_id as picker_id,
    p.pick_text as pick_text,
    r.name as week,
    r.year as year,
    m.id as matchup_id,
    away_team.name as away_team,
    home_team.name as home_team,
    p.pick_is_home as pick_is_home,
    away_team.is_b1g and home_team.is_b1g as is_b1g,
    m.is_postseason as is_postseason,
    m.is_postseason and (away_team.is_b1g or home_team.is_b1g) as is_b1g_postseason,
    p.created_at as created_at,
    m.matchup_title,
    p.id as pick_id,
    m.round as round,
    case
        when m.winner_is_home is null then null
    else
        m.winner_is_home = p.pick_is_home
    end as is_win
from
    pick as p
    left join matchup as m on p.matchup_id = m.id
    left join auth_user as u on p.picker_id = u.id
    left join team as away_team on m.away_team_id = away_team.id
    left join team as home_team on m.home_team_id = home_team.id
    left join round as r on m.round = r.id