# Animacja rutyn postaci po drogach — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Przycisk „Odtwórz” w panelu Czas przesuwa godzinę, a postacie z rutyn dnia idą po sieci dróg z gry między kolejnymi miejscami.

**Architecture:** Czyste klasy w `services/time/` budują oś czasu postaci (`CharacterTimeline`), planują odcinki marszu przez istniejący `RoutePlanner` (`RoutineMovementPlanner`) i liczą pozycję w danej minucie (`RoutineAnimator`). `RoutinePlayback` zwiększa godzinę w tempie 20 Hz. `TimeCoordinator` składa to w warstwę „Postacie o tej porze”, a renderer przesuwa istniejące punkty zamiast przebudowywać warstwę.

**Tech Stack:** SvelteKit 5, TypeScript, CesiumJS, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-rutyny-npc-animacja-design.md`

## Global Constraints

- Zakaz `any`, operatora `!` i asercji `as`; zawężaj typy. Importy z rozszerzeniem `.js`, alias `#lib/…`.
- Nazwy metod to czasowniki mówiące, co kod robi; bez komentarzy, chyba że algorytm jest złożony (JSDoc po polsku).
- UI nie importuje Cesium; komponenty wołają tylko fasadę (`geoportal`) i czytają `appState`. Obiektów Cesium nie trzymamy w `$state`.
- Teksty po polsku, sentence case, zgodne z `docs/glosariusz.md`; klasy motywu (`chip`, `button-iron`, `check-forged`), bez surowych kolorów.
- Rutyny: tylko domyślne (`isDefaultRoutine`), jak dziś. 4 s rzeczywiste = 1 minuta gry (`TravelTimeCalculator`).
- Tempa odtwarzania (minuty gry na sekundę rzeczywistą): „Jak w grze” 0,25, „Szybko” 4, „Bardzo szybko” 60. Aktualizacja warstwy maks. 20 razy na sekundę.
- Commity: `<type>: <nagłówek po polsku>` plus niepusta treść (commitlint), bez `Co-Authored-By`. Nie wdrażaj na produkcję.
- Weryfikacja końcowa: `npm run check`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`.

## Review Focus

- Postać z jednym miejscem rutyny stoi przez całą dobę, bez błędu i bez ruchu.
- Przejście przez północ (np. pobyt 22:00–07:00) oraz przedział „początek = koniec” (cała doba).
- Dane G3: luki, nakładanie i puste `times`; brak wyjątku, postać zostaje w ostatnim miejscu.
- Zmiana świata albo zatrzymanie w trakcie wyznaczania dróg: wynik starszego żądania jest pomijany.
- Kliknięcie ruchomego punktu identyfikuje właściwą postać (indeks punktu = indeks klatki), także przy filtrze rozdziału.

---

### Task 1: Odwrotne rzutowanie lokalnych metrów na lon/lat/h

**Files:**

- Modify: `src/lib/services/analysis/local-projector.ts`, `src/lib/services/analysis/local-projector.test.ts`

**Interfaces:**

- Produces: `interface GeodeticPoint { lon: number; lat: number; h: number }`; `LocalProjector.unprojectToGeodetic(point: LocalPoint): GeodeticPoint` — odwrotność `projectToLocalPoint` (współrzędne w stopniach i metrach nad elipsoidą).

- [ ] **Step 1: Test** `odwrotne rzutowanie wraca do lon/lat/h` — kotwica `{lon: 0, lat: 0, h: 0}` oraz kotwica spoza równika (`{lon: 19.9, lat: 50.06, h: 200}`); dla kilku punktów `(lon, lat, h)` w promieniu 5 km `unprojectToGeodetic(projectToLocalPoint(...))` równa się wejściu z dokładnością 1e-7° i 0,01 m. Test `punkt kotwicy to zero metrów i odwrotnie`.
- [ ] **Step 2:** `npx vitest run src/lib/services/analysis/local-projector.test.ts` → FAIL (brak metody).
- [ ] **Step 3:** Zaimplementuj `unprojectToGeodetic`: lokalne ENU → ECEF obrotem macierzą z `sinLon/cosLon/sinLat/cosLat` kotwicy, dodaj punkt kotwicy, ECEF → geodezyjne metodą iteracyjną (stała liczba iteracji, np. 5, zbieżna na tych odległościach).
- [ ] **Step 4:** PASS. **Step 5:** Commit — `feat: odwrotne rzutowanie lokalnych metrów na współrzędne geodezyjne`.

### Task 2: Oś czasu postaci (`CharacterTimeline`)

**Files:**

- Create: `src/lib/services/time/character-timeline.ts`, `src/lib/services/time/character-timeline.test.ts`

**Interfaces:**

- Consumes: `RoutinePlace` (`PointFeature<RoutinePlaceProperties>` z `#lib/data/layer-features.js` i `#lib/data/routine-places.js`), `parseTimeInterval`, `MINUTES_PER_DAY` z `daily-schedule.ts`.
- Produces: `interface RoutineStay { startMinute: number; endMinute: number; place: RoutinePlace }` (`endMinute` wyłączny, `start === end` = cała doba); `class CharacterTimeline` z `static build(places: readonly RoutinePlace[]): CharacterTimeline | null`, `readonly stays: readonly RoutineStay[]`, `findStayIndexAt(minute: number): number`, `readStayStartMinute(index: number): number`.

- [ ] **Step 1: Testy** (miejsca budowane helperem z `properties.timeRanges`): `jedno miejsce całą dobę daje jeden pobyt`, `dwa miejsca dzielą dobę i pobyt przez północ ma wrap` (np. 07:20–01:20 i 01:20–07:20), `przedział początek równy końcowi to cała doba`, `luka zostawia postać w ostatnim miejscu do następnego początku`, `nakładanie wygrywa pobyt o późniejszym początku`, `brak parsowalnych przedziałów zwraca null`, `findStayIndexAt zwraca właściwy pobyt dla minut 0, 1439 i granic`.
- [ ] **Step 2:** FAIL. **Step 3:** Zaimplementuj `build` tablicą 1440 minut: dla minuty `m` wybierz miejsce, którego przedział obejmuje `m` i którego początek jest najbliżej przed `m` (cyklicznie); minuty bez pokrycia dziedziczą wybór poprzedniej minuty; zwiń kolejne minuty z tym samym miejscem (klucz `lon,lat,h`) w pobyty. Gdy żadna minuta nie jest pokryta, zwróć `null`.
- [ ] **Step 4:** PASS. **Step 5:** Commit — `feat: oś czasu postaci z rutyn dnia`.

### Task 3: Planowanie marszu (`RoutineMovementPlanner`)

**Files:**

- Create: `src/lib/services/time/routine-movement-planner.ts`, `src/lib/services/time/routine-movement-planner.test.ts`
- Modify: `src/lib/services/measurement/travel-time-calculator.ts` (eksport `REAL_SECONDS_PER_GAME_MINUTE`)

**Interfaces:**

- Consumes: `RoutePlanner.planRoute(start: LocalPoint, end: LocalPoint): RouteOutcome`, `LocalProjector.projectToLocalPoint/unprojectToGeodetic` (Task 1), `RoutinePlace`.
- Produces: `interface WalkingLeg { durationMinutes: number; totalMetres: number; readonly points: readonly GeodeticPoint[]; readonly cumulativeMetres: readonly number[]; pointAtFraction(fraction: number): GeodeticPoint }`; `class RoutineMovementPlanner` z `constructor(routePlanner: RoutePlanner, projector: LocalProjector, walkMetresPerSecond: number)` i `planLeg(from: RoutinePlace, to: RoutinePlace): WalkingLeg | null` (`null` gdy `too-far-from-network` albo `no-path`).

- [ ] **Step 1: Testy** na małej sieci jak w `route-planner.test.ts`: `leg zawiera drogę po sieci i liczy czas z prędkości marszu` (np. 143 m przy 1,43 m/s = 100 s = 25 minut gry), `pointAtFraction 0 i 1 dają początek i koniec, a 0,5 środek drogi po długości`, `brak drogi daje null`, `to samo miejsce daje null`.
- [ ] **Step 2:** FAIL. **Step 3:** `durationMinutes = totalMetres / walkMetresPerSecond / REAL_SECONDS_PER_GAME_MINUTE`; `totalMetres` = suma długości kolejnych odcinków ścieżki (poziomo); punkty ścieżki przeliczone na geodezyjne `unprojectToGeodetic`; `pointAtFraction` interpoluje liniowo po skumulowanej długości, ze zwarciem do `[0, 1]`.
- [ ] **Step 4:** PASS. **Step 5:** Commit — `feat: planowanie marszu postaci po sieci dróg`.

### Task 4: Pozycje postaci w minucie (`RoutineAnimator`)

**Files:**

- Create: `src/lib/services/time/routine-animator.ts`, `src/lib/services/time/routine-animator.test.ts`

**Interfaces:**

- Consumes: `CharacterTimeline` (Task 2), `WalkingLeg` (Task 3), `GeodeticPoint` (Task 1).
- Produces: `type CharacterActivity = { kind: 'staying'; untilMinute: number } | { kind: 'walking'; from: RoutinePlace; to: RoutinePlace; arrivalMinute: number }`; `interface CharacterFrame { place: RoutinePlace; position: GeodeticPoint; activity: CharacterActivity }`; `interface AnimatedCharacter { timeline: CharacterTimeline; legs: readonly (WalkingLeg | null)[] }` (`legs[i]` = przejście do pobytu `i` z poprzedniego); `class RoutineAnimator` z `constructor(characters: readonly AnimatedCharacter[])`, `readFramesAt(minute: number): CharacterFrame[]`, `countCharactersWalkingOnRoads(): number`, `countCharactersWithoutRoad(): number`.

- [ ] **Step 1: Testy:** `postać z jednym pobytem stoi cały dzień`, `po północy marsz zaczyna się od początku pobytu przez północ (22:00 → 07:00)`, `w trakcie marszu pozycja leży na drodze i activity to walking z godziną przybycia`, `po przybyciu postać stoi w miejscu docelowym`, `bez drogi (leg null) postać skacze do nowego miejsca o godzinie przejścia`, `marsz dłuższy niż pobyt: w kolejnym pobycie postać startuje od miejsca docelowego poprzedniego pobytu`, `liczniki: postaci z drogą i bez drogi`.
- [ ] **Step 2:** FAIL. **Step 3:** `readFramesAt`: dla każdej postaci `i = timeline.findStayIndexAt(minute)`, `elapsed = (minute - stayStart + 1440) % 1440`; jeśli `legs[i]` istnieje i `elapsed < leg.durationMinutes` → walking z ułamkiem `elapsed / durationMinutes`, w przeciwnym razie staying w miejscu pobytu `i`. Postać z jednym pobytem nie ma `legs`.
- [ ] **Step 4:** PASS. **Step 5:** Commit — `feat: pozycje postaci w minucie doby z marszem po drodze`.

### Task 5: Tempo odtwarzania (`RoutinePlayback`)

**Files:**

- Create: `src/lib/services/time/routine-playback.ts`, `src/lib/services/time/routine-playback.test.ts`

**Interfaces:**

- Produces: `type PlaybackSpeed = 'game' | 'fast' | 'very-fast'`; `PLAYBACK_MINUTES_PER_SECOND: Readonly<Record<PlaybackSpeed, number>>` (0,25 / 4 / 60); `interface FrameScheduler { request(callback: (timestampMilliseconds: number) => void): number; cancel(handle: number): void }`; `class RoutinePlayback` z `constructor(scheduler: FrameScheduler, advance: (elapsedGameMinutes: number) => void)`, `start(speed: PlaybackSpeed): void`, `setSpeed(speed: PlaybackSpeed): void`, `stop(): void`, `readonly isPlaying: boolean`; `createBrowserFrameScheduler(): FrameScheduler` (opakowanie `requestAnimationFrame`, tylko w przeglądarce).

- [ ] **Step 1: Testy** z atrapą planisty klatek sterowaną ręcznie: `przyrost godziny wynika z tempa i czasu rzeczywistego`, `wywołuje advance najwyżej co 50 ms`, `pojedyncza klatka nie przesuwa czasu o więcej niż 100 ms rzeczywistych` (powrót z ukrytej karty), `stop anuluje następną klatkę i zeruje isPlaying`, `zmiana tempa w trakcie działa od następnej klatki`.
- [ ] **Step 2:** FAIL → implementacja → PASS. **Step 3:** Commit — `feat: odtwarzanie doby w trzech tempach`.

### Task 6: Przesuwanie punktów warstwy bez przebudowy

**Files:**

- Modify: `src/lib/services/map/data-layers-renderer.ts`, `src/lib/services/map/map-service.ts`, `src/lib/services/layers/data-layers-coordinator.ts` (interfejs `DataLayersDisplay`)

**Interfaces:**

- Produces: `DataLayersRenderer.moveLayerPoints(layerId: string, points: readonly DataLayerPoint[]): boolean` — `true`, gdy warstwa ma ten sam rodzaj i tyle samo punktów (zmienia tylko pozycje istniejących billboardów lub punktów, także w kolekcji „zasłoniętej”); `false` w przeciwnym razie. `MapService.moveDataLayerPoints(layerId, points): boolean` i ten sam członek w `DataLayersDisplay`.

- [ ] **Step 1:** Renderer korzysta z Cesium, więc test jednostkowy dotyczy tylko czystej decyzji. Wydziel `DataLayerShapeComparer.isSameShape(previous: readonly DataLayerPoint[], next: readonly DataLayerPoint[]): boolean` (równa liczba punktów i `iconId`/`cssColor` na każdym indeksie) z testem `kształt się zgadza przy samej zmianie pozycji i nie zgadza przy innej liczbie punktów lub ikonie`.
- [ ] **Step 2:** FAIL → implementacja porównywacza → PASS. **Step 3:** Zaimplementuj `moveLayerPoints` (renderer pamięta ostatnie punkty warstwy do porównania; ustawia `position` przez `Cartesian3.fromDegrees` na elementach obu kolekcji w tej samej kolejności).
- [ ] **Step 4:** `npm run check`. **Step 5:** Commit — `perf: przesuwanie punktów warstwy bez jej przebudowy`.

### Task 7: Integracja w `TimeCoordinator`

**Files:**

- Modify: `src/lib/services/time/time-coordinator.ts`, `src/lib/events/app-events.ts`
- Create: `src/lib/services/time/time-coordinator.playback.test.ts`

**Interfaces:**

- Consumes: `CharacterTimeline`, `RoutineMovementPlanner`, `RoutineAnimator`, `RoutinePlayback`, `WorldRoutingContext.loadRoutePlanner()` oraz nowa metoda `WorldRoutingContext.createProjector(): LocalProjector` (dodaj w tym zadaniu), `DataLayersDisplay.moveDataLayerPoints` (Task 6).
- Produces: `TimeCoordinator.useRoutingContext(context: WorldRoutingContext | null): void`, `useWalkingSpeed(metresPerSecond: number | null): void`, `startPlayback(speed: PlaybackSpeed): Promise<void>`, `setPlaybackSpeed(speed: PlaybackSpeed): void`, `stopPlayback(): void`; `type RoutinePlaybackView = { isPlaying: boolean; isPreparing: boolean; speed: PlaybackSpeed; walkingCount: number; withoutRoadCount: number }`; zdarzenie `time-of-day-changed` dostaje pole `playback: RoutinePlaybackView`.
- Zachowanie: `startPlayback` najpierw włącza warstwę (jeśli ukryta), potem buduje animator porcjami po 25 postaci (z `await` oddającym sterowanie), numerem żądania unieważnianym przez `useWorld`, `stopPlayback` i ponowny start; bez kontekstu tras albo prędkości marszu postacie mają `legs` równe `null` (skoki). Po zbudowaniu animatora `showCharactersAtCurrentTime` czyta klatki animatora (filtr rozdziału jak dziś, `framesOnMap` zgodne z indeksami punktów), przy tej samej liczbie punktów woła `moveDataLayerPoints`, inaczej `showDataLayer`. `setMinuteOfDay` wołane z zewnątrz (suwak) zatrzymuje odtwarzanie; wywołanie z `RoutinePlayback` używa osobnej ścieżki. `identifyCharacter` dla klatki w marszu dodaje fakt „Teraz”: „idzie z <miejsce> do <miejsce>, dotrze o HH:MM”, dla stojącej „stoi tutaj do HH:MM”.

- [ ] **Step 1: Testy** (prawdziwy `GeoportalDataLoader` z wstrzykniętym `fetch` serwującym małe `character_places.geojson` i `npcs.geojson`, atrapa `TimeOfDayDisplay` zapisująca wywołania, atrapa planisty klatek): `start odtwarzania włącza warstwę i buduje animator`, `godzina rośnie w tempie i punkty się przesuwają (moveDataLayerPoints)`, `przeciągnięcie suwaka zatrzymuje odtwarzanie`, `ukrycie warstwy i zmiana świata zatrzymują odtwarzanie`, `wynik budowania animatora po zmianie świata jest pomijany`, `kliknięcie punktu identyfikuje postać z właściwego indeksu przy filtrze rozdziału`, `bez kontekstu tras postacie skaczą, ale odtwarzanie działa`.
- [ ] **Step 2:** FAIL → implementacja → PASS (`npx vitest run src/lib/services/time`). **Step 3:** Commit — `feat: odtwarzanie rutyn postaci po drogach w koordynatorze czasu`.

### Task 8: Fasada, stan i panel Czas

**Files:**

- Modify: `src/lib/services/geoportal-facade.ts`, `src/lib/state/app-state.svelte.ts`, `src/lib/components/panels/TimePanel.svelte`, `docs/glosariusz.md`
- Create: `src/lib/services/time/playback-status-presenter.ts`, `src/lib/services/time/playback-status-presenter.test.ts`

**Interfaces:**

- Consumes: `TimeCoordinator` (Task 7), `WorldRoutingContext`, metadane `movement_speeds_m_s.walk`.
- Produces: `GeoportalFacade.startRoutinePlayback(speed: PlaybackSpeed): void`, `stopRoutinePlayback(): void`, `setRoutinePlaybackSpeed(speed: PlaybackSpeed): void`; `appState.routinePlayback: RoutinePlaybackView`; `PlaybackStatusPresenter.describeStatus(view: RoutinePlaybackView): string | null` — „Wyznaczam drogi postaci…” w trakcie przygotowania, „Na drogach: N, bez drogi: M” po zbudowaniu, `null` przed pierwszym odtwarzaniem.

- [ ] **Step 1: Test prezentera** (trzy stany) → FAIL → implementacja → PASS.
- [ ] **Step 2:** Fasada: w `showCurrentWorldOnMap` obok kontekstu tras przekaż `timeCoordinator.useRoutingContext(routingContext)` i `useWalkingSpeed(metadata.movement_speeds_m_s?.walk ?? null)`; w `openWorld` zeruj oba; przy zmianie narzędzia z `time` na inne wołaj `stopPlayback`. `appState` czyta `playback` ze zdarzenia.
- [ ] **Step 3:** Panel: przycisk „Odtwórz”/„Zatrzymaj” (`button-iron`) przy suwaku, trzy chipy tempa z `aria-pressed` („Jak w grze”, „Szybko”, „Bardzo szybko”), linia stanu z prezentera (`role="status"`). Dopisz do glosariusza „Odtwarzanie doby”.
- [ ] **Step 4:** Zweryfikuj w przeglądarce (`preview_start` `dev`; wyrejestruj service worker, jeśli moduły się nie ładują): Khorinis, narzędzie Czas, „Odtwórz”, zrzut ekranu z postaciami w ruchu, kliknięcie postaci w marszu, przeciągnięcie suwaka zatrzymuje; sprawdź płynność (brak błędów w konsoli, tempo „Bardzo szybko” nie zamraża mapy).
- [ ] **Step 5:** `npm run check && npm run lint`. **Step 6:** Commit — `feat: przycisk Odtwórz doby w panelu Czas`.

### Task 9: E2E, ADR i dokumentacja

**Files:**

- Create: `e2e/routine-playback.test.ts`, `docs/adr/0035-animacja-rutyn-po-sieci-drog.md`
- Modify: `docs/adr/README.md`, `docs/architektura.md`, `docs/pomysly.md`

- [ ] **Step 1: e2e** (service workery zablokowane, własny `character_places.geojson` z jedną postacią o dwóch miejscach i mała sieć jak w `e2e/route.test.ts`): `Odtwórz` włącza warstwę i pokazuje „Na drogach: 1”, `Zatrzymaj` zatrzymuje, świat bez sieci (404) pokazuje „bez drogi: 1” i nie zgłasza błędów.
- [ ] **Step 2:** ADR 0035 (decyzje: oś czasu z 1440 minut, reguły luk i nakładania, skok bez drogi, tempa, 20 Hz i `moveLayerPoints`, zatrzymania odtwarzania, ograniczenie „marsz dłuższy niż pobyt”), wpis w `docs/adr/README.md`.
- [ ] **Step 3:** `docs/architektura.md`: klasy i zdarzenie `time-of-day-changed` z `playback`. `docs/pomysly.md`: pozycja 12 do „Zrobione”. Sprawdź, że nazwy w dokumentach zgadzają się z kodem.
- [ ] **Step 4:** Pełna weryfikacja: `npm run check`, `npm run lint`, `npm run test`, `npm run test:e2e` (buduje aplikację) — wszystko zielone.
- [ ] **Step 5:** Commity — `test: scenariusze e2e odtwarzania rutyn` i `docs: ADR 0035 i opis animacji rutyn`.

---

## Self-review

- **Pokrycie spec:** oś czasu i reguły danych (2), ruch po drogach i skok (3, 4), tempa i zatrzymania (5, 7), wydajność 20 Hz i przesuwanie punktów (5, 6), karta i panel (7, 8), dokumentacja (9). Odłożone zgodnie ze spec: rutyny inne niż domyślne, zapis w adresie.
- **Spójność nazw:** `GeodeticPoint`, `CharacterTimeline`, `RoutineStay`, `WalkingLeg`, `RoutineMovementPlanner`, `AnimatedCharacter`, `CharacterFrame`, `RoutineAnimator`, `RoutinePlayback`, `PlaybackSpeed`, `RoutinePlaybackView`, `moveDataLayerPoints` są używane tak samo we wszystkich zadaniach.
- **Zmiana względem spec:** pomiar kosztu `showDataLayer` zastąpiony od razu przesuwaniem punktów (Task 6), bo przebudowa 400 billboardów 20 razy na sekundę jest wiadomym marnotrawstwem.
