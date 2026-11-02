# Pomysły na rozwój

Lista pomysłów po przeglądzie aplikacji w wersji 0.11.3 (2026-11-02). To propozycje, nie plan:
każdy większy pomysł przed startem dostaje projekt i ADR (zob. `docs/adr/`). Wizja produktu: `docs/wizja.md`.

Nie ma tu rzeczy, które już działają: widoczność z punktu (viewshed), wybór rozdziału, poziomice i siatka,
warstwa Questy, widok 2D z cięciem wysokości, rzut ortogonalny, lot kamerą, PWA
(oraz pozycje z sekcji „Zrobione”). Numery pozycji się nie zmieniają, żeby odwołania do nich się nie psuły.

## Największy zysk dla użytkownika

1. **Trasy i przewodnik po questach.** Zaznaczony quest rysuje kolejność miejsc z etapów dziennika
   i liczy czas przejścia. Dane etapów, czas przejścia i profil terenu już istnieją.
2. **Lokacje jako trzeci rodzaj danych.** Nazwane miejsca (obozy, jaskinie, budynki, przejścia między
   światami) z kartą i wpisem w wyszukiwarce. Pierwszy krok: wejścia do światów, np. Khorinis → Górnicza Dolina.

## Rozwinięcie istniejących narzędzi

6. **Pomiary: tempo marszu.** Przeliczenia pieszo / biegiem / strzały z łuku.
7. **Telefon: arkusz z trzema stanami** (zwinięty / połowa / pełny). Kadrowanie z ADR 0008 już go zakłada.
8. **Podkład „Poziomice”** jako osobny podkład, nie tylko nakładka.
9. **Analizy:** zasięg słyszalności i agresji potworów, najkrótsza trasa między dwoma punktami,
   porównanie dwóch rozdziałów.
10. **Porównanie światów lub rozdziałów** suwakiem podziału ekranu (split-screen Cesium), np. Archolos
    względem oryginału.

## Treść i wiki

11. **Powiązania między wpisami.** W karcie przedmiotu: kto go sprzedaje, kto nosi, w jakim queście
    występuje; i odwrotnie. Dane łączą to już dziś, karta nie pokazuje tego wprost.
12. **Rutyny postaci jako animacja.** Przesuwanie czasu przesuwa NPC po mapie według dziennych rozkładów
    (`daily-schedule` i suwak czasu już są).
13. **Podgląd 3D w karcie dla postaci i potworów**, jak dla przedmiotów.
14. **Filtry wyszukiwarki:** gildia, rozdział, zakres wartości, typ przedmiotu.

## Jakość i publikacja

15. **Dostępność i klawiatura:** obsługa bez myszy, ściąga skrótów pod `?`, kontrast w motywie.
16. **Telemetria wydajności bez śledzenia**, np. liczniki błędów ładowania kafli.
17. **Otwarcie repozytorium:** licencja, przegląd historii, dane do R2 w CI.
18. **Wiele języków** (angielski); interfejs jest dziś tylko po polsku.

## Proponowana kolejność

Najpierw małe i widoczne: **6**, **7**. Potem duże: **1**, a następnie **12**. Jeśli priorytetem
jest treść: **2**.

## Zrobione

- **3. Udostępnianie widoku jednym linkiem** — przycisk „Kopiuj link” w pasku górnym, w karcie wpisu i w panelu
  Zakładki; eksport i import zakładek razem z resztą notatnika do pliku JSON (ADR 0029).
- **4. Własne notatki i pinezki** — narzędzie Notatnik: pinezka z nazwą i opisem stawiana kliknięciem mapy,
  zapisana w przeglądarce (`localStorage`, nie IndexedDB — danych jest mało), w kopii zapasowej (ADR 0029).
- **5. Lista kontrolna „co zebrałem”** — przycisk „Oznacz jako zebrany” / „wykonany” w karcie przedmiotu i questa,
  postęp w procentach w Notatniku. Kamienne tablice liczą się jako zwykłe przedmioty, osobnego licznika nie mają.

## Odrzucone wcześniej (nie wracać bez powodu)

- Podfiltr waypointów w warstwach — niepotrzebny (2026-10-31).
- Podkład „Pergamin” — wyglądał źle (2026-10-31).
