-- Czasy wyświetlania per pytanie (zamiast time_override_seconds)

ALTER TABLE public.questions
  ADD COLUMN question_display_seconds integer NOT NULL DEFAULT 10
    CHECK (question_display_seconds > 0),
  ADD COLUMN answer_collection_seconds integer NOT NULL DEFAULT 15
    CHECK (answer_collection_seconds > 0),
  ADD COLUMN answer_display_seconds integer NOT NULL DEFAULT 5
    CHECK (answer_display_seconds > 0);

UPDATE public.questions
SET question_display_seconds = time_override_seconds
WHERE time_override_seconds IS NOT NULL;

ALTER TABLE public.questions DROP COLUMN time_override_seconds;