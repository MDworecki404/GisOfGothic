# 0005. Świat w adresie URL i katalog światów

- Status: przyjęta
- Data: 2026-10-15

## Kontekst

Projekt obejmie wiele gier (Gothic 1, Gothic 2 NK, później modyfikacje i Gothic 3) i wiele światów
w każdej z nich. Linki do konkretnego świata (a później wpisu) muszą dać się udostępniać.

## Decyzja

- Adres świata to `/<gameId>/<worldId>`, np. `/g2nk/khorinis`. Trasa `src/routes/[gameId]/[worldId]/`.
- Gry i światy opisuje klasa `WorldCatalog` (`src/lib/data/world-catalog.ts`): nazwa, katalog lekkich
  danych, asset ID modelu na ion. Strona `/` przekierowuje do świata domyślnego, nieznany świat → 404.
- Lekkie dane leżą w `static/data/<gameId>/<worldId>/`.
- Fasada przełącza świat metodą `openWorld`, niezależnie od podpięcia mapy.

## Konsekwencje

- Nowy świat to wpis w katalogu i paczka danych — bez zmian w kodzie UI.
- Katalog jest w kodzie TypeScript (typowany, testowany). Jeśli światów przybędzie albo będą
  dodawane bez wydania aplikacji, można go przenieść do pliku JSON z walidacją.
- Aplikacja jest SPA z `fallback: 'index.html'` — serwer musi kierować nieznane ścieżki do `index.html`.
