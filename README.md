# GIS of Gothic

Geoportal 3D świata Gothic 2: Noc Kruka (na start: Khorinis). Docelowo: wyszukujesz przedmiot albo
unikatową postać i widzisz na mapie 3D, gdzie są. **Ten krok to baza**: szkielet, motyw, mapa 3D
z modelem świata, wczytanie danych i pusty panel wyszukiwania.

## Stack

SvelteKit (Svelte 5, runy) + TypeScript, `adapter-static` (`fallback: 'index.html'`), Tailwind CSS 4,
shadcn-svelte (Bits UI), CesiumJS, MiniSearch (jeszcze nieużyty), Vitest, Playwright. UI po polsku.

## Uruchomienie

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # svelte-check
npm run lint
npm run test         # Vitest
npm run test:e2e     # Playwright (buduje i serwuje build; wymaga danych)
npm run build        # statyczna strona w build/
```

Pierwszy raz: `npx playwright install chromium`.

## Dane

- **Ciężkie warstwy** (model świata, modele 3D) są tilowane i hostowane na **Cesium ion** — nie ma ich
  w plikach aplikacji. Skopiuj `.env.example` do `.env` i wpisz `PUBLIC_CESIUM_ION_TOKEN`.
- **Lekkie dane** (`metadata.json`, `search_index.json`, warstwy GeoJSON) leżą w `static/data/khorinis/`.
  Są chronione prawem autorskim i **nie trafiają do repo** (`static/data/` w `.gitignore`). Skopiuj je
  z paczki `dist/g2nk/khorinis/` projektu ekstrakcji — bez `world.glb` i `models/`.
  Kontrakt danych opisuje `static/data/khorinis/README.md`.

## Struktura

Zasady architektury i stylu: `CLAUDE.md`.

- `src/lib/services/` — logika biznesowa: fasada `GeoportalFacade`, `MapService` (Cesium), budowniczy opcji Viewera
- `src/lib/events/` — typowany event bus i zdarzenia aplikacji
- `src/lib/data/` — typy, parsery i `GeoportalDataLoader`
- `src/lib/state/` — reaktywny stan dla UI (runy), aktualizowany zdarzeniami
- `src/lib/components/` — komponenty UI (bez logiki domenowej); `ui/` to shadcn-svelte
- `src/lib/composition-root.ts` — jedyne miejsce składania zależności
- `src/env.ts` — zmienne środowiskowe (SvelteKit 3); wymagany `PUBLIC_CESIUM_ION_TOKEN` w `.env` (wzór: `.env.example`)

## Uwagi

- Zasoby Cesium kopiuje `vite-plugin-static-copy` do `/cesiumStatic` (`vite-plugin-cesium` nie działa w SvelteKit).
- Model świata to 3D Tiles na Cesium ion (asset ID w `src/lib/data/world-catalog.ts`); globus wyłączony, bez podkładu Ion.
- Nie używaj `npm audit fix --force`.
