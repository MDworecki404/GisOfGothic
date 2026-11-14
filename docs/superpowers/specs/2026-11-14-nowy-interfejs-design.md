# Nowy interfejs „latarnia w kopalni” — projekt wdrożenia

Data: 2026-11-14. Status: do akceptacji. Makiety: <https://claude.ai/artifact/BDmMuX3VahcCsZiuBAnD77> (artefakt prywatny
właściciela). Zastępuje motyw z [ADR 0019](../../adr/0019-motyw-mapa-z-sakwy-i-tokeny-ukladu.md) po wdrożeniu etapu 1.

## Po co

Obecny interfejs (brązowa skóra, nity, pergamin) wygląda jak panel administracyjny w stylizowanym kostiumie: osiem
przycisków na lewej szynie, pasek górny, pasek stanu i panel boczny zabierają mapę, a każda funkcja ma własny panel
w tym samym kształcie. Użytkownik uznał go za „drętwy”. Nowy interfejs ma pasować do świata Gothica (ciemny łupek,
światło pochodni, chłodna bariera), a mapa ma być bohaterem: całym ekranem, na którym chrom pływa.

## Cele, nie-cele, anty-cele

Cele:

- Nowy motyw: łupek, płyty ze ściętym rogiem, żar (działanie, najechanie, godzina) i bariera (wybór, aktywne narzędzie,
  fokus). Pismo Grenze (nazwy, godzina) i Barlow Semi Condensed (interfejs, dane).
- Mapa na cały ekran: bez paska górnego i dolnego; tytuł świata, wyszukiwarka, dok narzędzi, sterowanie mapą i karta
  wpisu pływają nad nią.
- Księga: wyszukiwanie i karta wpisu w jednym oknie (lista po lewej, karta po prawej), otwierane skrótem Ctrl K.
- Zegar doby jako element wyróżniający: łuk 00:00–24:00 z przyciskiem Odtwórz i tempami.
- Telefon: pięciopozycyjna dolna nawigacja i arkusz karty.

Nie-cele:

- Zmiany logiki biznesowej, danych, zdarzeń i fasady; to przebudowa warstwy prezentacji.
- Jasny motyw, tłumaczenia, nowe funkcje poza przeniesieniem istniejących w nowe miejsca.
- Czcionki, logo i grafiki z gry (ADR 0019, 0012): kamień i pochodnia są rysowane CSS-em i SVG.

Anty-cele (porażka, nawet gdy „działa”):

- Wygląd „ciemnego szkła” z rozmytym tłem i identycznymi kartami: płyty są nieprzezroczyste, bez `backdrop-filter`
  (kosztowny nad płótnem WebGL).
- Pogorszenie telefonu, dostępności (kontrast tekstu ≥ 4,5:1, fokus widoczny, cele dotykowe ≥ 44 px) albo wydajności mapy.
- Rozjazd dokumentacji z kodem albo usunięcie etykiet, po których działają testy e2e i czytniki ekranu.

## Co wiemy z przeglądu (stan faktyczny)

- Wszystkie tokeny (kolory, pismo, układ) są w `src/app.css` (904 linie); komponenty używają ról shadcn i klas
  `material-leather`, `material-iron`, `material-parchment`, `button-iron`, `chip`, `choice-card`, `field`, `check-forged`,
  `range-forged`, `list-row`, `group-label`.
- Układ zależy od tokenów `--top-bar-height`, `--bottom-nav-height`, `--rail-width`, `--status-bar-height`,
  `--panel-width`, `--map-controls-width` oraz zmiennych ustawianych w biegu przez `ToolPanel`.
- Elementy zasłaniające mapę oznacza atrybut `data-map-obstacle`, który czyta `MapInsetsReporter`, więc pływające płyty
  dalej będą uwzględniane przy kadrowaniu kamery (ADR 0008).
- Pismo jest dziś samodzielnie hostowane przez `@fontsource` (Grenze Gotisch, Alegreya, Alegreya Sans), co jest
  potrzebne PWA offline. Grenze i Barlow Semi Condensed też mają paczki `@fontsource` z polskimi znakami.
- Duże komponenty do przebudowy: `SearchPanel` (476 linii), `MapControls` (174), `ToolPanel` (200), `TimePanel` (170),
  `TopBar`, `ToolRail`, `InstrumentBar`, `IdentifyCard`.

## Podejścia

|                          | Opis                                                           | Za                                                         | Przeciw                                                          |
| ------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| A. Sam motyw             | Nowe tokeny i klasy materiałów, układ bez zmian                | Tanio, bezpiecznie                                         | Zmienia kolor, nie wrażenie „drętwoty”                           |
| **B. Etapami** (wybrane) | Pięć etapów, każdy wdrażalny na podgląd i zacommitowany osobno | Widoczny postęp, mały zasięg błędu, testy po każdym etapie | Przejściowo dwa style (stary układ w nowym motywie)              |
| C. Przepisanie naraz     | Nowy interfejs w jednej gałęzi                                 | Spójny efekt                                               | Duży, trudny do przejrzenia diff, ryzyko regresji telefonu i e2e |

Wybór: B. Po każdym etapie aplikacja jest spójna i przechodzi `check`, `lint`, `test`, `build` i `test:e2e`.

## Etapy

1. **Motyw.** Nowe tokeny w `app.css` (łupek, woda, popiół, mgła, żar, bariera, krew), pismo Grenze + Barlow Semi Condensed
   z `@fontsource`, usunięcie Grenze Gotisch i Alegreya. Klasy `material-*`, `button-iron`, `chip` i pozostałe zachowują
   nazwy, ale dostają nowy wygląd (płyta ze ściętym rogiem przez `clip-path`, krawędź oświetlona od lewej-góry, przyciski,
   żetony). ADR 0036 zastępuje ADR 0019 w części motywu i tokenów.
2. **Układ.** Zniknięcie pasków górnego i dolnego (tokeny `--top-bar-height`, `--status-bar-height` do zera):
   pływająca płyta tytułu świata, pole wyszukiwania (do etapu 3 otwiera dotychczasowe narzędzie Szukaj), płyta akcji
   (link, wydajność, o projekcie), pionowy dok narzędzi z grupami i znacznikiem aktywnego, sterowanie mapą w jednej kolumnie
   (zoom, północ, cały świat) oraz przycisk „Widok” zbierający pozostałe (2D/3D, rzut, joysticki, porównanie światów).
   Pasek stanu zastępuje narożny odczyt współrzędnych i podpis praw autorskich. Telefon: dolna nawigacja z pięcioma
   pozycjami (Szukaj, Warstwy, Trasa, Czas, Więcej); w „Więcej” trafiają Analizy, Rozmiary, Notatnik, Zakładki.
3. **Księga i karta wpisu.** `SearchPanel` staje się oknem Księgi (lista, filtry, karta, miejsca z „Prowadź tutaj”,
   postęp zbierania). „Pokaż na mapie” zamyka Księgę, zostawia wpis wybrany, a po prawej pojawia się zwarta karta wpisu
   (nazwa, podtytuł, „Teraz” dla postaci w rutynie, doba postaci, akcje, „Otwórz w Księdze”).
4. **Zegar doby.** Komponent łuku 24 h z markerem godziny, przyciskiem Odtwórz i trzema tempami; domyślnie zwinięty
   chip (godzina i Odtwórz), rozwijany przy otwartym narzędziu Czas i podczas odtwarzania.
5. **Dopracowanie.** Ruch (wsunięcie karty, płynięcie godziny) z `prefers-reduced-motion`, ekran ładowania, okno
   „O projekcie”, przegląd kontrastu każdej pary kolorów, przegląd telefonu i klawiatury, aktualizacja `docs/`.

## Zachowanie przekrojowe

- Etykiety dostępności i nazwy przycisków używane przez testy e2e zostają, chyba że etap świadomie je zmienia; wtedy
  zmienia testy w tym samym commicie.
- Tokeny układu pozostają jedynym miejscem wymiarów; komponenty nie dostają surowych kolorów ani pikseli.
- Zakłada się brak nowych zależności poza `@fontsource/grenze` i `@fontsource/barlow-semi-condensed` oraz usunięciem
  trzech starych paczek pisma.

## Co zostawiamy wykonawcy (plan)

- Dokładne wartości tokenów shadcn (`--primary`, `--ring`, `--accent` itd.) i ich mapowanie na nowe nazwy.
- Wzór płyty w CSS (jedna klasa bazowa, wariant „wybrana”) oraz fallback dla przeglądarek bez `clip-path`.
- Podział etapu 2 na zadania (po komponencie) i kolejność, żeby aplikacja budowała się po każdym.
- Testy: przegląd kontrastu jako test jednostkowy tokenów, e2e dla dolnej nawigacji i dok narzędzi.
- Plan implementacji powstaje osobno dla etapów 1 i 2; etapy 3–5 dostają plany po obejrzeniu wyniku.

## Moje decyzje do sprawdzenia

- Księga jako nakładka z przyciemnieniem mapy, a nie panel boczny.
- Zwarta karta wpisu po prawej po zamknięciu Księgi.
- Przycisk „Widok” zbierający rzadziej używane sterowanie mapą.
- Zegar doby zwinięty do chipa, dopóki narzędzie Czas jest zamknięte.
- Pasek stanu zastąpiony narożnym odczytem; liczniki wpisów przechodzą do Księgi.
- Zachowanie nazw klas CSS z przebudową ich wyglądu w etapie 1 (mniejszy diff niż zmiana nazw).
