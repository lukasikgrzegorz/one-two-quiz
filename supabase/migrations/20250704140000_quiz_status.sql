-- Status quizu: szkic → zatwierdzony (gotowy do uruchomienia sesji)

CREATE TYPE public.quiz_status AS ENUM ('draft', 'approved');

ALTER TABLE public.quizzes
  ADD COLUMN status public.quiz_status NOT NULL DEFAULT 'draft';

CREATE INDEX quizzes_status_idx ON public.quizzes (status);