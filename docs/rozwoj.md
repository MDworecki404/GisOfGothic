# Rozwój projektu

## Wymagania

- Node.js 22+ i npm
- konto [Cesium ion](https://ion.cesium.com) z dostępem do assetów świata
- lekkie dane świata (patrz [dane.md](dane.md))

## Pierwsze uruchomienie

```bash
npm install
cp .env.example .env              # wpisz PUBLIC_CESIUM_ION_TOKEN
npx playwright install chromium   # tylko do testów e2e
npm run dev                       # http://localhost:5173
```

Token ion trafia do zbudowanej strony, więc jest publiczny. Na ion ustaw mu tylko zakres
`assets:read`, wyłącznie assety światów i ogranicz go do domeny aplikacji.

## Skrypty

| Komenda            | Co robi                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| `npm run dev`      | serwer deweloperski                                                           |
| `npm run check`    | `svelte-check` (typy TS i Svelte)                                             |
| `npm run lint`     | ESLint (w tym zakaz `any`, `!`, `as` i granice warstw)                        |
| `npm run format`   | Prettier                                                                      |
| `npm run test`     | testy jednostkowe Vitest (`src/**/*.test.ts`)                                 |
| `npm run test:e2e` | Playwright: buduje, serwuje i testuje w przeglądarce (wymaga danych i tokenu) |
| `npm run build`    | statyczna strona w `build/`                                                   |
| `npm run deploy`   | buduje stronę i wysyła ją na Cloudflare Pages (projekt `gis-of-gothic`)       |
| `npm run release`  | nowa wersja: podbija `package.json`, dopisuje `CHANGELOG.md`, tworzy tag      |

## Konwencje kodu

Pełne zasady: [`CLAUDE.md`](../CLAUDE.md). Najważniejsze:

- architektura klasowa i wzorce (fasada, budowniczy), UI oddzielone od logiki — [architektura.md](architektura.md);
- pełne typowanie bez `any`, `!` i `as`;
- nazwy mówią, co kod robi; komentarze tylko jako JSDoc po polsku przy złożonej logice;
- importy `#lib/...` w plikach `.ts` z rozszerzeniem `.js`.

## Testy

- **Vitest** — logika bez przeglądarki: parsery, loader, katalog światów. Zależności (np. `fetch`)
  wstrzykujemy konstruktorem, więc testy nie potrzebują sieci.
- **Playwright** (`e2e/`) — strona się ładuje, jest canvas Cesium i panel wyszukiwania, brak błędów
  w konsoli, nieznany świat daje stronę 404.

## Commity i wydania

```
<type>: <nagłówek po polsku>

<treść po polsku>
```

- `type` z Angular Conventional Commits: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `revert`. Treść jest obowiązkowa.
- Hook `commit-msg` (commitlint) sprawdza format, hook `pre-commit` uruchamia check, lint i testy.
- `npm run release` generuje `CHANGELOG.md` z commitów `feat`, `fix`, `perf`, `refactor`, `docs`, `build`.
- Zmiana architektury, danych albo konfiguracji aktualizuje dokumentację w tym samym commicie.

## Wdrożenie

Strona działa na Cloudflare Pages: **https://gisofgothic.dworecki.dev** (także
https://gis-of-gothic.pages.dev). Szczegóły decyzji: [ADR 0010](adr/0010-hosting-cloudflare-pages-z-wgrywaniem-lokalnym.md).

1. Jednorazowo: `npx wrangler login`.
2. Upewnij się, że `static/data/` ma aktualne dane, a `.env` token ion (trafia do zbudowanej strony).
3. `npm run deploy` — build i wysyłka katalogu `build/`.

Wydanie i wdrożenie razem: `npm run release`, `git push --follow-tags origin main`, `npm run deploy`.

Jeśli wrangler zaproponuje albo sam wykona automatyczną konfigurację (zamiana `adapter-static`
na `adapter-cloudflare`, plik `wrangler.jsonc`), cofnij te zmiany — aplikacja jest statyczna.
Nowy adres strony trzeba dopisać do CORS bucketa modeli (`wrangler r2 bucket cors set gis-of-gothic-models`)
i do ograniczeń tokenu Cesium ion.

## Decyzje projektowe

Ważne decyzje zapisujemy jako krótkie ADR w [`docs/adr/`](adr/) — kontekst, decyzja, konsekwencje.
Nowy ADR: kolejny numer, plik `NNNN-krotki-tytul.md` na wzór istniejących. Decyzji się nie edytuje —
zmienioną decyzję zastępuje nowy ADR (status starego: „zastąpiony przez NNNN”).
