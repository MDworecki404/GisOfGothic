# Trasy po sieci waypointów — projekt

Data: 2026-11-14. Status: do akceptacji. Pozycja z `docs/pomysly.md` (dawniej „Trasy i przewodnik po questach”,
zawężona do trasy A→B, patrz „Podejścia”).

## Po co

Wiki Gothica mówi, gdzie coś leży, ale nie, którędy tam dojść. Użytkownik wybiera dwa miejsca, a aplikacja
rysuje drogę, którą w grze chodzą NPC, i podaje dystans, czas przejścia oraz profil wysokości. Cel: odpowiedź
na pytanie „jak dojść stąd tam i ile to zajmie”, dla dowolnego wpisu (postać, przedmiot, cel questa, pinezka).

## Cele, nie-cele, anty-cele

Cele:

- Trasa między dwoma punktami po drogach z gry, w każdym świecie, który ma sieć waypointów.
- Wynik: linia na mapie, dystans, czas (marsz, bieg, skradanie, marsz z bronią), profil terenu.
- Punkty początku i końca z mapy, z wyszukiwarki, z karty wpisu i z pinezek Notatnika.
- Adres (URL) i „Kopiuj link” zachowują trasę.

Nie-cele:

- Kolejność etapów questa i „wycieczka po wszystkich celach” (patrz „Podejścia”, wariant B).
- Pływanie, wspinaczka, skróty poza siecią; trasa nie jest symulacją ruchu gracza.
- Światy bez sieci (Gothic 3): tam trasa się nie wyznacza.

Anty-cele (porażka, nawet gdy „działa”):

- Trasa udająca pewność, której nie mamy, np. droga przez miejsca nieosiągalne albo kolejność questa „z głowy”.
- Ciche użycie linii prostej tam, gdzie sieci brak, bez widocznej informacji dla użytkownika.
- Wydłużenie startu świata: sieć ładuje się leniwie, dopiero przy pierwszej trasie.

## Co wiemy z przeglądu (stan faktyczny)

- Ekstraktor (`C:\Moje_Różne\GothicClaudiusz`) czyta sieć (`world_data.py`: `way_net`) i zapisuje
  `waypoints.geojson`: punkty (`id` `wp-<NAZWA>`, `name`, `under_water`, `game_pos`, `height_m`) oraz linie
  `{a, b}`. Pliki są w `output/`, ale **nie ma ich w paczce `dist/`** (wymaga zmiany w `package.py` i `validate.py`).
- Liczności: Khorinis 2959 punktów / 3402 krawędzie, Górnicza Dolina 1408 / 1771, Jarkendar 1510 / 1712,
  Smocza Wyspa 315 / 375, Kolonia G1 2784 / 3500, Archolos kontynent 15919 / 18041. G3 ma 0 / 0.
- Graf Khorinis jest niemal spójny: 2952 z 2958 węzłów w jednej składowej.
- Waypoint `TOT` to miejsce odstawienia usuniętych NPC (nie jest realnym miejscem).
- Quest ma `order: "script"`, czyli etapy nie są w kolejności gry; miejsca mają `certainty` (`always`/`possible`).
- Istnieją gotowe klocki: `MeasurementCoordinator` (tryby `distance`/`area`/`point`, profil terenu, czas przejścia
  z prędkości w `metadata.json`), `TravelTimeCalculator`, `LocalProjector` (lon/lat/h → lokalne ENU w metrach),
  rysowanie w `measurement-renderer.ts`, `ProfileChart`. `showMeasurement(vertices, linePath)` już rozróżnia
  punkty kliknięte od narysowanej linii.

## Podejścia

| | Opis | Za | Przeciw |
|---|---|---|---|
| **A. Trasa A→B** (wybrane) | Dwa punkty, najkrótsza ścieżka po sieci, wynik jak w Pomiarach | Uczciwe, działa dla każdego wpisu, mały koszt dzięki istniejącym klockom | Wymaga dołożenia sieci do paczki |
| B. Wycieczka po celach questa | Jednym przyciskiem trasa przez wszystkie cele | Efektowne | Kolejność nasza, nie z gry; do 198 miejsc; odłożone do czasu, gdy ekstraktor poda kolejność etapów |
| C. Linia prosta | Jak dziś w Pomiarach | Zero kosztu | Nie mówi, którędy iść |

Wybór (użytkownik): A. Decyzja o miejscu w interfejsie jest moja (do skorygowania): trasa to **czwarty tryb Pomiarów**,
nie nowe narzędzie, bo pasek ma już osiem przycisków, a trasa korzysta z tego samego profilu i czasu przejścia.

## Projekt

### Dane (ekstraktor, osobne repozytorium)

Dodać `waypoints.geojson` do paczki każdego świata z siecią, bez punktu `TOT`; walidacja: krawędzie wskazują
istniejące punkty, brak duplikatów nazw, raport spójności grafu. Prompt dla ekstraktora jest w historii rozmowy;
kontrakt zapisujemy w `static/data/g2nk/khorinis/README.md` i `docs/dane.md`.

### Aplikacja

Klasy (zgodnie z `CLAUDE.md`, logika w serwisach, bez Cesium w klasach liczących):

- `WaypointGraph` (`src/lib/services/routing/waypoint-graph.ts`): buduje graf z `waypoints.geojson`, w lokalnych
  metrach przez `LocalProjector`; znajduje najbliższy punkt sieci dla pozycji; zna składowe spójności.
- `RouteFinder` (`.../route-finder.ts`): najkrótsza ścieżka (A* z odległością euklidesową w lokalnym układzie jako
  heurystyką), wynik: lista punktów, dystans poziomy, flaga „dojście spoza sieci” z długością odcinków dojścia.
- `RouteCoordinator` lub rozszerzenie `MeasurementCoordinator` o tryb `route`: przyjmuje start i cel, woła
  `RouteFinder`, przekazuje `vertices` (start, cel) i `linePath` (ścieżka) do istniejącego `showMeasurement`,
  a profil i czas przejścia liczą się jak dla odległości. Konkretny podział ustali plan.
- `WaypointNetworkLoader` w `src/lib/data/`: ładuje sieć leniwie, przy pierwszej trasie w danym świecie, i cache’uje
  na czas sesji. Brak pliku znaczy „świat bez sieci”.
- Zdarzenia na event busie: ustawienie startu, ustawienie celu, zamiana start/cel, wyczyszczenie; typowane,
  bez importu Cesium w komponentach.

### Zachowanie

1. W Pomiarach wybierasz „Trasa”. Pierwsze kliknięcie mapy (albo wybór z wyszukiwarki/karty/pinezki) to start,
   drugie to cel; kolejne kliknięcie zaczyna od nowa.
2. Karta wpisu (postać, przedmiot, cel questa) ma przycisk „Prowadź tutaj”: ustawia cel i otwiera Pomiary.
   Start to ostatni wybrany punkt, a bez niego pierwsze kliknięcie mapy.
3. Punkt spoza sieci jest przyciągany do najbliższego waypointu. Odcinek dojścia jest rysowany przerywaną linią
   i opisany „dojście poza siecią: N m”. Gdy najbliższy punkt jest dalej niż próg (do ustalenia w planie),
   panel mówi, że w pobliżu nie ma dróg z gry.
4. Wynik: dystans, czas dla czterech trybów ruchu, profil wysokości, zmiana start/cel, kopiowanie linku.
5. Punkty leżące pod wodą (`under_water`) nie są domyślnie używane do tras; wariant z pływaniem jest nie-celem.
6. Światy bez sieci (G3): tryb „Trasa” jest wyłączony z podpowiedzią „Ten świat nie ma sieci dróg z gry”.
   Użytkownik nadal ma tryb „Odległość” (linia prosta).
7. Brak ścieżki między punktami (osobne składowe): komunikat „Nie ma drogi między tymi miejscami w sieci gry”.

### Adres i zakładki

Trasa trafia do adresu jako `route=<start>~<cel>` (identyfikatory wpisów albo `lon,lat`), z tą samą obsługą co widok
w ADR 0007. Szczegóły formatu w planie.

### Dokumentacja

Nowy ADR „Trasy po sieci waypointów” (numer wg `docs/adr/README.md`), aktualizacja `docs/architektura.md`
(klasy, zdarzenia), `docs/dane.md` (nowy plik paczki) i `docs/pomysly.md` (pozycja 1 zawężona do A→B,
wariant B jako osobna pozycja zależna od kolejności etapów).

## Co zostawiamy wykonawcy (plan)

- Dokładny kształt zdarzeń i podział odpowiedzialności `MeasurementCoordinator` / nowego koordynatora.
- Próg „za daleko od sieci”, format `route` w adresie, rozmiar i wydajność sieci Archolosa (16 tys. punktów:
  budowa grafu w tle lub wcześniejsze uproszczenie w ekstraktorze).
- Testy jednostkowe (graf i wyszukiwanie na małej sieci, przyciąganie, brak ścieżki) oraz scenariusz e2e.
- Teksty interfejsu po polsku według glosariusza; zgodne z motywem „Mapa z sakwy kopacza” (ADR 0019).

## Moje decyzje do sprawdzenia

- Trasa jako czwarty tryb Pomiarów, nie osobne narzędzie.
- Domyślnie bez punktów pod wodą i bez `TOT`.
- Leniwe ładowanie sieci przy pierwszej trasie.
- A* zamiast Dijkstry (ten sam wynik, szybciej na dużych światach).
