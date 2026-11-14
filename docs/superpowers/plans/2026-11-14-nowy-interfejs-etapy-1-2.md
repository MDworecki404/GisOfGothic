# Nowy interfejs, etapy 1 i 2 (motyw i układ) — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wymienić motyw „Mapa z sakwy kopacza” na „latarnię w kopalni” (etap 1) i przebudować układ ekranu na mapę z pływającymi płytami (etap 2), bez zmian w logice aplikacji.

**Architecture:** Tokeny i klasy materiałów żyją dalej w `src/app.css` pod starymi nazwami klas (`material-leather`, `button-iron`, `chip` itd.), ale z nowym wyglądem, więc znaczniki komponentów zmieniają się tylko tam, gdzie zmienia się układ. Stałe kolory warstw mapy trafiają do jednego pliku `map-palette.ts` pilnowanego testem zgodności z `app.css`.

**Tech Stack:** SvelteKit 5, Tailwind 4, shadcn-svelte, CesiumJS, Vitest, Playwright, `@fontsource`.

**Spec:** `docs/superpowers/specs/2026-11-14-nowy-interfejs-design.md` (makiety: <https://claude.ai/artifact/BDmMuX3VahcCsZiuBAnD77>)

## Global Constraints

- Pismo: `@fontsource/grenze` (500, 600, 700) do nazw i godziny oraz `@fontsource/barlow-semi-condensed` (400, 500, 600) do interfejsu, oba z `latin` i `latin-ext`; stare paczki (`grenze-gotisch`, `alegreya`, `alegreya-sans`) znikają z `package.json`.
- Paleta (nazwa, hex, rola): łupek `#1e282b` (płyty), łupek wysoki `#27353a` (przyciski, pola), woda `#121b1e` (tło mapy), krawędź `#0c1214`, linia `#3a494f`, popiół `#e1dac8` (tekst), mgła `#9aa6a3` (tekst pomocniczy), żar `#f2a24a` (działanie, najechanie, godzina), bariera `#a3b4ff` (wybór, aktywne narzędzie, fokus), krew `#ee7d68` (błędy).
- Płyty są nieprzezroczyste, bez `backdrop-filter`; cienie miękkie zastępuje krawędź oświetlona od lewej-góry. Ścięcie rogu: 14 px (płyta), 9 px (mała), 7 px (przycisk).
- Zakaz czcionek, logo i grafik z gry; kamień i pochodnia są rysowane CSS-em i SVG.
- Kontrast tekstu ≥ 4,5:1 na łupku; cele dotykowe ≥ 44 px; widoczny fokus także na elementach ze `clip-path`; ruch tylko tam, gdzie coś się zmienia, z `prefers-reduced-motion`.
- Etykiety dostępności i role używane w `e2e/` zostają; zmiana etykiety wymaga zmiany testu w tym samym commicie.
- Logika (usługi, fasada, zdarzenia, stan) bez zmian; komponenty nie dostają surowych kolorów ani pikseli poza tokenami z `app.css`.
- Commity: `<type>: <nagłówek po polsku>` plus niepusta treść, bez `Co-Authored-By`. Brak wdrożeń na produkcję (`deploy:preview` wolno).
- Weryfikacja końcowa każdego etapu: `npm run check`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`.

## Review Focus

- Fokus klawiatury na przyciskach i żetonach ze ściętym rogiem: obrys nie może znikać pod `clip-path` (reguła `:focus-visible` z ujemnym `outline-offset` albo cieniem wewnętrznym).
- Kontrast każdej pary tekst/tło z palety (test liczy z wartości w `app.css`).
- Wąski ekran 360 px: pływająca płyta tytułu, wyszukiwarka i akcje nie nakładają się na siebie.
- Elementy zasłaniające mapę dalej mają `data-map-obstacle`, żeby kadrowanie kamery (ADR 0008) uwzględniało nowe płyty.
- Pismo działa offline: pliki `woff2` Grenze i Barlow trafiają do buildu i do powłoki PWA.

---

## Etap 1: motyw

### Task 1: Pismo i paleta w tokenach

**Files:**

- Modify: `package.json`, `package-lock.json`, `src/app.css` (importy, sekcje 1–2, `@theme`), `src/lib/components/shell/MapControls.svelte` (font w SVG kompasu)
- Create: `src/lib/services/theme/color-contrast-calculator.ts`, `src/lib/services/theme/color-contrast-calculator.test.ts`, `src/lib/services/theme/theme-tokens.test.ts`

**Interfaces:**

- Produces: `class ColorContrastCalculator` z `calculateContrastRatio(foregroundHex: string, backgroundHex: string): number` (WCAG 2.x, wejście `#rrggbb`); `--font-sans: 'Barlow Semi Condensed'`, `--font-heading` i `--font-serif`: `'Grenze'`; nowe tokeny `--lupek`, `--lupek-wysoki`, `--woda`, `--krawedz`, `--linia`, `--popiol`, `--mgla`, `--zar`, `--bariera`, `--krew`; stare nazwy (`--pitch`, `--oak`, `--ochre`, `--torch`, `--ore`, `--bone`, `--bone-dim`, `--leather*`, `--iron*`, `--stone`, `--blood`, `--map-backdrop`) zostają jako **aliasy** nowych (komentarz: „aliasy z ADR 0019, usuwane w etapie 5”).

- [ ] **Step 1: Testy.** `color-contrast-calculator.test.ts`: `czarny na białym daje 21`, `ten sam kolor daje 1`, `kolejność argumentów nie zmienia wyniku`. `theme-tokens.test.ts` czyta `src/app.css` (`node:fs`) i parsuje `--nazwa: #hex` z bloku `:root`: `popiół na łupku ma kontrast co najmniej 7`, `mgła, żar, bariera i krew na łupku mają kontrast co najmniej 4,5`, `tekst na żarze (--primary-foreground) ma kontrast co najmniej 4,5`, `popiół na wodzie ma kontrast co najmniej 7`, `bariera i żar na wodzie mają co najmniej 4,5` oraz `app.css nie importuje starych paczek pisma`.
- [ ] **Step 2:** `npx vitest run src/lib/services/theme` → FAIL.
- [ ] **Step 3:** Zaimplementuj kalkulator (jasność względna sRGB). Zainstaluj `npm install @fontsource/grenze @fontsource/barlow-semi-condensed`, odinstaluj trzy stare paczki, zamień importy w `app.css` na pliki `latin-<waga>.css` i `latin-ext-<waga>.css` nowych paczek, ustaw role shadcn: `--background` woda, `--card`/`--popover` łupek, `--primary` żar z `--primary-foreground: #261504`, `--ring` i `--active` bariera, `--hover` żar, `--destructive` krew, `--foreground` popiół, `--muted-foreground` mgła, `--border` linia, `--radius: 3px`. Ścieżka fontu SVG kompasu: `Grenze`.
- [ ] **Step 4:** testy → PASS; `npm run check`; `npm run build` i potwierdź, że w `build/` są pliki `woff2` Grenze i Barlow (`ls build/_app/immutable/assets | grep -i -E 'grenze|barlow'`).
- [ ] **Step 5:** Commit — `feat: paleta i pismo nowego motywu`.

### Task 2: Materiały: płyta, przycisk, żeton

**Files:** Modify: `src/app.css` (warstwa `@layer components`).

**Interfaces:**

- Produces: klasy zachowują nazwy, nowy wygląd. `.material-leather` i `.material-leather-riveted` = **płyta**: tło krawędzi z gradientem `linear-gradient(135deg, rgb(242 162 74 / .7), #40515a 28%, #2a373d 70%, #232e33)`, `clip-path` ze ściętym lewym-górnym i prawym-dolnym rogiem (`--cut: 14px`), wnętrze w `::before` (`inset: 1px`, `radial-gradient(120% 80% at 0 0, rgb(242 162 74 / .13), transparent 58%)` nad łupkiem, ten sam wielokąt z `--cut` pomniejszonym o 0,4 px); zawartość nad nim (`> * { position: relative; z-index: 1 }` tylko dla dzieci bezpośrednich bez `position`). `.material-leather-riveted::before/::after` (nity i przeszycie) znikają. `.material-iron` = wypukła płyta `--lupek-wysoki` z krawędzią `--linia`. `.button-iron` = przycisk łupek wysoki ze ściętym rogiem 7 px i wewnętrzną ramką; `.button-ochre` = żar z ciemnym tekstem; `.button-quiet` = przezroczysty z ramką. `.chip` = pełna pigułka, `aria-pressed='true'` → bariera (tło `rgb(163 180 255 / .16)`, ramka bariery). Dodatkowa klasa `.plate-selected` (krawędź w kolorze bariery).

- [ ] **Step 1: Test** w `theme-tokens.test.ts`: `elementy ze clip-path mają widoczny fokus` — dla selektorów `.button-iron`, `.button-ochre`, `.button-quiet`, `.chip`, `.choice-card` w `app.css` istnieje reguła `:focus-visible` z `outline-offset` ujemnym albo `box-shadow: inset`; `żadna klasa materiałów nie używa backdrop-filter`.
- [ ] **Step 2:** FAIL. **Step 3:** Przepisz reguły z listy; zachowaj `:disabled`, `:hover` (kolor żaru), `:active` (przesunięcie o 1 px).
- [ ] **Step 4:** PASS; `npm run check && npm run lint`. **Step 5:** Commit — `feat: płyty, przyciski i żetony nowego motywu`.

### Task 3: Pola, karty wyboru, suwak, powierzchnie mapy

**Files:** Modify: `src/app.css`.

**Interfaces:** klasy bez zmiany nazw: `.choice-card`, `.field`, `.check-forged`, `.range-forged`, `.list-row`, `.group-label`, `.skeleton`, `.material-parchment`, `.parchment-note` (+ `.note-faded`, `.note-rule`, `.button-ink`, `.parchment-note-shadow`), `.map-parchment`, `.map-parchment-frame`, `.map-compass`, `.scale-ruler`, `.map-attribution`, `.instrument-bar`, `.instrument-cell`, `.tool-rail-button`, `.map-control-button`, `.launch-screen*`, `.tile-loader-ring`.

- [ ] **Step 1:** Rozszerz test o `app.css nie używa już pergaminu ani nitów` (brak `--parchment`, `--rivet` w regułach klas po aliasach; aliasy w `:root` dozwolone) oraz `nowy kolor tła mapy to woda`.
- [ ] **Step 2:** FAIL. **Step 3:** Przepisz: pole (`.field`) = ciemne wnętrze `--krawedz` z ramką `--linia`, fokus w barierze; pole wyboru i suwak w kolorach bariery i żaru; `.parchment-note` i `.material-parchment` stają się płytami (tekst popiół, `.note-faded` mgła, bez gwoździa i postrzępionego `clip-path`), `.button-ink` = wariant przycisku; `.map-parchment` = tło wody z delikatnym wzorem fal (`repeating` gradient, bez obrazków); `.map-parchment-frame` bez przypalonych brzegów (zostaje delikatne winietowanie `rgb(8 12 14 / .5)`); kompas, skala, podpis i pasek stanu w nowych kolorach; ekran ładowania na łupku z żarem.
- [ ] **Step 4:** PASS; w przeglądarce (`preview_start` `dev`, wyrejestruj service worker, jeśli moduły się nie ładują) obejrzyj Khorinis na desktopie i telefonie (`resize_window` mobile): panele Szukaj, Pomiary, Czas, karta obiektu; zrzuty ekranu. **Step 5:** Commit — `feat: pola, karty i powierzchnie mapy w nowym motywie`.

### Task 4: Kolory warstw mapy i SVG w kodzie

**Files:**

- Create: `src/lib/services/map/map-palette.ts`, `src/lib/services/map/map-palette.test.ts`
- Modify: pliki z kolorami z motywu w TS i Svelte (znajdź: `grep -rnE "#(ecd08a|ffd27a|c99a45|e8913a|6cc3e8|eadcc0)" src`), m.in. `measurement-renderer.ts`, `time-coordinator.ts` (`ROUTINE_LAYER_COLOR`), `BrandMark.svelte`, `ProfileChart.svelte`

**Interfaces:**

- Produces: `MAP_PALETTE` (`readonly`): `ember: '#f2a24a'`, `barrier: '#a3b4ff'`, `ash: '#e1dac8'`, `edge: '#0c1214'`, `water: '#121b1e'`, `blood: '#ee7d68'`; moduł nie importuje Cesium (tylko stałe).

- [ ] **Step 1: Test:** `MAP_PALETTE zgadza się z tokenami app.css` (czyta `app.css`, porównuje `--zar`, `--bariera`, `--popiol`, `--krawedz`, `--woda`, `--krew`).
- [ ] **Step 2:** FAIL. **Step 3:** Utwórz `map-palette.ts` i zamień kolory motywowe w liście plików na stałe z niego (kolory kategorii przedmiotów i postaci w `data-layer-catalog.ts` zostają, bo niosą znaczenie). `BrandMark.svelte` rysuje odłamek rudy (`polygon 12,2 20,9 15,22 7,20 4,10`) w kolorze żaru z krawędzią `--krawedz`.
- [ ] **Step 4:** PASS; `npm run check && npm run lint && npx vitest run`. **Step 5:** Commit — `feat: kolory warstw mapy z jednej palety`.

### Task 5: ADR 0036, dokumentacja i weryfikacja etapu 1

**Files:** Create: `docs/adr/0036-motyw-latarnia-w-kopalni.md`; Modify: `docs/adr/README.md`, `docs/adr/0019-motyw-mapa-z-sakwy-i-tokeny-ukladu.md` (tylko pole statusu), `docs/architektura.md`, `docs/rozwoj.md` (jeśli opisuje pismo lub motyw), `CLAUDE.md` (sekcja „Pułapki projektu”, linia o motywie).

- [ ] **Step 1:** ADR 0036: kontekst („drętwy” interfejs), decyzja (paleta i role, pismo i `@fontsource`, płyty ze ściętym rogiem bez rozmycia, klasy zachowują nazwy, aliasy starych tokenów do etapu 5, `ColorContrastCalculator` i testy tokenów, `MAP_PALETTE`), konsekwencje. Status ADR 0019: „zastąpiona w części motywu (0036)”; wpis w `docs/adr/README.md`.
- [ ] **Step 2:** Zaktualizuj opisy motywu i pisma w `docs/architektura.md`, `docs/rozwoj.md` i w `CLAUDE.md` (motyw „Mapa z sakwy kopacza” → „latarnia w kopalni”, ADR 0036); sprawdź, że nazwy w dokumentach zgadzają się z kodem.
- [ ] **Step 3:** Pełna weryfikacja etapu: `npm run check`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e` — zielone.
- [ ] **Step 4:** Commit — `docs: ADR 0036 i opis nowego motywu`.

---

## Etap 2: układ

### Task 6: Tokeny układu i płyta nagłówka

**Files:** Modify: `src/app.css` (sekcja 3), `src/lib/components/shell/TopBar.svelte`, `src/lib/components/shell/WorldSwitcher.svelte` (tylko skórka), `src/lib/components/shell/BrandMark.svelte`

**Interfaces:**

- Produces: tokeny układu (desktop ≥ 48 rem): `--top-bar-height: 5.5rem` (strefa nagłówka: 24 px margines, 64 px płyta, 12 px odstępu), `--status-bar-height: 0px`, `--edge-inset: 1.5rem`; telefon: `--edge-inset: 0.75rem`. Nagłówek składa się z trzech pływających płyt: **tytuł świata** (`BrandMark`, nazwa świata Grenze 24 px, podtytuł gry, otwiera `WorldSwitcher`), **wyszukiwarka** (to samo pole `<input type="search">` i te same zdarzenia co dziś, w płycie `plyta-mala`), **akcje** (kopiuj link, wydajność przez `MoreMenu`, „O projekcie”, na desktopie „Zainstaluj”, jeśli `appState.canInstallApp`). Każda płyta ma `data-map-obstacle`. `<header>` zachowuje role i etykiety.

- [ ] **Step 1: Test e2e** `e2e/layout.test.ts`: `płyty nagłówka nie nakładają się na szerokości 360 i 1280` (viewport 360×740 i 1280×720: pobierz `boundingBox` trzech płyt po `data-testid` `header-title`, `header-search`, `header-actions` i sprawdź brak przecięć) oraz `płyty nagłówka mają data-map-obstacle`.
- [ ] **Step 2:** `npx playwright test e2e/layout.test.ts` → FAIL (brak `data-testid`).
- [ ] **Step 3:** Przebuduj `TopBar.svelte` na trzy płyty (pozycjonowanie `fixed`, `top: var(--edge-inset)`); na telefonie: tytuł skrócony do nazwy świata, wyszukiwarka zwinięta do ikony otwierającej pole (zachowaj `aria-label="Szukaj przedmiotu lub postaci"` i `type="search"`, bo e2e używają `getByRole('searchbox')`), akcje w jednej płycie. Skrót Ctrl K bez zmian.
- [ ] **Step 4:** test → PASS; uruchom całe `npx playwright test` i popraw testy, które zależały od starego paska (tylko selektory, nie zachowanie). **Step 5:** Commit — `feat: pływający nagłówek z tytułem świata, wyszukiwarką i akcjami`.

### Task 7: Dok narzędzi i nawigacja telefonu

**Files:**

- Modify: `src/lib/components/shell/tool-definitions.ts`, `src/lib/components/shell/ToolRail.svelte`
- Create: `src/lib/components/shell/tool-groups.test.ts`

**Interfaces:**

- Consumes: `TOOL_DEFINITIONS`, `ToolId` (`#lib/services/tools/tool-id.js`).
- Produces: `ToolDefinition` dostaje `group: 'find' | 'measure' | 'time'` oraz `isOnPhoneBar: boolean`; kolejność i grupy: Szukaj, Warstwy (`find`) | Pomiary, Analizy, Rozmiary (`measure`) | Czas, Notatnik, Zakładki (`time`); na pasku telefonu: Szukaj, Warstwy, Pomiary, Czas oraz przycisk „Więcej” otwierający listę pozostałych narzędzi (Analizy, Rozmiary, Notatnik, Zakładki) w `MoreMenu`-podobnym wyskakującym menu. Dok desktopowy: pionowa płyta przy lewej krawędzi, separatory między grupami, znacznik aktywnego (3 px paska bariery z lewej i tło `rgb(163 180 255 / .1)`), podpis narzędzia (zdanie, nie wersaliki) pokazywany po najechaniu i przy fokusie klawiatury; `aria-pressed` i nazwy przycisków bez zmian; `<nav aria-label="Narzędzia">` zachowany; `data-map-obstacle`.

- [ ] **Step 1: Test** `tool-groups.test.ts`: `każde narzędzie ma grupę i kolejność zgodną z makietą`, `na pasku telefonu są cztery narzędzia`, `narzędzia spoza paska telefonu są dostępne w menu Więcej (każde ma isOnPhoneBar false)`, `identyfikatory są unikalne`.
- [ ] **Step 2:** FAIL. **Step 3:** Dodaj pola i przebuduj `ToolRail.svelte` (dwa układy w jednym komponencie przez `MediaQuery('max-width: 767px')`, bo logika wyboru narzędzia jest ta sama: `geoportal.selectTool`); „Więcej” otwiera menu z przyciskami tych samych narzędzi z tymi samymi nazwami.
- [ ] **Step 4:** PASS; `npx playwright test` (testy używają `getByRole('navigation', { name: 'Narzędzia' })` na desktopie, więc działają bez zmian); dopisz do `e2e/layout.test.ts`: `na telefonie „Więcej” otwiera Analizy`. **Step 5:** Commit — `feat: dok narzędzi i pięć pozycji nawigacji na telefonie`.

### Task 8: Panel narzędzia, sterowanie mapą, karta obiektu i narożny odczyt

**Files:** Modify: `src/lib/components/shell/ToolPanel.svelte`, `MapControls.svelte`, `IdentifyCard.svelte`, `InstrumentBar.svelte`, `ActiveLayersLegend.svelte`, `TilesLoadingBadge.svelte`, `MapAttribution.svelte`, `src/app.css` (klasy `.instrument-bar`, `.map-control-button`)

**Interfaces:** `ToolPanel` desktop: lewa płyta obok doku (`left: calc(var(--edge-inset) + dok + 12px)`, `top: var(--top-bar-height)`, dolny margines `--edge-inset`); `--panel-occupied-width` i `--sheet-occupied-height` liczone jak dotąd. `MapControls`: jedna kolumna płyt przy prawej krawędzi pod nagłówkiem (kompas, zoom, cały świat) i druga mała płyta z pozostałymi przyciskami (widok 2D/3D, rzut, joysticki, porównanie światów); **nazwy i etykiety przycisków bez zmian** (testy używają m.in. `Rzut kamery`, `Widok kamery`, `FLAT_MAP_BUTTON`). `InstrumentBar`: zamiast paska na całą szerokość pływająca płyta w prawym dolnym rogu (układ współrzędnych, odczyt kursora, skala, tryb widoku, tekst stanu z `data-testid="status-bar"`); komórka „Godzina” znika (godzinę pokazuje panel Czas, a w etapie 4 Zegar doby). `IdentifyCard`: płyta przypięta do prawej krawędzi pod nagłówkiem (desktop) albo do dołu nad nawigacją (telefon), bez gwoździa i pergaminu. Podpis praw autorskich i logo Cesium pozostają widoczne (ADR 0020).

- [ ] **Step 1: Test e2e** w `e2e/layout.test.ts`: `otwarty panel narzędzia nie zasłania doku ani nagłówka` (bounding boxy), `płyta odczytu współrzędnych jest w prawym dolnym rogu i zawiera status-bar`, `podpis praw autorskich jest widoczny`.
- [ ] **Step 2:** FAIL. **Step 3:** Przebuduj komponenty z listy; tokeny `--map-controls-width` i `--status-bar-height` dostosuj (pasek zniknął, więc dolny margines to `--edge-inset`). Sprawdź w przeglądarce (desktop 1440×900, 1024×700, telefon 390×844): panel Pomiary + trasa, karta postaci, legenda warstw, plakietka ładowania kafli.
- [ ] **Step 4:** PASS; pełne `npx playwright test`. **Step 5:** Commit — `feat: pływające panele, sterowanie mapą i odczyt współrzędnych`.

### Task 9: Weryfikacja etapu 2 i dokumentacja

**Files:** Modify: `docs/architektura.md` (układ ekranu, komponenty powłoki), `docs/adr/0036-motyw-latarnia-w-kopalni.md` (sekcja „Układ”), `docs/rozwoj.md` (jeśli opisuje strukturę powłoki), `docs/glosariusz.md` (nazwy: „dok narzędzi”, „płyta”), `docs/superpowers/specs/2026-11-14-nowy-interfejs-design.md` (zaznacz zrealizowane etapy i odstępstwa: przycisk „Widok” przesunięty do etapu 5, bo testy e2e zależą od obecnych etykiet).

- [ ] **Step 1:** Zaktualizuj dokumenty; sprawdź, że nazwy klas, plików i `data-testid` zgadzają się z kodem.
- [ ] **Step 2:** Pełna weryfikacja: `npm run check`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`; przegląd w przeglądarce na desktopie i telefonie (zrzuty); `npm run deploy:preview` wykonaj dopiero, gdy użytkownik o to poprosi.
- [ ] **Step 3:** Commit — `docs: opis nowego układu ekranu`.

---

## Self-review

- **Pokrycie spec:** etap 1 (tokeny, pismo, płyty, przyciski, pola, mapa, kolory warstw, ADR 0036): zadania 1–5; etap 2 (nagłówek, dok, telefon, panel, sterowanie, odczyt, karta): zadania 6–9. Odstępstwo od spec: zwinięcie rzadko używanych przycisków mapy w „Widok” odłożone do etapu 5 (testy e2e zależą od obecnych etykiet; zapisane w zadaniu 9).
- **Spójność nazw:** `ColorContrastCalculator`, `MAP_PALETTE`, `.plate-selected`, `isOnPhoneBar`, `group`, `--edge-inset`, `--top-bar-height` (strefa nagłówka), `data-testid` `header-title`/`header-search`/`header-actions` są używane tak samo w zadaniach.
- **Proporcje:** plan opisuje decyzje i testy, ciało CSS ogranicza do wzoru płyty; resztę wykonawca przepisuje z makiet i istniejących reguł.
