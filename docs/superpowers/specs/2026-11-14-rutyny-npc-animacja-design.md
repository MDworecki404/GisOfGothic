# Rutyny postaci jako animacja po drogach — projekt

Data: 2026-11-14. Status: do akceptacji. Pozycja 12 z `docs/pomysly.md`. Opiera się na trasach po sieci waypointów
(ADR 0033, 0034).

## Po co

Dziś warstwa „Postacie o tej porze” pokazuje, gdzie postacie są o wybranej godzinie, ale przy zmianie godziny skaczą
z miejsca na miejsce. Gracz nie widzi, że kowal wychodzi z kuźni do gospody ani ile mu to zajmuje. Animacja po drogach
pokazuje życie miasta: przycisk „Odtwórz” przesuwa godzinę, a postacie idą po drogach z gry między kolejnymi
miejscami rutyny. Cel: odpowiedź na pytania „kiedy ta postać wychodzi, którędy idzie i kiedy dociera” oraz efektowny
punkt wejścia dla nowego użytkownika.

## Cele, nie-cele, anty-cele

Cele:

- Odtwarzanie doby: godzina rośnie sama, w trzech tempach, z możliwością zatrzymania i przeciągnięcia suwaka.
- Postać zmieniająca miejsce idzie po sieci dróg z prędkością marszu bohatera, a czas przejścia liczy się w czasie gry.
- Kliknięcie postaci mówi, gdzie jest teraz, a gdy idzie, skąd i dokąd.
- Zachowanie istniejącej warstwy (filtr rozdziału, karta, kolor, ikona) bez regresji.

Nie-cele:

- Zachowania postaci poza rutyną domyślną (walka, rutyny po zadaniach, pory roku).
- Wierne odtworzenie wnętrz i animacji; postać jest punktem na mapie.
- Pływanie, wspinaczka i omijanie przeszkód poza siecią dróg.
- Zapis stanu odtwarzania w adresie.

Anty-cele (porażka, nawet gdy „działa”):

- Postacie sunące po liniach prostych przez budynki i góry tam, gdzie nie ma drogi, bez żadnej informacji.
- Wyraźny spadek płynności mapy podczas odtwarzania (cel: do 20 aktualizacji na sekundę, bez przebudowy całej warstwy,
  jeśli pomiar pokaże, że to konieczne).
- Odtwarzanie działające w tle, gdy nikt na nie nie patrzy (zamknięty panel, ukryta warstwa, inny świat).

## Co wiemy z przeglądu (stan faktyczny)

- `TimeCoordinator` ładuje `character_places.geojson` i `npcs.geojson`, filtruje rutyny domyślne i przy każdej zmianie
  godziny woła `DailySchedule.findActiveAt` oraz `showDataLayer` (przebudowa warstwy). `identifyCharacter` odczytuje
  postać po indeksie w `placesOnMap`.
- Miejsce rutyny ma `lon/lat/h`, `waypoint`, `times` (przedziały `HH:MM–HH:MM`, także przez północ) i `actions`.
- Dane (rutyny domyślne): Khorinis 187 postaci, z czego 93 zmienia miejsce (52 dwa, 29 trzy, 12 więcej); Kolonia 133
  i 81; Myrtana 200 i 64; Archolos 423 i 183.
- Czysta, ciągła doba (każda minuta objęta jednym miejscem): Khorinis 183 z 187, Kolonia 127 ze 133, Myrtana tylko 50
  z 200 (godziny w G3 są orientacyjne, luki w 122 przypadkach, nakładanie w 28).
- Mamy `RoutePlanner` (przyciąganie do sieci, dojście do 60 m, A*), `TravelTimeCalculator` i prędkości z
  `metadata.json` (marsz 1,43 m/s). Przelicznik: 4 s rzeczywiste = 1 minuta gry.

## Podejścia

|                             | Opis                                                     | Za                         | Przeciw                                                     |
| --------------------------- | -------------------------------------------------------- | -------------------------- | ----------------------------------------------------------- |
| **A. Po drogach** (wybrane) | Odtwarzanie doby, ruch po sieci dróg z prędkością marszu | Wierne, wykorzystuje trasy | Najwięcej pracy: oś czasu na postać, interpolacja po trasie |
| B. Linia prosta             | Ten sam ruch bez sieci                                   | Prostsze                   | Postacie przechodzą przez ściany                            |
| C. Samo odtwarzanie         | Godzina rośnie sama, postacie skaczą                     | Kilka godzin pracy         | Mała wartość                                                |

## Projekt

### Oś czasu postaci (`CharacterTimeline`, czysta klasa)

- Z domyślnych miejsc jednej postaci powstaje lista pobytów `{ startMinute, endMinute, place }`, posortowana po
  początku. Każdy przedział `times` miejsca daje osobny pobyt.
- Reguły dla danych niekompletnych: **luka** — postać zostaje w ostatnim znanym miejscu do początku następnego pobytu
  (przed pierwszym pobytem dnia zostaje w ostatnim z poprzedniej doby); **nakładanie** — wygrywa pobyt o późniejszym
  początku; przedział, w którym początek równa się końcowi, oznacza całą dobę (jak dziś w `DailySchedule`).
- Przejście z pobytu `i` do `i+1` zaczyna się o `endMinute` pobytu `i`. `positionAt(minute)` zwraca punkt: postój albo
  punkt na trasie przejścia.

### Planowanie ruchu (`RoutineMovementPlanner`)

- Dla każdego przejścia między różnymi miejscami woła `RoutePlanner.planRoute`. Wynik dostaje długość (dojście, sieć,
  dojście) i czas przejścia w minutach gry = `długość / prędkość marszu / 4 s`.
- Gdy brak drogi (`too-far-from-network`, `no-path`) albo brak sieci świata: **brak ruchu**, postać stoi w poprzednim
  miejscu do początku przejścia i w tym momencie pojawia się w nowym (skok, jak dziś). Skoki są policzone i pokazane
  w panelu („Bez drogi: N postaci”).
- Gdy przejście trwa dłużej niż następny pobyt: postać kończy marsz do miejsca docelowego, a przy kolejnym
  przejściu startuje od miejsca docelowego (uproszczenie, zapisane jako ograniczenie).
- Trasy liczone są leniwie przy pierwszym „Odtwórz” w świecie, porcjami (bez blokowania interfejsu), a wynik jest
  zapamiętany. Nowy świat czyści pamięć podręczną.

### Odtwarzanie (`RoutinePlayback`)

- Ticker oparty na `requestAnimationFrame` (wstrzykiwany do testów), liczy przyrost godziny z tempa:
  „Jak w grze” (1 minuta gry na 4 s), „Szybko” (1 minuta na 0,25 s), „Bardzo szybko” (1 godzina na 1 s).
- Aktualizacja warstwy maksymalnie 20 razy na sekundę. Jeśli `showDataLayer` przy ~200 punktach okaże się zbyt
  drogie, dodajemy w rendererze przesuwanie istniejących punktów (decyzja po pomiarze, patrz plan).
- Odtwarzanie zatrzymuje się: po przeciągnięciu suwaka, po ukryciu warstwy, po zamknięciu narzędzia Czas, przy
  zmianie świata i przy ukryciu karty przeglądarki.

### Interfejs

- Panel Czas: przycisk „Odtwórz” / „Zatrzymaj” przy suwaku i trzy chipy tempa; opis stanu („Na drogach: N postaci,
  bez drogi: M”).
- Karta postaci: wiersz „Teraz” — „stoi tutaj (do 21:30)” albo „idzie z <miejsce> do <miejsce>, dotrze o 21:48”;
  tekst „orientacyjnie” dla G3 pozostaje.
- Teksty po polsku według glosariusza; `aria-pressed` na chipach, przycisk dostępny z klawiatury, odtwarzanie
  zatrzymywane przy `prefers-reduced-motion` nie wymaga zmiany (uruchamia je użytkownik).

### Dokumentacja

Nowy ADR „Animacja rutyn po sieci dróg”, aktualizacja `docs/architektura.md` (klasy, zdarzenia), `docs/pomysly.md`
(pozycja 12 do „Zrobione”).

## Co zostawiamy wykonawcy (plan)

- Podział odpowiedzialności `TimeCoordinator` / nowych klas i kształt zdarzeń (`time-of-day-changed` dostaje stan
  odtwarzania).
- Pomiar kosztu `showDataLayer` i ewentualna optymalizacja renderera.
- Dostęp koordynatora czasu do planisty (przez `WorldRoutingContext` z fasady, jak w Pomiarach).
- Testy: oś czasu (północ, luki, nakładanie, jedno miejsce), plan ruchu (z drogą, bez drogi, za długo), ticker,
  scenariusz e2e z podstawioną siecią.

## Moje decyzje do sprawdzenia

- Rutyny domyślne tylko (jak dziś).
- Skok zamiast ruchu tam, gdzie brak drogi, z licznikiem w panelu.
- Trzy tempa i zatrzymanie przy przeciągnięciu suwaka.
- Aktualizacja warstwy do 20 Hz.
