-- One Two Quiz — schema zgodny z PRD.md (sekcja 7)
-- Rozszerzenia MVP: player_token (gracz bez logowania), phase/question_started_at (synchronizacja timera)

-- =============================================================================
-- Typy
-- =============================================================================

CREATE TYPE public.game_session_status AS ENUM ('lobby', 'active', 'finished');

CREATE TYPE public.game_phase AS ENUM ('question', 'reveal', 'leaderboard');

-- =============================================================================
-- Tabele
-- =============================================================================

CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  question_display_seconds integer NOT NULL DEFAULT 10 CHECK (question_display_seconds > 0),
  answer_display_seconds integer NOT NULL DEFAULT 5 CHECK (answer_display_seconds > 0),
  points_per_correct integer NOT NULL DEFAULT 1000 CHECK (points_per_correct > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes (id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(trim(text)) > 0),
  order_index integer NOT NULL CHECK (order_index >= 0),
  time_override_seconds integer CHECK (
    time_override_seconds IS NULL OR time_override_seconds > 0
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, order_index)
);

CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(trim(text)) > 0),
  is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL CHECK (order_index >= 0 AND order_index <= 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, order_index)
);

-- Dokładnie jedna poprawna odpowiedź na pytanie
CREATE UNIQUE INDEX answers_one_correct_per_question_idx
  ON public.answers (question_id)
  WHERE is_correct = true;

CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes (id) ON DELETE CASCADE,
  room_code text NOT NULL CHECK (
    char_length(room_code) = 6
    AND room_code ~ '^[A-Z0-9]{6}$'
  ),
  status public.game_session_status NOT NULL DEFAULT 'lobby',
  current_question_index integer NOT NULL DEFAULT 0 CHECK (current_question_index >= 0),
  phase public.game_phase,
  started_at timestamptz,
  question_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status = 'lobby' AND phase IS NULL)
    OR (status = 'active' AND phase IS NOT NULL)
    OR (status = 'finished' AND phase IS NULL)
  )
);

-- Kod pokoju unikalny wśród sesji, które nie są zakończone (PRD: nowa sesja = nowy kod)
CREATE UNIQUE INDEX game_sessions_room_code_active_idx
  ON public.game_sessions (room_code)
  WHERE status <> 'finished';

CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions (id) ON DELETE CASCADE,
  nickname text NOT NULL CHECK (
    char_length(trim(nickname)) BETWEEN 1 AND 30
  ),
  total_score integer NOT NULL DEFAULT 0 CHECK (total_score >= 0),
  player_token uuid NOT NULL DEFAULT gen_random_uuid(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, nickname),
  UNIQUE (player_token)
);

CREATE TABLE public.player_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
  answer_id uuid REFERENCES public.answers (id) ON DELETE SET NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  points_earned integer NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
  UNIQUE (player_id, question_id)
);

-- =============================================================================
-- Indeksy
-- =============================================================================

CREATE INDEX questions_quiz_id_idx ON public.questions (quiz_id);
CREATE INDEX answers_question_id_idx ON public.answers (question_id);
CREATE INDEX game_sessions_quiz_id_idx ON public.game_sessions (quiz_id);
CREATE INDEX game_sessions_status_idx ON public.game_sessions (status);
CREATE INDEX players_session_id_idx ON public.players (session_id);
CREATE INDEX player_answers_player_id_idx ON public.player_answers (player_id);
CREATE INDEX player_answers_question_id_idx ON public.player_answers (question_id);

-- =============================================================================
-- Funkcje pomocnicze
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER quizzes_set_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER game_sessions_set_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Walidacja: maks. 4 opcje odpowiedzi na pytanie (min. 2 sprawdzane przy starcie sesji)
CREATE OR REPLACE FUNCTION public.validate_question_answer_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_question_id uuid;
  answer_count integer;
BEGIN
  target_question_id := COALESCE(NEW.question_id, OLD.question_id);

  SELECT count(*) INTO answer_count
  FROM public.answers
  WHERE question_id = target_question_id;

  IF answer_count > 4 THEN
    RAISE EXCEPTION 'Pytanie może mieć maksymalnie 4 opcje odpowiedzi';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER answers_validate_max_count
  AFTER INSERT OR UPDATE OR DELETE ON public.answers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_question_answer_count();

-- Walidacja kompletności quizu przed uruchomieniem sesji (2–4 odpowiedzi, 1 poprawna)
CREATE OR REPLACE FUNCTION public.validate_quiz_ready(p_quiz_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  r record;
  answer_count integer;
  correct_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.questions WHERE quiz_id = p_quiz_id
  ) THEN
    RAISE EXCEPTION 'Quiz musi zawierać co najmniej jedno pytanie';
  END IF;

  FOR r IN
    SELECT id, order_index
    FROM public.questions
    WHERE quiz_id = p_quiz_id
    ORDER BY order_index
  LOOP
    SELECT count(*) INTO answer_count
    FROM public.answers
    WHERE question_id = r.id;

    IF answer_count < 2 OR answer_count > 4 THEN
      RAISE EXCEPTION
        'Pytanie % musi mieć od 2 do 4 opcji odpowiedzi (obecnie: %)',
        r.order_index + 1,
        answer_count;
    END IF;

    SELECT count(*) INTO correct_count
    FROM public.answers
    WHERE question_id = r.id
      AND is_correct = true;

    IF correct_count <> 1 THEN
      RAISE EXCEPTION
        'Pytanie % musi mieć dokładnie jedną poprawną odpowiedź',
        r.order_index + 1;
    END IF;
  END LOOP;
END;
$$;

-- answer_id musi należeć do question_id
CREATE OR REPLACE FUNCTION public.validate_player_answer_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.answer_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.answers
      WHERE id = NEW.answer_id
        AND question_id = NEW.question_id
    ) THEN
      RAISE EXCEPTION 'Wybrana odpowiedź nie należy do tego pytania';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER player_answers_validate_consistency
  BEFORE INSERT OR UPDATE ON public.player_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_player_answer_consistency();

-- Aktualizacja total_score gracza po zapisie odpowiedzi
CREATE OR REPLACE FUNCTION public.sync_player_total_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.players
  SET total_score = (
    SELECT COALESCE(sum(points_earned), 0)
    FROM public.player_answers
    WHERE player_id = COALESCE(NEW.player_id, OLD.player_id)
  )
  WHERE id = COALESCE(NEW.player_id, OLD.player_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER player_answers_sync_total_score
  AFTER INSERT OR UPDATE OR DELETE ON public.player_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_player_total_score();

-- Generowanie unikalnego kodu pokoju (6 znaków A–Z, 0–9)
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  attempts integer := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.game_sessions
      WHERE room_code = code
        AND status <> 'finished'
    );

    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Nie udało się wygenerować unikalnego kodu pokoju';
    END IF;
  END LOOP;

  RETURN code;
END;
$$;

-- =============================================================================
-- RPC dla graczy bez logowania
-- =============================================================================

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
    FROM public.players
    WHERE session_id = v_session.id
      AND lower(nickname) = lower(v_nickname)
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

  IF v_session.status <> 'active' OR v_session.phase <> 'question' THEN
    RAISE EXCEPTION 'Odpowiedzi można składać tylko podczas aktywnego pytania';
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
      INTO v_points
      FROM public.quizzes q
      WHERE q.id = v_session.quiz_id;
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

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_session_id uuid)
RETURNS TABLE (
  rank bigint,
  player_id uuid,
  nickname text,
  total_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    rank() OVER (ORDER BY p.total_score DESC, p.joined_at ASC) AS rank,
    p.id AS player_id,
    p.nickname,
    p.total_score
  FROM public.players p
  WHERE p.session_id = p_session_id
  ORDER BY rank ASC, p.joined_at ASC;
$$;