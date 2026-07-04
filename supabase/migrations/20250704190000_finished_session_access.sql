-- Gracze muszą widzieć zakończoną sesję (ekran „Koniec gry” + ranking)

CREATE POLICY "Anyone reads finished sessions"
  ON public.game_sessions
  FOR SELECT
  TO anon, authenticated
  USING (status = 'finished');

CREATE POLICY "Anyone reads players in finished sessions"
  ON public.players
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.game_sessions gs
      WHERE gs.id = players.session_id
        AND gs.status = 'finished'
    )
  );