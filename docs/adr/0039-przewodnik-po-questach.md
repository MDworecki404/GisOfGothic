# 0039. Przewodnik po questach

Status: przyjęta.

## Kontekst

Etapy dziennika w `quests.json` były w kolejności ze skryptów (`order: "script"`), więc nie dało się z nich zbudować trasy.
Ekstraktor (paczka v6) dodał zależności między etapami wyczytane z warunków dialogów (`requires`, `level`), grupy
wykluczających się gałęzi (`alternative_group`) i miejsce etapu (`place`). Quest, którego etapy mają odczytywalne warunki,
ma `order: "dependency"`; pozostałe (większość Archolosa i Gothica 3) zostają na `script`.

## Decyzja

- `QuestGuidePlanner` (`services/search/`) układa przystanki według `level`, potem `seq`; kolejne etapy w tym samym miejscu
  zlewa w jeden przystanek. Quest z `order: "script"`, mniej niż dwoma przystankami albo bez miejsc nie ma przewodnika.
- `QuestPresenter` dodaje `guide` do `QuestDetailsView`. Księga pokazuje listę przystanków i przycisk „Pokaż trasę na mapie”;
  `SearchCoordinator` (`toggleQuestGuide`, `moveQuestGuideStep`) rysuje znaczniki połączone linią (`PlaceMarkersLayer`,
  parametr `showRoute`) i publikuje `quest-guide-changed`. Karta przy mapie (`EntrySummaryCard`) ma kroki „Wstecz” / „Dalej”
  i „Ukryj trasę”.
- Przystanki z domyślnej rutyny postaci są oznaczone jako orientacyjne, a gałęzie alternatywne jako „jedna z możliwych dróg”.

## Konsekwencje

- Trasa jest linią prostą między miejscami, nie ścieżką po sieci dróg.
- Kolejność jest tak dobra jak dane: `level` bywa przybliżony (np. etap z funkcji pomocniczej wołanej z wielu dialogów),
  więc trasa może się „odbijać” między postaciami. Poprawa należy do ekstraktora.
- Odłożone: trasa po sieci dróg (Pomiary → Trasa), osobne rysowanie gałęzi alternatywnych, przewodnik dla questów
  z `script`.
