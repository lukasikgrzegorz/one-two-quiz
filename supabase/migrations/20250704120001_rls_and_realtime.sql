-- RLS i Supabase Realtime dla One Two Quiz

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_answers ENABLE ROW LEVEL SECURITY;

-- Host (zalogowany admin) — własne quizy
CREATE POLICY "Host manages own quizzes"
  ON public.quizzes
  FOR ALL
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Host manages questions of own quizzes"
  ON public.questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quizzes q
      WHERE q.id = questions.quiz_id
        AND q.created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quizzes q
      WHERE q.id = questions.quiz_id
        AND q.created_by = (SELECT auth.uid())
    )
  );

CREATE POLICY "Host manages answers of own quizzes"
  ON public.answers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.questions qu
      JOIN public.quizzes q ON q.id = qu.quiz_id
      WHERE qu.id = answers.question_id
        AND q.created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.questions qu
      JOIN public.quizzes q ON q.id = qu.quiz_id
      WHERE qu.id = answers.question_id
        AND q.created_by = (SELECT auth.uid())
    )
  );

CREATE POLICY "Host manages sessions of own quizzes"
  ON public.game_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quizzes q
      WHERE q.id = game_sessions.quiz_id
        AND q.created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quizzes q
      WHERE q.id = game_sessions.quiz_id
        AND q.created_by = (SELECT auth.uid())
    )
  );

CREATE POLICY "Host reads players in own sessions"
  ON public.players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.game_sessions gs
      JOIN public.quizzes q ON q.id = gs.quiz_id
      WHERE gs.id = players.session_id
        AND q.created_by = (SELECT auth.uid())
    )
  );

CREATE POLICY "Host reads answers in own sessions"
  ON public.player_answers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.players p
      JOIN public.game_sessions gs ON gs.id = p.session_id
      JOIN public.quizzes q ON q.id = gs.quiz_id
      WHERE p.id = player_answers.player_id
        AND q.created_by = (SELECT auth.uid())
    )
  );

-- Gracze (anon) — odczyt sesji i listy graczy w lobby/grze
CREATE POLICY "Anyone reads non-finished sessions"
  ON public.game_sessions
  FOR SELECT
  TO anon, authenticated
  USING (status <> 'finished');

CREATE POLICY "Anyone reads players in active sessions"
  ON public.players
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.game_sessions gs
      WHERE gs.id = players.session_id
        AND gs.status <> 'finished'
    )
  );

-- Pytania i odpowiedzi widoczne podczas aktywnej gry (zsynchronizowany podgląd)
CREATE POLICY "Anyone reads questions during active game"
  ON public.questions
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.game_sessions gs
      WHERE gs.quiz_id = questions.quiz_id
        AND gs.status = 'active'
    )
  );

CREATE POLICY "Anyone reads answers during active game"
  ON public.answers
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.questions qu
      JOIN public.game_sessions gs ON gs.quiz_id = qu.quiz_id
      WHERE qu.id = answers.question_id
        AND gs.status = 'active'
    )
  );

CREATE POLICY "Anyone reads player answers after reveal"
  ON public.player_answers
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.players p
      JOIN public.game_sessions gs ON gs.id = p.session_id
      WHERE p.id = player_answers.player_id
        AND gs.status = 'active'
        AND gs.phase IN ('reveal', 'leaderboard')
    )
  );

-- =============================================================================
-- Uprawnienia do funkcji RPC
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.generate_room_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_quiz_ready(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_session(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_player_answer(uuid, uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(uuid) TO anon, authenticated;

-- =============================================================================
-- Supabase Realtime (postgres changes)
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_answers;