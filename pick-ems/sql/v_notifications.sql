CREATE OR REPLACE VIEW public.v_notifications AS
SELECT
  n.*,
  au.name AS user_name
FROM
  public.notifications n
LEFT JOIN
  public.auth_user au
ON
  au.uuid = n.user_id;