# Pomysły na rozwój

Lista pomysłów po przeglądzie aplikacji w wersji 0.11.3 (2026-11-02). To propozycje, nie plan:
każdy większy pomysł przed startem dostaje projekt i ADR (zob. `docs/adr/`). Wizja produktu: `docs/wizja.md`.

Nie ma tu rzeczy, które już działają: widoczność z punktu (viewshed), wybór rozdziału, poziomice i siatka,
warstwa Questy, widok 2D z cięciem wysokości, rzut ortogonalny, lot kamerą, PWA
(oraz pozycje z sekcji „Zrobione”). Numery pozycji się nie zmieniają, żeby odwołania do nich się nie psuły.

## Największy zysk dla użytkownika

- **1. Trasy i przewodnik po questach.** Zaznaczony quest rysuje kolejność miejsc z etapów dziennika
  i liczy czas przejścia. Dane etapów, czas przejścia i profil terenu już istnieją.
- **2. Lokacje jako trzeci rodzaj danych.** Nazwane miejsca (obozy, jaskinie, budynki, przejścia między
  światami) z kartą i wpisem w wyszukiwarce. Pierwszy krok: wejścia do światów, np. Khorinis → Górnicza Dolina.

## Rozwinięcie istniejących narzędzi

- **6. Pomiary: tempo marszu.** Przeliczenia pieszo / biegiem / strzały z łuku.
- **7. Telefon: arkusz z trzema stanami** (zwinięty / połowa / pełny). Kadrowanie z ADR 0008 już go zakłada.
- **8. Podkład „Poziomice”** jako osobny podkład, nie tylko nakładka.
- **9. Analizy:** zasięg słyszalności i agresji potworów, najkrótsza trasa między dwoma punktami,
  porównanie dwóch rozdziałów.
- **20. Porównanie rozdziałów** suwakiem podziału ekranu: po lewej postacie z jednego rozdziału, po prawej z drugiego.
- **21. Gizmo osi przy przesuwaniu światów** w narzędziu Rozmiary (strzałki osi i pierścień obrotu zamiast przeciągania
  po płaszczyźnie), jeśli przeciąganie okaże się niewygodne.

## Treść i wiki

- **12. Rutyny postaci jako animacja.** Przesuwanie czasu przesuwa NPC po mapie według dziennych rozkładów
  (`daily-schedule` i suwak czasu już są).
- **13. Podgląd 3D w karcie dla postaci i potworów**, jak dla przedmiotów.
- **19. Filtr wartości przedmiotów** (cena, obrażenia). Indeks nie niesie tych pól, więc najpierw trzeba je dodać
  w ekstraktorze danych.

## Jakość i publikacja

- **15. Dostępność i klawiatura:** obsługa bez myszy, ściąga skrótów pod `?`, kontrast w motywie.
- **16. Telemetria wydajności bez śledzenia**, np. liczniki błędów ładowania kafli.
- **17. Otwarcie repozytorium:** licencja, przegląd historii, dane do R2 w CI.
- **18. Wiele języków** (angielski); interfejs jest dziś tylko po polsku.

## Proponowana kolejność

Najpierw małe i widoczne: **6**, **7**. Potem duże: **1**, a następnie **12**. Jeśli priorytetem
jest treść: **2**.

## Zrobione

- **3. Udostępnianie widoku jednym linkiem** — przycisk „Kopiuj link” w pasku górnym, w karcie wpisu i w panelu
  Zakładki; eksport i import zakładek razem z resztą notatnika do pliku JSON (ADR 0029).
- **4. Własne notatki i pinezki** — narzędzie Notatnik: pinezka z nazwą i opisem stawiana kliknięciem mapy,
  zapisana w przeglądarce (`localStorage`, nie IndexedDB — danych jest mało), w kopii zapasowej (ADR 0029).
- **5. Lista kontrolna „co zebrałem”** — pole przy każdym miejscu przedmiotu (zebrane punkty gasną na mapie),
  „Zbierz wszystkie” i przycisk „Oznacz jako wykonany” przy queście; postęp w procentach w Notatniku. Kamienne tablice
  liczą się jak zwykłe przedmioty, osobnego licznika nie mają.
- **10. Porównanie światów** — przycisk „Porównaj światy” w kontrolkach mapy: suwak podziału ekranu odsłania po lewej
  otwarty świat, po prawej wybrany drugi (ADR 0030). Porównuje się teren; stan jest sesyjny. Porównanie rozdziałów
  przeszło do pozycji 20.
- **Porównanie rozmiarów światów** (narzędzie Rozmiary) — pola wyboru światów jako półprzezroczyste widma obok
  otwartego, wymiary w metrach, podświetlenie po najechaniu, przesuwanie myszą i polami liczbowymi oraz obrót (ADR 0031).
  Gizmo osi zostało odłożone na później.
- **11. Powiązania między wpisami** — karta przedmiotu pokazuje, kto ma go przy sobie, i questy, w których występuje;
  karta postaci pokazuje, co ma przy sobie. Powiązania sprzedawców dojdą z danymi o handlarzach.
- **14. Filtry wyszukiwarki** — gildia i typ przedmiotu działały już jako kategorie; doszły przedział poziomu postaci
  i rozdział questa. Filtr wartości przedmiotów (brak ceny w danych) przeszedł do pozycji 19.

## Odrzucone wcześniej (nie wracać bez powodu)

- Podfiltr waypointów w warstwach — niepotrzebny (2026-10-31).
- Podkład „Pergamin” — wyglądał źle (2026-10-31).
