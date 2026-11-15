# 0040. Trasa przewodnika po drogach i gałęzie alternatywne

Status: przyjęta. Uzupełnia [ADR 0039](0039-przewodnik-po-questach.md) (znosi jego ograniczenia: linię prostą i brak gałęzi).

## Kontekst

Pierwsza wersja przewodnika łączyła przystanki linią prostą i prowadziła przez wszystkie gałęzie alternatywne jedna po drugiej,
choć w grze wystarczy przejść jedną z nich.

## Decyzja

- `QuestGuideLegPlanner` (`services/search/`) zamienia przystanki na odcinki trasy. Kolejne przystanki jednej grupy
  `alternativeGroup` to równoległe gałęzie: każda dostaje odcinek od końców poprzedniego bloku, a następny blok zaczyna się
  od końca każdej z nich. Odcinki gałęzi są na mapie przerywane (`PlaceRoute.isAlternative`).
- `RoadPathFinder` (`services/routing/`) wyznacza drogę między dwoma miejscami po sieci dróg świata (`RoutePlanner`);
  bez drogi (miejsce dalej niż 60 m od sieci) zwraca linię prostą.
- `SearchCoordinator.showQuestGuideRoutes` rysuje odcinki najpierw prosto, a po wczytaniu sieci dróg
  (`useRoadPathFinderSource`, źródło z `WorldRoutingContext`) po drogach. `PlaceMarkersLayer.showRoutes` ma własną kolekcję
  linii, więc zmiana trasy nie czyści znaczników ani zaznaczonego przystanku.

## Konsekwencje

- Gałąź o kilku kolejnych etapach jest traktowana jak kilka równoległych przystanków tej samej grupy: dane nie mówią,
  które etapy tworzą jedną gałąź.
- Sieć dróg wczytuje się przy pierwszej trasie (jak w pomiarach), więc przez chwilę widać linię prostą.
- Odłożone: przewodnik dla questów z `order: script`.
