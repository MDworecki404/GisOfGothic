# Rozwój projektu

## Wymagania

- Node.js 22+ i npm
- konto [Cesium ion](https://ion.cesium.com) z dostępem do assetów świata
- lekkie dane świata (patrz [dane.md](dane.md))

## Pierwsze uruchomienie

```bash
npm install
cp .env.example .env              # wpisz PUBLIC_MODEL_KEY
npx playwright install chromium   # tylko do testów e2e
npm run dev                       # http://localhost:5173
```

Model świata i podglądy przedmiotów idą przez bramkę zasobów (`workers/model-gate/`), także przy
pracy lokalnej. Token Cesium ion nie trafia do strony — jest sekretem Workera
(`npx wrangler secret put CESIUM_ION_SERVER_TOKEN` w `workers/model-gate/`, ADR 0013).

## Skrypty

| Komenda                               | Co robi                                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                         | serwer deweloperski                                                                                               |
| `npm run check`                       | `svelte-check` (typy TS i Svelte) oraz typy service workera (`tsc -p src/service-worker`)                         |
| `npm run lint`                        | ESLint (w tym zakaz `any`, `!`, `as` i granice warstw)                                                            |
| `npm run format`                      | Prettier                                                                                                          |
| `npm run test`                        | testy jednostkowe Vitest (`src/**/*.test.ts`)                                                                     |
| `npm run test:e2e`                    | Playwright: buduje, serwuje i testuje w przeglądarce (wymaga danych i tokenu)                                     |
| `npm run build`                       | statyczna strona w `build/`                                                                                       |
| `node scripts/generate-pwa-icons.mjs` | ikony PWA w `static/icons/` z `static/favicon.svg` (po zmianie ikony)                                             |
| `npm run deploy`                      | **produkcja, tylko z wydania**: sprawdza tag i czyste repo, uruchamia wszystkie testy, buduje i wysyła (ADR 0014) |
| `npm run deploy:preview`              | bieżący build na podgląd `https://podglad.gis-of-gothic.pages.dev` (produkcja bez zmian)                          |
| `npm run deploy:gate`                 | wdraża bramkę zasobów (`workers/model-gate/`)                                                                     |
| `npm run release`                     | nowa wersja: nowe `feat` podbijają minor (ADR 0016), aktualizuje `package.json` i `CHANGELOG.md`, tworzy tag      |

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

**Na produkcję trafiają tylko wydania, po testach** ([ADR 0014](adr/0014-produkcja-tylko-z-wydan.md)).
Zmiany commitujemy na bieżąco, ale strona zmienia się dopiero przy wydaniu.

Jednorazowo: `npx wrangler login`; `static/data/` z aktualnymi danymi i `PUBLIC_MODEL_KEY` w `.env`.

1. **Podgląd:** `npm run deploy:preview` → sprawdź zmiany na `https://podglad.gis-of-gothic.pages.dev`.
2. **Wydanie:** `npm run release` (wersja i `CHANGELOG.md` z commitów, tag `vX.Y.Z`; `feat` podbija środkową liczbę, [ADR 0016](adr/0016-nowe-funkcje-podnosza-wersje-minor.md)).
3. **Publikacja w repo:** `git push --follow-tags origin main`.
4. **Produkcja:** `npm run deploy` — odmówi bez tagu wydania, przy niezacommitowanych zmianach albo
   niewypchniętym commicie/tagu; uruchamia `check`, `lint`, Vitest i Playwright, dopiero potem wysyła.

Jeśli wrangler zaproponuje albo sam wykona automatyczną konfigurację (zamiana `adapter-static`
na `adapter-cloudflare`, plik `wrangler.jsonc`), cofnij te zmiany — aplikacja jest statyczna.
Nowy adres strony trzeba dopisać do `ALLOWED_ORIGINS` bramki modeli
(`workers/model-gate/wrangler.jsonc`, potem `npm run deploy:gate`).

### Modele przedmiotów

Modele są szyfrowane i wydawane tylko przez bramkę ([ADR 0012](adr/0012-ochrona-modeli-przedmiotow.md)).

1. `node scripts/protect-item-models.mjs <dist>/<gra>/<świat>/models/previews <folder-wynikowy> <gra>/<świat>`
   — wbudowuje tekstury, szyfruje kluczem `PUBLIC_MODEL_KEY` z `.env` (tworzy go, jeśli brak).
2. `node scripts/upload-models-to-r2.mjs <folder-wynikowy> gis-of-gothic-models <gra>/<świat>/items`.
3. Podgląd i wydanie jak wyżej — klucz z `.env` trafia do strony.

Bucket nie może mieć publicznego adresu (domena własna ani `r2.dev`) — tylko bramka ma do niego dostęp.

## Decyzje projektowe

Ważne decyzje zapisujemy jako krótkie ADR w [`docs/adr/`](adr/) — kontekst, decyzja, konsekwencje.
Nowy ADR: kolejny numer, plik `NNNN-krotki-tytul.md` na wzór istniejących. Decyzji się nie edytuje —
zmienioną decyzję zastępuje nowy ADR (status starego: „zastąpiony przez NNNN”).
