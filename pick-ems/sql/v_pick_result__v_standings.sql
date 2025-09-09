drop view if exists v_standings;
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
		when m.is_postseason or not away_team.is_b1g or not home_team.is_b1g then 0
		when m.winner_is_home is null then null
		when m.winner_is_home and p.pick_is_home and m.underdog = 'home_underdog' then 2
		when not winner_is_home and not p.pick_is_home and m.underdog = 'away_underdog' then 2
		when m.winner_is_home = p.pick_is_home then 1
	else
		0
	end as points,
	
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
    left join round as r on m.round = r.id;



create or replace view v_standings as
select
    nickname,
    picker_text_color,
    picker_background_color,
    picker_id,
    year,
	points,
    b1g_wins,
    b1g_losses,
    case 
      when b1g_wins > 0 or b1g_losses > 0 then b1g_wins::real / (b1g_wins + b1g_losses)::real
      else 0
    end as b1g_percentage,
    total_wins,
    total_losses,
    case
        when total_wins > 0 or total_losses > 0 then total_wins::real / (total_wins + total_losses)::real
        else 0
    end as total_percentage,
    postseason_picks,
    postseason_wins,
    postseason_losses,
    case
        when postseason_wins > 0 or postseason_losses > 0 then postseason_wins::real / (postseason_wins + postseason_losses)::real
        else 0
    end as postseason_percentage
from
(
    select
        u.nickname as nickname,
        u.text_color as picker_text_color,
        u.background_color as picker_background_color,
        u.id as picker_id,
        pr.year as year,
		sum(pr.points) as points,
        count(*) filter ( where
            pr.is_win
            and pr.is_b1g
            and not pr.is_postseason
        ) as b1g_wins,
        count(*) filter (where
            not pr.is_win
            and pr.is_b1g
            and not pr.is_postseason
        ) as b1g_losses,
        count(*) filter (where
            pr.is_win
            and not pr.is_postseason
        ) as total_wins,
        count(*) filter (where
            not pr.is_win
            and not pr.is_postseason
        ) as total_losses,
        count(*) filter (where
            pr.is_postseason
            and not pr.is_b1g_postseason
        ) as postseason_picks,
        count(*) filter (where
            pr.is_postseason
            and pr.is_win
        ) as postseason_wins,
        count(*) filter (where
            pr.is_postseason
            and not pr.is_win
        ) as postseason_losses
    from
        auth_user as u
        left join v_pick_result as pr on u.id = pr.picker_id
    group by nickname, year, u.id
) t
where total_losses > 0 or total_wins > 0
order by year desc, b1g_percentage desc, total_percentage desc;