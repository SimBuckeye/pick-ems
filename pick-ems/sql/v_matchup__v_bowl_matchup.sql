drop view if exists v_bowl_matchup;
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
    m.round as round,
	m.underdog,
	coalesce(
		(
			select count() from pick where pick.matchup_id = m.id and pick.pick_is_home = false
		)
		, 0
	) as away_picks,
	coalesce(
		(
			select count() from pick where pick.matchup_id = m.id and pick.pick_is_home = true
		)
		, 0
	) as home_picks
from
    matchup as m
    left join team as away_team on m.away_team_id = away_team.id
    left join team as home_team on m.home_team_id = home_team.id
    left join round as r on m.round = r.id;
	
	
create or replace view v_bowl_matchup as
select m.*,
       away_pick.picker   as away_picker,
       away_pick.picker_id as away_picker_id,
       home_pick.picker   as home_picker,
       home_pick.picker_id as home_picker_id
from v_matchup m
left join lateral (
  select p.picker, p.picker_id
  from v_pick_result p
  where p.matchup_id = m.id and p.pick_is_home = false
  limit 1
) away_pick on true
left join lateral (
  select p.picker, p.picker_id
  from v_pick_result p
  where p.matchup_id = m.id and p.pick_is_home = true
  limit 1
) home_pick on true
where m.is_postseason = true
  and m.is_b1g_postseason = false;