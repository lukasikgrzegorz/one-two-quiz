-- Punktacja według kolejności poprawnych odpowiedzi + auto-przejście gdy wszyscy odpowiedzieli

CREATE OR REPLACE FUNCTION public.submit_player_answer(
  p_player_token uuid,
  p_question_id uuid,
  p_answer_id uuid DEFAULT NULL
)
RETURNS public.player_answers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player public.players%ROWTYPE;
  v_session public.game_sessions%ROWTYPE;
  v_question public.questions%ROWTYPE;
  v_answer public.answers%ROWTYPE;
  v_max_points integer;
  v_player_count integer;
  v_correct_rank integer;
  v_points integer;
  v_result public.player_answers%ROWTYPE;
BEGIN
  SELECT *
  INTO v_player
  FROM public.players
  WHERE player_token = p_player_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nieprawidłowy token gracza';
  END IF;

  SELECT *
  INTO v_session
  FROM public.game_sessions
  WHERE id = v_player.session_id;

  IF v_session.status <> 'active' OR v_session.phase <> 'answers' THEN
    RAISE EXCEPTION 'Odpowiedzi można składać tylko gdy opcje są widoczne';
  END IF;

  SELECT *
  INTO v_question
  FROM public.questions
  WHERE id = p_question_id
    AND quiz_id = v_session.quiz_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pytanie nie należy do tego quizu';
  END IF;

  IF v_question.order_index <> v_session.current_question_index THEN
    RAISE EXCEPTION 'To nie jest aktualne pytanie';
  END IF;

  v_points := 0;

  IF p_answer_id IS NOT NULL THEN
    SELECT *
    INTO v_answer
    FROM public.answers
    WHERE id = p_answer_id
      AND question_id = p_question_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Nieprawidłowa odpowiedź';
    END IF;

    IF v_answer.is_correct THEN
      SELECT q.points_per_correct
      INTO v_max_points
      FROM public.quizzes q
      WHERE q.id = v_session.quiz_id;

      SELECT COUNT(*)
      INTO v_player_count
      FROM public.players
      WHERE session_id = v_session.id;

      SELECT COUNT(*)
      INTO v_correct_rank
      FROM public.player_answers pa
      JOIN public.players pl ON pl.id = pa.player_id
      JOIN public.answers ans ON ans.id = pa.answer_id
      WHERE pl.session_id = v_session.id
        AND pa.question_id = p_question_id
        AND ans.is_correct = true;

      v_player_count := GREATEST(v_player_count, 1);

      v_points := GREATEST(
        100,
        FLOOR(
          v_max_points::numeric
            * (v_player_count - v_correct_rank)
            / v_player_count
        )::integer
      );
    END IF;
  END IF;

  INSERT INTO public.player_answers (
    player_id,
    question_id,
    answer_id,
    points_earned
  )
  VALUES (
    v_player.id,
    p_question_id,
    p_answer_id,
    v_points
  )
  ON CONFLICT (player_id, question_id) DO NOTHING
  RETURNING * INTO v_result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Odpowiedź na to pytanie została już zapisana';
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.maybe_advance_after_all_answered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.game_sessions%ROWTYPE;
  v_player_count integer;
  v_answer_count integer;
BEGIN
  SELECT gs.*
  INTO v_session
  FROM public.players p
  JOIN public.game_sessions gs ON gs.id = p.session_id
  WHERE p.id = NEW.player_id;

  IF v_session.status <> 'active' OR v_session.phase <> 'answers' THEN
    RETURN NEW;
  END IF;

  IF (
    SELECT order_index
    FROM public.questions
    WHERE id = NEW.question_id
  ) <> v_session.current_question_index THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO v_player_count
  FROM public.players
  WHERE session_id = v_session.id;

  SELECT COUNT(*)
  INTO v_answer_count
  FROM public.player_answers pa
  JOIN public.players p ON p.id = pa.player_id
  WHERE p.session_id = v_session.id
    AND pa.question_id = NEW.question_id;

  IF v_answer_count >= v_player_count AND v_player_count > 0 THEN
    UPDATE public.game_sessions
    SET
      phase = 'reveal',
      question_started_at = now()
    WHERE id = v_session.id
      AND status = 'active'
      AND phase = 'answers'
      AND current_question_index = (
        SELECT order_index
        FROM public.questions
        WHERE id = NEW.question_id
      );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS player_answers_maybe_advance ON public.player_answers;

CREATE TRIGGER player_answers_maybe_advance
  AFTER INSERT ON public.player_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.maybe_advance_after_all_answered();

GRANT EXECUTE ON FUNCTION public.submit_player_answer(uuid, uuid, uuid) TO anon, authenticated;