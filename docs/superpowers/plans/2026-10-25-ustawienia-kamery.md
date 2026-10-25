# Ustawienia kamery (rzut ortogonalny, FOV) — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Użytkownik przełącza rzut kamery (perspektywa / ortogonalny), ustawia FOV 30–100° i wybiera widoki „Z góry” i „Skos”; rzut jest w adresie i zakładkach.

**Architecture:** Czyste klasy w `src/lib/services/camera/` (ustawienie, kodek, konwerter, budowniczy presetów, koordynator, nasłuch klawisza P) oraz `CameraProjectionController` w `services/map/` jako jedyne miejsce dotykające frustum Cesium. UI zgłasza intencje fasadzie; stan rzutu wraca zdarzeniem `camera-projection-changed`. Podejście A ze spec: wbudowany ortho Cesium (szerokość frustum = odległość do punktu pod środkiem ekranu) plus korekta odległości przy przełączeniu.

**Tech Stack:** SvelteKit 5, CesiumJS 1.146, Vitest, Playwright, Tailwind + klasy motywu z `src/app.css`.

**Spec:** `docs/superpowers/specs/2026-10-25-ustawienia-kamery-design.md` (wyniki spike'a w sekcji „Ustalenia ze spike'a”).

## Global Constraints

- Pełne typowanie: zakaz `any`, operatora `!` i asercji `as` (zawężaj typy, type guardy).
- Importy w `.ts`/`.svelte.ts` z rozszerzeniem `.js` i aliasem `#lib/…`.
- Nazwy metod to czasowniki mówiące, co robią; bez komentarzy, chyba że złożona funkcja — wtedy JSDoc po polsku.
- UI po polsku, bez wykrzykników; tokeny i klasy `material-*`, `button-iron`, `chip`, `controls/ForgedRange` z `src/app.css`; elementy dotykowe min. 44×44 px (`--touch-target`), widoczny focus.
- Komponenty Svelte nie importują Cesium; obiektów Cesium nie trzymamy w `$state`.
- Zakres FOV: 30–100°, domyślnie 60°. Skrót: `KeyP`. Parametr adresu: `rzut` (`o` albo `p_<fov>`; brak = perspektywa 60°).
- Commity: `feat: …` po polsku z **niepustą treścią** (commitlint odrzuca pusty `body`), bez `Co-Authored-By` i wzmianki o Claude. Hook `pre-commit` uruchamia check, lint i testy, więc każdy commit musi być zielony.
- Dokumentacja w tym samym commicie co zmiana (`docs/architektura.md`, ADR 0021 z wpisem w `docs/adr/README.md`).
- Nie wdrażaj na produkcję; podgląd tylko `npm run deploy:preview`.
- Serwer dev do ręcznej weryfikacji z modelem świata musi działać na `localhost:5173`, `5174` albo `4173` (tylko te originy przepuszcza brama modelu); gdy zajęte przez inną sesję, użyj `4173`.

## Review Focus

- FOV poza zakresem lub nie-liczba w linku (`rzut=p_5`, `rzut=p_abc`): ignorowany, widok odtworzony w domyślnej perspektywie.
- Stary link bez `rzut` i stara zakładka bez pola `projection`: działają jak dziś (perspektywa 60°).
- Przełączenie rzutu przed wczytaniem świata (brak punktu pod środkiem ekranu): bez wyjątku, bez korekty odległości.
- Powrót ortho → perspektywa blisko terenu: kamera nie ląduje w terenie (dolna granica odległości).
- Klawisz P w polu tekstowym, suwaku, dialogu i z Ctrl/Alt/Meta: nie przełącza rzutu.
- Q/E w ortho zmieniają skalę (zoom), a nie wysokość kamery bez efektu.
- Cienie włączone + przełączanie rzutu: bez błędu renderowania (pkt 8 spike'a).

---

## Mapa plików

Nowe (`src/lib/services/camera/`): `camera-projection.ts` (typ, stałe, walidacja), `camera-projection-codec.ts`, `camera-projection-converter.ts`, `camera-preset-builder.ts`, `camera-projection-coordinator.ts`, `keyboard-projection-listener.ts`.
Nowe (inne): `src/lib/services/input/keyboard-focus-guard.ts`, `src/lib/services/map/camera-projection-controller.ts`, `src/lib/state/camera-settings-state.svelte.ts`, `src/lib/components/shell/CameraSettingsPopover.svelte`, `docs/adr/0021-rzut-kamery.md`, `e2e/camera.test.ts`; testy `*.test.ts` obok klas.
Zmieniane: `view-link-codec.ts`, `bookmark-store.ts`, `bookmarks-coordinator.ts`, `app-events.ts`, `app-state.svelte.ts`, `geoportal-facade.ts`, `composition-root.ts`, `map-service.ts`, `camera-framer.ts`, `camera-flight-controller.ts`, `map-view-observer.ts`, `keyboard-flight-listener.ts`, `MapControls.svelte`, `MapView.svelte`, `InstrumentBar.svelte`, `docs/architektura.md`, `docs/adr/README.md`.

---

### Task 1: Ustawienie rzutu i jego kodek

**Files:**
- Create: `src/lib/services/camera/camera-projection.ts`, `src/lib/services/camera/camera-projection-codec.ts`
- Test: `src/lib/services/camera/camera-projection-codec.test.ts`

**Interfaces:**
- Produces (`camera-projection.ts`): `type CameraProjectionSetting = { kind: 'perspective'; fovDegrees: number } | { kind: 'orthographic' }`; `const MINIMUM_FIELD_OF_VIEW_DEGREES = 30`, `MAXIMUM_FIELD_OF_VIEW_DEGREES = 100`, `DEFAULT_FIELD_OF_VIEW_DEGREES = 60`; `const DEFAULT_CAMERA_PROJECTION: CameraProjectionSetting` (perspektywa 60°); `clampFieldOfViewDegrees(degrees: number): number` (przycina do 30–100, zaokrągla do całości); `isDefaultCameraProjection(setting): boolean`; `isCameraProjectionSetting(value: unknown): value is CameraProjectionSetting` (waliduje strukturę i zakres FOV, do odczytu z `localStorage`).
- Produces (`camera-projection-codec.ts`): `class CameraProjectionCodec { serialize(setting): string | null; parse(text: string): CameraProjectionSetting | null }` — `null` z `serialize` dla ustawienia domyślnego; `o` dla ortho; `p_<fov>` dla perspektywy z niedomyślnym FOV.

- [ ] **Step 1: Write the failing test** — `CameraProjectionCodec`: `serialize(DEFAULT_CAMERA_PROJECTION)` → `null`; `serialize({kind:'orthographic'})` → `'o'`; `serialize({kind:'perspective',fovDegrees:75})` → `'p_75'`; `parse('o')` → ortho; `parse('p_75')` → perspektywa 75; `parse('p_5')`, `parse('p_101')`, `parse('p_abc')`, `parse('x')`, `parse('')` → `null`; roundtrip dla ortho i `p_45`. Dodatkowo `clampFieldOfViewDegrees(10)` → 30, `(150)` → 100, `(60.4)` → 60 oraz `isCameraProjectionSetting` odrzuca `{kind:'perspective'}` bez FOV, `{kind:'perspective',fovDegrees:5}`, `null`, `'o'`.
- [ ] **Step 2: Run** `npx vitest run src/lib/services/camera/camera-projection-codec.test.ts` — Expected: FAIL (brak modułów).
- [ ] **Step 3: Implement** moduły z podanymi sygnaturami; `parse` odrzuca FOV poza zakresem zamiast go przycinać (uszkodzony parametr ma być ignorowany, nie zgadywany).
- [ ] **Step 4: Run** ten sam test — Expected: PASS.
- [ ] **Step 5: Commit** `feat: ustawienie rzutu kamery i jego zapis w adresie` (treść: nowy typ ustawienia i kodek `rzut`, jeszcze bez użycia w UI).

---

### Task 2: Konwerter rzutu (wzory ze spike'a)

**Files:**
- Create: `src/lib/services/camera/camera-projection-converter.ts`
- Test: `src/lib/services/camera/camera-projection-converter.test.ts`

**Interfaces:**
- Consumes: `MINIMUM_FIELD_OF_VIEW_DEGREES` itd. z Task 1 (nie potrzebne bezpośrednio; tylko liczby).
- Produces: `class CameraProjectionConverter` z metodami (wszystkie czyste, kąty w radianach, `aspectRatio` = szerokość/wysokość płótna):
  - `calculateVerticalFieldOfView(fieldOfViewRadians: number, aspectRatio: number): number` — `fov` Cesium to większy z dwóch kątów: dla `aspectRatio >= 1` `2·atan(tan(fov/2)/aspectRatio)`, w przeciwnym razie `fov`.
  - `calculatePerspectiveVisibleWidth(distanceMetres: number, verticalFieldOfViewRadians: number, aspectRatio: number): number` = `2·d·tan(vfov/2)·aspectRatio`.
  - `calculatePerspectiveDistanceForWidth(widthMetres: number, verticalFieldOfViewRadians: number, aspectRatio: number, minimumDistanceMetres: number): number` — odwrotność, wynik nie mniejszy niż `minimumDistanceMetres`.
  - `calculateMetresPerPixel(frustumWidthMetres: number, canvasWidthPixels: number): number | null` — `null` dla niedodatnich/nieskończonych wejść.
  - `const MINIMUM_PERSPECTIVE_DISTANCE_METRES = 5` (eksport).

- [ ] **Step 1: Write the failing test** — z wartościami ze spike'a: `fov = 60°` (1.0472 rad), `aspectRatio = 4/3` → `calculateVerticalFieldOfView` ≈ 0.8173 (±1e-3, to `fovy` zmierzone w spike'u przy 4:3 dla domyślnego frustum Cesium); portret (`aspectRatio 0.5`) zwraca `fov`; `calculatePerspectiveVisibleWidth(1489, 0.8173, 4/3)` ≈ 1720 (±2); `calculatePerspectiveDistanceForWidth(visibleWidth(d), …)` ≈ `d` (roundtrip, kilka `d`); wynik nie schodzi poniżej `minimumDistanceMetres` (`calculatePerspectiveDistanceForWidth(2, …, 5)` → 5); `calculateMetresPerPixel(1489, 1024)` ≈ 1.454; `calculateMetresPerPixel(0, 1024)`, `(100, 0)`, `(NaN, 10)` → `null`.
- [ ] **Step 2: Run** `npx vitest run src/lib/services/camera/camera-projection-converter.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** klasę. JSDoc po polsku przy `calculatePerspectiveDistanceForWidth`: wyjaśnia, że po powrocie z ortho kamera zbliża się, więc dolna granica chroni przed wejściem w teren.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: wzory przeliczania rzutu perspektywa ↔ ortogonalny`.

---

### Task 3: Budowniczy widoków „Z góry” i „Skos”

**Files:**
- Create: `src/lib/services/camera/camera-preset-builder.ts`
- Test: `src/lib/services/camera/camera-preset-builder.test.ts`

**Interfaces:**
- Produces: `type CameraPreset = 'top' | 'oblique'`; `interface CameraPresetOrientation { headingRadians: number; pitchRadians: number }`; `class CameraPresetBuilder { build(preset: CameraPreset, currentHeadingRadians: number): CameraPresetOrientation }`. `top` → kierunek 0 (północ u góry), nachylenie −89,99° (przeciw osobliwości w `lookAt`); `oblique` → kierunek bez zmian, nachylenie −50°.

- [ ] **Step 1: Write the failing test** — `build('top', 1.2)` daje `headingRadians === 0` i `pitchRadians ≈ −89.99° w radianach` (`toBeCloseTo`); `build('oblique', 1.2)` daje `headingRadians === 1.2` i `pitchRadians ≈ −50°`.
- [ ] **Step 2: Run** `npx vitest run src/lib/services/camera/camera-preset-builder.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** klasę (stałe nazwane, bez komentarzy).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: budowniczy widoków Z góry i Skos`.

---

### Task 4: Rzut w linku (`?rzut=…`)

**Files:**
- Modify: `src/lib/services/bookmarks/view-link-codec.ts`
- Test: `src/lib/services/bookmarks/view-link-codec.test.ts` (rozszerzyć istniejący plik)
- Modify (konsekwencje typu): `src/lib/state/app-state.svelte.ts` (w `sharedViewQuery` przekaż `projection: null` tymczasowo), `src/lib/services/geoportal-facade.ts` (`captureViewState`, `restoreBookmark`: `projection: null`), `src/lib/services/bookmarks/bookmarks-coordinator.ts` (`presentBookmark`: `projection: null`)
- Modify: `docs/architektura.md` (akapit o linku i `CameraViewCodec`: dopisz parametr `rzut`)

**Interfaces:**
- Consumes: `CameraProjectionCodec`, `CameraProjectionSetting` (Task 1).
- Produces: `SharedViewState` dostaje pole `projection: CameraProjectionSetting | null` (`null` = domyślny). `buildQuery` dopisuje `rzut=<serialize>` tylko gdy kodek zwróci tekst; `parseQuery` zwraca `projection: null` dla braku i dla uszkodzonego `rzut`.

- [ ] **Step 1: Write the failing test** — w `view-link-codec.test.ts`: istniejące oczekiwania uzupełnij o `projection: null`; nowe: `buildQuery({…, projection: {kind:'orthographic'}})` zawiera `rzut=o`; `p_75` → `rzut=p_75`; `projection: null` i `DEFAULT_CAMERA_PROJECTION` nie dodają parametru; `parseQuery('?rzut=o')` → ortho; `parseQuery('?rzut=p_5')` → `projection: null`, reszta stanu (np. `widok`) odtworzona; stary link bez `rzut` → `projection: null`.
- [ ] **Step 2: Run** `npx vitest run src/lib/services/bookmarks/view-link-codec.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** zmianę kodeka i przekazanie `projection: null` w trzech miejscach, żeby `npm run check` przechodził (prawdziwe wartości w Task 6 i 7).
- [ ] **Step 4: Run** `npm run check` oraz `npx vitest run src/lib/services/bookmarks` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: parametr rzut w adresie widoku` (treść: stare linki działają bez zmian).

---

### Task 5: Rzut w zakładkach

**Files:**
- Modify: `src/lib/services/bookmarks/bookmark-store.ts`, `src/lib/services/bookmarks/bookmarks-coordinator.ts`
- Test: `src/lib/services/bookmarks/bookmark-store.test.ts`, `src/lib/services/bookmarks/bookmarks-coordinator.test.ts` (rozszerzyć)

**Interfaces:**
- Consumes: `CameraProjectionSetting`, `isCameraProjectionSetting` (Task 1).
- Produces: `SavedView.projection: CameraProjectionSetting | null`; `NewBookmark.projection: SavedView['projection']`; `BookmarkView.details` zawiera „Rzut ortogonalny” dla ortho; `BookmarkView.linkQuery` buduje się z `projection` zakładki. Klucz `gisofgothic:bookmarks:v1` bez zmian (zmiana addytywna).

- [ ] **Step 1: Write the failing test** — store: wpis bez pola `projection` odczytuje się z `projection: null`; wpis z `{kind:'orthographic'}` roundtrip przez `saveAll`/`loadAll`; wpis z `projection: {kind:'perspective',fovDegrees:5}` albo `'o'` odczytuje się jako `null` (reszta widoku zachowana). Koordynator: `addBookmark` z ortho daje `linkQuery` zawierający `rzut=o` i `details` zawierające „Rzut ortogonalny”; zakładka perspektywy 60° nie dodaje `rzut` ani wpisu w `details`.
- [ ] **Step 2: Run** `npx vitest run src/lib/services/bookmarks` — Expected: FAIL.
- [ ] **Step 3: Implement** odczyt `readProjection(value: unknown): CameraProjectionSetting | null` w `bookmark-store.ts`, przekazanie pola w `BookmarksCoordinator` (`addBookmark`, `presentBookmark`).
- [ ] **Step 4: Run** `npm run check && npx vitest run src/lib/services/bookmarks` — Expected: PASS (w tym kompilacja `geoportal-facade.ts`: uzupełnij tam `saveBookmark` o `projection: viewState.projection`; `captureViewState` nadal zwraca `null` do Task 7).
- [ ] **Step 5: Commit** `feat: zakładki zapamiętują rzut kamery` (treść: pole opcjonalne, stare zakładki działają).

---

### Task 6: Nasłuch klawisza P

**Files:**
- Create: `src/lib/services/input/keyboard-focus-guard.ts`, `src/lib/services/camera/keyboard-projection-listener.ts`
- Modify: `src/lib/services/flight/keyboard-flight-listener.ts` (użyj wspólnego strażnika)
- Test: `src/lib/services/camera/keyboard-projection-listener.test.ts`

**Interfaces:**
- Produces: `isKeyboardTargetUsingKeysItself(target: EventTarget | null): boolean` (ten sam selektor co dziś: `input, textarea, select, [contenteditable], [role="slider"], [role="dialog"], [role="listbox"], [role="menu"]`); `class KeyboardProjectionListener { constructor(eventSource: Window, requestToggle: () => void); start(): () => void }` — reaguje na `keydown` z `code === 'KeyP'`, pomija Ctrl/Alt/Meta, powtórzenia (`event.repeat`) i cele zwracające `true` ze strażnika; wywołuje `preventDefault` tylko gdy przełącza.

- [ ] **Step 1: Write the failing test** — z `EventTarget`-podobnym oknem (np. `new EventTarget()` rzutowanie niedozwolone → użyj `window` z `jsdom`/`happy-dom`, jeśli konfiguracja Vitest je daje; w przeciwnym razie wstrzyknij minimalny obiekt spełniający interfejs `Pick<Window, 'addEventListener' | 'removeEventListener'>` i zmień typ parametru konstruktora na ten `Pick`): `KeyP` wywołuje `requestToggle` raz; `KeyP` z `ctrlKey` nie; `KeyP` z `repeat: true` nie; zdarzenie z celem w `<input>` nie; `KeyQ` nie; po wywołaniu funkcji zwróconej przez `start()` nic nie reaguje.
- [ ] **Step 2: Run** `npx vitest run src/lib/services/camera/keyboard-projection-listener.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** klasę i strażnika; `KeyboardFlightListener` zastąp prywatną metodę wywołaniem strażnika (zachowanie bez zmian — istniejące testy lotu muszą przejść).
- [ ] **Step 4: Run** `npx vitest run src/lib/services` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: klawisz P przełącza rzut kamery` (treść: wspólny strażnik fokusu dla skrótów klawiszowych).

---

### Task 7: Koordynator rzutu, zdarzenie, stan i fasada

**Files:**
- Create: `src/lib/services/camera/camera-projection-coordinator.ts`
- Test: `src/lib/services/camera/camera-projection-coordinator.test.ts`
- Modify: `src/lib/events/app-events.ts`, `src/lib/state/app-state.svelte.ts`, `src/lib/services/geoportal-facade.ts`
- Modify: `src/lib/services/map/map-service.ts` (tylko metody-zaślepki z Interfaces poniżej, żeby fasada się kompilowała; prawdziwa logika w Task 8)

**Interfaces:**
- Consumes: Task 1 (typy, `clampFieldOfViewDegrees`), Task 3 (`CameraPreset`), Task 6 (`KeyboardProjectionListener`).
- Produces:
  - `interface CameraProjectionDisplay { showCameraProjection(setting: CameraProjectionSetting): void }`.
  - `class CameraProjectionCoordinator { constructor(eventBus: AppEventBus, getDisplay: () => CameraProjectionDisplay | null); readonly currentSetting: CameraProjectionSetting (getter); selectKind(kind: 'perspective' | 'orthographic'): void; toggleKind(): void; setFieldOfView(degrees: number): void; restore(setting: CameraProjectionSetting | null): void; showOnMap(): void }`. Koordynator pamięta ostatnie FOV perspektywy, więc ortho → perspektywa wraca z poprzednim FOV; `setFieldOfView` w ortho tylko zapamiętuje wartość (bez zmiany rzutu) i publikuje zdarzenie z ustawieniem ortho; każda zmiana wywołuje `display.showCameraProjection(...)` (gdy display istnieje) i publikuje zdarzenie.
  - Zdarzenie: `{ type: 'camera-projection-changed'; projection: CameraProjectionSetting; fieldOfViewDegrees: number }` (`fieldOfViewDegrees` = FOV do pokazania na suwaku także w ortho).
  - `AppState.cameraProjection: CameraProjectionSetting` i `AppState.fieldOfViewDegrees: number` (domyślne: `DEFAULT_CAMERA_PROJECTION`, 60); `sharedViewQuery` przekazuje `projection: this.cameraProjection`.
  - Fasada: `selectCameraProjection(kind)`, `toggleCameraProjection()`, `setCameraFieldOfView(degrees)`, `showCameraPreset(preset: CameraPreset)` (deleguje do `mapService?.showCameraPreset(preset)`), `listenToProjectionKeyboard(eventSource: Window): () => void`; `captureViewState` zwraca `projection: this.cameraProjectionCoordinator.currentSetting`; `applyViewState` woła `coordinator.restore(state.projection)` przed ruchem kamery; `showCurrentWorldOnMap` woła `coordinator.showOnMap()` po `showWorldTileset`, a przed `moveCameraToView` z linku.
  - `MapService` (zaślepki do wypełnienia w Task 8): `showCameraProjection(setting: CameraProjectionSetting): void`, `showCameraPreset(preset: CameraPreset): void`.

- [ ] **Step 1: Write the failing test** — z atrapą display i `EventBus`: `selectKind('orthographic')` publikuje zdarzenie z ortho i woła display z ortho; `toggleKind()` z perspektywy daje ortho, drugi raz perspektywę z poprzednim FOV (np. po `setFieldOfView(75)`); `setFieldOfView(150)` przycina do 100; `setFieldOfView(75)` w ortho nie zmienia rzutu, ale kolejne `selectKind('perspective')` daje 75; `restore(null)` ustawia domyślną perspektywę; `restore({kind:'perspective',fovDegrees:45})` stosuje FOV 45; `showOnMap()` woła display z bieżącym ustawieniem; bez display (`getDisplay` zwraca `null`) wszystko publikuje zdarzenia i nie rzuca.
- [ ] **Step 2: Run** `npx vitest run src/lib/services/camera/camera-projection-coordinator.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** koordynator wzorem `PerformanceCoordinator`; dopisz zdarzenie, pola `AppState` (subskrypcja) i metody fasady z powyższej listy; usuń tymczasowe `projection: null` z Task 4–5 w fasadzie.
- [ ] **Step 4: Run** `npm run check && npx vitest run` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: koordynator rzutu kamery w fasadzie i stanie aplikacji` (treść: zdarzenie `camera-projection-changed`, rzut w linku i zakładkach; mapa jeszcze nie reaguje).

---

### Task 8: Rzut na mapie (warstwa Cesium)

**Files:**
- Create: `src/lib/services/map/camera-projection-controller.ts`
- Modify: `src/lib/services/map/map-service.ts`, `src/lib/services/map/camera-framer.ts`, `src/lib/services/map/camera-flight-controller.ts`, `src/lib/services/map/map-view-observer.ts`
- Modify: `docs/architektura.md` (nowa sekcja „Rzut kamery”; poprawki w „Kadrowanie kamery” i „Lot kamerą”), create `docs/adr/0021-rzut-kamery.md`, `docs/adr/README.md` (wiersz 0021)

Ta warstwa jest zależna od Cesium i nie ma testów jednostkowych; weryfikacja w przeglądarce (Step 4) i w Task 10.

**Interfaces:**
- Consumes: `CameraProjectionConverter`, `MINIMUM_PERSPECTIVE_DISTANCE_METRES` (Task 2), `CameraProjectionSetting` (Task 1), `CameraPresetBuilder` (Task 3).
- Produces:
  - `interface CameraViewGeometry { readVerticalFieldOfViewRadians(): number; convertViewRangeToCameraDistance(viewRangeMetres: number): number; convertCameraDistanceToViewRange(cameraDistanceMetres: number): number }` (w `camera-projection-controller.ts`).
  - `class CameraProjectionController implements CameraViewGeometry { constructor(viewer: Viewer, measureDistanceToScreenCentre: () => number | null); applyProjection(setting: CameraProjectionSetting): void; isOrthographic(): boolean; readOrthographicMetresPerPixel(): number | null; synchronizeWidthWhenSurfaceKnown(): void }`.
  - `MapService.showCameraProjection(setting)` — przełącza rzut i FOV, po czym woła `viewObserver.requestRefresh()` i `listeners.onCameraSettled()` (żeby skala, adres i `widok` się odświeżyły); `MapService.showCameraPreset(preset)` — cel to punkt pod środkiem ekranu (brak = nic nie rób), kierunek i nachylenie z `CameraPresetBuilder`, zakres = `convertCameraDistanceToViewRange(odległość do celu)`, lot przez `cameraFramer.flyToPoint(…, flightSeconds: 1)`.
  - `CameraFramer` przyjmuje `CameraViewGeometry` i używa go zamiast czytania `frustum.fovy`; kamera ustawia się w odległości `convertViewRangeToCameraDistance(range)` od celu, a metry na piksel dla przesunięcia w wolny obszar liczy się z `range` jak dotąd (w ortho dają ten sam wynik, bo szerokość = widoczna szerokość perspektywy).
  - `MapViewObserver`: nowy parametr konstruktora `readExactMetresPerPixel: () => number | null` (z kontrolera); gdy zwraca liczbę, jest użyty zamiast pomiaru przez `pickPosition`; nowa metoda `requestRefresh(): void` (ustawia flagę zmiany kamery).

- [ ] **Step 1: Implement `CameraProjectionController`.** Algorytm `applyProjection` (z wynikami spike'a): dla ortho — odczytaj odległość `d` do punktu pod środkiem (`measureDistanceToScreenCentre`), `camera.switchToOrthographicFrustum()`, a gdy `d` znane: `camera.move(camera.directionWC, -(W − d))`, gdzie `W = calculatePerspectiveVisibleWidth(d, vfov, aspect)`; dla perspektywy — gdy kamera była w ortho i `d` znane: `newD = calculatePerspectiveDistanceForWidth(frustum.width, vfov, aspect, MINIMUM_PERSPECTIVE_DISTANCE_METRES)`, `camera.switchToPerspectiveFrustum()`, `camera.move(camera.directionWC, d − newD)`; zawsze po przełączeniu na perspektywę ustaw `frustum.fov` (radiany) z ustawienia (`switchToPerspectiveFrustum` resetuje do 60°); sama zmiana FOV w perspektywie bez przełączania ustawia tylko `fov`. Kontroler pamięta `fieldOfViewDegrees` także w ortho (potrzebne konwerterom jako „równoważne FOV”). `synchronizeWidthWhenSurfaceKnown`: w ortho, na kolejnych `postRender` (maks. 120 klatek), aż `measureDistanceToScreenCentre` zwróci liczbę, ustaw `frustum.width` na tę odległość (po przywróceniu widoku z linku przed wczytaniem kafli szerokość Cesium opiera się na wysokości nad elipsoidą i bywa błędna); po zrobieniu odpina nasłuch. `readOrthographicMetresPerPixel` zwraca `calculateMetresPerPixel(frustum.width, canvas.clientWidth)` w ortho, w przeciwnym razie `null`. Brak odległości nie jest błędem: przełącz frustum bez korekty.
- [ ] **Step 2: Wire.** `MapService`: utwórz kontroler (po viewerze), przekaż go jako `CameraViewGeometry` do `CameraFramer` i `readExactMetresPerPixel` do `MapViewObserver`; zastąp zaślepki z Task 7; `moveCameraToView` po `setView` w ortho woła `synchronizeWidthWhenSurfaceKnown()`; `CameraFlightController` dostaje `isOrthographic: () => boolean` i w `applyStep` w ortho zamienia `riseMetres` na `camera.move(camera.directionWC, -step.riseMetres)` (E = oddal, Q = przybliż; ruch przód/tył/bok bez zmian; obrót `look` bez odświeżania szerokości — świadomie, zob. Ryzyka w spec).
- [ ] **Step 3: Docs.** `docs/architektura.md`: sekcja „Rzut kamery” (klasy, przepływ przełączenia, sprzężenie szerokości z odległością, korekta, dolna granica, `rzut` w linku, skrót P — UI dopisuje Task 9); poprawka akapitów kadrowania i lotu. `docs/adr/0021-rzut-kamery.md` (kontekst, decyzja podejście A, odrzucone B i C, konsekwencje: sprzężenie szerokości z odległością, rozjazd po `look`, tylko komputer zmierzony) + wiersz w README ADR. Wyniki spike'a jako uzasadnienie.
- [ ] **Step 4: Verify in the browser.** `npm run check && npm run lint && npx vitest run && npm run build`, potem `preview_start` (port z listy dozwolonych) i sprawdź, że aplikacja startuje z modelem świata bez błędów w konsoli, a zoom, przeciąganie i przelot „Pokaż cały świat” w perspektywie działają jak przed zmianą (regresja kadrowania). Przełączanie rzutu da się wywołać dopiero z UI (Task 9), pełna weryfikacja w Task 9 Step 4 i Task 10.
- [ ] **Step 5: Commit** `feat: mapa obsługuje rzut ortogonalny i zmianę FOV` (treść: kontroler rzutu, kadrowanie i lot w ortho, dokumentacja i ADR 0021).

---

### Task 9: Interfejs: przycisk, okienko, status

**Files:**
- Create: `src/lib/state/camera-settings-state.svelte.ts`, `src/lib/components/shell/CameraSettingsPopover.svelte`
- Modify: `src/lib/composition-root.ts`, `src/lib/components/shell/MapControls.svelte`, `src/lib/components/MapView.svelte`, `src/lib/components/shell/InstrumentBar.svelte`, `docs/architektura.md` (akapit UI + skrót P w „Lot kamerą”)

**Interfaces:**
- Consumes: metody fasady z Task 7 (`selectCameraProjection`, `setCameraFieldOfView`, `showCameraPreset`, `listenToProjectionKeyboard`), `appState.cameraProjection`, `appState.fieldOfViewDegrees`.
- Produces: `class CameraSettingsState { isOpen: boolean; toggle(): void; close(): void }` (stan UI jak `FlightControlsState`, eksport `cameraSettings` w `composition-root.ts`).

- [ ] **Step 1: Implement** `CameraSettingsState` i eksport. W `MapControls.svelte` dodaj na końcu stosu przycisk 44 px (ikona Lucide `box` lub `cuboid`; `aria-label="Rzut kamery"`, `aria-pressed={appState.cameraProjection.kind === 'orthographic'}`, `aria-expanded`, `title` z podpowiedzią „Rzut kamery (klawisz P)”), przełączający `cameraSettings.toggle()`.
- [ ] **Step 2: Implement `CameraSettingsPopover.svelte`** (zawartość: nagłówek „Widok kamery”; grupa `chip` z `aria-pressed` „Perspektywa” / „Ortogonalny” → `geoportal.selectCameraProjection`; `ForgedRange` min 30, max 100, step 1, label „Kąt widzenia”, `valueText` „{n}°”, `onValueChange` → `geoportal.setCameraFieldOfView`, w ortho wyłączony (`disabled`-ekwiwalent stylowy i `aria-disabled`) z podpowiedzią „Kąt widzenia dotyczy tylko rzutu środkowego.”; dwa `button-iron`: „Z góry” i „Skos” → `geoportal.showCameraPreset('top' | 'oblique')`). Pozycja: obok kolumny kontrolek (na komputerze lewa strona kolumny, szerokość ok. 14 rem), na telefonie szerokość 100% − gutter, nad dolnym arkuszem. Esc i kliknięcie poza zamykają (`cameraSettings.close()`), fokus wraca na przycisk. Dołącz w `MapControls.svelte`. Teksty bez znaków `!`.
- [ ] **Step 3: Wire P and status.** `MapView.svelte`: obok `listenToFlightKeyboard` uruchom `geoportal.listenToProjectionKeyboard(window)` i sprzątaj oba. `InstrumentBar.svelte`: obok skali dopisz etykietę „rzut ortogonalny”, gdy `appState.cameraProjection.kind === 'orthographic'` (ukryta na wąskich ekranach razem ze skalą; sprawdź układ telefonu).
- [ ] **Step 4: Verify** `npm run check && npm run lint && npx vitest run && npm run build`; ręcznie w przeglądarce (serwer na dozwolonym porcie): przycisk otwiera okienko, chip przełącza rzut, suwak zmienia FOV w perspektywie, P przełącza, Esc zamyka; zrzut ekranu dla 1440 px i 360 px (`resize_window`).
- [ ] **Step 5: Commit** `feat: okienko ustawień kamery i skrót P` (treść: przycisk w kontrolkach mapy, etykieta rzutu na pasku stanu, dokumentacja UI).

---

### Task 10: Scenariusze Playwright i przegląd responsywny

**Files:**
- Create: `e2e/camera.test.ts`

**Interfaces:**
- Consumes: UI z Task 9 (przycisk „Rzut kamery”, chip „Ortogonalny”/„Perspektywa”, przyciski „Z góry”/„Skos”, etykieta „rzut ortogonalny”, `getByTestId('status-bar')`), `?rzut=o` z Task 4.

- [ ] **Step 1: Write the tests** (wzorem `e2e/app.test.ts`, z kontrolą błędów konsoli): (a) otwórz mapę, przycisk „Rzut kamery” → chip „Ortogonalny” → `aria-pressed=true`, etykieta „rzut ortogonalny” widoczna, adres zawiera `rzut=o` po zatrzymaniu kamery; (b) klawisz P przełącza z powrotem (adres bez `rzut`); (c) wejście bezpośrednio na `/g2nk/khorinis?rzut=o` otwiera ortogonalny (przycisk `aria-pressed`); (d) „Z góry” w ortho: podziałka w pasku stanu widoczna i zmienia się po zoomie (przycisk „Przybliż”); (e) cienie włączone w panelu „Czas” + przełączenie rzutu dwa razy: brak błędów konsoli i `pageerror`; (f) zakładka zapisana w ortho po przywróceniu daje `rzut=o` w adresie; (g) pomiar: w panelu „Pomiary” dwa kliknięcia w mapę w ortho dodają punkty (długość ≠ 0); (h) Review Focus: `?rzut=p_5` ładuje się bez błędów jako perspektywa (przycisk nie jest `aria-pressed`).
- [ ] **Step 2: Run** `npm run test:e2e -- e2e/camera.test.ts` — Expected: PASS (pierwsze uruchomienie buduje aplikację). Napraw znalezione defekty w kodzie z Task 8–9 małymi commitami `fix:`.
- [ ] **Step 3: Responsive review** ręcznie przez `resize_window` 360, 768, 1024, 1440 px w obu rzutach: przesuwanie, zoom kółkiem i przyciskami, klik w obiekt (karta obiektu), pomiar, przełączanie warstw, link z `widok`+`rzut`, zakładka; sprawdź, że kolumna kontrolek z nowym przyciskiem mieści się na 360×640 przy zwiniętym arkuszu i że okienko nie wchodzi pod arkusz; focus widoczny, cele ≥ 44 px, `prefers-reduced-motion` (emulacja) → przełączenie i przeloty natychmiastowe. Wynik zapisz w opisie ostatniego commita.
- [ ] **Step 4: Full gate** `npm run check && npm run lint && npm run test && npm run build && npm run test:e2e` — Expected: wszystko zielone.
- [ ] **Step 5: Commit** `test: scenariusze e2e rzutu kamery` (treść: przełączanie, link, zakładka, cienie, pomiar; lista sprawdzonych szerokości).

---

### Task 11: Podgląd na Cloudflare i domknięcie

**Files:** `docs/superpowers/specs/2026-10-25-ustawienia-kamery-design.md` (korekty), brak kodu.

- [ ] **Step 1:** W spec popraw dwa miejsca zgodnie z implementacją: `OrthographicScaleCalculator` → metoda `calculateMetresPerPixel` w `CameraProjectionConverter`; ryzyko „odświeżenie szerokości po obrocie” → „po obrocie (`look`) szerokość nie jest odświeżana; następny zoom może skoczyć do ok. 12%; skala i kadrowanie biorą szerokość z frustum”. Dodaj do spec wynik przeglądu z Task 10.
- [ ] **Step 2:** `npm run deploy:preview` i zapisz adres podglądu; **nie** uruchamiaj `release` ani `deploy`.
- [ ] **Step 3: Commit** `docs: korekty projektu kamery po implementacji` (treść: odchylenia od spec i wynik przeglądu).

---

## Samoocena planu

- **Pokrycie spec:** przełącznik i FOV (T1, T2, T7, T8, T9), presety (T3, T8, T9), link i zakładki (T4, T5, T7), skrót P (T6, T9), podziałka (T2, T8), kadrowanie i lot (T8), cienie i pick (T10 e), dokumentacja i ADR (T8, T9, T11), testy Vitest/Playwright (T1–T7, T10). Poza zakresem: oczy bohatera, płynne przejście, `localStorage`.
- **Spójność nazw:** `CameraProjectionSetting`, `CameraProjectionCodec`, `CameraProjectionConverter`, `CameraPresetBuilder`, `CameraProjectionCoordinator`, `CameraProjectionController`, `CameraViewGeometry`, `KeyboardProjectionListener`, `CameraSettingsState` oraz metody fasady `selectCameraProjection`, `toggleCameraProjection`, `setCameraFieldOfView`, `showCameraPreset`, `listenToProjectionKeyboard` są używane jednakowo w zadaniach.
- **Odchylenie od spec:** `OrthographicScaleCalculator` złożone w konwerter (YAGNI, jedna formuła); poprawiane w T11.
- **Znane ograniczenia:** brak testów jednostkowych warstwy Cesium (weryfikacja przeglądarką i e2e); wydajność mobilna niezmierzona.
