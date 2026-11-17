# 0046. Nagłówki bezpieczeństwa i polityka CSP

- Status: przyjęta
- Data: 2026-11-17

## Kontekst

Repozytorium jest otwierane publicznie (ADR 0041), a strona to statyczny build na Cloudflare Pages
bez własnego serwera. Brakowało nagłówków bezpieczeństwa i Content Security Policy.

## Decyzja

- **Nagłówki** w `static/_headers` (Cloudflare Pages): `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Strict-Transport-Security`;
  `service-worker.js` bez pamięci podręcznej.
- **CSP** jako `<meta>` w `index.html`, generowane przez SvelteKit (`csp` w `vite.config.ts`, tryb `hash`).
  Skrypt inline SvelteKit dostaje skrót SHA-256; domyślnie `default-src 'none'`. Połączenia tylko do
  własnej domeny i bramki zasobów, workery z `self` i `blob:`.
- Skrypt ustawiający motyw przed pierwszym renderem jest plikiem `static/theme-init.js` (ładowany
  synchronicznie), nie skryptem inline.

## Konsekwencje

- `script-src` zawiera `'unsafe-eval'`: widgety Cesium używają knockouta z `(0,eval)('this')`; bez tego
  strona się nie uruchamia. `wasm-unsafe-eval` jest potrzebne dla dekoderów Cesium. CSP nadal blokuje
  skrypty z obcych domen i połączenia poza bramką.
- `style-src 'unsafe-inline'`: Cesium i Svelte ustawiają style w atrybutach.
- Zmiana adresu bramki zasobów wymaga poprawki `connect-src` w `vite.config.ts`.
- `frame-ancestors` nie działa w `<meta>`, dlatego osłania `X-Frame-Options`.
