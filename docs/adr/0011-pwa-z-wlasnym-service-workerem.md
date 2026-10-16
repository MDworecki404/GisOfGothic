# 0011. PWA z własnym service workerem SvelteKit

- Status: przyjęta
- Data: 2026-10-16

## Kontekst

Wizja zakłada aplikację instalowaną na komputerze i telefonie (PWA). Aplikacja jest statyczna,
a ciężki model świata pochodzi z Cesium ion, który ma własne tokeny, limity i nagłówki pamięci.
Lekkie dane świata (~2 MB) i powłoka aplikacji mogą działać bez sieci.

## Decyzja

- Manifest `static/manifest.webmanifest`, ikony PNG w `static/icons/` generowane skryptem
  `scripts/generate-pwa-icons.mjs` z `static/favicon.svg` (w tym wersja maskable i apple-touch).
- Własny service worker SvelteKit (`src/service-worker/`, bez bibliotek typu Workbox). W SvelteKit 3
  to katalog z własnym `tsconfig.json` rozszerzającym `$app/tsconfig/service-worker`; główny
  `tsconfig.json` go wyklucza, a `npm run check` sprawdza go osobno (`tsc -p src/service-worker`).
- Strategie wybiera czysta, testowana klasa `CachingPolicy`:
  strony — najpierw sieć, bez niej zapisana powłoka; pliki z hashem i zasoby Cesium — najpierw pamięć;
  dane świata i pozostałe pliki — z pamięci z odświeżeniem w tle; obce adresy (ion, R2) — bez udziału
  workera.
- Powłoka jest zapisywana przy instalacji; pamięci starych wersji są usuwane przy aktywacji;
  nowa wersja przejmuje stronę od razu (`skipWaiting`, `clients.claim`).
- `paths.relative: false` — zapisana powłoka jest podawana pod dowolnym adresem świata, więc musi
  odwoływać się do `/_app/…` ścieżkami bezwzględnymi.
- Dopasowanie w pamięci z `ignoreVary` — moduły JS wysyłają `Origin`, a odpowiedzi mają `Vary`.
- Własny przycisk „Zainstaluj” (`AppInstallation`) zamiast domyślnego okna przeglądarki.

## Konsekwencje

- Bez sieci działają interfejs, wyszukiwarka, karty, warstwy i analizy na danych; model świata
  wymaga internetu i pokazuje zrozumiały komunikat.
- Każde wdrożenie zmienia wersję i nazwy pamięci, więc użytkownik dostaje nowe pliki przy
  następnym wejściu.
- Hosting musi podawać aplikację z katalogu głównego domeny (ścieżki bezwzględne).
