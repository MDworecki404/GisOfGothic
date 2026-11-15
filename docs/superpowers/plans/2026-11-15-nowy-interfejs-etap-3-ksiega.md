# Nowy interfejs, etap 3 (Księga i karta wpisu) — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zamienić panel boczny „Wyszukiwarka” na Księgę (okno z listą po lewej i kartą wpisu po prawej, otwierane Ctrl K) oraz pokazywać wybrany wpis jako zwartą kartę przy prawej krawędzi mapy.

**Architecture:** Księga to stan narzędzia `search` (`activeToolId === 'search'`), więc działają adres `narzedzie=search`, zakładki i `selectTool`. Okno to `Dialog` z `ui/dialog` (fokus, Esc, nakładka), a zawartość to dwa komponenty wydzielone z `SearchPanel`. Zamknięcie Księgi zostawia wybrany wpis, a `EntrySummaryCard` pokazuje go przy mapie. Logika biznesowa i zdarzenia bez zmian.

**Tech Stack:** SvelteKit 5, Tailwind 4, bits-ui Dialog, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-nowy-interfejs-design.md` (etap 3; makiety: <https://claude.ai/artifact/BDmMuX3VahcCsZiuBAnD77>)

## Global Constraints

- Motyw i klasy z ADR 0036: płyty `material-leather`, przyciski `button-iron`/`button-ochre`/`button-quiet`, żetony `chip`, tokeny z `app.css`; bez surowych kolorów.
- Księga ⇔ `activeToolId === 'search'`. Domyślne narzędzie przy braku parametru `narzedzie` w adresie to **żadne** (mapa bez otwartych okien); `narzedzie=search` otwiera Księgę, `wpis=…` bez `narzedzie` pokazuje tylko kartę przy mapie.
- Zamknięcie Księgi (Esc, nakładka, „Pokaż na mapie”, przycisk zamknięcia) **nie czyści** wybranego wpisu; czyści go tylko przycisk zamknięcia na karcie wpisu.
- Jedno pole `searchbox` na stronie (wewnątrz Księgi); przycisk w nagłówku nie jest polem tekstowym. Skrót Ctrl K otwiera Księgę z fokusem w polu.
- Nazwy dostępności zostają: nagłówek „Wyszukiwarka” (ukryty wizualnie, `sr-only`) w Księdze, grupa „Rodzaj wyników”, przycisk „Prowadź tutaj: …”, pola „Zebrane: …”, „Poziom od/do”.
- Logika (fasada, usługi, zdarzenia, stan) bez zmian poza jednym wyjątkiem: zamknięcie narzędzia `search` nie czyści wyboru wpisu (`GeoportalFacade.activateTool`).
- Telefon: Księga na pełny ekran, jedna kolumna: lista, a po wyborze wpisu karta z przyciskiem „Wróć do wyników”.
- Commity: `<type>: <nagłówek po polsku>` plus niepusta treść, bez `Co-Authored-By`; brak wdrożeń na produkcję.
- Weryfikacja każdego zadania: `npm run check`, `npm run lint`, `npx vitest run`; końcowa etapu: także `npm run build` i `npm run test:e2e`.

## Review Focus

- Esc i kliknięcie nakładki zamykają Księgę, a wybrany wpis zostaje i widać go na karcie przy mapie.
- Ctrl K otwiera Księgę z fokusem w polu, a pisanie od razu filtruje listę (fokus nie jest kradziony przez przycisk w nagłówku).
- Adres `?wpis=…` bez `narzedzie` pokazuje kartę przy mapie, nie Księgę; `?narzedzie=search&wpis=…` pokazuje Księgę z kartą.
- Na telefonie (390 px) Księga nie ma poziomego przewijania, a po wyborze wpisu jest przycisk „Wróć do wyników”.
- Karta identyfikacji obiektu z mapy ma pierwszeństwo przed kartą wpisu (nie nakładają się), a „Szukaj” z karty identyfikacji otwiera Księgę z wpisaną frazą.

---

### Task 1: Księga jako narzędzie bez panelu; domyślnie nic otwartego

**Files:**

- Modify: `src/lib/components/shell/tool-definitions.ts`, `src/lib/components/shell/tool-groups.test.ts`, `src/lib/components/shell/ToolPanel.svelte`, `src/lib/services/bookmarks/view-link-codec.ts`, `src/lib/services/bookmarks/view-link-codec.test.ts`, `src/lib/services/geoportal-facade.ts`, `src/lib/services/backup/user-data-transfer.test.ts` (tylko jeśli używa domyślnego narzędzia)

**Interfaces:**

- Produces: `ToolDefinition.presentation: 'panel' | 'book'` (`search` = `'book'`, reszta `'panel'`); `DEFAULT_TOOL_ID: ToolId | null = null` w `view-link-codec.ts`. `ToolPanel` nie renderuje panelu dla narzędzia o `presentation: 'book'`.

- [ ] **Step 1: Testy.** W `tool-groups.test.ts`: `tylko Szukaj otwiera Księgę, pozostałe narzędzia mają panel`. W `view-link-codec.test.ts`: `adres bez parametru narzedzie nie otwiera żadnego narzędzia` (`parseQuery('').toolId === null`), `narzedzie=search otwiera Księgę` (`parseQuery('?narzedzie=search').toolId === 'search'`), `buildQuery z toolId search zapisuje narzedzie=search`, `buildQuery bez narzędzia nie dodaje parametru`, `stary parametr narzedzie=zamkniete jest nadal rozpoznawany jako brak narzędzia`; popraw istniejące oczekiwania, które zakładały domyślne `search` (`domyślny widok daje pusty adres` używa `toolId: null`).
- [ ] **Step 2:** `npx vitest run src/lib/components/shell src/lib/services/bookmarks` → FAIL.
- [ ] **Step 3:** Dodaj pole `presentation` do definicji; `ToolPanel` wybiera `activeTool` tylko spośród definicji z `presentation === 'panel'`; w kodeku `DEFAULT_TOOL_ID` to `null`, a `buildQuery` pomija parametr, gdy `toolId === DEFAULT_TOOL_ID`, i zapisuje `narzedzie=<id>` w pozostałych przypadkach (parser nadal rozumie `zamkniete`). W `GeoportalFacade.activateTool` usuń czyszczenie wyboru przy zamknięciu narzędzia `search` (linia z `searchCoordinator.clearSelection()`).
- [ ] **Step 4:** Testy → PASS; `npm run check`. **Step 5:** Commit — `refactor: Księga jako narzędzie bez panelu bocznego`.

### Task 2: Okno Księgi z listą i kartą wpisu

**Files:**

- Create: `src/lib/components/book/Book.svelte`, `src/lib/components/book/BookSearch.svelte`, `src/lib/components/book/BookEntry.svelte`
- Delete: `src/lib/components/panels/SearchPanel.svelte` (treść przechodzi do `BookSearch` i `BookEntry`)
- Modify: `src/routes/[gameId]/[worldId]/+page.svelte` (montuje `<Book />`), `src/lib/components/shell/TopBar.svelte` (pole wyszukiwania staje się przyciskiem), `src/lib/components/shell/ToolRail.svelte` (bez zmian logiki: „Szukaj” nadal wywołuje `selectTool('search')`), `e2e/app.test.ts`, `e2e/camera.test.ts`, `e2e/view-2d.test.ts`, `e2e/layout.test.ts` (selektory)

**Interfaces:**

- Consumes: `appState.activeToolId`, `geoportal.selectTool`, `geoportal.search`, `geoportal.selectSearchEntry`, `geoportal.clearSearchSelection`, istniejące odczyty `appState.*` dotychczas używane w `SearchPanel`.
- Produces: `Book.svelte` — `Dialog.Root` z `open={appState.activeToolId === 'search'}` i `onOpenChange` wołającym `geoportal.selectTool('search')`, gdy zamykane (przełączenie zamyka); zawartość `Dialog.Content` z `showCloseButton={false}`, klasy `material-leather` w układzie `md:grid-cols-[26rem_1fr]`, wysokość `min(48rem, 100dvh - 3rem)`, szerokość `min(72rem, 100vw - 3rem)`, na telefonie `inset-0` bez ścięcia; nagłówek `Dialog.Title` „Wyszukiwarka” z `sr-only`. `BookSearch` = pole `type="search"` (`aria-label="Szukaj przedmiotu lub postaci"`, Enter wybiera pierwszy wynik, `oninput` woła `geoportal.search`) plus dotychczasowa lista, filtry i puste stany; `BookEntry` = dotychczasowa karta wpisu bez przycisku „Wróć…” na `md` (na telefonie przycisk „Wróć do wyników” zostaje) oraz przycisk „Pokaż na mapie” (zamyka Księgę przez `geoportal.selectTool('search')`) obok „Kopiuj link”; bez wybranego wpisu `BookEntry` pokazuje tekst „Wybierz wpis z listy” (na `md`). Telefon: `BookSearch` ukryte, gdy `appState.selectedEntry` istnieje; `BookEntry` ukryte, gdy go nie ma.
- Nagłówek: `header-search` to `<button>` z `aria-label="Szukaj przedmiotu lub postaci"`, tekstem podpowiedzi i skrótem Ctrl K, który woła `geoportal.selectTool('search')`, gdy Księga jest zamknięta; Ctrl K i Cmd K robią to samo (skrót w `TopBar.svelte` zostaje, ale otwiera Księgę zamiast fokusować pole).

- [ ] **Step 1: Testy e2e** w `e2e/book.test.ts`: `Ctrl K otwiera Księgę z fokusem w polu wyszukiwania` (`keyboard.press('Control+k')`, `expect(getByRole('searchbox')).toBeFocused()`, nagłówek „Wyszukiwarka” obecny), `pisanie w Księdze zawęża listę do wpisu` (fraza `szczaw krolewski` → przycisk wyniku widoczny), `Esc zamyka Księgę`, `kliknięcie nakładki zamyka Księgę`, `przycisk w nagłówku otwiera Księgę`, `Księga na telefonie ma jedną kolumnę i przycisk Wróć do wyników po wyborze wpisu` (viewport 390×844, brak poziomego przewijania: `scrollWidth <= clientWidth`), `adres narzedzie=search otwiera Księgę, a sam adres nie`.
- [ ] **Step 2:** `npx playwright test e2e/book.test.ts` → FAIL.
- [ ] **Step 3:** Wydziel `BookSearch` i `BookEntry` z `SearchPanel` (przenieś znaczniki, snippety i pochodne; nie zmieniaj zachowania ani nazw dostępności), zbuduj `Book.svelte`, zamień pole w `TopBar` na przycisk, zamontuj `<Book />` w stronie świata, usuń `SearchPanel`. Dostosuj istniejące testy e2e: testy zakładające domyślnie otwarty panel wyszukiwania dostają adres z `?narzedzie=search` (wspólna stała `BOOK_URL` w `e2e/support/test.ts`), `getByPlaceholder('Szukaj przedmiotu lub postaci…')` z testu „strona się ładuje” zastępuje `getByRole('button', { name: 'Szukaj przedmiotu lub postaci' })`.
- [ ] **Step 4:** Testy Księgi → PASS; pełne `npx playwright test` zielone (popraw selektory, nie zachowanie). `npm run check && npm run lint`.
- [ ] **Step 5:** W przeglądarce (`preview_start` `dev`, wyrejestruj service worker): Księga na desktopie 1280×720 i telefonie 390×844 (zrzuty), Esc, nakładka, wybór wpisu, „Prowadź tutaj”. **Step 6:** Commit — `feat: Księga z listą i kartą wpisu zamiast panelu wyszukiwania`.

### Task 3: Karta wpisu przy mapie

**Files:**

- Create: `src/lib/components/shell/EntrySummaryCard.svelte`
- Modify: `src/routes/[gameId]/[worldId]/+page.svelte`, `e2e/book.test.ts`

**Interfaces:**

- Consumes: `appState.selectedEntry` (`name`, `categoryLabel`, `code`, `facts`, `places`, `type`), `appState.identifiedFeature`, `appState.isSelectedQuestCollected`, `appState.collectedPlaceKeysOfSelectedEntry`, `geoportal.selectTool`, `geoportal.clearSearchSelection`, `geoportal.toggleCollectedStateOfSelectedQuest`, `CopyViewLinkButton`.
- Produces: `EntrySummaryCard.svelte` — płyta `material-leather` przy prawej krawędzi (desktop: `top-[calc(var(--top-bar-height)+var(--gutter))] right-(--map-controls-width)`, szerokość `19rem`; telefon: przypięta do dołu nad nawigacją i arkuszem), widoczna, gdy `appState.selectedEntry` istnieje, Księga jest zamknięta i nie ma `appState.identifiedFeature`; zawiera nazwę (`font-heading`), podtytuł (kategoria i kod), do trzech faktów, dla przedmiotów postęp „Zebrano N z M” (tylko gdy są miejsca do odhaczenia), dla questów przycisk „Oznacz jako wykonany”, przycisk `button-ochre` „Otwórz w Księdze” (`selectTool('search')`), „Kopiuj link”, przycisk zamknięcia z `aria-label="Zamknij kartę wpisu"` (czyści wybór). Brak `data-map-obstacle`.

- [ ] **Step 1: Testy e2e:** `po zamknięciu Księgi wybrany wpis zostaje na karcie przy mapie` (wybierz `Szczaw królewski`, Esc, karta z tytułem widoczna, URL zawiera `wpis=`), `przycisk Otwórz w Księdze wraca do karty wpisu`, `zamknięcie karty czyści wpis z adresu`, `adres z samym wpisem pokazuje kartę, a nie Księgę`, `karta wpisu nie nakłada się na kontrolki mapy` (bounding boxy karty i kolumny `Obróć mapę na północ`).
- [ ] **Step 2:** FAIL. **Step 3:** Zbuduj komponent, zamontuj w stronie świata. **Step 4:** PASS + pełne e2e; przegląd w przeglądarce (desktop i telefon). **Step 5:** Commit — `feat: karta wpisu przy mapie po zamknięciu Księgi`.

### Task 4: Dokumentacja, ADR 0037 i porządki

**Files:** Create: `docs/adr/0037-ksiega-i-karta-wpisu.md`; Modify: `docs/adr/README.md`, `docs/architektura.md`, `docs/glosariusz.md`, `docs/superpowers/specs/2026-11-14-nowy-interfejs-design.md`, `src/lib/components/shell/AboutDialog.svelte` (stary znak pinezki w kolorach z ADR 0019 → `BrandMark`)

- [ ] **Step 1:** ADR 0037: kontekst (panel boczny jako jedyny kształt wyszukiwania), decyzja (Księga ⇔ narzędzie `search`, domyślnie brak otwartego narzędzia, nakładka `Dialog`, zamknięcie nie czyści wyboru, karta wpisu przy mapie, przycisk w nagłówku zamiast drugiego pola `searchbox`), konsekwencje (stare linki z `narzedzie=zamkniete` działają; zakładki z narzędziem `search` otwierają Księgę; „Teraz” i doba postaci na karcie oraz lista „Ostatnio oglądane” nie weszły i czekają na etap 4); wpis w `docs/adr/README.md`.
- [ ] **Step 2:** Zaktualizuj `docs/architektura.md` (sekcje wyszukiwania i układu: komponenty `Book`, `BookSearch`, `BookEntry`, `EntrySummaryCard`, domyślny brak narzędzia), `docs/glosariusz.md` („Księga”, „karta wpisu”), notkę statusu w spec (etap 3 zrobiony i odstępstwa). W `AboutDialog.svelte` zastąp rysunek pinezki komponentem `BrandMark`.
- [ ] **Step 3:** Pełna weryfikacja: `npm run check`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`; sprawdź, że nazwy w dokumentach zgadzają się z kodem. **Step 4:** Commit — `docs: ADR 0037 i opis Księgi`.

---

## Self-review

- **Pokrycie spec (etap 3):** Księga z listą, filtrami, kartą, miejscami z „Prowadź tutaj” i postępem zbierania (zadanie 2, treść przeniesiona z `SearchPanel`), „Pokaż na mapie” zamyka Księgę i zostawia wpis (zadania 1–3), zwarta karta przy mapie z „Otwórz w Księdze” (zadanie 3), Ctrl K (zadanie 2). Odstępstwa od spec: „Teraz” i doba postaci na karcie oraz lista „Ostatnio oglądane” (mockup) odłożone do etapu 4, bo wymagają łączenia z `TimeCoordinator` i nowego magazynu; Księga identyfikowana ze stanem narzędzia `search`, żeby zachować adres i zakładki.
- **Spójność nazw:** `presentation`, `DEFAULT_TOOL_ID`, `Book`, `BookSearch`, `BookEntry`, `EntrySummaryCard`, `BOOK_URL` są używane tak samo w zadaniach.
- **Ryzyko:** największe to przeniesienie 470 linii z `SearchPanel`; zadanie 2 nie zmienia nazw dostępności i uruchamia pełne e2e po zmianie.
