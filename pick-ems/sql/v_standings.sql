drop view if exists v_standings;

create or replace view v_standings as
select
    nickname,
    picker_text_color,
    picker_background_color,
    picker_id,
    year,
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
    postseason_picks
from
(
    select
        u.nickname as nickname,
        u.text_color as picker_text_color,
        u.background_color as picker_background_color,
        u.id as picker_id,
        pr.year as year,
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
        ) as postseason_picks
    from
        auth_user as u
        left join v_pick_result as pr on u.id = pr.picker_id
    group by nickname, year, u.id
) t
where total_losses > 0 or total_wins > 0
order by year desc, b1g_percentage desc, total_percentage desc