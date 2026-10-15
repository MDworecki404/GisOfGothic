# GIS of Gothic — wytyczne dla Claude

Geoportal 3D świata Gothic 2 (SvelteKit 5 + CesiumJS). Stack i uruchomienie: `README.md`.
Kontrakt danych: `static/data/khorinis/README.md`. UI po polsku.

## Architektura

- Aplikacja ma charakter **klasowy**: logika biznesowa żyje w klasach (serwisy, fasady, budowniczowie),
  nie w luźnych funkcjach ani w komponentach.
- Stosuj wzorce projektowe tam, gdzie upraszczają kod, np. **fasada** (jeden prosty interfejs do mapy
  Cesium, danych, wyszukiwania) i **budowniczy** (składanie złożonych obiektów, np. konfiguracji
  Viewera, warstw, zapytań). Nie dokładaj wzorca bez powodu.
- **UI nie wie nic o logice biznesowej, a logika nic o UI.** Komponenty Svelte tylko renderują stan
  i zgłaszają intencje użytkownika; nie importują Cesium ani MiniSearch.
- Komunikacja UI ↔ logika przez **event bus** (typowane zdarzenia) oraz reaktywny stan udostępniany
  przez fasadę. Żadnych bezpośrednich wywołań serwisu z logiką domenową w komponencie.
- Obiektów Cesium (Viewer, Model, kolekcje) **nie trzymamy w `$state`** — tylko w polach klas.
  Reaktywne są wyłącznie dane aplikacji; do Cesium przekazuje je warstwa łącząca w `$effect`.
- Ciężkie warstwy (model świata, modele 3D) docelowo ładujemy z **Cesium ion**, nie z `static/`.

### Struktura folderów (alias `#lib`)

```
src/lib/
  services/     logika biznesowa: fasada, MapService, budowniczowie
  events/       event bus i typy zdarzeń
  data/         typy, parsery, loader paczki danych
  state/        reaktywny stan dla UI (runy), tylko dane
  components/   komponenty aplikacji (bez logiki domenowej); ui/ = shadcn-svelte
```

Importy w `.ts`/`.svelte.ts` piszemy z rozszerzeniem `.js` (`#lib/data/geoportal-data-loader.js`).

## Styl kodu

- **Pełne typowanie.** Zakaz `any`, zakaz operatora `!` (non-null) i asercji `as`. Jeśli da się uniknąć
  asercji — nie używamy jej: zawężamy typ (type guard, walidacja, `satisfies`, generyki).
- **Nazwy mówią, co kod robi**: funkcje i metody to czasowniki opisujące jednoznacznie działanie
  (`loadSearchIndex`, `flyToBoundingSphereOfWorld`), bez skrótów i ogólników (`handle`, `process`, `doStuff`).
- **Bez komentarzy**, chyba że funkcja jest skomplikowana i wymaga wyjaśnienia — wtedy **JSDoc po polsku**.
  Kod ma tłumaczyć się sam nazwami.
- Pisz tak, żeby użytkownik czytający kod zrozumiał go bez znajomości reszty projektu.
- Zmieniając kod, dopasuj się do otoczenia; stare miejsca łamiące te zasady poprawiaj przy okazji.

## Commity i wersjonowanie

Format:

```
<type>: <nagłówek po polsku>

<treść po polsku>
```

- `type` z Angular Conventional Commits: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `revert`.
- **Bez `Co-Authored-By` i jakiejkolwiek wzmianki o Claude** — to polecenie użytkownika ma pierwszeństwo
  nad domyślną atrybucją.
- Commity służą do wersjonowania aplikacji i generowania **CHANGELOG.md** — jeden commit = jedna logiczna
  zmiana, nagłówek opisuje efekt dla użytkownika/rozwoju. Zmiany łamiące: `!` po typie i opis w treści.
- Commituj tylko na prośbę użytkownika.

## Narzędzia i skille

Korzystaj z pluginów i skilli: `superpowers` (planowanie, TDD, weryfikacja, review), `frontend-design`
(UI, motyw Gothic), skille do copywritingu (teksty interfejsu po polsku) oraz `geoai` / `cesiumjs-*`
(GIS i Cesium).

## Pułapki projektu

- Cesium działa tylko w przeglądarce (`ssr = false`). Zasoby Cesium kopiuje `vite-plugin-static-copy`.
- Konfiguracja SvelteKit jest w `vite.config.ts`; zmienne środowiskowe w `src/env.ts` (SvelteKit 3).
- Dane z gry (`static/data/`) nie trafiają do repo. Nie używamy `npm audit fix --force`.
- Motyw: ciemny „Gothic” (zmienne shadcn w `src/app.css`); bez logo, czcionek i grafik z gry.

## Weryfikacja przed oddaniem

`npm run check`, `npm run lint`, `npm run test`, `npm run build` (oraz `npm run test:e2e` przy zmianach mapy/UI).

## Wydania

- `commitlint` (hook `commit-msg`, husky) pilnuje formatu commitów; hook `pre-commit` uruchamia check, lint i testy.
- Wersję podbija i generuje `CHANGELOG.md` komenda `npm run release` (commit-and-tag-version, wersja wg commitów).
