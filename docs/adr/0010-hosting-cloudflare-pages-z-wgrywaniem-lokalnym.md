# 0010. Hosting na Cloudflare Pages z wgrywaniem z komputera

- Status: przyjęta
- Data: 2026-10-16

## Kontekst

Aplikacja to statyczna strona (`adapter-static`, SPA z `fallback: 'index.html'`). Modele przedmiotów
leżą już w Cloudflare R2, a domena `dworecki.dev` jest w Cloudflare. Lekkie dane świata
(`static/data/`) pochodzą z gry i nie są w repozytorium, więc build uruchomiony przez Cloudflare
z GitHuba nie miałby danych.

Wrangler 4 przy `pages project create` / `pages deploy` domyślnie przekierowuje Pages na Workers
i uruchamia automatyczną konfigurację, która podmienia `adapter-static` na `adapter-cloudflare`
i dodaje `wrangler.jsonc`. Tego nie chcemy — aplikacja nie potrzebuje serwera.

## Decyzja

- Projekt Cloudflare Pages `gis-of-gothic` (klasyczne Pages), utworzony raz z flagą `--force`,
  która pomija przekierowanie na Workers. Kolejne polecenia działają już bezpośrednio na Pages.
- Wdrożenie z komputera: `npm run deploy` buduje stronę lokalnie (z danymi z `static/data/`
  i tokenem ion z `.env`) i wysyła katalog `build/` przez `wrangler pages deploy`.
- Adres: `gisofgothic.dworecki.dev` (domena własna projektu Pages, wpis CNAME na
  `gis-of-gothic.pages.dev`) oraz `gis-of-gothic.pages.dev`.
- Pages bez pliku `404.html` działa jak SPA: nieznane ścieżki dostają `index.html`.
- CORS bucketa modeli R2 dopuszcza oba adresy produkcyjne i porty deweloperskie.

## Konsekwencje

- Strona jest online bez przenoszenia danych z gry; każde wdrożenie idzie z maszyny autora.
- Przy przejściu na publiczne repozytorium i automatyczne wdrażanie z GitHuba trzeba przenieść
  lekkie dane do R2 (jak modele) i zmienić `dataBaseUrl` w katalogu światów — wtedy nowy ADR.
- Nie wolno akceptować automatycznej konfiguracji wranglera; jeśli doda `wrangler.jsonc` albo zmieni
  adapter, zmiany należy cofnąć.
