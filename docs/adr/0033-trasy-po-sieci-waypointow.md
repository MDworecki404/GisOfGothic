# 0033. Trasy po sieci waypointów

Status: przyjęta

## Kontekst

Wiki Gothica mówi, gdzie coś leży, ale nie, którędy tam dojść. Dane questów nie dają kolejności etapów
(`order: "script"` to kolejność w skryptach, nie w grze), więc trasy „przez wszystkie cele questa” udawałyby wiedzę,
której nie mamy. Gra ma za to sieć waypointów (waynet): punkty i połączenia, po których chodzą postacie. Ekstraktor
czyta ją z pliku świata. Pełny geojson tej sieci ma w Archolosie (15 918 punktów) 7,6 MB, w Khorinis 1,5 MB.

## Decyzja

- Trasa to **czwarty tryb narzędzia Pomiary** (`route`), nie osobne narzędzie. Używa tego samego profilu terenu i czasu
  przejścia co odległość. Wybiera się początek i cel (kliknięcie mapy albo „Prowadź tutaj” w karcie wpisu); trzecie
  kliknięcie zaczyna od nowa.
- Dane: osobny, zwarty plik `waypoints.json` w paczce świata (`nodes: [[nazwa, lon, lat, wysokość, podWodą]]`,
  `edges: [[i, j]]` jako indeksy). Dla wszystkich światów z siecią ten sam format; Archolos mainland ma 1,0 MB (228 KB po
  gzip). Gothic 3 sieci nie ma i pliku też nie, więc tryb pokazuje „Ten świat nie ma sieci dróg z gry.” (HTTP 404 to
  „brak sieci”, nie błąd).
- Logika w czystych klasach `services/routing/`, liczących w lokalnych metrach (`LocalProjector`), bez Cesium:
  `WaypointGraph` (graf bez punktu `TOT` i punktów pod wodą; krawędź waży odległość w poziomie),
  `RouteFinder` (A* z heurystyką w linii prostej), `RoutePlanner` (przyciąganie do sieci i dojście),
  `WorldRoutingContext` (leniwe pobranie sieci i przeliczanie pozycji).
- Punkt wyszukiwany z zewnątrz przyciąga się tylko do **największej spójnej części** sieci, żeby trasa nie kończyła się
  na odciętej wyspie dróg. Dojście dłuższe niż `MAXIMUM_APPROACH_METRES` = 60 m daje komunikat „W pobliżu nie ma dróg
  z gry” zamiast trasy. Próg wyznaczono pomiarem: przedmioty leżące w terenie są od drogi o 22 m (95. percentyl)
  i 37 m (99.) w Khorinis; miejsca questów leżą dokładnie na waypointach.
- Sieć ładuje się leniwie przy pierwszym użyciu trybu w danym świecie. Wynik starszego ładowania (po zmianie świata)
  jest pomijany numerem żądania.
- Trasa trafia do adresu: `trasa=E_N_H~E_N_H` (metry od kotwicy świata, jedna dziesiąta po przecinku). Zakładki
  trasy nie zapisują. Wynik w adresie to współrzędne, a nie identyfikatory wpisów, bo miejsce wpisu nie ma stabilnego
  identyfikatora.

## Konsekwencje

- Trasa jest uczciwa: idzie po drogach z gry i nie zakłada kolejności questów. „Wycieczka po celach questa” wróci, gdy
  ekstraktor poda kolejność etapów w grze.
- Odcinki dojścia poza siecią rysują się tą samą linią co droga; ich długość jest opisana w panelu.
- Trasa nie uwzględnia pływania, wspinaczki ani skrótów poza siecią.
- Nowy świat z siecią wymaga tylko pliku `waypoints.json` w paczce.
