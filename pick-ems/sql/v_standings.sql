drop view if exists v_standings;

create or replace view v_standings as
select
    nickname,
    picker_text_color,
    picker_background_color,
    year,
    b1g_wins,
    b1g_losses,
    b1g_wins::real / (b1g_wins + b1g_losses)::real as b1g_percentage,
    total_wins,
    total_losses,
    total_wins::real / (total_wins + total_losses)::real as total_percentage
from
(
    select
        u.nickname as nickname,
        u.text_color as picker_text_color,
        u.background_color as picker_background_color,
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
        ) as total_losses
    from
        auth_user as u
        left join v_pick_result as pr on u.id = pr.picker_id
    group by nickname, year, u.id
) t
order by year desc, b1g_percentage desc, total_percentage desc