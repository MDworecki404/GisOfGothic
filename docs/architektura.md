# Architektura

Aplikacja to statyczna strona (SvelteKit, `adapter-static`) działająca wyłącznie w przeglądarce.
Kod dzieli się na warstwy, które znają się tylko w jednym kierunku: **UI nie zna logiki biznesowej,
a logika nie zna UI**. Łączy je fasada (polecenia) i event bus (wyniki).

## Warstwy

```mermaid
flowchart LR
    subgraph UI["UI (Svelte)"]
        R["routes/<br/>strony"]
        C["components/<br/>komponenty"]
    end
    subgraph Logika
        F["GeoportalFacade<br/>(fasada)"]
        M["MapService<br/>(Cesium)"]
        L["GeoportalDataLoader<br/>(dane)"]
        K["WorldCatalog<br/>(gry i światy)"]
    end
    B(("EventBus"))
    S["AppState<br/>(stan dla UI, runy)"]

    R -- "openWorld()" --> F
    C -- "attachMapTo() / detachMap()" --> F
    F --> M
    F --> L
    R -- "findWorld()" --> K
    F -- "publish()" --> B
    B -- "subscribe()" --> S
    S -- "odczyt reaktywny" --> C
```

| Warstwa    | Folder                                 | Odpowiedzialność                                              | Czego nie robi                                                                   |
| ---------- | -------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Strony     | `src/routes/`                          | adresy, odczyt parametrów, wybór świata z katalogu            | nie wczytuje danych, nie dotyka Cesium                                           |
| Komponenty | `src/lib/components/`                  | renderowanie stanu, zgłaszanie intencji użytkownika do fasady | nie importuje `cesium`, `minisearch`, `services/`, `data/` (pilnuje tego ESLint) |
| Fasada     | `src/lib/services/geoportal-facade.ts` | jedyne wejście UI do logiki; koordynuje serwisy               | nie zwraca wyników bezpośrednio — publikuje zdarzenia                            |
| Serwisy    | `src/lib/services/`                    | mapa 3D (`MapService`), budowniczy opcji Viewera              | nie znają Svelte                                                                 |
| Dane       | `src/lib/data/`                        | typy, parsowanie i walidacja paczki danych, katalog światów   | nie znają Cesium ani UI                                                          |
| Zdarzenia  | `src/lib/events/`                      | typowany event bus i lista zdarzeń aplikacji                  | —                                                                                |
| Stan       | `src/lib/state/`                       | reaktywny stan dla UI, aktualizowany wyłącznie zdarzeniami    | nie trzyma obiektów Cesium                                                       |

Zależności składa jedno miejsce: `src/lib/composition-root.ts`. Komponenty i strony importują stamtąd
gotowe instancje (`geoportal`, `appState`, `worldCatalog`).

## Przepływ: otwarcie świata

```mermaid
sequenceDiagram
    participant P as Strona /[gameId]/[worldId]
    participant V as MapView
    participant F as GeoportalFacade
    participant D as GeoportalDataLoader
    participant M as MapService
    participant B as EventBus
    participant S as AppState

    V->>F: attachMapTo(kontener)
    F->>M: new MapService (Viewer)
    P->>F: openWorld(świat)
    F->>B: world-opened
    F->>D: loadSearchIndex()
    D-->>F: indeks
    F->>B: search-index-loaded (liczby)
    F->>D: loadMetadata() → kotwica
    F->>M: showWorldTileset(asset ion, kotwica)
    F->>B: world-loaded
    B->>S: aktualizacja stanu
    S-->>P: pasek statusu, nagłówek
```

Kolejność `attachMapTo` i `openWorld` nie ma znaczenia — fasada pokaże świat, gdy ma oba.
Każde wczytanie świata dostaje numer pokolenia; wynik wyprzedzonego wczytania (szybka zmiana świata,
odpięcie mapy) jest pomijany, a niepotrzebny tileset niszczony.

## Zdarzenia

Lista w `src/lib/events/app-events.ts`. Zdarzenie to obiekt z polem `type` (unia dyskryminowana),
więc `subscribe('world-load-failed', ({ message }) => …)` ma pełne typy bez asercji.

| Zdarzenie                   | Dane                                                                    | Kiedy                                                                       |
| --------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `world-opened`              | `worldName`                                                             | fasada przełączyła świat                                                    |
| `world-load-started`        | —                                                                       | start wczytywania modelu świata                                             |
| `world-loaded`              | —                                                                       | tileset świata dodany do sceny                                              |
| `world-load-failed`         | `message`                                                               | brak tokenu ion albo błąd wczytywania                                       |
| `search-index-load-started` | —                                                                       | start wczytywania indeksu                                                   |
| `search-index-loaded`       | `counts`                                                                | indeks wczytany; liczba przedmiotów i postaci                               |
| `search-index-load-failed`  | `message`                                                               | błąd pobrania lub walidacji indeksu                                         |
| `tool-selected`             | `toolId` lub `null`                                                     | otwarto albo zamknięto narzędzie na szynie                                  |
| `cursor-moved`              | `position` (E, N, H, lon, lat) lub `null`                               | kursor nad terenem (najwyżej raz na klatkę)                                 |
| `camera-heading-changed`    | `headingDegrees`                                                        | obrót kamery — kompas                                                       |
| `map-scale-changed`         | `metresPerPixel` lub `null`                                             | zmiana skali w środku ekranu — podziałka                                    |
| `coordinate-system-changed` | `systemId`                                                              | zmiana układu współrzędnych w pasku przyrządu                               |
| `search-results-changed`    | `query`, `typeFilter`, `results`                                        | zmiana zapytania, filtra albo wczytanie indeksu                             |
| `search-entry-selected`     | `details` lub `null`                                                    | wybrano wpis (karta szczegółów, znaczniki na mapie) albo wrócono do wyników |
| `data-layers-changed`       | `layers` (nazwa, kolor, liczność, stan)                                 | włączenie, wczytywanie albo błąd warstwy danych                             |
| `data-layer-load-failed`    | `layerName`, `message`                                                  | nie udało się pobrać lub sprawdzić pliku warstwy                            |
| `feature-identified`        | `identification` lub `null`                                             | kliknięto punkt warstwy (karta informacji) albo puste miejsce               |
| `analysis-changed`          | `analysis` (tryb, temat, punkt odniesienia, wyniki)                     | zmiana tematu, punktu albo wyniku analizy w narzędziu Analizy               |
| `camera-view-changed`       | `view` (E, N, H, kierunek, nachylenie) lub `null`                       | kamera się zatrzymała (`moveEnd`) albo odtworzono widok z linku             |
| `bookmarks-changed`         | `bookmarks`, `hasStorageError`                                          | wczytano, dodano albo usunięto zakładkę (lista dotyczy otwartego świata)    |
| `measurement-changed`       | `measurement` (tryb, wierzchołki, podsumowanie, profil, wskazany punkt) | kliknięcie mapy w narzędziu Pomiary, wynik profilu terenu, wyczyszczenie    |
| `time-of-day-changed`       | `minuteOfDay`, `routineLayerStatus`, `charactersOnMap`                  | zmiana pory dnia albo warstwy postaci o tej godzinie                        |

## Cesium a reaktywność Svelte

Obiektów Cesium (`Viewer`, `Cesium3DTileset`, kolekcje) **nie trzymamy w `$state`** — proxy Svelte
psuje ich wewnętrzne mechanizmy. Żyją w zwykłych polach `MapService`. Reaktywne są tylko dane
aplikacji w `AppState`.

## Wzorce

- **Fasada** — `GeoportalFacade`: prosty interfejs (`openWorld`, `attachMapTo`, `detachMap`) zamiast
  wielu serwisów.
- **Budowniczy** — `ViewerOptionsBuilder`: czytelne składanie opcji Viewera
  (`withoutIonBaseLayer().withoutToolbarWidgets()…`).
- **Obserwator** — `EventBus`: wyniki płyną od logiki do stanu bez wzajemnej znajomości.
- **Korzeń kompozycji** — `composition-root.ts`: jedno miejsce tworzenia i łączenia obiektów;
  zależności przekazywane konstruktorem, co ułatwia testy.

## Geodezja

`WorldFrame` przelicza punkt sceny Cesium na pozycję w świecie: E/N/H w metrach od kotwicy oraz lon/lat.
`CoordinateFormatter` pokazuje ją w jednym z układów: **Układ Khorinis 1992** (metry), **jednostki gry**
(centymetry silnika: x = E, y = H, z = −N — te same co w komendzie Marvina `goto pos`) albo **WGS 84**.

## Wyszukiwanie

`SearchCoordinator` (wywoływany przez fasadę) trzyma zapytanie, filtr i wybrany wpis jednego świata.
`SearchService` to indeks MiniSearch: pola nazwa, kategoria (z nazwą gildii zamiast kodu, np. VLK →
Mieszczanin) i kod; wyszukiwanie po początku słowa, z tolerancją literówek w dłuższych słowach i bez
polskich znaków (`normalizeSearchTerm`). `SearchEntryPresenter` zamienia wpisy na teksty dla UI,
a `PlaceMarkersLayer` rysuje miejsca wybranego wpisu jako jedną kolekcję punktów Cesium.

Wybrany wpis jest w adresie: `/g2nk/khorinis?wpis=item:ITPL_PERM_HERB`. Wpis z linku czeka na
wczytanie indeksu, a po wczytaniu modelu świata kamera leci do jego miejsc.

## Warstwy danych i identyfikacja

`DATA_LAYERS` (`services/layers/data-layer-catalog.ts`) opisuje warstwy: przedmioty w świecie, skrzynie,
unikatowe postacie, wszyscy NPC — plik GeoJSON, kolor, parser właściwości i opis obiektu do karty.
`DataLayersCoordinator` pobiera plik dopiero przy pierwszym włączeniu warstwy i go zapamiętuje.
`DataLayersRenderer` rysuje każdą warstwę jako kolekcję punktów, której identyfikatorem jest
`{ layerId, featureIndex }`; kliknięcie mapy (`MapViewObserver` → `onMapClicked`) wskazuje obiekt
w danych bez dodatkowych map, a fasada publikuje `feature-identified`.

## Pomiary

Gdy aktywne jest narzędzie Pomiary, fasada kieruje kliknięcia mapy do `MeasurementCoordinator`
zamiast do identyfikacji. Tryb **Odległość** zbiera wierzchołki łamanej; `MeasurementCalculator`
liczy odległość w poziomie i w przestrzeni, a profil terenu powstaje z próbek co ~2 m rzutowanych
na model świata (`MapService.sampleTerrainUnder` → `clampToHeightMostDetailed`). Model zawiera drzewa
i dachy, więc przed liczeniem profilu wysokości przechodzą przez filtr medianowy
(`removeNarrowObstacles`), który usuwa wąskie przeszkody; gęsty las nadal może podnieść profil.
Tryb **Pole** zbiera wierzchołki wielokąta; od trzech `MeasurementCalculator.summarizePolygon` liczy pole
w rzucie na płaszczyznę poziomą (wzór Gaussa, wynik w m² i ha) oraz obwód, a obrys domyka się i idzie
po terenie jak linia odległości.
Tryb **Współrzędne** pokazuje wskazany punkt we wszystkich układach i komendę Marvina `goto pos`.

## Analizy

Gdy aktywne jest narzędzie Analizy, kliknięcie mapy ustawia punkt odniesienia w `AnalysisCoordinator`
(zamiast identyfikować obiekt). Temat analizy (przedmiot albo postać) wybiera się spośród wpisów
indeksu — koordynator korzysta z tego samego `SearchService` co wyszukiwarka. **Najbliższe**: miejsca
tematu rzutuje `LocalProjector` na ramę świata (E, N, H), a `NearestPlacesFinder` wybiera pięć
najbliższych po prostej w przestrzeni (z odległością w poziomie). `AnalysisRenderer` rysuje punkt,
połączenia i numerowane wyniki; kliknięcie wiersza przelatuje kamerą do miejsca. **Zasięg**: punkt i promień (10–300 m); `BufferAnalyzer` zlicza w kole (w poziomie)
przedmioty, skrzynie i wszystkich NPC z warstw danych (`DataLayersCoordinator.loadLayerFeatures` pobiera
plik bez pokazywania warstwy) i grupuje je po nazwie; okrąg na mapie idzie po terenie (próbkowanie
wysokości jak w profilu pomiaru). **Zagęszczenie**: `DensityGridBuilder` dzieli miejsca tematu na siatkę sześciokątną (rozmiar =
odległość między równoległymi bokami) albo kwadratową i zlicza sztuki w niepustych komórkach;
kolor komórki wynika z legendy (równe przedziały, najwyżej pięć, ciepła skala rdza → żar → mosiądz →
jasny żar). `AnalysisRenderer` rysuje komórki jako jeden prymityw z `depthFailAppearance`, żeby
nie znikały pod terenem na zboczach; w tym trybie kliknięcie mapy nie ustawia punktu. Uzasadnienie podziału
na czyste klasy i renderer: [ADR 0006](adr/0006-analizy-na-czystych-klasach-i-lokalnym-rzucie.md).

## Widok w adresie i zakładki

Stan widoku to trzy rzeczy: wybrany wpis, kamera i otwarte narzędzie. `ViewLinkCodec` zamienia je na
parametry adresu i z powrotem: `?wpis=item:…&widok=E_N_H_kierunek_nachylenie&narzedzie=measure`
(parametry domyślne są pomijane, zamknięty panel to `narzedzie=zamkniete`). Kamerę koduje
`CameraViewCodec` w metrach od kotwicy i stopniach, więc link nie zależy od globusa Cesium; uszkodzony
parametr jest ignorowany, a reszta widoku odtwarzana.

Strona (`+page.svelte`) tylko przekazuje fasadzie surowe `location.search` (`openSharedView`) i po każdej
zmianie `AppState.sharedViewQuery` podmienia adres (`replaceState`). `MapViewObserver` zgłasza zatrzymanie
kamery (`camera.moveEnd`), fasada publikuje `camera-view-changed`. Widok z linku czeka na wczytanie modelu
świata (kamera) i indeksu (wpis); gdy link ma kamerę, wpis nie przelatuje do swoich miejsc.

`BookmarksCoordinator` trzyma zakładki otwartego świata, a `BookmarkStore` zapisuje je w `localStorage`
(klucz `gisofgothic:bookmarks:v1`, lista JSON). Odczyt waliduje każdy wpis; niedostępna albo pełna pamięć
nie przerywa działania — panel pokazuje ostrzeżenie. Zakładka zapamiętuje to samo co link, więc „Kopiuj
link” składa adres z `linkQuery` zakładki. Decyzje: [ADR 0007](adr/0007-widok-w-adresie-i-zakladki-w-localstorage.md).

## Pora dnia

`TimeCoordinator` trzyma minutę doby (domyślnie 12:00). `MapService.showTimeOfDay` ustawia światło
kierunkowe: słońce od wschodu (6:00) przez południe do zachodu (18:00), nocą słabsze, chłodne światło.
Cienie (`MapService.showShadows`) są domyślnie wyłączone; mapa cieni Cesium korzysta z kierunku światła
sceny, więc cienie podążają za porą dnia. Gładkie cienie to `softShadows` i mapa 4096 px zamiast 2048 px.
Warstwa „postacie o tej godzinie” czyta `character_places.geojson` przy pierwszym włączeniu, bierze
tylko rutyny domyślne i przez `DailySchedule` wybiera miejsca, których przedział godzin obejmuje
wybraną minutę (przedziały przez północ, np. „22:00–07:00”, są obsługiwane).
