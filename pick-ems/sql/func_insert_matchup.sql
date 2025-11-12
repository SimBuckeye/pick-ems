CREATE OR REPLACE FUNCTION public.insert_matchup(
  p_away_team_id bigint,
  p_home_team_id bigint,
  p_datetime timestamptz,
  p_matchup_title text,
  p_round_id bigint,
  p_underdog "Underdog_Type" DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_away_is_b1g boolean;
  v_home_is_b1g boolean;
  v_round_name text;
  v_is_b1g boolean;
  v_is_postseason boolean := false;
  v_inserted_id bigint;
BEGIN
  -- Validate teams exist and fetch their is_b1g flags
  SELECT is_b1g INTO v_away_is_b1g FROM public.team WHERE id = p_away_team_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Away team id % does not exist', p_away_team_id;
  END IF;

  SELECT is_b1g INTO v_home_is_b1g FROM public.team WHERE id = p_home_team_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Home team id % does not exist', p_home_team_id;
  END IF;

  -- Determine is_b1g: true only if both teams are is_b1g = true
  v_is_b1g := COALESCE(v_away_is_b1g, false) AND COALESCE(v_home_is_b1g, false);

  -- If a round id was provided, fetch the name and determine postseason
  IF p_round_id IS NOT NULL THEN
    SELECT name INTO v_round_name FROM public.round WHERE id = p_round_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Round id % does not exist', p_round_id;
    END IF;

    -- If round name is purely integer, it's NOT postseason; otherwise it is postseason
    IF v_round_name IS NULL THEN
      -- treat NULL as not postseason
      v_is_postseason := false;
    ELSIF v_round_name ~ '^\d+$' THEN
      v_is_postseason := false;
    ELSE
      v_is_postseason := true;
    END IF;
  END IF;

  -- Insert matchup
  INSERT INTO public.matchup (
    away_team_id,
    home_team_id,
    datetime,
    matchup_title,
    round,
    underdog,
    is_b1g,
    is_postseason,
    created_at
  ) VALUES (
    p_away_team_id,
    p_home_team_id,
    p_datetime,
    p_matchup_title,
    p_round_id,
    p_underdog,
    v_is_b1g,
    v_is_postseason,
    now()
  )
  RETURNING id INTO v_inserted_id;

  RETURN v_inserted_id;
END;
$$;