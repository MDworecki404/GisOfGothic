# 0003. Zasoby Cesium przez vite-plugin-static-copy

- Status: przyjęta
- Data: 2026-10-15

## Kontekst

CesiumJS potrzebuje w czasie działania swoich plików statycznych (`Workers`, `Assets`, `ThirdParty`,
`Widgets`) pod adresem `CESIUM_BASE_URL`. Popularny `vite-plugin-cesium` nie działa w SvelteKit,
bo opiera się na `transformIndexHtml`, którego SvelteKit nie wywołuje.

## Decyzja

- `vite-plugin-static-copy` kopiuje (w dev: serwuje) `node_modules/cesium/Build/Cesium/{Workers,Assets,ThirdParty,Widgets}`
  pod `/cesiumStatic`. Wymagane `rename: { stripBase: 4 }`, inaczej pliki lądują pod pełną ścieżką
  `node_modules/…` i dev zwraca 404.
- `define: { CESIUM_BASE_URL: JSON.stringify('/cesiumStatic') }` w `vite.config.ts`.
- Style widgetów Cesium importujemy w `src/app.css`.

## Konsekwencje

- Aktualizacja Cesium nie wymaga zmian konfiguracji, o ile nie zmieni się układ `Build/Cesium`.
- Build zawiera ~kilkanaście MB zasobów Cesium (do uwzględnienia w strategii pamięci podręcznej PWA).
