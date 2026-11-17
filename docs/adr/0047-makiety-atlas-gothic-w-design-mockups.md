# 0047. Makiety „Atlas Gothic” w osobnej aplikacji `design-mockups/`

- Status: przyjęta (nie zastępuje ADR 0043 i 0044; to propozycja kolejnego kierunku wyglądu)
- Data: 2026-11-17

## Kontekst

Motyw „Krąg” (ADR 0043 i 0044) jest wdrożony. Właściciel chce porównać go z kierunkiem „Modern Fantasy
Cartography”: grafit, mosiądz i oliwka, atlas zamiast mchu. Wcześniejsze makiety (`docs/makiety/`) to
pojedynczy plik HTML bez prawdziwych komponentów, więc nie sprawdzają ergonomii mapy, wyszukiwania
i układów na telefonie.

## Decyzja

- Makiety są **osobną aplikacją Svelte 5 + Vite** w `design-mockups/` z własnym `vite.config.ts`,
  `tsconfig.json` i portem 5180. Używają bibliotek już zainstalowanych w projekcie; nowa zależność to tylko
  `@fontsource-variable/cormorant`.
- Makiety **niczego nie importują z `src/`** i nie dotykają Cesium ani `static/data/`. Mapa jest rysunkiem SVG
  z przykładowymi danymi, więc podgląd nie wymaga danych z gry, tokenu ani backendu.
- Uruchamia je `npm run mockups`, budują `npm run mockups:build` (`design-mockups/dist/`, poza repo dzięki
  `.gitignore`) i `npm run mockups:preview`.
- Kod makiet przechodzi ten sam ESLint (`any`, `!` i `as` zakazane). Reguła `no-navigation-without-resolve`
  jest wyłączona tylko dla `design-mockups/`, bo makiety używają adresów po `#` zamiast routera SvelteKit.
- `svelte-check` aplikacji pomija makiety (nie ma ich w `tsconfig.json`); makiety sprawdza
  `npx svelte-check --tsconfig design-mockups/tsconfig.json`.

## Konsekwencje

- Wdrożenie kierunku do produkcji to osobna praca: przeniesienie tokenów do `src/app.css` i przepisanie
  komponentów na role z ADR 0019 i 0043. Makiety zostają jako punkt odniesienia i nie są usuwane.
- Dane przykładowe mogą rozjechać się z prawdziwymi; makiety nie są źródłem prawdy o świecie gry.
- Przybywa katalog z własną konfiguracją do utrzymania, ale zmiany w aplikacji nie psują makiet i odwrotnie.
