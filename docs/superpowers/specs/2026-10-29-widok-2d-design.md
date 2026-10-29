# Widok 2D (płaska mapa z cięciem wysokości) — projekt V1

Data: 2026-10-29. Status: do akceptacji. Zakres ustalony w rozmowie.

## Cel i powód

Widok 2D to zwykły tryb wyświetlania geoportalu, taki jak płaska mapa w OpenLayers: północ u góry,
przesuwanie i zoom, bez przechyłu i obrotu. Cała reszta (znaczniki, wyszukiwarka, pomiary, zakładki,
linki) działa tak samo jak w 3D. Światy Gothica są wielopoziomowe (kopalnie, wieże, jaskinie), więc na
mapie z góry trzeba móc „ściąć” model na wybranej wysokości i zobaczyć niższy poziom.

### Cele V1

- Przełącznik 2D / 3D w kolumnie kontrolek mapy.
- W 2D: rzut ortogonalny, kamera prosto w dół, północ u góry, zablokowany przechył i obrót.
- Domyślnie 2D to cały świat z góry, **bez cięcia**.
- Suwak wysokości cięcia (natywny `ClippingPlaneCollection` Cesium) i przycisk „Bez cięcia”.
- Tryb i wysokość cięcia w adresie i w zakładkach, ze zgodnością starych linków.
- Powrót do 3D przywraca rzut i kąt widzenia sprzed wejścia w 2D.

### Cele poza V1 (świadomie)

- Nazwane poziomy per świat (np. „Poziom 2” w Starej Kopalni) — wymagałyby ręcznych danych dla każdego świata.
- Ortofotomapy / kafelki 2D renderowane offline per poziom — ciężkie w danych i w potoku ekstraktora.
- Zmniejszanie kosztu renderowania w 2D (np. wyższe `maximumScreenSpaceError`). 2D nie jest lżejsze od 3D.
- Zamykanie przekroju („nakładka” na ciętych bryłach). Z góry podłogi i grubość ścian wystarczają jako plan.
- Skrót klawiszowy dla trybu.

### Antycele

- Cięcie, które obcina wzgórza i pokazuje tylko dolinę, gdy użytkownik o to nie prosił (stąd domyślnie bez cięcia).
- Osobny silnik 2D albo `SceneMode.SCENE2D` (zepsułby 3D Tiles i układ świata przyklejonego do globusa).
- Nowa zależność, import Cesium w komponencie, obiekty Cesium w `$state`.

## Podejścia i wybór

| Podejście                                                    | Za                                                                 | Przeciw                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **A. Zablokowany widok 3D z góry + płaszczyzna cięcia (wybrane)** | Brak nowych danych; znaczniki, pick, pomiary, linki działają bez zmian | Nadal ładuje ciężki model 3D, więc na telefonie nie jest lżej       |
| B. Kafelki 2D renderowane offline per poziom jako warstwa obrazu | Lekkie, szybkie, wygląda jak mapa                                  | Nowy potok w ekstraktorze, duże dane per poziom i świat, poziomy z góry |
| C. `SceneMode.SCENE2D` Cesium                                | Prawdziwy tryb 2D                                                  | Nie współgra z 3D Tiles i kotwicą świata, osobne projekcje          |

Wybór użytkownika: **A**, bez abstrakcji pod B. Ortofotomapy odrzucone jako zbyt ciężkie.

## Projekt

### Model

```
ViewMode = 'view-3d' | 'view-2d'
```

`CameraProjectionSetting` zostaje bez zmian ([ADR 0021](../../adr/0021-rzut-kamery.md)). Tryb 2D jest
nadbudową: wymusza rzut ortogonalny i widok z góry, a nie nowym rodzajem rzutu.

Wysokość cięcia: `sliceHeightMetres: number | null` (`null` = bez cięcia), w metrach nad elipsoidą, jak
wszystkie `h` w danych. Cięcie należy do trybu 2D: po wyjściu z 2D znika (zakładam, że użytkownik w 3D
nie oczekuje obciętego świata; mój wybór).

### Klasy (logika, bez Svelte)

- `ViewModeCoordinator` (`services/camera/`) — trzyma tryb i wysokość cięcia, jak
  `CameraProjectionCoordinator`. Przy wejściu w 2D zapamiętuje bieżący rzut, prosi
  `CameraProjectionCoordinator` o ortogonalny, a mapę o widok „Z góry” i blokadę sterowania. Przy wyjściu
  przywraca zapamiętany rzut i zdejmuje blokadę i cięcie. Publikuje zdarzenie
  `view-mode-changed` (`mode`, `sliceHeightMetres`). Waliduje wysokość (skończona liczba).
- `ViewModeDisplay` (interfejs w tym samym pliku, jak `CameraProjectionDisplay`) — implementuje go `MapService`:
  `showViewMode(mode)`, `showSliceHeight(metres | null)`.
- `WorldSliceController` (`services/map/`) — jedyne miejsce, które dotyka `clippingPlanes` tilesetów
  świata. Buduje `ClippingPlaneCollection` z jedną poziomą płaszczyzną w ramie kotwicy (`WorldFrame`),
  zwróconą tak, by zostawiała część **poniżej** wysokości cięcia; aktualizuje odległość płaszczyzny przy
  zmianie wysokości; zwraca zakres wysokości z granic modelu (nie z liczb wpisanych w kodzie).
- `MapService` — `showViewMode` ustawia `enableTilt = false` i `enableLook = false` w
  `ScreenSpaceCameraController` w 2D (przywraca w 3D), woła `showCameraPreset('top')`, a przy zmianie
  rzutu nie psuje trybu. Nowy tileset świata po zmianie świata dostaje bieżące cięcie.
- Lot z klawiatury i joysticki: w 2D ignorują obrót i przechył (przesuwanie i zoom zostają). Przycisk
  „na północ” jest w 2D zbędny i ukryty.

### Fasada, zdarzenia, stan

- `GeoportalFacade`: `selectViewMode(mode)`, `setSliceHeight(metres | null)`.
- Zdarzenie: `{ type: 'view-mode-changed'; mode: ViewMode; sliceHeightMetres: number | null }`.
- `AppState.viewMode` i `AppState.sliceHeightMetres` (reaktywne dane) oraz `AppState.sliceHeightRange`
  (zakres suwaka, odczytany po wczytaniu świata przez zdarzenie lub fasadę; obiektów Cesium w `$state` nie ma).

### Adres i zakładki (zgodność wsteczna)

- Nowe parametry: `tryb=2d` (brak = 3D) i `ciecie=<metry>` (brak = bez cięcia; tylko z `tryb=2d`).
- `rzut` zostaje: w 2D zapisuje się rzut wymuszony (`o`), ale odtwarzanie najpierw ustawia tryb, a rzut
  poprzedni (do powrotu do 3D) wraca do domyślnego. Stare linki działają bez zmian, nieznane parametry
  w starych wersjach aplikacji są ignorowane.
- `SharedViewState` dostaje `viewMode` i `sliceHeightMetres`; `ViewLinkCodec` serializuje i parsuje,
  uszkodzone wartości są ignorowane, reszta widoku odtwarzana.
- `SavedView` dostaje opcjonalne pola `viewMode`, `sliceHeightMetres`; odczyt z `localStorage` akceptuje
  ich brak (klucz `gisofgothic:bookmarks:v1`, zmiana addytywna). Etykieta zakładki w 2D: „Widok 2D”.
- Kolejność odtwarzania: tryb, potem `setView` na zapisaną pozycję, potem cięcie.

### UI

- Nowy przycisk „Widok 2D” w kolumnie `MapControls` obok przycisku rzutu kamery (`controlButton`,
  `aria-pressed` w 2D). Szyna narzędzi bez zmian.
- Okienko `CameraSettingsPopover` w 2D: grupa „Rzut” i suwak FOV są nieaktywne z podpowiedzią (wymusza
  je tryb), a pojawia się sekcja **„Poziom cięcia”**: `chip` „Bez cięcia” (`aria-pressed`) i `ForgedRange`
  wysokości w metrach z wartością. Przeciągnięcie suwaka włącza cięcie.
- Pasek stanu: obok podziałki etykieta „widok 2D” (zamiast „rzut ortogonalny”).
- Panel Czas: istniejąca uwaga o cieniach w ortho obowiązuje bez zmian.
- Znaczniki miejsc **nie są cięte** (zostają widoczne także nad płaszczyzną); to informacja, nie geometria.
- Min. 44×44 px, widoczny focus, tokeny i klasy `material-*` z `src/app.css`, teksty po polsku, bez
  wykrzykników, `prefers-reduced-motion` jak przy rzucie.

## Testy

- **Vitest:** `ViewModeCoordinator` (wejście i wyjście z 2D przywraca rzut, walidacja wysokości, zdarzenia),
  `ViewLinkCodec` (`tryb=2d`, `ciecie`, brak, błędne wartości, stare linki), `BookmarkStore` z polami i bez nich.
- **Playwright:** przełączenie przyciskiem; 2D blokuje przechył (przeciągnięcie prawym przyciskiem nie
  zmienia nachylenia); suwak zmienia widoczny model; „Bez cięcia” go przywraca; link `?tryb=2d&ciecie=…`
  odtwarza widok; zakładka zachowuje tryb; pomiar i klik w znacznik w 2D; powrót do 3D przywraca rzut;
  szerokości 360, 768, 1024, 1440 px.
- Ręcznie przed oddaniem: telefon (dotyk, pinch, okienko nad arkuszem), `npm run deploy:preview`.

## Dokumentacja

W tym samym commicie co kod: `docs/architektura.md` (sekcja „Widok 2D”, poprawki w „Rzut kamery”,
„Lot kamerą”, link i zakładki), nowy ADR `0026-widok-2d.md` (wybór A, odrzucone B i C, parametry `tryb`
i `ciecie`) i wpis w `docs/adr/README.md`.

## Co zostaje decyzji wykonawcy

- **Spike przed implementacją:** znak normalnej płaszczyzny cięcia (która strona jest zachowana) oraz
  zachowanie `ScreenSpaceCameraController` w widoku z góry (czy lewy przycisk w 3D nie obraca kierunku;
  jeśli tak, dopilnować północy po każdym ruchu, np. przez `moveEnd`).
- Czy cięcie obejmuje poza modelem świata także tilesety obiektów (drzewa, beczki): domyślnie wszystkie
  tilesety świata, żeby obraz był spójny.
- Zakres i krok suwaka (z granic modelu, krok np. 1 m), położenie sekcji w okienku, nazwy plików poza podanymi klasami.
- Podział na commity (jedna logiczna zmiana = jeden commit `feat`).

## Ryzyka

- Wzgórza po włączeniu cięcia znikają ponad płaszczyzną — dlatego cięcie jest opcjonalne i jawne.
- Dryf kierunku północy podczas przesuwania w 2D (patrz spike).
- Wydajność na telefonie nie jest poprawiana; mierzona dopiero przy testach na urządzeniu.
- Cesium bez zamykania przekroju: wnętrza ciętych brył widać „od środka”; z góry akceptowalne, do oceny na Starej Kopalni.
