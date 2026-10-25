# Ustawienia kamery (rzut środkowy i ortogonalny, FOV) — projekt V1

Data: 2026-10-25. Status: zatwierdzony zakres V1 (rozmowa), spike wykonany na Cesium 1.146.

## Cel i powód

Użytkownik przełącza rzut kamery i dostraja widok. Tryb ortogonalny z góry ma być planem mapy, na którym
odległości i porównania są czytelne (jeden metr = tyle samo pikseli w całym kadrze). Najczęstsze
przełączenie (perspektywa ↔ ortogonalny) ma kosztować 1–2 kliknięcia.

### Cele V1

- Przełącznik Perspektywa / Ortogonalny.
- Suwak kąta widzenia (FOV) 30–100°, domyślnie 60° (jak dziś).
- Gotowe widoki „Z góry” (plan, północ u góry) i „Skos” (nachylenie −50°, jak przegląd świata).
- Rzut (i FOV) w adresie `?rzut=…` i w zakładkach, ze zgodnością starych linków.
- Poprawne działanie w obu rzutach: podziałka, kadrowanie z marginesem na panele (ADR 0008), przeloty,
  lot z klawiatury i joysticków, pick i odczyt współrzędnych, pomiary, cienie, zoom, link i zakładka.
- Skrót klawiszowy **P** przełącza rzut.

### Poza zakresem (V2 i dalej)

- „Oczy bohatera” (wymusza perspektywę, teren + ok. 1,7 m, FOV ok. 75°).
- Płynne przejście perspektywa ↔ ortogonalny (dolly zoom). W V1 przełączenie jest natychmiastowe.
- Zapamiętywanie preferowanego rzutu/FOV między sesjami (`localStorage`).
- Zawyżanie `maximumScreenSpaceError` w ortho (spike: liczba kafli i trójkątów taka sama jak w perspektywie).

### Antycele

- Ortho, w którym zoom albo kadrowanie „nie słuchają” (skok widoku przy przełączeniu, przeloty ustawiające
  inną skalę niż w perspektywie).
- Nowa zależność, nowa pozycja na szynie narzędzi, import Cesium w komponencie.

## Ustalenia ze spike'a (Cesium 1.146, prawdziwy świat Khorinis)

1. W ortho Cesium sam ustawia `frustum.width` = odległość kamery od punktu pod środkiem ekranu
   (zoom, `move`, przeloty, `setView`). Zostajemy przy tym zachowaniu; własnego zarządzania szerokością
   nie robimy (wymagałoby przepisania wejścia myszy i dotyku).
2. `switchToOrthographicFrustum()` daje skok widoku. Rozmiar celu zachowuje korekta odległości: nowa
   odległość = widoczna szerokość perspektywy na celu = `2·d·tan(hfov/2)`, gdzie
   `hfov = 2·atan(tan(fovy/2)·proporcje)`. Powrót do perspektywy używa wzoru odwrotnego i musi mieć dolną
   granicę odległości, żeby kamera nie weszła w teren.
3. `PerspectiveFrustum.fov` w Cesium to większy z dwóch kątów (na ekranie poziomym — poziomy). Suwak FOV
   w UI ustawia `fov` Cesium. `CameraFramer` czyta `fovy` (zgodnie z geometrią) i to zostaje.
   `switchToPerspectiveFrustum()` tworzy nowy frustum z 60°, więc FOV trzeba ustawić po przełączeniu.
4. `look` (obrót w miejscu: strzałki, joystick) i `moveUp/moveDown` nie odświeżają szerokości (rozjazd
   szerokości i odległości rzędu 12%). Dlatego skala i kadrowanie biorą szerokość z frustum, nie z odległości.
5. W ortho Q/E (wysokość) nic nie zmieniają na obrazie. Mają działać jak zoom. Ruch w przód, w tył i w bok
   to przesuwanie mapy i zostaje bez zmian.
6. Skala w ortho: `metry na piksel = frustum.width / szerokość płótna` (zgodne z pomiarem przez
   `pickPosition`). W perspektywie zostaje pomiar przez `pickPosition`.
7. Bez zmian działają: pick i `pickPosition` (odczyt E/N/H kursora), `setView`, `flyTo`,
   `flyToBoundingSphere`, wheel i przeciąganie, 3D Tiles, cienie (po włączeniu z UI aplikacji,
   także przy wielokrotnym przełączaniu).
8. Jednorazowy błąd renderowania (`fov, aspectRatio, near, or far parameters are not set`) pojawił się
   przy programowym włączaniu cieni w spike'u, także w czystej perspektywie. Z UI aplikacji nie wystąpił.
   Scenariusz e2e „cienie włączone + przełączanie rzutu” jest wymagany, żeby to potwierdzić.

## Podejścia i wybór

| Podejście | Za | Przeciw |
|---|---|---|
| **A. Wbudowany ortho Cesium + korekta odległości (wybrane)** | Mało kodu, wheel/drag/flyTo działają natywnie | Szerokość sprzężona z odległością; trzeba obsłużyć rozjazd po `look` i Q/E |
| B. Własne zarządzanie szerokością | Pełna kontrola skali | Przepisanie wheel/pinch/przycisków; prywatne API Cesium lub asercje |
| C. Pseudo-ortho przez małe FOV i daleką kamerę | Zero zmian frustum | Zniekształcenia, kłopoty z near/far i z głębią, nie jest to prawdziwy plan |

Wybór: **A** — spike potwierdził, że nic z podstawowych funkcji nie psuje się natywnie.

## Projekt

### Model

```
CameraProjectionSetting =
  | { kind: 'perspective'; fovDegrees: number }   // 30–100, domyślnie 60
  | { kind: 'orthographic' }
```

Typ i walidacja (`isCameraProjectionSetting`, przycięcie FOV) żyją w `services/camera/`.
Brak zasady wymiany stanu między rzutami: FOV zapamiętany w ustawieniu perspektywy wraca po
przełączeniu ortho → perspektywa w tej samej sesji.

### Klasy (logika, bez Svelte)

- `CameraProjectionConverter` — czysta, testowana w Vitest. Przelicza: odległość perspektywy ↔ widoczna
  szerokość (wzór z pkt 2), przycina FOV do 30–100°, wyznacza dolną granicę odległości przy powrocie do
  perspektywy. Przyjmuje `fovy`/`fov` i proporcje płótna jako liczby.
- `OrthographicScaleCalculator` — czysta; `metresPerPixel(frustumWidth, canvasWidth)`.
- `CameraPresetBuilder` (budowniczy) — składa cel presetu (`top` | `oblique`): nachylenie, kierunek
  (top: północ u góry, nachylenie −89,99° przeciw osobliwości), zakres dobrany do bieżącej skali.
  Czysta część testowana; wywołanie przelotu przez `CameraFramer`.
- `CameraProjectionController` (`services/map/`) — jedyne miejsce, które dotyka frustum Cesium. Metody:
  `applyProjection(setting)`, `applyFieldOfView(degrees)`, `readProjection()`,
  `readViewScale()` (źródło metrów na piksel i współczynnika zakresu dla `CameraFramer`,
  `CameraFlightController`, `MapViewObserver`). Przy przełączeniu: przelicza odległość po pkt 2,
  ustawia FOV (pkt 3) i zgłasza zmianę.
- `CameraFramer` — zamiast liczyć metry na piksel z `fovy` i zakresu, pyta `CameraProjectionController`.
  W ortho zakres „perspektywiczny” z wywołań (`showWholeWorld`, `PlaceMarkersLayer`) jest zamieniany
  na odległość kamery tym samym wzorem, więc rozmiar celu jest taki jak w perspektywie.
- `CameraFlightController` — w ortho krok „wysokość” (Q/E, przyciski) zamienia na zoom (zmiana
  odległości zmienia szerokość), prędkość z bieżącej szerokości; po `look` odświeża szerokość.
- `MapViewObserver` — w ortho skala = `OrthographicScaleCalculator`, bez `pickPosition`; nie ponawia
  pomiaru co 30 klatek (skala jest znana od razu).

### Fasada, zdarzenia, stan

- Fasada (`GeoportalFacade`): `setCameraProjection(kind)`, `setFieldOfView(degrees)`,
  `showCameraPreset(preset)`. Zakres i wartość FOV są walidowane w logice, nie w komponencie.
- Zdarzenie: `{ type: 'camera-projection-changed'; projection: CameraProjectionSetting }`
  (po nim, jak dziś, `map-scale-changed`).
- `AppState.cameraProjection` (reaktywny) subskrybuje zdarzenie. Obiektów Cesium w `$state` nie ma.

### Adres i zakładki (zgodność wsteczna)

- Nowy parametr `rzut`: `o` (ortogonalny) albo `p_<fov>` (perspektywa z niedomyślnym FOV, np. `p_75`).
  Brak parametru = perspektywa 60°, więc wszystkie stare linki działają bez zmian. Stare wersje aplikacji
  zignorują nieznany parametr.
- `widok` bez zmian. Odtwarzanie: najpierw `applyProjection`, potem `setView` na zapisaną pozycję
  (spike: `setView` ustawia szerokość z odległości, więc `widok` w ortho wystarcza).
- `SharedViewState` dostaje `projection: CameraProjectionSetting | null` (`null` = domyślna).
  `ViewLinkCodec` serializuje i parsuje; uszkodzony `rzut` jest ignorowany, reszta widoku odtwarzana.
- `SavedView` dostaje opcjonalne pole `projection`. Odczyt z `localStorage` akceptuje jego brak
  (klucz pozostaje `gisofgothic:bookmarks:v1`, zmiana jest addytywna).
- Widok z linku czeka na wczytanie modelu świata (już tak działa); rzut stosuje się razem z kamerą.

### UI

- Jeden nowy przycisk „Rzut kamery” na dole prawej kolumny `MapControls` (po joystickach), klasa
  `controlButton`, `aria-pressed` gdy ortho. Szyna narzędzi (6 pozycji) bez zmian.
- Przycisk otwiera okienko „Widok kamery” (komponent `CameraSettingsPopover`, pozycjonowane przy kolumnie;
  na telefonie nad arkuszem, szerokość 100% − gutter):
  - dwa `chip` w grupie: Perspektywa / Ortogonalny (`aria-pressed`),
  - `controls/ForgedRange` FOV 30–100° z wartością; w ortho nieaktywny z podpowiedzią „Kąt widzenia dotyczy
    tylko rzutu środkowego.”,
  - dwa przyciski `button-iron`: „Z góry”, „Skos”.
- Skrót **P** przełącza rzut (`KeyboardProjectionListener`, tak samo jak lot pomija pola tekstowe,
  suwaki, dialogi i skróty z Ctrl/Alt/Meta). Okienko zamyka Esc i kliknięcie poza nim; fokus wraca na przycisk.
- Elementy dotykowe min. 44×44 px (`--touch-target`), widoczny focus, tokeny i klasy `material-*`
  z `src/app.css`. Teksty po polsku, bez wykrzykników.
- Przycisk w ortho pokazuje stan na pasku stanu: obok podziałki etykieta „rzut ortogonalny”.
- `prefers-reduced-motion`: przełączenie rzutu jest natychmiastowe zawsze; przeloty presetów idą
  przez `CameraFramer` (już natychmiastowe przy reduced motion).

### Skala i podziałka

`ScaleBarCalculator` nie zmienia się. Zmienia się źródło `metresPerPixel` (pkt 6). W ortho podziałka
jest dokładna dla każdego punktu kadru poziomo; przy pochyleniu pionowo nie (foreshortening) — to opisujemy
w dokumentacji jako cechę rzutu, nie błąd.

## Testy

- **Vitest (czyste klasy):** `CameraProjectionConverter` (wzór korekty, odwrotność, przycięcie FOV, dolna
  granica), `OrthographicScaleCalculator`, `CameraPresetBuilder`, kodek `rzut` w `ViewLinkCodec`
  (`o`, `p_75`, brak, błędny, FOV poza zakresem), `BookmarkStore` z i bez pola `projection`,
  `KeyboardProjectionListener` (mapowanie P, pomijanie pól tekstowych).
- **Playwright:** przełączenie rzutu przyciskiem i klawiszem P; widok z góry w ortho (podziałka
  widoczna i zmienia się przy zoomie); link `?rzut=o` odtwarza ortho; zakładka zachowuje rzut;
  klik w obiekt i pomiar w ortho; warstwy i cienie włączone + przełączenie rzutu bez błędu renderowania
  (pkt 8 spike'a); 360, 768, 1024, 1440 px.
- Ręcznie przed oddaniem: telefon (dotyk, pinch, okienko nad arkuszem), `npm run deploy:preview`.

## Dokumentacja

Zmiany w tym samym commicie co kod: `docs/architektura.md` (nowa sekcja „Rzut kamery” oraz poprawki
w „Kadrowanie kamery”, „Lot kamerą”, link i zakładki), nowy ADR `0021-rzut-kamery.md` (wybór podejścia A,
sprzężenie szerokości z odległością, korekta przy przełączeniu, format `rzut`) i wpis w `docs/adr/README.md`.
Tabela skrótów klawiszowych: P.

## Co zostaje decyzji wykonawcy

- Dokładne położenie okienka względem kolumny kontrolek i animacja otwarcia (zgodnie z motywem).
- Wartość dolnej granicy odległości przy powrocie do perspektywy (dobrana testem na świecie;
  zaczynamy od kilku metrów nad zmierzonym punktem pod środkiem).
- Nazwy plików poza podanymi klasami, podział na commity (jedna logiczna zmiana = jeden commit `feat`).

## Ryzyka

- Rozjazd szerokości i odległości po `look` (pkt 4) — mitigacja: skala i kadrowanie z frustum, odświeżenie
  szerokości po obrocie.
- Wejście kamery w teren przy powrocie do perspektywy — dolna granica odległości.
- Wydajność na telefonie nie zmierzona (tylko komputer, tylko liczba kafli i trójkątów).
- Błąd renderowania z cieniami (pkt 8) — scenariusz e2e; jeśli się powtórzy w aplikacji, osobne
  badanie przed wydaniem.
