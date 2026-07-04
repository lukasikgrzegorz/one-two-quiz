-- Naprawa join_session: niejednoznaczne odniesienie do session_id w RETURNS TABLE

CREATE OR REPLACE FUNCTION public.join_session(
  p_room_code text,
  p_nickname text
)
RETURNS TABLE (
  player_id uuid,
  player_token uuid,
  session_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.game_sessions%ROWTYPE;
  v_player public.players%ROWTYPE;
  v_nickname text;
BEGIN
  v_nickname := trim(p_nickname);

  IF v_nickname IS NULL OR char_length(v_nickname) = 0 THEN
    RAISE EXCEPTION 'Nick jest wymagany';
  END IF;

  SELECT *
  INTO v_session
  FROM public.game_sessions
  WHERE room_code = upper(trim(p_room_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono pokoju o podanym kodzie';
  END IF;

  IF v_session.status <> 'lobby' THEN
    RAISE EXCEPTION 'Dołączenie możliwe tylko w fazie lobby';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.players p
    WHERE p.session_id = v_session.id
      AND lower(p.nickname) = lower(v_nickname)
  ) THEN
    RAISE EXCEPTION 'Nick jest już zajęty w tym pokoju';
  END IF;

  INSERT INTO public.players (session_id, nickname)
  VALUES (v_session.id, v_nickname)
  RETURNING * INTO v_player;

  RETURN QUERY
  SELECT v_player.id, v_player.player_token, v_session.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_session(text, text) TO anon, authenticated;