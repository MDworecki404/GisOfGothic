# 0038. Lokacje i przejścia między światami

Status: przyjęta.

## Kontekst

Aplikacja znała dwa rodzaje danych o świecie: przedmioty i postacie (oraz questy). Brakowało nazwanych
miejsc — obozów, miast, budynków, jaskiń — i przejść między światami, np. Khorinis → Górnicza Dolina.
Ekstraktor (paczka v5) zapisuje je w osobnym pliku `locations.json`.

## Decyzja

- **Lokacje to warstwa danych** (`DataLayerId: 'locations'`, plik `locations.json`), a nie wpisy
  `search_index.json`. Plik ma własny parser (`data/location-parsers.ts`) i typy (`LocationEntry`,
  `LocationPassage`); kontrakt: [dane.md](../dane.md#lokacje-locationsjson).
- Karta obiektu (`FeatureIdentification`) opisuje rodzaj, zasięg, najbliższy punkt dróg i kod. Nazwa spoza
  gry (`name_source: derived` albo `code`) jest oznaczona jako robocza, bo gra nie ma tabeli „strefa → nazwa”.
- **Przejście** niesie `passage` (`toWorld` w postaci `<gra>/<świat>`, `arrival` w WGS84). Przycisk
  „Przejdź do tego świata” prosi fasadę o `planPassageTravel`; `PassageTravelPlanner` zamienia punkt przybycia
  na widok kamery (80 m na południe i w górę, patrzy na punkt) w parametrze `widok` adresu świata docelowego.
  Nawigacja to zwykłe przejście do trasy `/[gameId]/[worldId]`, więc działa też „wstecz” w przeglądarce.
- Cel poza paczką, przejście bez `arrival` i przejście do tego samego świata nie dają dodatkowych wyjątków:
  pierwsze dwa tracą widok (przycisk otwiera świat bez kamery albo nie ma celu), ostatnie ukrywa przycisk.

## Konsekwencje

- Świat bez `locations.json` (starsza paczka v4) pokazuje błąd wczytania warstwy; tylko ta warstwa.
- Lokacje są też wpisami wyszukiwarki: `GeoportalDataLoader.loadSearchIndex` dokłada je do indeksu jako wpisy
  `type: 'location'` (`buildSearchEntryFromLocation`), z kategorią równą rodzajowi lokacji. Księga ma filtr „Lokacje”,
  a karta wpisu i `EntrySummaryCard` pokazują przycisk przejścia (`PassageTravelButton`). Warstwa na mapie czyta
  ten sam plik osobno, więc nie wymaga otwarcia Księgi.
- Wybrana lokacja ma na mapie obrys zasięgu: `Place.extent` (obrys z `polygon` albo okrąg o `radius_m`) rysuje
  `PlaceMarkersLayer` jako linię w kolorze znacznika; teren ją zasłania, w przeciwieństwie do znacznika.
- Kliknięcie ikony w warstwie „Lokacje” wybiera wpis lokacji (`IdentifiableFeature.entryId`, `GeoportalFacade.reactToMapClick`)
  zamiast otwierać kartę obiektu, więc obrys zasięgu i karta przy mapie wyglądają tak samo jak po wyborze w Księdze.
- Odłożone: filtr po rodzaju lokacji.
