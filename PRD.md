# PRD — One Two Quiz

## 1. Wizja produktu

**One Two Quiz** to lekka aplikacja webowa inspirowana Kahoot — do prowadzenia quizów na żywo w grupie. Host tworzy quiz, gracze dołączają bez konta, odpowiadają na pytania w czasie rzeczywistym, a na końcu widzą ranking.

**Cel MVP:** działający flow od utworzenia quizu przez hosta do wyświetlenia rankingu po zakończeniu gry.

---

## 2. Użytkownicy i role

| Rola | Dostęp | Uwagi |
|------|--------|-------|
| **Admin / Host** | Logowanie przez Supabase Auth | Jedno konto administratora. Tworzy quizy, uruchamia sesje, steruje przebiegiem gry. |
| **Gracz (uczestnik)** | Bez logowania | Dołącza do lobby po kodzie pokoju, podaje nick. Sesja gracza trzymana w przeglądarce (localStorage / session). |

---

## 3. Wymagania funkcjonalne

### 3.1 Panel admina (host)

- [ ] Logowanie jednym kontem admina (Supabase Auth — email + hasło).
- [ ] Tworzenie i edycja quizów:
  - tytuł quizu;
  - lista pytań;
  - każde pytanie ma **2, 3 lub 4** opcje odpowiedzi;
  - dokładnie **jedna** poprawna odpowiedź na pytanie.
- [ ] Konfiguracja czasów na poziomie quizu lub pytania:
  - **czas wyświetlania pytania** (np. 10 s);
  - **czas wyświetlania odpowiedzi / wyniku** po zamknięciu pytania (np. 5 s).
- [ ] Uruchomienie sesji gry — wygenerowanie **kodu pokoju** (np. 6 znaków).
- [ ] Widok hosta podczas gry:
  - liczba graczy w lobby / w grze;
  - aktualne pytanie i postęp (np. 3/10);
  - przycisk „Następne pytanie” / automatyczne przejście po timerze;
  - podgląd rankingu po każdym pytaniu i na końcu gry.

### 3.2 Lobby

- [ ] Gracz wchodzi na stronę główną, wpisuje **kod pokoju** i **nick**.
- [ ] Walidacja: unikalny nick w obrębie pokoju, kod istnieje i sesja nie jest zakończona.
- [ ] **Widoczna lista graczy** w lobby — aktualizowana na żywo, zanim host ruszy z grą.
- [ ] Host widzi tę samą listę i może rozpocząć grę, gdy jest gotowy.

### 3.3 Rozgrywka (gracz)

- [ ] Po starcie gry gracz widzi aktualne pytanie zsynchronizowane z hostem.
- [ ] Odpowiedź wybierana kliknięciem (przyciski A/B/C/D lub kolorowe kafelki).
- [ ] Po upływie czasu na pytanie — blokada odpowiedzi.
- [ ] Krótki ekran z poprawną odpowiedzią (czas konfigurowalny).
- [ ] **Ranking** po każdym pytaniu: nick, punkty, ewentualnie pozycja.
- [ ] Ekran końcowy z pełnym rankingiem.

### 3.4 Punktacja

- [ ] Poprawna odpowiedź = punkty.
- [ ] Szybsza odpowiedź = więcej punktów (np. liniowo względem pozostałego czasu) — opcjonalnie w MVP, ale warto zaplanować w modelu danych.
- [ ] Błędna lub brak odpowiedzi = 0 pkt.

### 3.5 Ranking

- [ ] Sortowanie malejąco po łącznej liczbie punktów.
- [ ] Widoczny dla hosta i graczy po każdym pytaniu oraz na końcu.
- [ ] Remisy: ta sama pozycja lub kolejność po czasie odpowiedzi (do ustalenia).

---

## 4. Przepływy użytkownika

### Host

```
Logowanie → Lista quizów → Nowy/edycja quizu → Start sesji (kod pokoju)
→ Lobby (lista graczy) → Start gry → Pytanie → Wynik → … → Ranking końcowy
```

### Gracz

```
Strona główna → Kod + nick → Lobby (lista graczy) → Odpowiedzi na pytania
→ Rankingi po pytaniach → Ranking końcowy
```

---

## 5. Wymagania niefunkcjonalne

- **Lekkość:** mało zależności, szybkie ładowanie, działanie na telefonie (mobile-first).
- **Realtime:** synchronizacja stanu pokoju między hostem a graczami w czasie rzeczywistym.
- **Skala MVP:** do ~50 graczy w jednym pokoju bez zauważalnych opóźnień.
- **Dostępność:** czytelne UI, duże przyciski odpowiedzi, kontrast kolorów.

---

## 6. Stack technologiczny

| Warstwa | Technologia | Uzasadnienie |
|---------|-------------|--------------|
| Frontend | **Next.js** (App Router), React, Tailwind, shadcn/ui | Już w projekcie; SSR + API routes. |
| Backend / DB | **Supabase** (PostgreSQL) | Przechowywanie quizów, sesji, odpowiedzi, wyników. |
| Autoryzacja | **Supabase Auth** (domyślna, email + hasło) | Tylko dla konta admina. |
| Realtime | **Supabase Realtime** (Broadcast / Presence / postgres changes) | Lekka synchronizacja lobby, pytań i rankingu. |
| Hosting | Vercel + Supabase Cloud | Prosty deploy startera. |

### Realtime — webhooki czy coś innego?

**Webhooki nie są tu właściwym narzędziem** — służą do powiadomień server-to-server (np. po zapisie w bazie), a nie do utrzymania połączenia z wieloma klientami w czasie rzeczywistym.

**Rekomendacja:** Supabase Realtime:
- **Presence** — lista graczy w lobby;
- **Broadcast** — zmiana fazy gry (pytanie, timer, wynik, koniec);
- opcjonalnie **postgres changes** — persystencja odpowiedzi i rankingu.

### Supabase Realtime — plan Free i limity

**Tak — Realtime jest dostępne na darmowym planie.** Nie trzeba od razu przechodzić na Pro.

| Funkcja | Limit (Free) |
|---------|--------------|
| Postgres Changes | wliczone |
| Broadcast / Presence | wliczone |
| Jednoczesne połączenia (peak) | **200** |
| Wiadomości miesięcznie | **2 mln** |
| Maks. rozmiar wiadomości | 256 KB |

Na planie Free **nie ma dopłat za przekroczenie** — po osiągnięciu limitu Realtime przestaje działać do czasu zejścia poniżej progu lub przejścia na Pro.

**Ograniczenia całego planu Free** (poza Realtime):
- projekt **pauzuje po 1 tygodniu bez aktywności** (trzeba „obudzić” w dashboardzie);
- max **2 aktywne projekty** na organizację;
- baza: 500 MB, egress: 5 GB/mies.

### Szacunki zużycia dla One Two Quiz

| Scenariusz | Połączenia | Wiadomości / grę |
|------------|------------|------------------|
| 1 sesja (1 host + 30 graczy) | ~31 | ~300–800 |
| 1 sesja (1 host + 50 graczy) | ~51 | ~500–1 200 |
| 5 równoległych sesji po 30 graczy | ~155 | ~1 500–4 000 |

Założenia: Broadcast przy każdej zmianie fazy (lobby → pytanie → wynik → ranking), Presence przy dołączaniu/rozłączaniu graczy, bez wysyłania timera co sekundę (timer liczony lokalnie po synchronizacji `started_at`).

**Wniosek:** na testy, lekcje i małe wydarzenia plan Free w zupełności wystarczy. Limit **200 połączeń** pozwala na kilka równoległych pokoi; limit **2 mln wiadomości** — na setki gier miesięcznie przy rozsądnym Broadcast.

### Kiedy rozważyć plan Pro ($25/mies.)?

- regularnie **>150 jednoczesnych uczestników** (wiele dużych sal naraz);
- potrzeba **braku pauzy** projektu po okresie nieaktywności;
- zbliżanie się do **2 mln wiadomości Realtime** miesięcznie (Pro: 5 mln + dopłaty).

---

## 7. Model danych (szkic)

```
quizzes
  id, title, created_by, question_display_seconds, answer_display_seconds, created_at

questions
  id, quiz_id, text, order_index, time_override_seconds (nullable)

answers (opcje)
  id, question_id, text, is_correct, order_index

game_sessions
  id, quiz_id, room_code, status (lobby | active | finished), current_question_index, started_at

players
  id, session_id, nickname, total_score, joined_at

player_answers
  id, player_id, question_id, answer_id, answered_at, points_earned
```

---

## 8. Zakres MVP vs później

### MVP (wersja 1)

- Jedno konto admina.
- CRUD quizów z pytaniami (2–4 odpowiedzi).
- Sesja z kodem pokoju, lobby z listą graczy.
- Rozgrywka zsynchronizowana w czasie rzeczywistym.
- Konfigurowalne czasy wyświetlania pytania i odpowiedzi.
- Ranking po pytaniach i na końcu.
- Podstawowa punktacja (poprawna = punkty; bez bonusu za szybkość — opcjonalnie).

### Później (poza MVP)

- Bonus za szybką odpowiedź.
- Obrazki w pytaniach.
- Eksport wyników (CSV).
- Wiele kont hostów / organizacje.
- Tryb ćwiczeń (solo, bez hosta).
- Animacje i dźwięki jak w Kahoot.

---

## 9. Otwarte decyzje

| # | Pytanie | Propozycja |
|---|---------|------------|
| 1 | Automatyczne przejście między pytaniami czy tylko ręcznie przez hosta? | Oba: timer + host może przyspieszyć. |
| 2 | Czy gracz może dołączyć w trakcie gry? | MVP: tylko w lobby; w trakcie — odrzucenie. |
| 3 | Jak długo ważny jest kod pokoju? | Do zakończenia sesji; nowa sesja = nowy kod. |
| 4 | Punktacja za szybkość w MVP? | Na start: stałe punkty za poprawną odpowiedź. |

---

## 10. Kryteria sukcesu MVP

- Host tworzy quiz, startuje sesję, min. 2 graczy dołącza bez logowania.
- Wszyscy widzą to samo pytanie w tym samym momencie.
- Po 10 pytaniach ranking jest poprawny i zgodny u wszystkich klientów.
- Aplikacja działa na desktopie i telefonie w jednej sieci Wi‑Fi.