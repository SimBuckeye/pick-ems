CREATE OR REPLACE FUNCTION public.new_draft_pick_push_notif()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  m_row public.matchup%ROWTYPE;
  away_team_is_b1g boolean;
  home_team_is_b1g boolean;
  on_the_clock_picker_id bigint;
  on_the_clock_picker_uuid uuid;
BEGIN
  -- Load matchup
  SELECT *
    INTO m_row
    FROM public.matchup
   WHERE id = NEW.matchup_id;

  IF NOT FOUND THEN
    -- No matchup found; nothing to do
    RETURN NEW;
  END IF;

  -- If not postseason, do nothing
  IF NOT COALESCE(m_row.is_postseason, false) = true THEN
    RETURN NEW;
  END IF;

  -- Check away team is_b1g
  SELECT t.is_b1g
    INTO away_team_is_b1g
    FROM public.team t
   WHERE t.id = m_row.away_team_id;

  -- If away team missing or is_b1g true -> do nothing
  IF NOT FOUND OR COALESCE(away_team_is_b1g, false) = true THEN
    RETURN NEW;
  END IF;

  -- Check home team is_b1g
  SELECT t.is_b1g
    INTO home_team_is_b1g
    FROM public.team t
   WHERE t.id = m_row.home_team_id;

  -- If home team missing or is_b1g true -> do nothing
  IF NOT FOUND OR COALESCE(home_team_is_b1g, false) = true THEN
    RETURN NEW;
  END IF;

  -- Find on-the-clock picker; postseason_picks should be updated by now
  SELECT vs.picker_id
    INTO on_the_clock_picker_id
    FROM public.v_standings vs
   ORDER BY vs.year DESC,
            vs.postseason_picks ASC,
            vs.points DESC,
            vs.b1g_percentage DESC,
            vs.total_percentage DESC,
            vs.nickname DESC
   LIMIT 1;

  IF NOT FOUND OR on_the_clock_picker_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lookup uuid from auth_user
  SELECT au.uuid
    INTO on_the_clock_picker_uuid
    FROM public.auth_user au
   WHERE au.id = on_the_clock_picker_id
   LIMIT 1;

  IF NOT FOUND OR on_the_clock_picker_uuid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert notification
  INSERT INTO public.notifications (user_id, body)
  VALUES (on_the_clock_picker_uuid, 'You are on the clock!');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS new_draft_pick_push_notif_tr ON public.pick;

CREATE TRIGGER new_draft_pick_push_notif_tr
AFTER INSERT ON public.pick
FOR EACH ROW
EXECUTE FUNCTION public.new_draft_pick_push_notif();