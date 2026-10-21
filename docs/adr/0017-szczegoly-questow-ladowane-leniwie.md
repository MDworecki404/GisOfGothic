# 0017. Szczegóły questów ładowane leniwie z `quests.json`

Status: przyjęta

## Kontekst

Quest ma do ok. 40 wpisów dziennika, listę postaci, przedmiotów i nagrody. Wszystkie 165 questów Khorinis
to 1,5 MB JSON-a; po dodaniu ich do `search_index.json` indeks rósłby z 0,76 do 1,6 MB, a MiniSearch
budowałby się przy każdym starcie świata.

## Decyzja

- `search_index.json` zawiera lekkie wpisy `quest` (nazwa, kategoria, zleceniodawca, rozdział, miejsca startu).
- Pełne dane są w `quests.json` świata. `SearchCoordinator` wczytuje je dopiero przy wyborze questa, raz na świat,
  i buforuje obietnicę; nieudane wczytanie można ponowić.
- Wynik trafia do UI zdarzeniem `quest-details-changed` (`loading` / `ready` / `error`). Odpowiedź dla wpisu,
  który nie jest już wybrany, jest pomijana.
- Kolejność etapów pochodzi ze skryptów i nie jest dowodną chronologią; karta mówi o tym wprost.

## Konsekwencje

- Start aplikacji i wyszukiwanie nie płacą za teksty dziennika.
- Pierwsza karta questa w świecie czeka na sieć (potem działa z pamięci).
- Dodanie Gothica 1 wymaga tylko tej samej pary plików w paczce świata.
